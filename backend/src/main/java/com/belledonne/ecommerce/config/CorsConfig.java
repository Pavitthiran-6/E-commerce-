package com.belledonne.ecommerce.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOriginsProperty;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Build allowed origins from application property (supports comma-separated list)
        List<String> origins = new ArrayList<>(Arrays.asList(allowedOriginsProperty.split(",")));

        // Also add FRONTEND_URL env var if set (for production deployment)
        String frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl != null && !frontendUrl.isBlank() && !origins.contains(frontendUrl.trim())) {
            origins.add(frontendUrl.trim());
        }

        config.setAllowedOrigins(origins);

        // Allow all HTTP methods
        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        // Explicitly list allowed request headers — avoid wildcard with allowCredentials
        // since some browsers (Safari, older Chrome) reject it
        config.setAllowedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "Accept", "Origin",
            "X-Requested-With", "Cache-Control"
        ));
        // Expose Set-Cookie so browser can process refreshToken cookie in cross-origin responses
        config.setExposedHeaders(Arrays.asList("Set-Cookie"));
        // Allow cookies and Authorization header
        config.setAllowCredentials(true);
        // Cache preflight for 1 hour
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
