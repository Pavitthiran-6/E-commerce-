package com.belledonne.ecommerce.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final Map<String, Integer> attempts = new ConcurrentHashMap<>();
    private final Map<String, Long> resetTimes = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        long now = System.currentTimeMillis();
        synchronized (this) {
            Long resetTime = resetTimes.get(ip);
            if (resetTime == null || now > resetTime) {
                attempts.put(ip, 1);
                resetTimes.put(ip, now + 60000);
            } else {
                int count = attempts.getOrDefault(ip, 0);
                if (count >= 5) {
                    response.setStatus(429);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write("{\"success\":false,\"message\":\"Too many login attempts. Please try again after 1 minute.\",\"errorCode\":\"RATE_LIMIT_EXCEEDED\"}");
                    return false;
                }
                attempts.put(ip, count + 1);
            }
        }
        return true;
    }
}
