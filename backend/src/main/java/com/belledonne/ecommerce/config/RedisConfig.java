package com.belledonne.ecommerce.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Conditionally configures Redis for production token blacklisting and registration flow.
 *
 * <p>If {@code REDIS_URL} environment variable is provided, a real Redis connection
 * is created using Lettuce. Otherwise, no Redis bean is registered and
 * dependent services automatically fall back to in-memory/DB implementations.
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
     * Configures and returns a {@link RedisConnectionFactory} only when {@code REDIS_URL} is configured.
     * Returns {@code null} otherwise.
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        if (redisUrl == null || redisUrl.isBlank()) {
            log.info("[RedisConfig] REDIS_URL not set — RedisConnectionFactory disabled (returns null).");
            return null;
        }

        try {
            log.info("[RedisConfig] Configuring LettuceConnectionFactory…");
            RedisStandaloneConfiguration config = parseRedisUrl(redisUrl);
            LettuceConnectionFactory factory = new LettuceConnectionFactory(config);
            factory.afterPropertiesSet();
            return factory;
        } catch (Exception e) {
            log.error("[RedisConfig] ⚠️ Failed to configure LettuceConnectionFactory: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Returns a {@link StringRedisTemplate} only when {@link RedisConnectionFactory} is available.
     * Returns {@code null} when not configured — dependent services fall back to their in-memory/DB implementations.
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        if (connectionFactory == null) {
            log.info("[RedisConfig] RedisConnectionFactory is null — StringRedisTemplate disabled (returns null).");
            return null;
        }

        try {
            StringRedisTemplate template = new StringRedisTemplate(connectionFactory);
            template.afterPropertiesSet();
            log.info("[RedisConfig] ✅ StringRedisTemplate configured successfully.");
            return template;
        } catch (Exception e) {
            log.error("[RedisConfig] ⚠️ Failed to configure StringRedisTemplate: {}", e.getMessage());
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
