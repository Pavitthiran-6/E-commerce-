package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentResponse {
    private UUID paymentId;
    private UUID orderId;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String keyId;
    private LocalDateTime createdAt;
}
