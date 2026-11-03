package org.soulbattery.backend.dto;

import java.util.List;

/**
 * @param answers 30문항 답변
 * @param note    "내 배터리 상태를 한마디로 하자면?" (선택, 저장하지 않음)
 */
public record AnalysisRequest(List<AnswerDto> answers, String note) {}
