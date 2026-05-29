package com.belledonne.ecommerce.config;

import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.enums.Role;
import com.belledonne.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * One-time startup runner that promotes the admin@belledonne.com account
 * to ROLE_ADMIN if it exists and is not already an admin.
 * This is safe to keep — it only runs once at startup and does nothing
 * if the user is already ROLE_ADMIN or doesn't exist.
 */
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private static final String ADMIN_EMAIL = "admin@belledonne.com";

    @Override
    public void run(ApplicationArguments args) {
        try {
            userRepository.findAll().forEach(user -> log.info("[AdminSeeder] DB USER: {} - {} - {}", user.getEmail(), user.getRole(), user.getName()));
            userRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(user -> {
                if (user.getRole() == Role.ROLE_ADMIN) {
                    log.info("[AdminSeeder] User {} is already ROLE_ADMIN — nothing to do.", ADMIN_EMAIL);
                    return;
                }
                user.setRole(Role.ROLE_ADMIN);
                userRepository.save(user);
                log.info("[AdminSeeder] ✅ Successfully promoted {} to ROLE_ADMIN.", ADMIN_EMAIL);
            }, () -> {
                log.info("[AdminSeeder] User {} not found — creating admin user.", ADMIN_EMAIL);
                User admin = User.builder()
                    .name("Admin")
                    .email(ADMIN_EMAIL)
                    .password(passwordEncoder.encode("admin123"))
                    .phone("9999999999")
                    .isEmailVerified(true)
                    .role(Role.ROLE_ADMIN)
                    .build();
                userRepository.save(admin);
                log.info("[AdminSeeder] ✅ Successfully created admin user {}.", ADMIN_EMAIL);
            });
        } catch (Exception e) {
            log.error("[AdminSeeder] Failed to promote/create admin user: {}", e.getMessage());
        }
    }
}
