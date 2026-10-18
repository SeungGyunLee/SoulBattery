package org.soulbattery.backend.auth;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtProviderTest {

    private static final String SECRET = "test-secret-0123456789-0123456789-abc";
    private static final Instant NOW = Instant.parse("2026-10-19T00:00:00Z");

    private JwtProvider providerAt(Instant instant) {
        return new JwtProvider(SECRET, Duration.ofDays(14), Clock.fixed(instant, ZoneOffset.UTC));
    }

    @Test
    void 발급한_토큰에서_사용자_id를_꺼낸다() {
        String token = providerAt(NOW).issue(42L);
        assertThat(providerAt(NOW).parseUserId(token)).contains(42L);
    }

    @Test
    void 만료된_토큰은_거부한다() {
        String token = providerAt(NOW).issue(42L);
        assertThat(providerAt(NOW.plus(Duration.ofDays(15))).parseUserId(token)).isEmpty();
    }

    @Test
    void 위조되거나_다른_키로_서명된_토큰은_거부한다() {
        String token = providerAt(NOW).issue(42L);
        String[] parts = token.split("\\.");
        String forgedPayload = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"1\",\"iat\":0,\"exp\":9999999999}".getBytes());

        assertThat(providerAt(NOW).parseUserId(parts[0] + "." + forgedPayload + "." + parts[2])).isEmpty();
        JwtProvider other = new JwtProvider("another-secret-0123456789-0123456789", Duration.ofDays(14),
                Clock.fixed(NOW, ZoneOffset.UTC));
        assertThat(other.parseUserId(token)).isEmpty();
        assertThat(providerAt(NOW).parseUserId("not.a.token")).isEmpty();
        assertThat(providerAt(NOW).parseUserId(null)).isEmpty();
    }

    @Test
    void 짧은_비밀키는_허용하지_않는다() {
        assertThatThrownBy(() -> new JwtProvider("short", Duration.ofDays(1), Clock.systemUTC()))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
