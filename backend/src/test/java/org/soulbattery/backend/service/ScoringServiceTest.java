package org.soulbattery.backend.service;

import org.junit.jupiter.api.Test;
import org.soulbattery.backend.domain.AxisScores;
import org.soulbattery.backend.domain.SoulType;
import org.soulbattery.backend.dto.AnswerDto;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ScoringServiceTest {

    private static final Set<Integer> REVERSED = Set.of(20, 27, 28, 29, 30);
    private final ScoringService service = new ScoringService();

    /** 축별로 '채점 후' 점수(1~5)를 지정하면, 역채점 문항은 원래 응답으로 되돌려 만든다. */
    private static List<AnswerDto> answers(int outer, int inner, int open) {
        List<AnswerDto> list = new ArrayList<>();
        for (int id = 1; id <= 30; id++) {
            int value = id <= 10 ? outer : id <= 20 ? inner : open;
            int raw = REVERSED.contains(id) ? 6 - value : value;
            list.add(new AnswerDto(id, raw));
        }
        return list;
    }

    @Test
    void 축별_점수를_0에서_100으로_계산한다() {
        AxisScores s = service.score(answers(5, 1, 3));
        assertThat(s.outer()).isEqualTo(100);
        assertThat(s.inner()).isZero();
        assertThat(s.open()).isEqualTo(50);
        assertThat(s.gap()).isEqualTo(100);
    }

    @Test
    void 역채점_문항은_뒤집어서_계산한다() {
        List<AnswerDto> list = answers(3, 3, 3);
        list.set(29, new AnswerDto(30, 5)); // "웃고 있지만 속은 지쳐 있다" 매우 그렇다 → 1점
        assertThat(service.score(list).open()).isEqualTo(45);
    }

    @Test
    void 총점이_중간이어도_겉은_높고_속이_낮으면_차이형으로_분류한다() {
        // 기존 총점 방식이면 중간(미어캣)으로 묻히던 패턴
        assertThat(service.classify(new AxisScores(80, 40, 70))).isEqualTo(SoulType.HIDDEN_DRAIN);
        assertThat(service.classify(new AxisScores(80, 40, 30))).isEqualTo(SoulType.MASKED_DRAIN);
    }

    @Test
    void 속_배터리가_매우_낮으면_다른_조건보다_도움_연결이_우선이다() {
        SoulType type = service.classify(new AxisScores(90, 20, 20));
        assertThat(type).isEqualTo(SoulType.NEEDS_SUPPORT);
        assertThat(type.paywallAllowed()).isFalse();
    }

    @Test
    void 나머지_유형을_분류한다() {
        assertThat(service.classify(new AxisScores(80, 75, 70))).isEqualTo(SoulType.FULL);
        assertThat(service.classify(new AxisScores(35, 60, 50))).isEqualTo(SoulType.BODY_LAG);
        assertThat(service.classify(new AxisScores(35, 35, 50))).isEqualTo(SoulType.DEEP_REST);
        assertThat(service.classify(new AxisScores(60, 55, 50))).isEqualTo(SoulType.STEADY);
    }

    @Test
    void 잘못된_답변은_거부한다() {
        assertThatThrownBy(() -> service.score(answers(3, 3, 3).subList(0, 29)))
                .isInstanceOf(IllegalArgumentException.class);

        List<AnswerDto> outOfRange = answers(3, 3, 3);
        outOfRange.set(0, new AnswerDto(1, 6));
        assertThatThrownBy(() -> service.score(outOfRange)).isInstanceOf(IllegalArgumentException.class);

        List<AnswerDto> duplicated = answers(3, 3, 3);
        duplicated.set(1, new AnswerDto(1, 3));
        assertThatThrownBy(() -> service.score(duplicated)).isInstanceOf(IllegalArgumentException.class);
    }
}
