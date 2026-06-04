package com.belledonne.ecommerce.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class RateLimitConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Apply rate limiting to all sensitive auth endpoints:
        // POST /api/auth/login          — brute-force protection
        // POST /api/auth/forgot-password — OTP request spam protection
        // POST /api/auth/reset-password  — OTP validation spam protection
        // POST /api/auth/verify-otp      — OTP brute-force protection
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns(
                    "/api/auth/login",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                    "/api/auth/verify-otp",
                    "/api/auth/verify-registration",
                    "/api/auth/resend-registration-otp"
                );
    }
}
