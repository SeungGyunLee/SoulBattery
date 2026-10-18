package org.soulbattery.backend.record;

import jakarta.persistence.*;
import org.soulbattery.backend.domain.SoulType;

import java.time.Instant;

/** 점검 기록 1건. 유형 이름·심볼은 typeCode로 SoulType에서 꺼내 쓰므로 저장하지 않는다. */
@Entity
@Table(name = "soul_record",
        uniqueConstraints = @UniqueConstraint(name = "uk_soul_record_client", columnNames = {"user_id", "client_id"}),
        indexes = @Index(name = "idx_soul_record_user_created", columnList = "user_id, created_at"))
public class SoulRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 프론트에서 만든 기록 id. 기기 기록을 서버로 옮길 때 같은 기록이 두 번 들어가지 않게 막는다. */
    @Column(name = "client_id", nullable = false, length = 64)
    private String clientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_code", nullable = false, length = 30)
    private SoulType type;

    @Column(name = "outer_battery", nullable = false)
    private int outerBattery;

    @Column(name = "inner_battery", nullable = false)
    private int innerBattery;

    @Column(nullable = false)
    private int openness;

    @Column(name = "user_guess", nullable = false)
    private int userGuess;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected SoulRecord() {}

    public SoulRecord(Long userId, String clientId, SoulType type, int outerBattery, int innerBattery,
                      int openness, int userGuess, Instant createdAt) {
        this.userId = userId;
        this.clientId = clientId;
        this.type = type;
        this.outerBattery = outerBattery;
        this.innerBattery = innerBattery;
        this.openness = openness;
        this.userGuess = userGuess;
        this.createdAt = createdAt;
    }

    public String getClientId() { return clientId; }
    public SoulType getType() { return type; }
    public int getOuterBattery() { return outerBattery; }
    public int getInnerBattery() { return innerBattery; }
    public int getOpenness() { return openness; }
    public int getUserGuess() { return userGuess; }
    public Instant getCreatedAt() { return createdAt; }
}
