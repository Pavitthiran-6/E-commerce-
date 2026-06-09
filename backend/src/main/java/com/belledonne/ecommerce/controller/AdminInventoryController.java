package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.InventoryAdjustmentRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.dto.response.InventoryReportResponse;
import com.belledonne.ecommerce.dto.response.InventoryResponse;
import com.belledonne.ecommerce.entity.InventoryHistory;
import com.belledonne.ecommerce.repository.InventoryHistoryRepository;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.InventoryService;
import com.belledonne.ecommerce.service.SecurityAuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Inventory", description = "Admin endpoints for inventory tracking and adjustments")
public class AdminInventoryController {

    private final InventoryService inventoryService;
    private final InventoryHistoryRepository inventoryHistoryRepository;

    @GetMapping
    @Operation(summary = "Get filtered inventory list with pagination")
    public ResponseEntity<ApiResponse<Page<InventoryResponse>>> getInventoryList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(required = false) Boolean outOfStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<InventoryResponse> response = inventoryService.getInventoryList(search, lowStock, outOfStock, pageable);
        return ResponseEntity.ok(ApiResponse.success("Inventory list fetched successfully", response));
    }

    @PostMapping("/adjust")
    @Operation(summary = "Manually adjust stock for a product or variant")
    public ResponseEntity<ApiResponse<InventoryResponse>> adjustStock(
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @Valid @RequestBody InventoryAdjustmentRequest request,
            HttpServletRequest httpServletRequest) {
        
        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");
        InventoryResponse response = inventoryService.adjustStock(request, adminPrincipal.getEmail(), ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted successfully", response));
    }

    @GetMapping("/reports")
    @Operation(summary = "Get current, reserved, and sold inventory metrics")
    public ResponseEntity<ApiResponse<InventoryReportResponse>> getInventoryReports() {
        InventoryReportResponse response = inventoryService.getInventoryReports();
        return ResponseEntity.ok(ApiResponse.success("Inventory reports fetched successfully", response));
    }

    @GetMapping("/history")
    @Operation(summary = "Get ledger logs for a specific product")
    public ResponseEntity<ApiResponse<Page<InventoryHistory>>> getInventoryHistory(
            @RequestParam UUID productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InventoryHistory> historyPage = inventoryHistoryRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Inventory ledger logs fetched successfully", historyPage));
    }
}
