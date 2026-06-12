package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.RefundPayoutDetailsRequest;
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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
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

    /**
     * Submit a return request for a delivered order.
     * New Flow: Customer provides reason, optional comments, and 1–5 proof images.
     * UPI/Bank details are NOT collected here — they are requested separately by admin for COD orders.
     */
    @PostMapping(value = "/{orderId}/return", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit a return request for a delivered order (reason + comments + 1-5 images)")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> submitReturnRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId,
            @RequestParam("cancellationReason") String cancellationReason,
            @RequestParam(value = "additionalComments", required = false) String additionalComments,
            @RequestParam("files") List<MultipartFile> files,
            HttpServletRequest httpServletRequest) {

        if (cancellationReason == null || cancellationReason.trim().length() < 10) {
            throw new com.belledonne.ecommerce.exception.BadRequestException(
                "Return reason must be at least 10 characters.");
        }
        if (cancellationReason.trim().length() > 500) {
            throw new com.belledonne.ecommerce.exception.BadRequestException(
                "Return reason cannot exceed 500 characters.");
        }
        if (files == null || files.isEmpty()) {
            throw new com.belledonne.ecommerce.exception.BadRequestException(
                "At least 1 product image is required for returns.");
        }
        if (files.size() > 5) {
            throw new com.belledonne.ecommerce.exception.BadRequestException(
                "Maximum 5 images allowed.");
        }

        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        RefundRequestResponse response = refundRequestService.submitReturnRequest(
                principal, orderId, cancellationReason, additionalComments, files, ipAddress, userAgent
        );
        return ResponseEntity.ok(ApiResponse.success("Return request submitted successfully", response));
    }

    /**
     * Customer submits their UPI/Bank payout details after admin requests them.
     * Only applicable for COD return orders at PAYOUT_DETAILS_REQUESTED status.
     */
    @PostMapping("/{orderId}/return/payout-details")
    @Operation(summary = "Customer submits UPI/Bank payout details for COD return refund")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> submitPayoutDetails(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId,
            @RequestBody RefundPayoutDetailsRequest request,
            HttpServletRequest httpServletRequest) {

        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        RefundRequestResponse response = refundRequestService.submitPayoutDetails(
                principal, orderId, request, ipAddress, userAgent
        );
        return ResponseEntity.ok(ApiResponse.success("Payout details submitted successfully", response));
    }

    @GetMapping("/{orderId}/refund-status")
    @Operation(summary = "Get refund status for a cancelled or returned order")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> getRefundStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID orderId) {
        
        RefundRequestResponse response = refundRequestService.getRefundStatusForOrder(orderId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Refund status retrieved successfully", response));
    }
}

