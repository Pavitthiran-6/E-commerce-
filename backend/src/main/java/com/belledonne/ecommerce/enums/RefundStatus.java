package com.belledonne.ecommerce.enums;

public enum RefundStatus {
    REFUND_REQUESTED,           // Customer submitted a refund/cancellation request
    REFUND_APPROVED,            // Admin approved, awaiting Razorpay processing
    REFUND_INITIATED,           // Razorpay refund API called successfully
    REFUNDED,                   // Refund complete (Razorpay or COD manual)
    REFUND_REJECTED,            // Admin rejected the request
    REFUND_FAILED,              // Razorpay refund API failed
    RETURN_APPROVED,            // Admin approved return request
    RETURN_PICKUP_SCHEDULED,    // Admin scheduled courier pickup
    PAYOUT_DETAILS_REQUESTED,   // Admin requested UPI/Bank details from customer (COD returns)
    PAYOUT_DETAILS_PROVIDED     // Customer submitted UPI/Bank details, admin can now process refund
}
