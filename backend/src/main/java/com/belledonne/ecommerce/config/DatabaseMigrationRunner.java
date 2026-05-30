package com.belledonne.ecommerce.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Starting automatic database migration for product images column type...");
        try {
            // Upgrade images array type from varchar(255)[] to text[] to support base64 images
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN images TYPE text[] USING images::text[]");
            log.info("Database migration successfully upgraded products.images to text[]!");
        } catch (Exception e) {
            log.warn("Database migration products.images alter skipped or not needed (this is normal if table doesn't exist yet or already altered): {}", e.getMessage());
        }
    }
}
