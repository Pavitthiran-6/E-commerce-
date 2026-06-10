-- Production PostgreSQL Schema Migration Script
-- Covers: Inventory, Shipment Tracking, Refund Failures, Notifications, Security Audits, and Review Verification features

-- =============================================================================
-- 1. Create Tables for New Entities (with IF NOT EXISTS)
-- =============================================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(40) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory History Ledger
CREATE TABLE IF NOT EXISTS inventory_history (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity_changed INTEGER NOT NULL,
    resulting_stock INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Shipment Milestone Tracking (if not already created)
CREATE TABLE IF NOT EXISTS order_tracking (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    location VARCHAR(200),
    tracking_time TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Security Auditing Ledger (if not already created)
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    user_email VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. Create Supporting Indexes
-- =============================================================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notifications(created_at);

-- Inventory history indexes
CREATE INDEX IF NOT EXISTS idx_inv_product_id ON inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_variant_id ON inventory_history(variant_id);
CREATE INDEX IF NOT EXISTS idx_inv_created_at ON inventory_history(created_at);

-- Security logs indexes
CREATE INDEX IF NOT EXISTS idx_sec_audit_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_audit_action ON security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_sec_audit_created_at ON security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sec_audit_ip_address ON security_audit_logs(ip_address);

-- Refund requests indexes
CREATE INDEX IF NOT EXISTS idx_refund_order_id ON refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_status ON refund_requests(refund_status);
CREATE INDEX IF NOT EXISTS idx_refund_requested ON refund_requests(requested_at);

-- =============================================================================
-- 3. ALTER Tables & Columns for Existing Entities
-- =============================================================================

-- A. Products (Inventory threshold)
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- B. Reviews (Verification states)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images VARCHAR(500)[];

-- C. Orders (Fulfillment tracking and restoration)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_restored BOOLEAN DEFAULT FALSE;

-- D. Refund Requests (Razorpay failure audit)
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS razorpay_refund_failure_reason TEXT;

-- E. Users (Brute-force security and admin seeder updates)
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITHOUT TIME ZONE;

-- =============================================================================
-- 4. Default Backfill Updates (Ensuring No Null Mappings Exist)
-- =============================================================================

UPDATE products SET low_stock_threshold = 5 WHERE low_stock_threshold IS NULL;

UPDATE reviews SET is_verified_purchase = FALSE WHERE is_verified_purchase IS NULL;
UPDATE reviews SET is_approved = TRUE WHERE is_approved IS NULL;

UPDATE orders SET payment_status = 'PENDING' WHERE payment_status IS NULL;
UPDATE orders SET stock_restored = FALSE WHERE stock_restored IS NULL;

UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL;
UPDATE users SET is_blocked = FALSE WHERE is_blocked IS NULL;

-- =============================================================================
-- 5. Google Login Schema Upgrades
-- =============================================================================

-- Add Google authentication provider fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

-- Make password nullable for passwordless Google users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Create unique index on google_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Backfill auth_provider
UPDATE users SET auth_provider = 'LOCAL' WHERE auth_provider IS NULL;

-- =============================================================================
-- 6. Google Login Security Audit Logs Check Constraint & Enum Upgrade
-- =============================================================================

-- Drop NOT NULL from users.password (ensuring it is dropped in production)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Drop and recreate the security_audit_logs action CHECK constraint to support new Google actions
ALTER TABLE security_audit_logs DROP CONSTRAINT IF EXISTS security_audit_logs_action_check;
ALTER TABLE security_audit_logs ADD CONSTRAINT security_audit_logs_action_check CHECK (action IN (
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'ACCOUNT_LOCKED',
    'ACCOUNT_UNLOCKED',
    'PASSWORD_RESET_REQUESTED',
    'PASSWORD_RESET_SUCCESS',
    'OTP_VERIFIED',
    'OTP_FAILED',
    'TOKEN_REFRESH',
    'LOGOUT',
    'ADMIN_UNLOCK_ACCOUNT',
    'ADMIN_BLOCK_USER',
    'ADMIN_UNBLOCK_USER',
    'ADMIN_DELETE_USER',
    'ADMIN_LOGIN',
    'ADMIN_ACTION',
    'ADMIN_EXPORT_LOGS',
    'SECURITY_ALERT_TRIGGERED',
    'SUSPICIOUS_ACTIVITY',
    'REGISTRATION_STARTED',
    'REGISTRATION_OTP_SENT',
    'REGISTRATION_OTP_RESENT',
    'EMAIL_VERIFIED',
    'EMAIL_VERIFICATION_FAILED',
    'REFUND_REQUESTED',
    'REFUND_APPROVED',
    'REFUND_REJECTED',
    'REFUND_INITIATED',
    'REFUND_COMPLETED',
    'REFUND_FAILED',
    'INVENTORY_ADJUSTED',
    'GOOGLE_LOGIN_SUCCESS',
    'GOOGLE_LOGIN_FAILED',
    'GOOGLE_ACCOUNT_LINKED'
));

-- Ensure users auth_provider has the correct CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_provider_check;
ALTER TABLE users ADD CONSTRAINT users_auth_provider_check CHECK (auth_provider IN ('LOCAL', 'GOOGLE'));

