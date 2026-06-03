package com.belledonne.ecommerce.exception;

import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Thrown when a user account is temporarily locked due to too many failed login attempts.
 * Maps to HTTP 423 Locked.
 */
@Getter
public class AccountLockedException extends RuntimeException {

    private final LocalDateTime lockedUntil;

    public AccountLockedException(LocalDateTime lockedUntil) {
        super("Account temporarily locked due to multiple failed login attempts.");
        this.lockedUntil = lockedUntil;
    }
}
