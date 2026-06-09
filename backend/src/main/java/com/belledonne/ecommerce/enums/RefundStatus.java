package com.belledonne.ecommerce.enums;

public enum RefundStatus {
    REFUND_REQUESTED,   // Customer submitted a refund request
    REFUND_APPROVED,    // Admin approved, awaiting Razorpay processing
    REFUND_INITIATED,   // Razorpay refund API called successfully
    REFUNDED,           // Razorpay confirmed refund complete
    REFUND_REJECTED     // Admin rejected the request
}
