package org.soulbattery.backend.record;

import org.soulbattery.backend.domain.SoulType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class RecordService {

    /** 사용자 1명이 가질 수 있는 최대 기록 수 */
    static final int MAX_RECORDS_PER_USER = 1000;
    /** 기기 기록을 한 번에 옮길 수 있는 최대 개수 (프론트도 100개까지만 보관) */
    static final int MAX_IMPORT = 100;

    private final SoulRecordRepository repository;

    public RecordService(SoulRecordRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RecordDto> list(Long userId) {
        return repository.findByUserIdOrderByCreatedAtAsc(userId).stream().map(RecordDto::from).toList();
    }

    /** 방금 끝난 점검 결과 저장. 생성 시각은 서버 기준. */
    @Transactional
    public RecordDto add(Long userId, RecordDto dto) {
        if (repository.countByUserId(userId) >= MAX_RECORDS_PER_USER) {
            throw new IllegalArgumentException("저장할 수 있는 기록 수를 넘었어요.");
        }
        SoulRecord saved = repository.save(toEntity(userId, dto, UUID.randomUUID().toString(), Instant.now()));
        return RecordDto.from(saved);
    }

    /**
     * 로그인 전 기기에 쌓인 기록을 계정으로 옮긴다.
     * 같은 id 는 한 번만 들어가므로 여러 번 호출해도 안전하다. 형식이 잘못된 기록은 건너뛴다.
     */
    @Transactional
    public List<RecordDto> importAll(Long userId, List<RecordDto> records) {
        if (records != null) {
            Set<String> existing = new HashSet<>(repository.findClientIdsByUserId(userId));
            long room = MAX_RECORDS_PER_USER - existing.size();
            for (RecordDto dto : records.stream().limit(MAX_IMPORT).toList()) {
                if (room <= 0) break;
                if (dto.id() == null || dto.id().isBlank() || dto.id().length() > 64 || existing.contains(dto.id())) continue;
                try {
                    repository.save(toEntity(userId, dto, dto.id(), parseTime(dto.createdAt())));
                    existing.add(dto.id());
                    room--;
                } catch (IllegalArgumentException ignored) {
                    // 잘못된 기록 하나 때문에 전체 이전이 실패하지 않도록 건너뛴다
                }
            }
        }
        return list(userId);
    }

    @Transactional
    public void deleteAll(Long userId) {
        repository.deleteAllByUserId(userId);
    }

    private static SoulRecord toEntity(Long userId, RecordDto dto, String clientId, Instant createdAt) {
        SoulType type;
        try {
            type = SoulType.valueOf(dto.typeCode());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("알 수 없는 유형입니다: " + dto.typeCode());
        }
        return new SoulRecord(userId, clientId, type,
                percent(dto.outerBattery()), percent(dto.innerBattery()),
                percent(dto.openness()), percent(dto.userGuess()), createdAt);
    }

    private static int percent(int value) {
        if (value < 0 || value > 100) {
            throw new IllegalArgumentException("배터리 값은 0~100 이어야 합니다: " + value);
        }
        return value;
    }

    private static Instant parseTime(String value) {
        Instant now = Instant.now();
        if (value == null) return now;
        try {
            Instant parsed = Instant.parse(value);
            return parsed.isAfter(now) ? now : parsed;
        } catch (DateTimeParseException e) {
            return now;
        }
    }
}
