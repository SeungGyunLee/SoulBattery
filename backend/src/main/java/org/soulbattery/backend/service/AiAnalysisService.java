package org.soulbattery.backend.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AiAnalysisService {

    private final ChatClient chatClient;

    public AiAnalysisService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String getAiComment(String animal, String traits) {
        String prompt = String.format("""
            당신은 10년 차 전문 심리 상담가입니다.
            사용자는 방금 '신체 에너지, 심리 의욕, 감정 표출 성향'을 묻는 30개의 심층 심리 진단을 완료했습니다.
            
            [사용자 진단 결과]
            - 동물 유형: [%s]
            - 현재 주요 상태: %s
            
            아래 지시사항을 엄격하게 지켜서 진단서를 작성해주세요.
            
            [지시사항]
            1. [형식 제한 - 매우 중요]:
               - `**굵게**`나 `*`, `#` 같은 마크다운 문법, 이모지를 절대 사용하지 마세요.
               - 기계적인 느낌이 나지 않도록, 내담자에게 보내는 따뜻하고 정돈된 편지처럼 작성하세요.
               - '[마음 진단서]' 같은 첫 제목을 쓰지 말고, 바로 본문부터 시작하세요.
            
            2. [1부: 진단 및 공감 (무료)]
               - 사용자의 현재 상태(%s)를 바탕으로, 마음의 에너지가 왜 이런 상태인지 심리학적 관점에서 5줄 이상 깊이 있게 분석하고 공감해주세요.
               - 진단 후 줄바꿈을 두 번 하세요.
            
            3. [2부: 오늘의 행동 처방 (무료)]
               - '[오늘의 처방]' 이라는 소제목을 적으세요.
               - 지금 상태에서 당장 실천할 수 있는 구체적인 행동 2가지를 제안하고, 그 행동이 뇌과학/심리학적으로 어떤 효과가 있는지 행동마다 3~4줄로 자세히 설명하세요.
               - 2부 끝에는 마무리 인사를 하지 마세요.
            
            4. [구분자]
               - 줄을 바꾸고 정확히 `[[PAYWALL]]` 이라고만 입력하세요.
            
            5. [3부: 전문가 심화 루틴 (유료)]
               - (유료 사용자 전용 공간입니다)
               - 현재 상태를 근본적으로 개선하거나 최상으로 유지하기 위한 심층적인 인지행동 루틴이나 감정 훈련법 3가지를 구체적으로 작성하세요 (총 6줄 이상).
               - 글의 맨 마지막에는 상담가로서 진심 어린 응원과 따뜻한 인사로 마무리하세요.
            """, animal, traits, traits);

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }
}