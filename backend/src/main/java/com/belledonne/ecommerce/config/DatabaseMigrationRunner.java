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
        log.info("Starting automatic database migrations...");
        try {
            // Upgrade images array type from varchar(255)[] to text[] to support base64 images
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN images TYPE text[] USING images::text[]");
            log.info("Database migration successfully upgraded products.images to text[]!");
        } catch (Exception e) {
            log.warn("Database migration products.images alter skipped or not needed: {}", e.getMessage());
        }

        try {
            // Add show_on_home column to coupons if not exists
            jdbcTemplate.execute("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT FALSE");
            log.info("Database migration successfully added show_on_home to coupons table!");
            // Update any existing null columns to safe defaults
            jdbcTemplate.execute("UPDATE coupons SET show_on_home = FALSE WHERE show_on_home IS NULL");
            jdbcTemplate.execute("UPDATE coupons SET used_count = 0 WHERE used_count IS NULL");
            jdbcTemplate.execute("UPDATE coupons SET min_cart_value = 0 WHERE min_cart_value IS NULL");
            log.info("Database migration successfully cleaned up null values in coupons table!");
        } catch (Exception e) {
            log.warn("Database migration coupons table cleanup skipped or failed: {}", e.getMessage());
        }
    }
}
