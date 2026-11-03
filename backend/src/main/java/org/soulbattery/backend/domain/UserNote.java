package org.soulbattery.backend.domain;

import java.util.List;
import java.util.Optional;

/**
 * 검사 전에 사용자가 적는 "내 배터리 상태를 한마디로 하자면?" 문장.
 * - 처방전을 만드는 AI 요청에만 쓰고, DB·기록·로그에는 저장하지 않는다.
 * - 길이를 제한하고 줄바꿈·제어 문자를 정리해서, 프롬프트 안에서 지시문처럼 보이지 않게 한다.
 */
public final class UserNote {

    public static final int MAX_LENGTH = 60;

    /**
     * 위기 신호로 볼 표현 (공백을 지운 뒤 포함 여부로 판단).
     * "피곤해 죽겠다" 같은 흔한 관용 표현은 일부러 넣지 않는다.
     */
    private static final List<String> CRISIS_PHRASES = List.of(
            "죽고싶", "죽을래", "죽어버리", "자살", "자해", "극단적선택",
            "사라지고싶", "없어지고싶", "살기싫", "살고싶지않", "그만살", "목숨을끊", "손목을");

    private UserNote() {}

    /** 정리된 문장. 비어 있으면 빈 값. */
    public static Optional<String> normalize(String raw) {
        if (raw == null) return Optional.empty();
        String cleaned = raw
                .replaceAll("[\\p{Cntrl}\\r\\n\\t]+", " ")
                .replace('"', '\'')
                .replace("<<<", "")
                .replace(">>>", "")
                .replaceAll("\\s{2,}", " ")
                .trim();
        if (cleaned.isEmpty()) return Optional.empty();
        if (cleaned.codePointCount(0, cleaned.length()) > MAX_LENGTH) {
            cleaned = cleaned.substring(0, cleaned.offsetByCodePoints(0, MAX_LENGTH));
        }
        return Optional.of(cleaned);
    }

    /** 위기 신호가 담긴 표현인지 */
    public static boolean isCrisis(String note) {
        if (note == null) return false;
        String compact = note.replaceAll("\\s+", "");
        return CRISIS_PHRASES.stream().anyMatch(compact::contains);
    }
}
