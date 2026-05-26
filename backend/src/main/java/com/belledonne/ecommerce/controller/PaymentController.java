package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.PaymentRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Razorpay payment integration")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    @Operation(summary = "Create Razorpay order for payment")
    public ResponseEntity<ApiResponse<?>> createOrder(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody Map<String, String> body) {
        UUID orderId = UUID.fromString(body.get("orderId"));
        return ResponseEntity.ok(ApiResponse.success("Razorpay order created",
            paymentService.createRazorpayOrder(orderId)));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify Razorpay payment signature")
    public ResponseEntity<ApiResponse<?>> verifyPayment(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully",
            paymentService.verifyPayment(request)));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get payment details for an order")
    public ResponseEntity<ApiResponse<?>> getPayment(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID orderId) {
        return ResponseEntity.ok(ApiResponse.success("Payment fetched",
            paymentService.getPaymentByOrderId(orderId)));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Razorpay webhook endpoint (public)")
    public ResponseEntity<String> webhook(@RequestBody String payload) {
        // Webhook events can be processed here for async payment status updates
        return ResponseEntity.ok("OK");
    }
}
