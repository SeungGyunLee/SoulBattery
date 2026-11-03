package org.soulbattery.backend.controller;

import org.soulbattery.backend.domain.AxisScores;
import org.soulbattery.backend.domain.SoulType;
import org.soulbattery.backend.domain.UserNote;
import org.soulbattery.backend.dto.AnalysisRequest;
import org.soulbattery.backend.dto.AnalysisResponse;
import org.soulbattery.backend.service.AiAnalysisService;
import org.soulbattery.backend.service.ScoringService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final ScoringService scoringService;
    private final AiAnalysisService aiAnalysisService;

    public AnalysisController(ScoringService scoringService, AiAnalysisService aiAnalysisService) {
        this.scoringService = scoringService;
        this.aiAnalysisService = aiAnalysisService;
    }

    @PostMapping("/submit")
    public AnalysisResponse analyze(@RequestBody AnalysisRequest request) {
        AxisScores scores;
        try {
            scores = scoringService.score(request.answers());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        // 한마디 문장은 AI 요청에만 쓰고 저장하지 않는다. 위기 표현이 있으면 점수와 상관없이 도움 연결을 우선한다.
        String note = UserNote.normalize(request.note()).orElse(null);
        SoulType type = UserNote.isCrisis(note) ? SoulType.NEEDS_SUPPORT : scoringService.classify(scores);
        String aiComment = aiAnalysisService.getAiComment(type, scores, note);

        return new AnalysisResponse(
                type.name(),
                type.title(),
                type.description(),
                type.symbol(),
                scores.outer(),
                scores.inner(),
                scores.open(),
                scores.gap(),
                type == SoulType.NEEDS_SUPPORT,
                aiComment);
    }
}
