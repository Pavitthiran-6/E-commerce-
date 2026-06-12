package com.belledonne.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "shipping_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "free_shipping_threshold", nullable = false, precision = 10, scale = 2)
    private BigDecimal freeShippingThreshold;

    @Column(name = "shipping_charge", nullable = false, precision = 10, scale = 2)
    private BigDecimal shippingCharge;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
