package com.belledonne.ecommerce.config;

import com.belledonne.ecommerce.security.JwtAuthenticationFilter;
import com.belledonne.ecommerce.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(org.springframework.security.config.Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized: Please log in.\"}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                // Allow CORS preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public root and auth routes
                .requestMatchers("/").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                // Public product/category/review read routes
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reviews/product/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/sales/**").permitAll()
                // Public coupons routes
                .requestMatchers("/api/coupons/**").permitAll()
                // Swagger UI
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                // Webhook (public, verified by signature)
                .requestMatchers("/api/payments/webhook").permitAll()
                // Admin routes
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Everything else requires auth
                .anyRequest().authenticated()
            )
            .authenticationProvider(authProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
