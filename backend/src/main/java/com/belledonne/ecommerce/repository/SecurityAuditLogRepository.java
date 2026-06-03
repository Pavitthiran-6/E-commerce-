package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.SecurityAuditLog;
import com.belledonne.ecommerce.enums.SecurityAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface SecurityAuditLogRepository extends JpaRepository<SecurityAuditLog, Long>, JpaSpecificationExecutor<SecurityAuditLog> {

    long countByIpAddressAndActionAndCreatedAtAfter(String ipAddress, SecurityAction action, LocalDateTime createdAt);

    long countByUserIdAndActionAndCreatedAtAfter(UUID userId, SecurityAction action, LocalDateTime createdAt);

    long countByUserEmailAndActionAndCreatedAtAfter(String userEmail, SecurityAction action, LocalDateTime createdAt);

    int deleteByCreatedAtBefore(LocalDateTime createdAt);

    @org.springframework.data.jpa.repository.Query("SELECT s.action, COUNT(s) FROM SecurityAuditLog s WHERE s.createdAt >= :startOfToday GROUP BY s.action")
    java.util.List<Object[]> countActionsToday(@org.springframework.data.repository.query.Param("startOfToday") LocalDateTime startOfToday);

    long countByActionAndCreatedAtAfter(SecurityAction action, LocalDateTime createdAt);

    @org.springframework.data.jpa.repository.Query("SELECT CAST(s.createdAt AS date), s.action, COUNT(s) FROM SecurityAuditLog s WHERE s.createdAt >= :startDate AND s.action IN (com.belledonne.ecommerce.enums.SecurityAction.LOGIN_SUCCESS, com.belledonne.ecommerce.enums.SecurityAction.LOGIN_FAILED, com.belledonne.ecommerce.enums.SecurityAction.SUSPICIOUS_ACTIVITY) GROUP BY CAST(s.createdAt AS date), s.action ORDER BY CAST(s.createdAt AS date) ASC")
    java.util.List<Object[]> getDailySecurityCounts(@org.springframework.data.repository.query.Param("startDate") LocalDateTime startDate);

    @org.springframework.data.jpa.repository.Query("SELECT s.ipAddress, COUNT(s) FROM SecurityAuditLog s WHERE s.ipAddress IS NOT NULL GROUP BY s.ipAddress ORDER BY COUNT(s) DESC")
    java.util.List<Object[]> getTopIPs(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT s.userEmail, COUNT(s) FROM SecurityAuditLog s WHERE s.action = com.belledonne.ecommerce.enums.SecurityAction.ACCOUNT_LOCKED AND s.userEmail IS NOT NULL GROUP BY s.userEmail ORDER BY COUNT(s) DESC")
    java.util.List<Object[]> getTopLockedAccounts(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM SecurityAuditLog s WHERE s.action = com.belledonne.ecommerce.enums.SecurityAction.SECURITY_ALERT_TRIGGERED ORDER BY s.createdAt DESC")
    java.util.List<SecurityAuditLog> findLatestAlert(org.springframework.data.domain.Pageable pageable);
}
