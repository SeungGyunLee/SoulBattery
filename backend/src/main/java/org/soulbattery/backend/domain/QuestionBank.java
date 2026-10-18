package org.soulbattery.backend.domain;

import java.util.Map;
import java.util.Set;

/**
 * 문항 id별 축과 역채점 여부.
 * 문항 텍스트는 프론트(questions.ts)에 있고, 채점에 필요한 정보만 서버가 갖는다.
 * 프론트에서 받은 축 정보를 믿지 않고 서버 기준으로 채점하기 위함.
 */
public final class QuestionBank {

    public record QuestionMeta(Axis axis, boolean reverse) {}

    public static final int QUESTION_COUNT = 30;
    public static final int MIN_SCORE = 1;
    public static final int MAX_SCORE = 5;

    private static final Set<Integer> REVERSED = Set.of(20, 27, 28, 29, 30);

    private static final Map<Integer, QuestionMeta> QUESTIONS = build();

    private QuestionBank() {}

    private static Map<Integer, QuestionMeta> build() {
        var map = new java.util.HashMap<Integer, QuestionMeta>();
        for (int id = 1; id <= QUESTION_COUNT; id++) {
            Axis axis = id <= 10 ? Axis.OUTER : id <= 20 ? Axis.INNER : Axis.OPEN;
            map.put(id, new QuestionMeta(axis, REVERSED.contains(id)));
        }
        return Map.copyOf(map);
    }

    public static QuestionMeta get(int questionId) {
        QuestionMeta meta = QUESTIONS.get(questionId);
        if (meta == null) {
            throw new IllegalArgumentException("존재하지 않는 문항입니다: " + questionId);
        }
        return meta;
    }
}
