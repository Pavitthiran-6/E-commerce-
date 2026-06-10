package com.belledonne.ecommerce.entity;

import com.belledonne.ecommerce.enums.Role;
import com.belledonne.ecommerce.enums.AuthProvider;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(length = 255)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;

    @Column(length = 15)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private Role role = Role.ROLE_USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = true, length = 20)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(name = "google_id", length = 255, unique = true)
    private String googleId;

    @Column(name = "is_email_verified")
    @Builder.Default
    private Boolean isEmailVerified = false;

    @Column(length = 6)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String otp;

    @Column(name = "otp_expiry")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private LocalDateTime otpExpiry;

    @Column(name = "is_blocked")
    @Builder.Default
    private Boolean isBlocked = false;

    @Column(name = "blocked_reason", columnDefinition = "TEXT")
    private String blockedReason;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    /** Incremented on each failed login attempt. Reset to 0 on successful login. */
    @Column(name = "failed_login_attempts")
    @Builder.Default
    private int failedLoginAttempts = 0;

    /**
     * Set to now + 15 minutes when failedLoginAttempts reaches the threshold.
     * Null means account is not locked. Auto-unlocks when time passes.
     */
    @Column(name = "account_locked_until")
    private LocalDateTime accountLockedUntil;


    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Address> addresses = new ArrayList<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Cart cart;

    public boolean isEnabled() {
        return isBlocked == null || !isBlocked;
    }
}
