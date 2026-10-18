package org.soulbattery.backend.config;

import org.soulbattery.backend.auth.AuthInterceptor;
import org.soulbattery.backend.auth.JwtProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Clock;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class WebConfig implements WebMvcConfigurer {

    private final AppProperties properties;

    public WebConfig(AppProperties properties) {
        this.properties = properties;
    }

    @Bean
    public JwtProvider jwtProvider() {
        return new JwtProvider(properties.jwt().secret(), properties.jwt().expiry(), Clock.systemUTC());
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(properties.cors().allowedOrigins().toArray(String[]::new))
                .allowedMethods("GET", "POST", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 로그인이 필요한 API만 검사한다. 설문 분석(/api/analysis)과 로그인(/api/auth)은 누구나 사용 가능.
        registry.addInterceptor(new AuthInterceptor(jwtProvider()))
                .addPathPatterns("/api/me", "/api/records", "/api/records/**");
    }
}
