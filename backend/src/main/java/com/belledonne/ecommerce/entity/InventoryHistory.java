package com.belledonne.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "inventory_history",
    indexes = {
        @Index(name = "idx_inv_product_id", columnList = "product_id"),
        @Index(name = "idx_inv_variant_id", columnList = "variant_id"),
        @Index(name = "idx_inv_created_at", columnList = "created_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ProductVariant variant;

    @Column(name = "quantity_changed", nullable = false)
    private Integer quantityChanged;

    @Column(name = "resulting_stock", nullable = false)
    private Integer resultingStock;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType; // ORDER_PLACED, ORDER_CANCELLED, REFUND_APPROVED, MANUAL_ADJUSTMENT

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "changed_by", length = 255)
    private String changedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
