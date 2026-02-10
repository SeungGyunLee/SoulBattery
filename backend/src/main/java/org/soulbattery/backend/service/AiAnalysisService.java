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
            당신은 전문 심리 상담가입니다.
            사용자 결과: '[%s] - %s'
            (참고: 이 테스트는 부정적인 질문들로 구성되어 있어서, 점수가 높을수록 상태가 안 좋은 것입니다.)
            
           [지시사항]
                            1. **[형식 제한 - 중요]**:
                               - `**굵게**` 같은 마크다운 문법이나 특수기호를 **절대 사용하지 마세요**.
                               - 기계적인 느낌이 나지 않도록, 사람이 쓴 편지처럼 깨끗한 텍스트로만 작성하세요.
            1. [제목 절대 금지]: '[마음 진단서]' 같은 제목을 쓰지 말고, 바로 본문부터 시작하세요.
            
            2. 1. 진단 및 공감 (무료)]
               - 사용자의 성향(%s)을 바탕으로 현재 마음 상태를 **5줄 이상 깊이 있게** 분석하고 공감해주세요.
               - (예: "에너지가 고갈된 상태군요..." 또는 "아주 건강하고 멋진 상태네요!")
               - 진단 후 **줄바꿈 두 번**.
            
            3. 2. 오늘의 처방 (무료)
               - '[오늘의 처방]' 소제목 작성.
               - 실천할 수 있는 2가지 행동과 효과를 행동마다 3~4줄로 작성.
               - 마무리 인사 금지.
            
            4. [구분자]
               - 줄 바꾸고 `[[PAYWALL]]` 입력.
            
            5. 3. 심화 루틴 (유료)
               - (유료 사용자 전용)
               - 상태 유지/개선을 위한 전문 루틴 3가지를 구체적으로(6줄 이상) 작성.
               - 따뜻한 마무리 인사 포함.
            """, animal, traits, traits);

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }
}