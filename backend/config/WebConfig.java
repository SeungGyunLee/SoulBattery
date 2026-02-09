package org.soulbattery.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class WebConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // 1. 내 프론트엔드 주소 (정확히 입력! 뒤에 / 없어야 함)
        config.addAllowedOrigin("https://soulbattery.vercel.app");
        config.addAllowedOrigin("http://localhost:5173");

        // 2. 나머지 허용 설정 (이게 중요합니다)
        config.setAllowCredentials(true); // 쿠키/인증 정보 허용
        config.addAllowedHeader("*");     // 모든 헤더 허용
        config.addAllowedMethod("*");     // GET, POST, PUT, DELETE 등 모든 동작 허용

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}