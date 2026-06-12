package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.dto.response.ProductResponse;
import com.belledonne.ecommerce.dto.response.SaleSettingsResponse;
import com.belledonne.ecommerce.entity.SaleSettings;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.ProductRepository;
import com.belledonne.ecommerce.service.ProductService;
import com.belledonne.ecommerce.service.SaleSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@Tag(name = "Sales", description = "Public sale settings endpoints for frontend")
public class SaleController {

    private final SaleSettingsService saleSettingsService;
    private final ProductService productService;
    private final ProductRepository productRepository;
    private final com.belledonne.ecommerce.service.ShippingSettingsService shippingSettingsService;

    @GetMapping("/shipping/settings")
    @Operation(summary = "Get current shipping configurations (public)")
    public ResponseEntity<ApiResponse<?>> getShippingSettings() {
        return ResponseEntity.ok(ApiResponse.success("Shipping settings fetched", shippingSettingsService.getOrCreate()));
    }

    @GetMapping("/settings")
    @Operation(summary = "Get current sale banner settings (public)")
    public ResponseEntity<ApiResponse<?>> getSettings() {
        SaleSettingsResponse response = saleSettingsService.getResponse();
        return ResponseEntity.ok(ApiResponse.success("Sale settings fetched", response));
    }

    @GetMapping("/deal-of-the-day")
    @Operation(summary = "Get the current Deal of the Day product (public)")
    public ResponseEntity<ApiResponse<?>> getDealOfTheDay() {
        SaleSettings settings = saleSettingsService.getOrCreate();
        if (settings.getDealOfTheDayProductId() == null) {
            return ResponseEntity.ok(ApiResponse.success("No deal of the day set", null));
        }
        ProductResponse product = productRepository.findById(settings.getDealOfTheDayProductId())
            .map(productService::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", settings.getDealOfTheDayProductId()));
        return ResponseEntity.ok(ApiResponse.success("Deal of the day fetched", product));
    }
}
