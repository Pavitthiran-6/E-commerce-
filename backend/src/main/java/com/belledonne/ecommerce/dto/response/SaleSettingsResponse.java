package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleSettingsResponse {
    private Long id;
    private String saleTitle;
    private String saleSubtitle;
    private String maxDiscountText;
    private LocalDateTime saleEndDateTime;
    private Boolean isActive;
    private UUID dealOfTheDayProductId;

    // Deal of the Day product preview fields
    private String dealProductName;
    private String dealProductImage;
    private BigDecimal dealProductPrice;
    private BigDecimal dealProductOriginalPrice;
    private Integer dealProductDiscountPercentage;
    private String dealProductDescription;

    private LocalDateTime updatedAt;
}
