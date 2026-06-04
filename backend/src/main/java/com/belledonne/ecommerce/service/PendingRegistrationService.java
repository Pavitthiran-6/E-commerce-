package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.PendingRegistration;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class PendingRegistrationService {

    private static final String KEY_PREFIX = "pending-register:";
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // In-memory fallback
    private final Map<String, PendingRegistration> inMemoryStore = new ConcurrentHashMap<>();

    @Autowired
    public PendingRegistrationService(@Nullable StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        if (redisTemplate != null) {
            log.info("[PendingRegistrationService] Using Redis backend for pending registrations.");
        } else {
            log.warn("[PendingRegistrationService] Redis not available — using in-memory store.");
        }
    }

    public void save(String email, PendingRegistration registration) {
        if (redisTemplate != null) {
            String key = KEY_PREFIX + email;
            try {
                String json = objectMapper.writeValueAsString(registration);
                redisTemplate.opsForValue().set(key, json, 15, TimeUnit.MINUTES);
                log.debug("[PendingRegistrationService] Saved registration to Redis for {}", email);
            } catch (Exception e) {
                log.error("[PendingRegistrationService] Failed to write to Redis, falling back to in-memory: {}", e.getMessage());
                inMemoryStore.put(email, registration);
            }
        } else {
            inMemoryStore.put(email, registration);
            log.debug("[PendingRegistrationService] Saved registration in-memory for {}", email);
        }
    }

    public PendingRegistration get(String email) {
        if (redisTemplate != null) {
            String key = KEY_PREFIX + email;
            try {
                String json = redisTemplate.opsForValue().get(key);
                if (json == null) {
                    // Check in-memory fallback just in case
                    return inMemoryStore.get(email);
                }
                return objectMapper.readValue(json, PendingRegistration.class);
            } catch (Exception e) {
                log.error("[PendingRegistrationService] Failed to read from Redis, checking in-memory fallback: {}", e.getMessage());
                return inMemoryStore.get(email);
            }
        } else {
            return inMemoryStore.get(email);
        }
    }

    public void delete(String email) {
        inMemoryStore.remove(email);
        if (redisTemplate != null) {
            String key = KEY_PREFIX + email;
            try {
                redisTemplate.delete(key);
                log.debug("[PendingRegistrationService] Deleted registration from Redis for {}", email);
            } catch (Exception e) {
                log.error("[PendingRegistrationService] Failed to delete from Redis: {}", e.getMessage());
            }
        }
    }
}
