package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CouponRequest {
    @NotBlank(message = "Coupon code is required")
    private String code;

    private String description;

    @NotBlank(message = "Coupon type is required")
    private String type;

    @NotNull(message = "Coupon value is required")
    private BigDecimal value;

    private BigDecimal minCartValue;

    private BigDecimal maxDiscount;

    private Integer usageLimit;

    private LocalDateTime validFrom;

    private LocalDateTime validUntil;

    private Boolean showOnHome;
}
