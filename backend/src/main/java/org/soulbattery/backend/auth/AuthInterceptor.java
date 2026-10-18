package org.soulbattery.backend.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

/**
 * Authorization: Bearer {토큰} 을 검사해서, 유효하면 요청 속성에 사용자 id를 넣는다.
 * 컨트롤러에서는 @RequestAttribute(AuthInterceptor.USER_ID) Long userId 로 꺼내 쓴다.
 */
public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ID = "userId";
    private static final String BEARER = "Bearer ";

    private final JwtProvider jwtProvider;

    public AuthInterceptor(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (CorsUtils.isPreFlightRequest(request)) {
            return true;
        }
        String header = request.getHeader("Authorization");
        Optional<Long> userId = header != null && header.startsWith(BEARER)
                ? jwtProvider.parseUserId(header.substring(BEARER.length()))
                : Optional.empty();

        if (userId.isEmpty()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "로그인이 필요합니다.");
            return false;
        }
        request.setAttribute(USER_ID, userId.get());
        return true;
    }
}
