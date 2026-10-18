package org.soulbattery.backend.user;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "users", uniqueConstraints =
        @UniqueConstraint(name = "uk_users_provider", columnNames = {"provider", "provider_user_id"}))
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_user_id", nullable = false, length = 64)
    private String providerUserId;

    @Column(length = 50)
    private String nickname;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected User() {}

    public User(String provider, String providerUserId, String nickname) {
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.nickname = nickname;
        this.createdAt = Instant.now();
    }

    public void updateNickname(String nickname) {
        if (nickname != null) this.nickname = nickname;
    }

    public Long getId() { return id; }
    public String getNickname() { return nickname; }
}
