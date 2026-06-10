package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class LoginLockoutService {

    private static final String FAIL_KEY_PREFIX = "login-fail:";
    private static final String LOCKOUT_KEY_PREFIX = "lockout:";
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 15;

    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;
    private final EmailService emailService;
    private final SecurityAuditService securityAuditService;
    private final jakarta.servlet.http.HttpServletRequest request;

    @Autowired
    public LoginLockoutService(UserRepository userRepository,
                               @Nullable StringRedisTemplate redisTemplate,
                               EmailService emailService,
                               SecurityAuditService securityAuditService,
                               jakarta.servlet.http.HttpServletRequest request) {
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
        this.emailService = emailService;
        this.securityAuditService = securityAuditService;
        this.request = request;
        if (redisTemplate != null) {
            log.info("[LoginLockoutService] Redis detected. Lockout counters will be stored in Redis.");
        } else {
            log.warn("[LoginLockoutService] Redis not available. Falling back to database-only lockout tracking.");
        }
    }

    /**
     * Checks if the user is locked.
     * If Redis is available, it checks the lockout key in Redis first.
     * If locked in Redis, returns true.
     * If not locked in Redis, but accountLockedUntil in DB is in the future, we treat it as unlocked
     * (since Redis auto-unlock expired the TTL), and we clear the DB lockout state.
     * If Redis is NOT available, it falls back to checking the DB.
     */
    public boolean isLocked(User user) {
        if (redisTemplate != null) {
            String lockKey = LOCKOUT_KEY_PREFIX + user.getId().toString();
            boolean hasLock = Boolean.TRUE.equals(redisTemplate.hasKey(lockKey));
            if (hasLock) {
                return true;
            } else if (user.getAccountLockedUntil() != null) {
                // Redis key is absent but DB still shows locked — this means the lock has expired (auto-unlocked).
                // Let's clear the DB state.
                user.setAccountLockedUntil(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
            return false;
        } else {
            // In-memory / DB fallback
            return user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isAfter(LocalDateTime.now());
        }
    }

    /**
     * Returns when the user lockout expires.
     * If Redis is available, it calculates this based on the remaining TTL of the lockout key.
     * If Redis is not available, it gets the value from the database.
     */
    public LocalDateTime getLockedUntil(User user) {
        if (redisTemplate != null) {
            String lockKey = LOCKOUT_KEY_PREFIX + user.getId().toString();
            Long expire = redisTemplate.getExpire(lockKey, TimeUnit.SECONDS);
            if (expire != null && expire > 0) {
                return LocalDateTime.now().plusSeconds(expire);
            }
            return null;
        } else {
            if (user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isAfter(LocalDateTime.now())) {
                return user.getAccountLockedUntil();
            }
            return null;
        }
    }

    /**
     * Returns the number of failed attempts.
     * If Redis is available, it gets the value from the Redis counter key.
     * If Redis is not available, it gets the value from the database.
     */
    public int getFailedAttempts(User user) {
        if (redisTemplate != null) {
            String lockKey = LOCKOUT_KEY_PREFIX + user.getId().toString();
            if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey))) {
                return MAX_FAILED_ATTEMPTS;
            }
            String failKey = FAIL_KEY_PREFIX + user.getId().toString();
            String val = redisTemplate.opsForValue().get(failKey);
            if (val != null) {
                try {
                    return Integer.parseInt(val);
                } catch (NumberFormatException ignored) {}
            }
            return 0;
        } else {
            if (user.getAccountLockedUntil() != null && !user.getAccountLockedUntil().isAfter(LocalDateTime.now())) {
                // Lazily clear expired lock count
                return 0;
            }
            return user.getFailedLoginAttempts();
        }
    }

    /**
     * Records a failed login attempt.
     * Increments the failure count (in Redis if available, and updates DB).
     * If the count reaches 5:
     * - Locks the account (sets Redis lockout key with TTL 15 mins).
     * - Sets the DB accountLockedUntil and failedLoginAttempts.
     * - Sends email notification (exactly once).
     * Returns true if the account becomes locked.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean recordLoginFailure(User user) {
        int attempts;
        if (redisTemplate != null) {
            String failKey = FAIL_KEY_PREFIX + user.getId().toString();
            Long val = redisTemplate.opsForValue().increment(failKey);
            if (val == null) {
                attempts = 1;
            } else {
                attempts = val.intValue();
            }
            if (attempts == 1) {
                // Set TTL of 15 minutes for the failures counter
                redisTemplate.expire(failKey, LOCK_DURATION_MINUTES, TimeUnit.MINUTES);
            }
            
            // Also update DB for admin visibility
            user.setFailedLoginAttempts(attempts);
            userRepository.save(user);

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                // Create lockout key
                String lockKey = LOCKOUT_KEY_PREFIX + user.getId().toString();
                redisTemplate.opsForValue().set(lockKey, "1", LOCK_DURATION_MINUTES, TimeUnit.MINUTES);
                
                // Delete failed attempts key
                redisTemplate.delete(failKey);

                // Update DB for admin visibility
                LocalDateTime lockUntil = LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES);
                user.setAccountLockedUntil(lockUntil);
                user.setFailedLoginAttempts(MAX_FAILED_ATTEMPTS);
                userRepository.save(user);

                // Send email notification (only once!)
                emailService.sendAccountLockedEmail(user.getEmail(), user.getName());
                log.info("[LoginLockoutService] Account {} locked out for {} minutes due to {} failed attempts.",
                         user.getEmail(), LOCK_DURATION_MINUTES, MAX_FAILED_ATTEMPTS);

                // Log SECURITY AUDIT LOG
                String ip = SecurityAuditService.getClientIp(request);
                String ua = request.getHeader("User-Agent");
                securityAuditService.log(user.getId(), user.getEmail(), com.belledonne.ecommerce.enums.SecurityAction.ACCOUNT_LOCKED, ip, ua, "SUCCESS", "5 failed login attempts detected");

                return true;
            }
        } else {
            // DB fallback
            attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            userRepository.save(user);

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                LocalDateTime lockUntil = LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES);
                user.setAccountLockedUntil(lockUntil);
                userRepository.save(user);

                emailService.sendAccountLockedEmail(user.getEmail(), user.getName());
                log.info("[LoginLockoutService] (Fallback) Account {} locked out for {} minutes.",
                         user.getEmail(), LOCK_DURATION_MINUTES);

                // Log SECURITY AUDIT LOG
                String ip = SecurityAuditService.getClientIp(request);
                String ua = request.getHeader("User-Agent");
                securityAuditService.log(user.getId(), user.getEmail(), com.belledonne.ecommerce.enums.SecurityAction.ACCOUNT_LOCKED, ip, ua, "SUCCESS", "5 failed login attempts detected");

                return true;
            }
        }
        return false;
    }

    /**
     * Resets failed login attempts and clears lockout.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetLockout(User user) {
        boolean wasLocked = isLocked(user);

        if (redisTemplate != null) {
            String failKey = FAIL_KEY_PREFIX + user.getId().toString();
            String lockKey = LOCKOUT_KEY_PREFIX + user.getId().toString();
            redisTemplate.delete(failKey);
            redisTemplate.delete(lockKey);
        }
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        userRepository.save(user);
        log.info("[LoginLockoutService] Lockout states cleared for account {}.", user.getEmail());

        if (wasLocked) {
            String ip = SecurityAuditService.getClientIp(request);
            String ua = request.getHeader("User-Agent");
            securityAuditService.log(user.getId(), user.getEmail(), com.belledonne.ecommerce.enums.SecurityAction.ACCOUNT_UNLOCKED, ip, ua, "SUCCESS", "Account lockout cleared");
        }
    }
}
