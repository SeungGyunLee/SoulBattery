package org.soulbattery.backend.auth;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 서비스 자체 로그인 토큰 (HS256 JWT).
 * 필요한 기능이 발급과 검증뿐이라 외부 라이브러리 없이 표준 라이브러리로 구현했다.
 * 페이로드는 이 클래스가 직접 만든 형식만 받으며, 서명 검증을 통과한 뒤에만 읽는다.
 */
public class JwtProvider {

    private static final String HEADER = base64Url("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
    private static final Pattern SUB = Pattern.compile("\"sub\":\"(\\d+)\"");
    private static final Pattern EXP = Pattern.compile("\"exp\":(\\d+)");

    private final byte[] secret;
    private final Duration expiry;
    private final Clock clock;

    public JwtProvider(String secret, Duration expiry, Clock clock) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("JWT 비밀키는 32자 이상이어야 합니다. JWT_SECRET 환경 변수를 확인하세요.");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expiry = expiry;
        this.clock = clock;
    }

    public String issue(long userId) {
        long now = clock.instant().getEpochSecond();
        String payload = base64Url(String.format("{\"sub\":\"%d\",\"iat\":%d,\"exp\":%d}",
                userId, now, now + expiry.toSeconds()).getBytes(StandardCharsets.UTF_8));
        String unsigned = HEADER + "." + payload;
        return unsigned + "." + base64Url(sign(unsigned));
    }

    /** 유효한 토큰이면 사용자 id, 아니면 빈 값. */
    public Optional<Long> parseUserId(String token) {
        if (token == null) return Optional.empty();
        String[] parts = token.split("\\.");
        if (parts.length != 3 || !HEADER.equals(parts[0])) return Optional.empty();

        byte[] expected = sign(parts[0] + "." + parts[1]);
        byte[] actual;
        String payload;
        try {
            actual = Base64.getUrlDecoder().decode(parts[2]);
            payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
        if (!MessageDigest.isEqual(expected, actual)) return Optional.empty();

        Matcher sub = SUB.matcher(payload);
        Matcher exp = EXP.matcher(payload);
        if (!sub.find() || !exp.find()) return Optional.empty();
        if (Long.parseLong(exp.group(1)) <= clock.instant().getEpochSecond()) return Optional.empty();
        return Optional.of(Long.parseLong(sub.group(1)));
    }

    private byte[] sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
