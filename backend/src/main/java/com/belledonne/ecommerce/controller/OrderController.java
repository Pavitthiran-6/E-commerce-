package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.OrderRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.OrderService;
import com.belledonne.ecommerce.service.OrderTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order placement and tracking")
public class OrderController {

    private final OrderService orderService;
    private final OrderTrackingService orderTrackingService;

    @GetMapping
    @Operation(summary = "Get all orders for logged-in user")
    public ResponseEntity<ApiResponse<?>> getOrders(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Orders fetched",
            orderService.getUserOrders(principal, PageRequest.of(page, size))));
    }

    @PostMapping
    @Operation(summary = "Place a new order")
    public ResponseEntity<ApiResponse<?>> placeOrder(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Order placed successfully", orderService.placeOrder(principal, request)));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order details")
    public ResponseEntity<ApiResponse<?>> getOrder(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID orderId) {
        return ResponseEntity.ok(ApiResponse.success("Order fetched", orderService.getOrder(principal, orderId)));
    }

    @PutMapping("/{orderId}/cancel")
    @Operation(summary = "Cancel an order")
    public ResponseEntity<ApiResponse<?>> cancelOrder(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID orderId) {
        return ResponseEntity.ok(ApiResponse.success("Order cancelled", orderService.cancelOrder(principal, orderId)));
    }

    @GetMapping("/{orderId}/track")
    @Operation(summary = "Get order tracking timeline")
    public ResponseEntity<ApiResponse<?>> getOrderTracking(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID orderId) {
        // Enforce ownership
        orderService.getOrder(principal, orderId);
        return ResponseEntity.ok(ApiResponse.success("Tracking timeline fetched", orderTrackingService.getTrackingTimeline(orderId)));
    }
}
