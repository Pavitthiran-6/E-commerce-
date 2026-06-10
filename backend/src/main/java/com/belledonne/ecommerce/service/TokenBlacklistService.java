package com.belledonne.ecommerce.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Abstraction layer for refresh token blacklisting.
 *
 * <h2>Redis (production)</h2>
 * <p>When {@code REDIS_URL} is set and {@link StringRedisTemplate} is available,
 * blacklisted tokens are stored in Redis with a TTL matching the refresh-token expiry.
 * Entries auto-delete after expiry — no manual cleanup needed.
 * Survives server restarts — a logged-out token remains invalid after restart.
 *
 * <h2>In-memory fallback (local development)</h2>
 * <p>When Redis is not configured ({@code REDIS_URL} is absent), an in-memory
 * {@link ConcurrentHashMap} set is used. This does NOT survive restarts and should
 * only be used in local development.
 *
 * <h2>Redis key format</h2>
 * <pre>blacklist:refresh:{token}</pre>
 * <p>Value is {@code "1"} (placeholder). TTL = refresh-token-expiry milliseconds.
 */
@Service
@Slf4j
public class TokenBlacklistService {

    private static final String KEY_PREFIX = "blacklist:refresh:";

    /** Injected when REDIS_URL is set. Null when Redis is not configured. */
    @Nullable
    private final StringRedisTemplate redisTemplate;

    /** TTL for blacklisted tokens — must match jwt.refresh-token-expiry (default 30 days). */
    @Value("${jwt.refresh-token-expiry:2592000000}")
    private long refreshTokenExpiryMs;

    /** In-memory fallback — only used when Redis is not available. */
    private final Set<String> inMemoryBlacklist = ConcurrentHashMap.newKeySet();

    @Autowired
    public TokenBlacklistService(@Nullable StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        if (redisTemplate != null) {
            log.info("[TokenBlacklist] Using Redis backend for token blacklisting.");
        } else {
            log.warn("[TokenBlacklist] Redis not available — using in-memory blacklist. " +
                     "Blacklist will be LOST on server restart. Set REDIS_URL for production.");
        }
    }

    /**
     * Blacklists (invalidates) a refresh token so it cannot be reused.
     *
     * <p>Redis: token stored with TTL = refresh-token-expiry. Auto-expires.
     * <p>In-memory: token added to ConcurrentHashMap set (lost on restart).
     *
     * @param token the raw refresh token string to invalidate
     */
    public void blacklist(String token) {
        if (token == null || token.isBlank()) return;

        if (redisTemplate != null) {
            String key = KEY_PREFIX + token;
            redisTemplate.opsForValue().set(key, "1", refreshTokenExpiryMs, TimeUnit.MILLISECONDS);
            log.debug("[TokenBlacklist] Token blacklisted in Redis with TTL={}ms.", refreshTokenExpiryMs);
        } else {
            inMemoryBlacklist.add(token);
            log.debug("[TokenBlacklist] Token blacklisted in-memory (Redis unavailable).");
        }
    }

    /**
     * Returns true if the token has been blacklisted (i.e. is invalid / logged out).
     *
     * <p>Redis: checks for key existence — expired keys are automatically absent.
     * <p>In-memory: checks ConcurrentHashMap membership.
     *
     * @param token the raw refresh token string to check
     * @return {@code true} if the token is blacklisted
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) return false;

        if (redisTemplate != null) {
            return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + token));
        } else {
            return inMemoryBlacklist.contains(token);
        }
    }
}
