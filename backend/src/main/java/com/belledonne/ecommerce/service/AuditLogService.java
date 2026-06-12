package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.AuditLog;
import com.belledonne.ecommerce.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async
    @Transactional
    public void log(String adminUser, String action, String notes, String orderId, String refundRequestId) {
        try {
            AuditLog entry = AuditLog.builder()
                .adminUser(adminUser != null ? adminUser : "system@belledonne.in")
                .action(action)
                .notes(notes)
                .orderId(orderId)
                .refundRequestId(refundRequestId)
                .timestamp(LocalDateTime.now())
                .build();
            auditLogRepository.save(entry);
            log.info("[AuditLog] User={} Action={} Order={} Refund={} Notes={}", adminUser, action, orderId, refundRequestId, notes);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage(), e);
        }
    }
}
