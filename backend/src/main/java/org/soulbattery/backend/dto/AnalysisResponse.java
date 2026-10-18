package org.soulbattery.backend.dto;

public record AnalysisResponse(
        String typeCode,
        String typeName,
        String description,
        String symbol,
        int outerBattery,
        int innerBattery,
        int openness,
        int gap,
        boolean needsSupport,
        String aiComment
) {}
