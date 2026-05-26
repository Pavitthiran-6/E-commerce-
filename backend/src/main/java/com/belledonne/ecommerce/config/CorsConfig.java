package com.belledonne.ecommerce.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import java.util.Arrays;
import java.util.List;
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        // Allow your React frontend
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173"
        ));
        // Allow all HTTP methods
        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        // Allow all headers
        config.setAllowedHeaders(List.of("*"));
        // Allow cookies and Authorization header
        config.setAllowCredentials(true);
        // Cache preflight for 1 hour
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
