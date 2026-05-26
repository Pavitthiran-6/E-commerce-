package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CouponResponse {
    private Long id;
    private String code;
    private String description;
    private String type;
    private BigDecimal value;
    private BigDecimal minCartValue;
    private BigDecimal maxDiscount;
    private Boolean isActive;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
}
