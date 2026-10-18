package org.soulbattery.backend.service;

import org.soulbattery.backend.domain.AxisScores;
import org.soulbattery.backend.domain.SoulType;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AiAnalysisService {

    public static final String PAYWALL_MARKER = "[[PAYWALL]]";

    private final ChatClient chatClient;

    public AiAnalysisService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String getAiComment(SoulType type, AxisScores scores) {
        return chatClient.prompt()
                .user(buildPrompt(type, scores))
                .call()
                .content();
    }

    String buildPrompt(SoulType type, AxisScores s) {
        String common = String.format("""
            당신은 '소울 배터리' 서비스의 마음 에너지 코치입니다.
            사용자는 30개 문항으로 마음 배터리를 점검했습니다. 결과는 세 가지 축으로 나뉩니다.

            [점검 결과]
            - 결과 유형: %s (%s)
            - 겉 배터리 (겉으로 일상을 굴려 가는 힘): %d%%
            - 속 배터리 (속에 실제로 남아 있는 에너지): %d%%
            - 표현 (속 상태를 드러내고 도움을 청하는 정도): %d%%
            - 겉과 속의 차이: %d%%p

            [반드시 지킬 원칙]
            - 이것은 의료적 진단이 아닙니다. '우울증', '장애', '진단' 같은 질병·진단 용어를 쓰지 마세요.
            - 겉과 속의 차이를 핵심으로 해석하세요. 차이가 크다면, 겉으로는 잘 해내고 있어서
              주변도 본인도 소진을 알아차리기 어렵다는 점을 따뜻하게 짚어 주세요.
            - 마크다운 문법(**, *, #)과 이모지를 쓰지 말고, 내담자에게 보내는 편지처럼 차분하게 쓰세요.
            - 제목 없이 바로 본문으로 시작하세요.

            [1부: 지금 상태 읽기]
            - 세 축의 숫자가 어떤 상태를 말해 주는지 4~6줄로 공감하며 풀어 주세요.
            - 끝나면 줄바꿈을 두 번 하세요.

            [2부: 오늘의 작은 충전]
            - '[오늘의 작은 충전]' 이라는 소제목을 적으세요.
            - 오늘 10분 안에 할 수 있는 구체적인 행동 2가지를 제안하고, 각각 왜 도움이 되는지 2~3줄로 설명하세요.
              가장 낮은 축을 채우는 방향으로 고르세요.
            """, type.title(), type.description(), s.outer(), s.inner(), s.open(), s.gap());

        if (!type.paywallAllowed()) {
            // 속 배터리가 매우 낮은 구간: 결제 구분자 없이, 사람과 연결되는 방향으로 마무리
            return common + """

                [3부: 마무리]
                - 지금은 혼자 버티기보다 믿을 만한 사람이나 전문 상담과 이야기 나누는 것이
                  가장 좋은 충전이라는 점을 부드럽게 권하세요. 겁을 주거나 단정하지 마세요.
                - 따뜻한 응원으로 마무리하세요.
                - 구분자나 유료 안내는 절대 넣지 마세요.
                """;
        }

        return common + """
            - 2부 끝에는 마무리 인사를 하지 마세요.

            [구분자]
            - 줄을 바꾸고 정확히 `%s` 이라고만 입력하세요.

            [3부: 2주 충전 루틴]
            - 이 유형이 2주 동안 꾸준히 해 볼 수 있는 루틴 3가지를 구체적으로 적으세요 (총 6줄 이상).
            - 마지막은 진심 어린 응원으로 마무리하세요.
            """.formatted(PAYWALL_MARKER);
    }
}
