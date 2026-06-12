package com.belledonne.ecommerce.entity;

import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.enums.PaymentMethod;
import com.belledonne.ecommerce.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_number", unique = true, nullable = false, length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.PLACED;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "shipping_charge", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal shippingCharge = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Coupon coupon;

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "estimated_delivery")
    private LocalDate estimatedDelivery;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    /** For COD orders: timestamp when cash payment was physically collected by courier/agent. */
    @Column(name = "payment_collected_at")
    private LocalDateTime paymentCollectedAt;

    @Column(name = "delivery_timestamp")
    private LocalDateTime deliveryTimestamp;

    @Column(name = "courier_delivery_remarks", columnDefinition = "TEXT")
    private String courierDeliveryRemarks;

    @Column(name = "receiver_name", length = 255)
    private String receiverName;

    @Column(name = "delivery_confirmation_details", columnDefinition = "TEXT")
    private String deliveryConfirmationDetails;

    @Column(name = "proof_of_delivery_url", columnDefinition = "TEXT")
    private String proofOfDeliveryUrl;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "courier_name", length = 100)
    private String courierName;

    @Column(name = "shipment_notes", columnDefinition = "TEXT")
    private String shipmentNotes;

    @Column(name = "shiprocket_order_id", length = 100)
    private String shiprocketOrderId;

    @Column(name = "shipment_id", length = 100)
    private String shipmentId;

    @Column(name = "awb_code", length = 100)
    private String awbCode;

    @Column(name = "tracking_url", columnDefinition = "TEXT")
    private String trackingUrl;

    @Column(name = "shipment_status", length = 50)
    private String shipmentStatus;

    @Column(name = "shipment_created_at")
    private LocalDateTime shipmentCreatedAt;

    @Column(name = "stock_restored", nullable = false)
    @Builder.Default
    private boolean stockRestored = false;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<OrderTracking> trackingHistory = new ArrayList<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Payment payment;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private RefundRequest refundRequest;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
