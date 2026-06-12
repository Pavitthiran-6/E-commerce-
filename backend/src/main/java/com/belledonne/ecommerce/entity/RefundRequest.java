package com.belledonne.ecommerce.entity;

import com.belledonne.ecommerce.enums.RefundStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tracks the business-level refund request workflow.
 *
 * Lifecycle:
 *   Customer submits → REFUND_REQUESTED
 *   Admin approves   → REFUND_APPROVED → (Razorpay called) → REFUND_INITIATED → REFUNDED
 *   Admin rejects    → REFUND_REJECTED
 *
 * This is separate from the Payment entity which tracks Razorpay financial state.
 * Order.paymentStatus is mirrored to RefundStatus for easy customer-facing display.
 */
@Entity
@Table(
    name = "refund_requests",
    indexes = {
        @Index(name = "idx_refund_order_id",  columnList = "order_id"),
        @Index(name = "idx_refund_user_id",   columnList = "user_id"),
        @Index(name = "idx_refund_status",    columnList = "refund_status"),
        @Index(name = "idx_refund_requested", columnList = "requested_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** The order being cancelled and refunded. One refund per order. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Order order;

    /** Denormalized for fast admin queries — avoids JOIN to orders→users. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    /** Customer-entered reason for cancellation / refund. */
    @Column(name = "cancellation_reason", columnDefinition = "TEXT", nullable = false)
    private String cancellationReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", length = 30, nullable = false)
    @Builder.Default
    private RefundStatus refundStatus = RefundStatus.REFUND_REQUESTED;

    /** Amount to be refunded — always equals order.totalAmount (full refund). */
    @Column(name = "refund_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal refundAmount;

    // ── Admin fields ──────────────────────────────────────────────────────────

    /** Optional admin notes added on approval. */
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    /** Required when rejecting. */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    /** UUID of the admin user who approved or rejected this request. */
    @Column(name = "reviewed_by_admin_id")
    private UUID reviewedByAdminId;

    /** Email of the admin for display purposes (denormalized). */
    @Column(name = "reviewed_by_admin_email", length = 255)
    private String reviewedByAdminEmail;

    /** When the admin acted on this request. */
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    // ── Razorpay ──────────────────────────────────────────────────────────────

    /** Set after Razorpay Refund API responds successfully. */
    @Column(name = "razorpay_refund_id", length = 100)
    private String razorpayRefundId;

    /** Recorded if Razorpay Refund API call fails. */
    @Column(name = "razorpay_refund_failure_reason", columnDefinition = "TEXT")
    private String razorpayRefundFailureReason;

    /** Uploaded image URL as proof of return. */
    @Column(name = "product_image_url", columnDefinition = "TEXT")
    private String productImageUrl;

    // ── Timestamps ────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "requested_at", updatable = false)
    private LocalDateTime requestedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
