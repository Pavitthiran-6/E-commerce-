package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private Boolean isBlocked;
    private String blockedReason;
    private Long ordersCount;
    private BigDecimal totalAmountSpent;
    /** True when accountLockedUntil is in the future (temporary lockout from failed logins). */
    private Boolean isLocked;
    private LocalDateTime lockedUntil;

    private Long totalReturns;
    private Long totalRefunds;
    private Double returnPercentage;
    private Boolean isHighReturnRisk;

    // Custom constructor for JpaRepository JPQL projection
    public UserAdminResponse(UUID id, String name, String email, String phone,
                             com.belledonne.ecommerce.enums.Role role,
                             LocalDateTime createdAt, LocalDateTime lastLoginAt,
                             Boolean isBlocked, String blockedReason,
                             Long ordersCount, BigDecimal totalAmountSpent,
                             LocalDateTime accountLockedUntil,
                             Long totalReturns, Long totalRefunds) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role != null ? role.name() : null;
        this.createdAt = createdAt;
        this.lastLoginAt = lastLoginAt;
        this.isBlocked = isBlocked;
        this.blockedReason = blockedReason;
        this.ordersCount = ordersCount;
        this.totalAmountSpent = totalAmountSpent != null ? totalAmountSpent : BigDecimal.ZERO;
        this.lockedUntil = accountLockedUntil;
        this.isLocked = accountLockedUntil != null && accountLockedUntil.isAfter(LocalDateTime.now());
        this.totalReturns = totalReturns != null ? totalReturns : 0L;
        this.totalRefunds = totalRefunds != null ? totalRefunds : 0L;
        if (this.ordersCount != null && this.ordersCount > 0) {
            this.returnPercentage = (double) this.totalReturns * 100.0 / (double) this.ordersCount;
        } else {
            this.returnPercentage = 0.0;
        }
        this.isHighReturnRisk = this.returnPercentage > 40.0 && this.ordersCount > 0;
    }
}
