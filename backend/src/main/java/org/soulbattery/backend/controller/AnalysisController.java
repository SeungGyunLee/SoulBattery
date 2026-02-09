package org.soulbattery.backend.controller;

import org.soulbattery.backend.service.AiAnalysisService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final AiAnalysisService aiAnalysisService;

    public AnalysisController(AiAnalysisService aiAnalysisService) {
        this.aiAnalysisService = aiAnalysisService;
    }

    @PostMapping("/submit")
    public Map<String, String> analyze(@RequestBody Map<String, List<Integer>> request) {
        List<Integer> answers = request.get("answers");

        // 총점 계산 (최소 15점 ~ 최대 75점)
        // 질문이 '부정적'이므로, 점수가 높을수록 '상태가 나쁨'입니다.
        int totalScore = answers.stream().mapToInt(Integer::intValue).sum();

        String animal;
        String description;
        String traits; // AI에게 보낼 성향 정보

        // 🚨 로직 수정: 점수가 높을수록(60점 이상) -> 번아웃(부정)
        if (totalScore >= 60) {
            animal = "방전된 나무늘보";
            description = "손가락 하나 까딱하기 싫은 극도의 번아웃 상태";
            traits = "에너지 고갈, 무기력, 휴식 시급, 만성 피로";
        } else if (totalScore >= 45) {
            animal = "겨울잠 자는 곰";
            description = "몸과 마음이 무거워 동굴로 숨고 싶은 상태";
            traits = "현실 도피, 수면 부족, 예민함, 스트레스 누적";
        } else if (totalScore >= 30) {
            animal = "눈치 보는 미어캣";
            description = "아직은 버틸만하지만 경고등이 깜빡이는 상태";
            traits = "불안감, 긴장, 가벼운 피로, 감정 기복";
        } else {
            // 점수가 낮을수록(30점 미만) -> 건강함(긍정)
            animal = "지칠 줄 모르는 에너자이저 호랑이";
            description = "스트레스? 그게 뭐죠? 활력이 넘치는 최상의 상태!";
            traits = "긍정적, 높은 에너지, 강한 멘탈, 여유로움";
        }

        // AI에게 분석 요청 (수정된 traits 정보를 보냄)
        String aiComment = aiAnalysisService.getAiComment(animal, traits);

        return Map.of(
                "animal", animal,
                "description", description,
                "aiComment", aiComment
        );
    }
}