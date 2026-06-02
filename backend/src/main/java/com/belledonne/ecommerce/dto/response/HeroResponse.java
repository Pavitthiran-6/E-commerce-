package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeroResponse {
    private Long id;
    private String title;
    private String badge;
    private String dateRange;
    private String backgroundColor;
    private String leftIcon;
    private String rightIcon;

    // Featured Product fields
    private String featuredProductName;
    private String featuredProductImage;
    private BigDecimal featuredOriginalPrice;
    private BigDecimal featuredSalePrice;
    private Integer featuredDiscountPercentage;
    private String featuredCardBackgroundColor;

    private String productSlug;

    private List<HeroCardResponse> promoCards;
}
