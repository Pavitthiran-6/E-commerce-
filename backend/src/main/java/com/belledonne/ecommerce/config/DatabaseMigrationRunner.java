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

        try {
            // Add images column to reviews if not exists
            jdbcTemplate.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images text[]");
            log.info("Database migration successfully added images column to reviews table!");
        } catch (Exception e) {
            log.warn("Database migration reviews.images alter skipped or failed: {}", e.getMessage());
        }

        try {
            // Upgrade categories.image_url from VARCHAR(500) to TEXT to support base64 images
            jdbcTemplate.execute("ALTER TABLE categories ALTER COLUMN image_url TYPE TEXT USING image_url::TEXT");
            log.info("Database migration successfully upgraded categories.image_url to TEXT!");
        } catch (Exception e) {
            log.warn("Database migration categories.image_url alter skipped or not needed: {}", e.getMessage());
        }

        try {
            // Upgrade order_items.product_image from VARCHAR(500) to TEXT to support base64 images/long URLs
            jdbcTemplate.execute("ALTER TABLE order_items ALTER COLUMN product_image TYPE TEXT USING product_image::TEXT");
            log.info("Database migration successfully upgraded order_items.product_image to TEXT!");
        } catch (Exception e) {
            log.warn("Database migration order_items.product_image alter skipped or not needed: {}", e.getMessage());
        }

        try {
            log.info("Updating check constraint on orders.status to include all current OrderStatus values...");
            // Drop the stale constraint that only contained old/legacy status values
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
            // Recreate with all current OrderStatus enum values including return lifecycle states
            jdbcTemplate.execute("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (" +
                "'PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'PACKED', 'PROCESSING', 'SHIPPED', " +
                "'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', " +
                "'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_PICKUP_SCHEDULED', 'RETURNED', 'REFUNDED'" +
                "))");
            log.info("Database migration successfully updated orders_status_check constraint with all statuses!");
        } catch (Exception e) {
            log.warn("Database migration orders.status check constraint update skipped or failed: {}", e.getMessage());
        }

        try {
            log.info("Updating check constraint on orders.payment_status to include all current PaymentStatus values...");
            // Drop the stale payment_status constraint
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check");
            // Recreate with all current PaymentStatus enum values
            jdbcTemplate.execute("ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN (" +
                "'PENDING', 'INITIATED', 'SUCCESS', 'FAILED', 'CANCELLED', " +
                "'REFUND_REQUESTED', 'REFUND_APPROVED', 'REFUND_REJECTED', " +
                "'REFUND_INITIATED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'REFUND_FAILED', 'PAID'" +
                "))");
            log.info("Database migration successfully updated orders_payment_status_check constraint with all PaymentStatus values!");
        } catch (Exception e) {
            log.warn("Database migration orders.payment_status check constraint update skipped or failed: {}", e.getMessage());
        }

        try {
            log.info("Updating check constraint on security_audit_logs.action...");
            // Drop old constraint if it exists
            jdbcTemplate.execute("ALTER TABLE security_audit_logs DROP CONSTRAINT IF EXISTS security_audit_logs_action_check");
            // Add updated constraint containing all the current/new enum values
            jdbcTemplate.execute("ALTER TABLE security_audit_logs ADD CONSTRAINT security_audit_logs_action_check CHECK (action IN (" +
                "'LOGIN_SUCCESS', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'PASSWORD_RESET_REQUESTED', " +
                "'PASSWORD_RESET_SUCCESS', 'OTP_VERIFIED', 'OTP_FAILED', 'TOKEN_REFRESH', 'LOGOUT', 'ADMIN_UNLOCK_ACCOUNT', " +
                "'ADMIN_BLOCK_USER', 'ADMIN_UNBLOCK_USER', 'ADMIN_DELETE_USER', 'ADMIN_LOGIN', 'ADMIN_ACTION', " +
                "'ADMIN_EXPORT_LOGS', 'SECURITY_ALERT_TRIGGERED', 'SUSPICIOUS_ACTIVITY', 'REGISTRATION_STARTED', " +
                "'REGISTRATION_OTP_SENT', 'REGISTRATION_OTP_RESENT', 'EMAIL_VERIFIED', 'EMAIL_VERIFICATION_FAILED'" +
                "))");
            log.info("Database migration successfully updated security_audit_logs_action_check constraint!");
        } catch (Exception e) {
            log.warn("Database migration security_audit_logs.action check constraint update skipped or failed: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS product_image_url TEXT");
            log.info("Database migration successfully added product_image_url to refund_requests table!");
        } catch (Exception e) {
            log.warn("Database migration refund_requests.product_image_url alter skipped or failed: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS bank_details TEXT");
            jdbcTemplate.execute("ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100)");
            log.info("Database migration successfully added bank_details and upi_id to refund_requests table!");
        } catch (Exception e) {
            log.warn("Database migration refund_requests.bank_details/upi_id alter skipped or failed: {}", e.getMessage());
        }

        try {
            // Correct the refund amount of the existing return request that is currently ₹80 for test order #ORD-20260611-0001
            jdbcTemplate.execute("UPDATE refund_requests SET refund_amount = 1.00 " +
                                 "WHERE order_id IN (SELECT id FROM orders WHERE order_number = 'ORD-20260611-0001') " +
                                 "AND refund_amount = 80.00");
            log.info("Database migration successfully updated test order refund amount!");
        } catch (Exception e) {
            log.warn("Database migration test order refund amount update failed: {}", e.getMessage());
        }

        try {
            log.info("Adding Shiprocket fields to orders table...");
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_id VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_code VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT");
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_status VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_created_at TIMESTAMP");
            log.info("Database migration successfully added Shiprocket fields to orders table!");
        } catch (Exception e) {
            log.warn("Database migration orders table Shiprocket columns skipped or failed: {}", e.getMessage());
        }

        try {
            log.info("Creating shipping_settings table...");
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS shipping_settings (" +
                                 "  id UUID PRIMARY KEY," +
                                 "  free_shipping_threshold DECIMAL(10,2) NOT NULL," +
                                 "  shipping_charge DECIMAL(10,2) NOT NULL," +
                                 "  updated_at TIMESTAMP" +
                                 ")");
            log.info("Database migration successfully created/verified shipping_settings table!");
            
            // Sync/Update default shipping settings to 499 threshold
            jdbcTemplate.execute("UPDATE shipping_settings SET free_shipping_threshold = 499.00 WHERE free_shipping_threshold = 999.00");
            log.info("Database migration successfully synced free shipping threshold to ₹499!");
        } catch (Exception e) {
            log.warn("Database migration shipping_settings table creation skipped or failed: {}", e.getMessage());
        }

        try {
            log.info("Adding shipping columns to products table...");
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_charge DECIMAL(10,2)");
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2) DEFAULT 0.5");
            log.info("Database migration successfully added shipping_charge and weight columns to products table!");
        } catch (Exception e) {
            log.warn("Database migration products table columns skipped or failed: {}", e.getMessage());
        }
    }
}
