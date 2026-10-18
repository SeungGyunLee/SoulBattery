package org.soulbattery.backend.record;

import org.soulbattery.backend.auth.AuthInterceptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** 로그인한 사용자의 점검 기록. 모든 요청은 AuthInterceptor 를 거친다. */
@RestController
@RequestMapping("/api/records")
public class RecordController {

    public record ImportRequest(List<RecordDto> records) {}

    private final RecordService recordService;

    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    @GetMapping
    public List<RecordDto> list(@RequestAttribute(AuthInterceptor.USER_ID) Long userId) {
        return recordService.list(userId);
    }

    @PostMapping
    public RecordDto add(@RequestAttribute(AuthInterceptor.USER_ID) Long userId, @RequestBody RecordDto record) {
        try {
            return recordService.add(userId, record);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /** 로그인 직후, 기기에 있던 기록을 계정으로 옮긴다. */
    @PostMapping("/import")
    public List<RecordDto> importLocal(@RequestAttribute(AuthInterceptor.USER_ID) Long userId,
                                       @RequestBody ImportRequest request) {
        return recordService.importAll(userId, request.records());
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAll(@RequestAttribute(AuthInterceptor.USER_ID) Long userId) {
        recordService.deleteAll(userId);
    }
}
