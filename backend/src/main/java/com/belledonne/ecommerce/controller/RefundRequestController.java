package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.RefundRequestRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.dto.response.RefundRequestResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.RefundRequestService;
import com.belledonne.ecommerce.service.SecurityAuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Refund Requests", description = "Customer-facing refund request management")
public class RefundRequestController {

    private final RefundRequestService refundRequestService;

    @PutMapping("/{orderId}/cancel-with-refund")
    @Operation(summary = "Cancel a paid online order and submit a refund request")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> submitRefundRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId,
            @Valid @RequestBody RefundRequestRequest request,
            HttpServletRequest httpServletRequest) {
        
        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        RefundRequestResponse response = refundRequestService.submitRefundRequest(
                principal, orderId, request, ipAddress, userAgent
        );
        return ResponseEntity.ok(ApiResponse.success("Refund request submitted successfully", response));
    }

    @GetMapping("/{orderId}/refund-status")
    @Operation(summary = "Get refund status for a cancelled order")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> getRefundStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId) {
        
        RefundRequestResponse response = refundRequestService.getRefundStatusForOrder(orderId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Refund status retrieved successfully", response));
    }
}
