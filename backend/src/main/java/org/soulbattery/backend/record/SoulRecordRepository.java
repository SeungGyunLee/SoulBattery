package org.soulbattery.backend.record;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SoulRecordRepository extends JpaRepository<SoulRecord, Long> {

    List<SoulRecord> findByUserIdOrderByCreatedAtAsc(Long userId);

    @Query("select r.clientId from SoulRecord r where r.userId = :userId")
    List<String> findClientIdsByUserId(@Param("userId") Long userId);

    long countByUserId(Long userId);

    @Modifying
    @Query("delete from SoulRecord r where r.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
