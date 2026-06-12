package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderResponse {
    private UUID id;
    private String orderNumber;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal shippingCharge;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String couponCode;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDate estimatedDelivery;
    private LocalDateTime deliveredAt;
    private LocalDateTime paymentCollectedAt;
    private String trackingNumber;
    private String courierName;
    private String shipmentNotes;
    private boolean stockRestored;
    private AddressResponse address;
    private List<OrderItemResponse> items;
    private List<TrackingResponse> trackingHistory;
    private LocalDateTime createdAt;

    // Shiprocket fields
    private String shiprocketOrderId;
    private String shipmentId;
    private String awbCode;
    private String trackingUrl;
    private String shipmentStatus;
    private LocalDateTime shipmentCreatedAt;

    // Delivery Proof fields
    private LocalDateTime deliveryTimestamp;
    private String courierDeliveryRemarks;
    private String receiverName;
    private String deliveryConfirmationDetails;
    private String proofOfDeliveryUrl;

    // Refund fields
    private String cancellationReason;
    private String additionalComments;
    private String refundStatus;
    private LocalDateTime refundRequestedAt;
    private String refundNotes;
    private String rejectionReason;
    private String razorpayRefundId;
    private String razorpayRefundFailureReason;
    private String productImageUrl;
    private String[] productImageUrls;
    private String bankDetails;
    private String upiId;
    private LocalDateTime payoutDetailsRequestedAt;
    private LocalDateTime payoutDetailsProvidedAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private UUID productId;
        private String productName;
        private String productImage;
        private String size;
        private String color;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TrackingResponse {
        private String status;
        private String message;
        private String location;
        private LocalDateTime trackingTime;
    }
}
