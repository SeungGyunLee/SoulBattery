package org.soulbattery.backend.auth;

import org.soulbattery.backend.config.AppProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

/** 카카오 인가 코드 → 액세스 토큰 → 사용자 정보 조회. */
@Component
public class KakaoClient {

    public record KakaoUser(String id, String nickname) {}

    private final RestClient restClient = RestClient.create();
    private final AppProperties.Kakao kakao;

    public KakaoClient(AppProperties properties) {
        this.kakao = properties.kakao();
    }

    public KakaoUser login(String code) {
        return fetchUser(exchangeToken(code));
    }

    private String exchangeToken(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", kakao.restApiKey());
        form.add("redirect_uri", kakao.redirectUri());
        form.add("code", code);
        if (kakao.clientSecret() != null && !kakao.clientSecret().isBlank()) {
            form.add("client_secret", kakao.clientSecret());
        }

        Map<?, ?> body = restClient.post()
                .uri("https://kauth.kakao.com/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        Object token = body == null ? null : body.get("access_token");
        if (token == null) {
            throw new IllegalStateException("카카오 액세스 토큰을 받지 못했습니다.");
        }
        return token.toString();
    }

    private KakaoUser fetchUser(String accessToken) {
        Map<?, ?> body = restClient.get()
                .uri("https://kapi.kakao.com/v2/user/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(Map.class);

        if (body == null || body.get("id") == null) {
            throw new IllegalStateException("카카오 사용자 정보를 받지 못했습니다.");
        }
        return new KakaoUser(body.get("id").toString(), extractNickname(body));
    }

    /** 닉네임은 동의 항목 설정에 따라 없을 수 있다. */
    private static String extractNickname(Map<?, ?> body) {
        if (body.get("kakao_account") instanceof Map<?, ?> account
                && account.get("profile") instanceof Map<?, ?> profile
                && profile.get("nickname") != null) {
            return profile.get("nickname").toString();
        }
        if (body.get("properties") instanceof Map<?, ?> props && props.get("nickname") != null) {
            return props.get("nickname").toString();
        }
        return null;
    }
}
