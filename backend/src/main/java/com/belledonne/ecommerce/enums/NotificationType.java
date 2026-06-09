package com.belledonne.ecommerce.enums;

public enum NotificationType {
    // ── Customer order notifications ──────────────────────────────────────────
    ORDER_CONFIRMED,
    ORDER_SHIPPED,
    ORDER_DELIVERED,
    ORDER_CANCELLED,
    ORDER_PACKED,
    ORDER_OUT_FOR_DELIVERY,

    // ── Customer refund notifications ─────────────────────────────────────────
    REFUND_REQUESTED,
    REFUND_APPROVED,
    REFUND_REJECTED,
    REFUND_COMPLETED,
    REFUND_FAILED,

    // ── Customer misc notifications ───────────────────────────────────────────
    INVOICE_READY,
    COUPON_ASSIGNED,

    // ── Admin-only notifications ─────────────────────────────────────────────
    LOW_STOCK_ALERT,
    FAILED_REFUND_ALERT,
    SECURITY_ALERT,
    NEW_REFUND_REQUEST
}
