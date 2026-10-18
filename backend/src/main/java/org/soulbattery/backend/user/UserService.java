package org.soulbattery.backend.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    public static final String KAKAO = "KAKAO";

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** 처음 로그인하면 가입, 이미 있으면 닉네임만 최신으로 갱신. */
    @Transactional
    public User loginWithKakao(String kakaoId, String nickname) {
        User user = userRepository.findByProviderAndProviderUserId(KAKAO, kakaoId)
                .orElseGet(() -> userRepository.save(new User(KAKAO, kakaoId, nickname)));
        user.updateNickname(nickname);
        return user;
    }

    @Transactional(readOnly = true)
    public User get(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
    }
}
