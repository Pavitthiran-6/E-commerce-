package com.belledonne.ecommerce.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * IP-based rate limiter for sensitive authentication endpoints.
 *
 * <p>Limits each IP address to a maximum of {@value #MAX_ATTEMPTS} requests
 * within a {@value #WINDOW_MS}-millisecond sliding window.
 * Returns HTTP 429 with a JSON error body when the limit is exceeded.
 *
 * <p>Applies to:
 * <ul>
 *   <li>POST /api/auth/login</li>
 *   <li>POST /api/auth/forgot-password</li>
 *   <li>POST /api/auth/reset-password</li>
 * </ul>
 *
 * <p><b>TODO (production hardening):</b> For multi-node deployments, replace the
 * in-memory maps with a Redis-backed counter so rate limits are shared across
 * all application instances. Use {@code INCR} + {@code EXPIRE} in Redis for
 * an atomic sliding-window counter.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    /** Maximum number of requests allowed within the time window. */
    private static final int MAX_ATTEMPTS = 5;

    /** Time window in milliseconds: 15 minutes. */
    private static final long WINDOW_MS = 15 * 60 * 1000L;

    // Key: "IP:path" to apply separate limits per endpoint
    private final Map<String, Integer> attempts = new ConcurrentHashMap<>();
    private final Map<String, Long> resetTimes  = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        String ip = getClientIp(request);
        // Include the request path so each endpoint has its own counter per IP
        String key = ip + ":" + request.getRequestURI();

        long now = System.currentTimeMillis();

        synchronized (this) {
            Long resetTime = resetTimes.get(key);

            // Window expired — reset counter
            if (resetTime == null || now > resetTime) {
                attempts.put(key, 1);
                resetTimes.put(key, now + WINDOW_MS);
                return true;
            }

            int count = attempts.getOrDefault(key, 0);
            if (count >= MAX_ATTEMPTS) {
                long remainingSeconds = Math.max(0L, (resetTime - now) / 1000);
                response.setStatus(429);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.setHeader("Retry-After", String.valueOf(remainingSeconds));
                response.getWriter().write(
                    "{\"success\":false," +
                    "\"message\":\"Too many attempts. Please try again later.\"," +
                    "\"retryAfterSeconds\":" + remainingSeconds + "}"
                );
                return false;
            }

            attempts.put(key, count + 1);
        }
        return true;
    }

    /**
     * Resolves the real client IP address, honouring the X-Forwarded-For header
     * set by reverse proxies (nginx, AWS ALB, Cloudflare, etc.).
     */
    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank() && !"unknown".equalsIgnoreCase(xff)) {
            // X-Forwarded-For may contain a comma-separated chain — use the first (originating) IP
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && !"unknown".equalsIgnoreCase(realIp)) {
            return realIp;
        }
        return request.getRemoteAddr();
    }
}
