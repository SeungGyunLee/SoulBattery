package org.soulbattery.backend.domain;

/** 축별 점수 패턴으로 나눈 결과 유형. */
public enum SoulType {

    FULL("가득 찬 배터리", "겉과 속 모두 넉넉하게 채워져 있어요.", "🌿", true),
    STEADY("천천히 닳는 배터리", "크게 무너진 곳은 없지만, 조금씩 에너지가 새고 있어요.", "🍃", true),
    HIDDEN_DRAIN("겉만 켜진 배터리", "화면은 밝게 켜져 있는데, 속 잔량은 생각보다 낮아요.", "🕯️", true),
    MASKED_DRAIN("괜찮은 척하는 배터리", "잘 해내고 있는 모습 뒤에서 혼자 방전을 견디고 있어요.", "🌙", true),
    BODY_LAG("마음이 앞선 배터리", "속은 아직 살아 있는데, 일상을 굴리는 힘이 잠시 느려졌어요.", "🌱", true),
    DEEP_REST("쉼이 필요한 배터리", "겉도 속도 많이 지쳐 있어요. 지금은 채우는 것보다 쉬는 게 먼저예요.", "☁️", true),
    /** 속 배터리가 매우 낮은 구간. 결제 유도 대신 도움 연결을 먼저 보여준다. */
    NEEDS_SUPPORT("잠시 멈춤이 필요한 배터리", "지금은 혼자 버티기보다 누군가와 나눠야 할 때예요.", "🤍", false);

    private final String title;
    private final String description;
    private final String symbol;
    private final boolean paywallAllowed;

    SoulType(String title, String description, String symbol, boolean paywallAllowed) {
        this.title = title;
        this.description = description;
        this.symbol = symbol;
        this.paywallAllowed = paywallAllowed;
    }

    public String title() { return title; }
    public String description() { return description; }
    public String symbol() { return symbol; }
    public boolean paywallAllowed() { return paywallAllowed; }
}
