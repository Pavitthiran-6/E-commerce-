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
    private String additionalComments;
    private String refundStatus;
    private BigDecimal refundAmount;
    private String adminNotes;
    private String rejectionReason;
    private UUID reviewedByAdminId;
    private String reviewedByAdminEmail;
    private LocalDateTime reviewedAt;
    private String razorpayRefundId;
    private String razorpayRefundFailureReason;
    // Legacy single image (kept for backward compatibility)
    private String productImageUrl;
    // New multi-image array (1–5 images)
    private String[] productImageUrls;
    private String bankDetails;
    private String upiId;
    private LocalDateTime requestedAt;
    private LocalDateTime updatedAt;
    // COD Payout Details Collection timestamps
    private LocalDateTime payoutDetailsRequestedAt;
    private LocalDateTime payoutDetailsProvidedAt;

    // Return & Refund SLA Analytics
    private LocalDateTime returnRequestedAt;
    private LocalDateTime returnApprovedAt;
    private LocalDateTime returnPickupScheduledAt;
    private LocalDateTime returnReceivedAt;
    private LocalDateTime refundProcessedAt;

    // Warehouse Inspection Checklist & Notes
    private String warehouseInspectionNotes;
    private Boolean isProductDamaged;
    private Boolean isWrongProductReturned;
    private Boolean isMissingAccessories;
    private Boolean isUsedProduct;
    private Boolean isPackagingMissing;
    private Boolean isQualityIssueConfirmed;

    // Razorpay Refund Reconciliation details
    private String razorpayRefundStatus;
    private LocalDateTime razorpayRefundTimestamp;
    private String razorpayRefundNotes;
    
    // Order details denormalized or sent along for rich dashboard
    private BigDecimal orderTotalAmount;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime orderDate;
    private List<OrderResponse.OrderItemResponse> items;
}
