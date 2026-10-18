package org.soulbattery.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/** application.yml 의 app.* 설정. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Kakao kakao, Cors cors) {

    public record Jwt(String secret, Duration expiry) {}

    public record Kakao(String restApiKey, String clientSecret, String redirectUri) {}

    public record Cors(List<String> allowedOrigins) {}
}
