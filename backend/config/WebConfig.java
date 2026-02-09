package org.soulbattery.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 모든 경로에 대해
                .allowedOrigins(
                        "http://localhost:5173",          // 로컬 테스트용
                        "https://soulbattery.vercel.app"  // 👈 실제 배포된 프론트엔드 주소 (필수!)
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 모든 동작 허용
                .allowCredentials(true); // 인증 정보 허용
    }
}