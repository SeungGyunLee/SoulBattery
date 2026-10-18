package org.soulbattery.backend.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.soulbattery.backend.user.User;
import org.soulbattery.backend.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AuthController {

    public record KakaoLoginRequest(String code) {}
    public record LoginResponse(String token, String nickname) {}
    public record MeResponse(String nickname) {}

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final KakaoClient kakaoClient;
    private final UserService userService;
    private final JwtProvider jwtProvider;

    public AuthController(KakaoClient kakaoClient, UserService userService, JwtProvider jwtProvider) {
        this.kakaoClient = kakaoClient;
        this.userService = userService;
        this.jwtProvider = jwtProvider;
    }

    @PostMapping("/auth/kakao")
    public LoginResponse kakaoLogin(@RequestBody KakaoLoginRequest request) {
        if (request.code() == null || request.code().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인가 코드가 없습니다.");
        }
        KakaoClient.KakaoUser kakaoUser;
        try {
            kakaoUser = kakaoClient.login(request.code());
        } catch (RuntimeException e) {
            log.warn("카카오 로그인 실패: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "카카오 로그인에 실패했어요.");
        }
        User user = userService.loginWithKakao(kakaoUser.id(), kakaoUser.nickname());
        return new LoginResponse(jwtProvider.issue(user.getId()), user.getNickname());
    }

    @GetMapping("/me")
    public MeResponse me(@RequestAttribute(AuthInterceptor.USER_ID) Long userId) {
        try {
            return new MeResponse(userService.get(userId).getNickname());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }
}
