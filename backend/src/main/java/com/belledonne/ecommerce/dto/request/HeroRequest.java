package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class HeroRequest {

    @NotBlank(message = "Hero title is required")
    private String title;

    private String badge;

    private String dateRange;

    private String backgroundColor;

    private String leftIcon;

    private String rightIcon;

    // Featured product details
    private String featuredProductName;
    private String featuredProductImage;
    private BigDecimal featuredOriginalPrice;
    private BigDecimal featuredSalePrice;
    private Integer featuredDiscountPercentage;
    private String featuredCardBackgroundColor;

    private List<HeroCardRequest> promoCards;
}
