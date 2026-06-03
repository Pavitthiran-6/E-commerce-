package com.belledonne.ecommerce.config;

import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.enums.Role;
import com.belledonne.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Startup runner that ensures an admin account exists.
 *
 * <p>If the configured admin email already exists and is ROLE_ADMIN, this does nothing.
 * If the admin email exists but is not ROLE_ADMIN, it is promoted.
 * If the admin email does not exist, a new admin account is created using the password
 * read from the {@code ADMIN_DEFAULT_PASSWORD} environment variable.
 *
 * <p><b>Production requirement:</b> The {@code ADMIN_DEFAULT_PASSWORD} environment
 * variable MUST be set before first deployment. If missing, no admin account will be
 * created and a warning is logged.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@belledonne.com";

    /**
     * Admin password read from environment variable.
     * Defaults to an empty string if the variable is not set —
     * empty value is treated as "not configured" and admin creation is skipped.
     */
    @Value("${ADMIN_DEFAULT_PASSWORD:}")
    private String adminDefaultPassword;

    @Override
    public void run(ApplicationArguments args) {
        try {
            userRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(user -> {
                if (user.getRole() == Role.ROLE_ADMIN) {
                    log.info("[AdminSeeder] ✅ User {} is already ROLE_ADMIN — nothing to do.", ADMIN_EMAIL);
                    return;
                }
                user.setRole(Role.ROLE_ADMIN);
                userRepository.save(user);
                log.info("[AdminSeeder] ✅ Successfully promoted {} to ROLE_ADMIN.", ADMIN_EMAIL);
            }, () -> {
                // Admin does not exist — attempt to create
                if (adminDefaultPassword == null || adminDefaultPassword.isBlank()) {
                    log.warn("[AdminSeeder] ⚠️  ADMIN_DEFAULT_PASSWORD environment variable is not set. " +
                             "No admin account has been created. " +
                             "Set ADMIN_DEFAULT_PASSWORD and restart the application to create the default admin.");
                    return;
                }

                User admin = User.builder()
                        .name("Admin")
                        .email(ADMIN_EMAIL)
                        .password(passwordEncoder.encode(adminDefaultPassword))
                        .phone("9999999999")
                        .isEmailVerified(true)
                        .role(Role.ROLE_ADMIN)
                        .build();
                userRepository.save(admin);
                log.info("[AdminSeeder] ✅ Successfully created admin user {} using ADMIN_DEFAULT_PASSWORD.", ADMIN_EMAIL);
            });
        } catch (Exception e) {
            log.error("[AdminSeeder] Failed to promote/create admin user: {}", e.getMessage());
        }
    }
}
