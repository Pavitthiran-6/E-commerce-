package com.belledonne.ecommerce.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SaleSettingsRequest {
    private String saleTitle;
    private String saleSubtitle;
    private String maxDiscountText;
    private LocalDateTime saleEndDateTime;
    private Boolean isActive;
}
