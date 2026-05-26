package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class PaymentRequest {
    private UUID orderId;
    @NotBlank
    private String razorpayOrderId;
    @NotBlank
    private String razorpayPaymentId;
    @NotBlank
    private String razorpaySignature;
}
