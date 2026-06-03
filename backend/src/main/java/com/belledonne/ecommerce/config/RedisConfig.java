package com.belledonne.ecommerce.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Conditionally configures Redis for production token blacklisting.
 *
 * <p>If {@code REDIS_URL} environment variable is provided, a real Redis connection
 * is created using Lettuce. Otherwise, no Redis bean is registered and
 * {@link com.belledonne.ecommerce.service.TokenBlacklistService} falls back to
 * the in-memory implementation automatically.
 *
 * <p><b>Render deployment:</b>
 * <ol>
 *   <li>Render dashboard → Add-ons → Redis → Attach to your service</li>
 *   <li>Render injects {@code REDIS_URL} automatically into the environment</li>
 *   <li>Redeploy — Redis activates with zero code changes</li>
 * </ol>
 */
@Configuration
@Slf4j
public class RedisConfig {

    @Value("${REDIS_URL:}")
    private String redisUrl;

    /**
     * Returns a {@link StringRedisTemplate} only when {@code REDIS_URL} is configured.
     * Returns {@code null} when not configured — Spring skips bean registration and
     * {@link com.belledonne.ecommerce.service.TokenBlacklistService} uses in-memory fallback.
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate() {
        if (redisUrl == null || redisUrl.isBlank()) {
            log.info("[RedisConfig] REDIS_URL not set — Redis disabled. " +
                     "TokenBlacklistService will use in-memory fallback. " +
                     "Set REDIS_URL in production for persistent token blacklisting.");
            return null;
        }

        try {
            log.info("[RedisConfig] Connecting to Redis…");
            RedisStandaloneConfiguration config = parseRedisUrl(redisUrl);
            LettuceConnectionFactory factory = new LettuceConnectionFactory(config);
            factory.afterPropertiesSet();
            StringRedisTemplate template = new StringRedisTemplate(factory);
            template.afterPropertiesSet();
            log.info("[RedisConfig] ✅ Redis connected successfully (host={}, port={}).",
                     config.getHostName(), config.getPort());
            return template;
        } catch (Exception e) {
            log.error("[RedisConfig] ⚠️ Redis connection failed: {}. Falling back to in-memory blacklist.",
                      e.getMessage());
            return null;
        }
    }

    /**
     * Parses a Redis URL in the format {@code redis[s]://[:password@]host[:port][/db]}
     * into a {@link RedisStandaloneConfiguration}.
     * Supports formats used by Render, Railway, Heroku, etc.
     */
    private RedisStandaloneConfiguration parseRedisUrl(String url) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        try {
            java.net.URI uri = java.net.URI.create(url);
            if (uri.getHost() != null) config.setHostName(uri.getHost());
            if (uri.getPort() > 0) config.setPort(uri.getPort());

            if (uri.getUserInfo() != null) {
                String[] parts = uri.getUserInfo().split(":", 2);
                // Format: "user:password" or ":password" (Render uses default:password)
                if (parts.length == 2 && !parts[1].isBlank()) {
                    config.setPassword(RedisPassword.of(parts[1]));
                }
            }
            if (uri.getPath() != null && uri.getPath().length() > 1) {
                try {
                    config.setDatabase(Integer.parseInt(uri.getPath().substring(1)));
                } catch (NumberFormatException ignored) { /* use default db 0 */ }
            }
        } catch (Exception e) {
            log.warn("[RedisConfig] Could not fully parse REDIS_URL, using defaults: {}", e.getMessage());
        }
        return config;
    }
}
