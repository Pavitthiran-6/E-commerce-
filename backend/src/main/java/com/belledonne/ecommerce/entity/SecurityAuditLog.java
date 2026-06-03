package com.belledonne.ecommerce.entity;

import com.belledonne.ecommerce.enums.SecurityAction;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_audit_logs", indexes = {
    @Index(name = "idx_sec_audit_user_id", columnList = "user_id"),
    @Index(name = "idx_sec_audit_action", columnList = "action"),
    @Index(name = "idx_sec_audit_created_at", columnList = "created_at"),
    @Index(name = "idx_sec_audit_ip_address", columnList = "ip_address")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 50)
    private SecurityAction action;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
