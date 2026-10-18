package org.soulbattery.backend.domain;

/**
 * 축별 점수 (0~100).
 *
 * @param outer 겉 배터리
 * @param inner 속 배터리
 * @param open  표현 정도
 */
public record AxisScores(int outer, int inner, int open) {

    /** 겉과 속의 차이. 양수일수록 "겉은 멀쩡한데 속은 비어 있는" 상태. */
    public int gap() {
        return outer - inner;
    }

    /** 대표 배터리 잔량. 서비스 컨셉상 "속 배터리"를 실제 잔량으로 본다. */
    public int soulBattery() {
        return inner;
    }
}
