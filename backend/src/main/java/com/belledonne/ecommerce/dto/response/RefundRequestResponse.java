package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundRequestResponse {
    private UUID id;
    private UUID orderId;
    private String orderNumber;
    private UUID userId;
    private String customerName;
    private String customerEmail;
    private String cancellationReason;
    private String refundStatus;
    private BigDecimal refundAmount;
    private String adminNotes;
    private String rejectionReason;
    private UUID reviewedByAdminId;
    private String reviewedByAdminEmail;
    private LocalDateTime reviewedAt;
    private String razorpayRefundId;
    private LocalDateTime requestedAt;
    private LocalDateTime updatedAt;
    
    // Order details denormalized or sent along for rich dashboard
    private BigDecimal orderTotalAmount;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime orderDate;
    private List<OrderResponse.OrderItemResponse> items;
}
