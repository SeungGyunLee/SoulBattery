package org.soulbattery.backend.controller;

import org.soulbattery.backend.domain.AxisScores;
import org.soulbattery.backend.domain.SoulType;
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
        SoulType type = scoringService.classify(scores);
        String aiComment = aiAnalysisService.getAiComment(type, scores);

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
