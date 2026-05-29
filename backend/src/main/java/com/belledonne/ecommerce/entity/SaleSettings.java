package com.belledonne.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sale_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sale_title", length = 200)
    @Builder.Default
    private String saleTitle = "SALE IS LIVE 🔥";

    @Column(name = "sale_subtitle", length = 500)
    @Builder.Default
    private String saleSubtitle = "Limited time deals — up to 70% off on selected products!";

    @Column(name = "max_discount_text", length = 100)
    @Builder.Default
    private String maxDiscountText = "up to 70% off";

    @Column(name = "sale_end_date_time")
    private LocalDateTime saleEndDateTime;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "deal_of_the_day_product_id")
    private UUID dealOfTheDayProductId;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
