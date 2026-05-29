package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CouponResponse {
    private String code;
    private String description;
    private BigDecimal minOrderValue;
    private String discountType;      // 'PERCENTAGE' or 'FIXED'
    private BigDecimal discountValue;
}
