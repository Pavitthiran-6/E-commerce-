package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Sent by the frontend when the Razorpay payment.failed event fires.
 * Allows the backend to record the failure reason and mark the payment FAILED
 * so the user can safely retry without duplicate inserts.
 */
@Data
public class PaymentFailureRequest {

    /** The Razorpay order ID — used to locate the Payment record. */
    @NotBlank(message = "razorpayOrderId is required")
    private String razorpayOrderId;

    /** Razorpay error code (e.g. BAD_REQUEST_ERROR, GATEWAY_ERROR). */
    private String errorCode;

    /** Human-readable failure description from Razorpay. */
    private String errorDescription;
}
