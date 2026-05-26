package com.belledonne.ecommerce.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class VariantRequest {
    private String size;
    private String color;
    private String colorHex;
    private Integer stockQuantity;
    private BigDecimal additionalPrice;
}
