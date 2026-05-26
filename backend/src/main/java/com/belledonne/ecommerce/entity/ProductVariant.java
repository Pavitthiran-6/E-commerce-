package com.belledonne.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Product product;

    @Column(length = 20)
    private String size;

    @Column(length = 50)
    private String color;

    @Column(name = "color_hex", length = 10)
    private String colorHex;

    @Column(name = "stock_quantity")
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "additional_price", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal additionalPrice = BigDecimal.ZERO;
}
