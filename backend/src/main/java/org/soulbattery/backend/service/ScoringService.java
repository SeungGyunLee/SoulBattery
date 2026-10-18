package org.soulbattery.backend.service;

import org.soulbattery.backend.domain.Axis;
import org.soulbattery.backend.domain.AxisScores;
import org.soulbattery.backend.domain.QuestionBank;
import org.soulbattery.backend.domain.QuestionBank.QuestionMeta;
import org.soulbattery.backend.domain.SoulType;
import org.soulbattery.backend.dto.AnswerDto;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 답변 → 축별 점수 → 유형 분류.
 *
 * 기존에는 총점 하나로 유형을 나눠서, "겉은 잘 기능하는데 속은 비어 있는" 사람이
 * 중간 점수로 묻혔다. 축을 따로 계산하고 겉-속 차이(gap)를 분류 기준으로 쓴다.
 * 임계값은 초기 가설이므로 실제 응답 분포를 보고 조정해야 한다.
 */
@Service
public class ScoringService {

    static final int SUPPORT_THRESHOLD = 25;   // 속 배터리가 이보다 낮으면 도움 연결 우선
    static final int FULL_THRESHOLD = 70;      // 모든 축이 이 이상이면 가득 찬 배터리
    static final int GAP_THRESHOLD = 20;       // 겉-속 차이가 이 이상이면 차이형
    static final int OUTER_FUNCTIONING = 50;   // 차이형으로 보려면 겉 배터리가 이 이상
    static final int MASKING_THRESHOLD = 50;   // 표현이 이보다 낮으면 '괜찮은 척'형
    static final int LOW_THRESHOLD = 45;       // 겉·속 모두 이보다 낮으면 쉼이 필요한 배터리

    public AxisScores score(List<AnswerDto> answers) {
        validate(answers);

        Map<Axis, int[]> sums = new EnumMap<>(Axis.class); // [합계, 문항 수]
        for (Axis axis : Axis.values()) {
            sums.put(axis, new int[2]);
        }
        for (AnswerDto answer : answers) {
            QuestionMeta meta = QuestionBank.get(answer.questionId());
            int value = meta.reverse()
                    ? QuestionBank.MIN_SCORE + QuestionBank.MAX_SCORE - answer.score()
                    : answer.score();
            int[] acc = sums.get(meta.axis());
            acc[0] += value;
            acc[1]++;
        }
        return new AxisScores(
                toPercent(sums.get(Axis.OUTER)),
                toPercent(sums.get(Axis.INNER)),
                toPercent(sums.get(Axis.OPEN)));
    }

    public SoulType classify(AxisScores s) {
        if (s.inner() < SUPPORT_THRESHOLD) {
            return SoulType.NEEDS_SUPPORT;
        }
        if (s.outer() >= FULL_THRESHOLD && s.inner() >= FULL_THRESHOLD && s.open() >= FULL_THRESHOLD) {
            return SoulType.FULL;
        }
        if (s.gap() >= GAP_THRESHOLD && s.outer() >= OUTER_FUNCTIONING) {
            return s.open() < MASKING_THRESHOLD ? SoulType.MASKED_DRAIN : SoulType.HIDDEN_DRAIN;
        }
        if (-s.gap() >= GAP_THRESHOLD) {
            return SoulType.BODY_LAG;
        }
        if (s.outer() < LOW_THRESHOLD && s.inner() < LOW_THRESHOLD) {
            return SoulType.DEEP_REST;
        }
        return SoulType.STEADY;
    }

    /** 평균 점수(1~5)를 0~100으로 변환. */
    private static int toPercent(int[] acc) {
        double avg = (double) acc[0] / acc[1];
        double range = QuestionBank.MAX_SCORE - QuestionBank.MIN_SCORE;
        return (int) Math.round((avg - QuestionBank.MIN_SCORE) / range * 100);
    }

    private static void validate(List<AnswerDto> answers) {
        if (answers == null || answers.size() != QuestionBank.QUESTION_COUNT) {
            throw new IllegalArgumentException("답변은 " + QuestionBank.QUESTION_COUNT + "개여야 합니다.");
        }
        Set<Integer> seen = new HashSet<>();
        for (AnswerDto a : answers) {
            if (a.score() < QuestionBank.MIN_SCORE || a.score() > QuestionBank.MAX_SCORE) {
                throw new IllegalArgumentException("점수는 1~5 사이여야 합니다: 문항 " + a.questionId());
            }
            QuestionBank.get(a.questionId());
            if (!seen.add(a.questionId())) {
                throw new IllegalArgumentException("중복된 문항 답변입니다: " + a.questionId());
            }
        }
    }
}
