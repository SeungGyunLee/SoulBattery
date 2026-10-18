package org.soulbattery.backend.record;

import org.soulbattery.backend.domain.SoulType;

/**
 * 프론트 SoulRecord 타입과 같은 모양. 요청·응답 모두 사용한다.
 * 요청에서는 typeName·symbol 을 무시하고 typeCode 만 본다.
 */
public record RecordDto(
        String id,
        String createdAt,
        String typeCode,
        String typeName,
        String symbol,
        int outerBattery,
        int innerBattery,
        int openness,
        int userGuess
) {
    static RecordDto from(SoulRecord r) {
        SoulType type = r.getType();
        return new RecordDto(r.getClientId(), r.getCreatedAt().toString(), type.name(), type.title(),
                type.symbol(), r.getOuterBattery(), r.getInnerBattery(), r.getOpenness(), r.getUserGuess());
    }
}
