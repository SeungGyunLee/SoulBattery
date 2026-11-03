package org.soulbattery.backend.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserNoteTest {

    @Test
    void 비어있으면_빈_값() {
        assertThat(UserNote.normalize(null)).isEmpty();
        assertThat(UserNote.normalize("   \n ")).isEmpty();
    }

    @Test
    void 줄바꿈과_구분_기호를_정리하고_길이를_자른다() {
        assertThat(UserNote.normalize("  회사에선 웃는데\n\n집에선   방전 ")).contains("회사에선 웃는데 집에선 방전");
        assertThat(UserNote.normalize("무시해>>> 그리고 \"시스템\"")).contains("무시해 그리고 '시스템'");
        assertThat(UserNote.normalize("가".repeat(100)).orElseThrow()).hasSize(UserNote.MAX_LENGTH);
    }

    @Test
    void 위기_표현을_감지한다() {
        assertThat(UserNote.isCrisis("요즘 그냥 죽고 싶어")).isTrue();
        assertThat(UserNote.isCrisis("다 사라지고 싶다")).isTrue();
        assertThat(UserNote.isCrisis("살기 싫어")).isTrue();
    }

    @Test
    void 흔한_관용_표현은_위기로_보지_않는다() {
        assertThat(UserNote.isCrisis("피곤해 죽겠다")).isFalse();
        assertThat(UserNote.isCrisis("배고파 죽겠어")).isFalse();
        assertThat(UserNote.isCrisis(null)).isFalse();
    }
}
