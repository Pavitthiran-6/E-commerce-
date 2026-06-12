package com.belledonne.ecommerce.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseInspectionRequest {
    private String warehouseInspectionNotes;
    private Boolean isProductDamaged = false;
    private Boolean isWrongProductReturned = false;
    private Boolean isMissingAccessories = false;
    private Boolean isUsedProduct = false;
    private Boolean isPackagingMissing = false;
    private Boolean isQualityIssueConfirmed = false;
}
