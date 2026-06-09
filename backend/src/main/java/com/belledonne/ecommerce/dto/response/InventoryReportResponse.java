package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReportResponse {
    private Long currentStock;
    private Long reservedStock;
    private Long soldStock;
    private Long lowStockCount;
    private Long outOfStockCount;
}
