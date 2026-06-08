package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.PaymentFailureRequest;
import com.belledonne.ecommerce.dto.request.PaymentRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payments", description = "Razorpay payment integration")
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Step 1 of checkout: initialise a Razorpay order.
     *
     * Idempotent — safe to call multiple times for the same orderId.
     * The service returns the existing Razorpay order if one is already INITIATED.
     * Ownership is enforced: the orderId must belong to the authenticated user.
     */
    @PostMapping("/create-order")
    @Operation(summary = "Create (or retrieve) a Razorpay order for payment")
    public ResponseEntity<ApiResponse<?>> createOrder(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody Map<String, String> body) {

        UUID orderId = UUID.fromString(body.get("orderId"));
        return ResponseEntity.ok(ApiResponse.success(
            "Razorpay order ready",
            paymentService.createRazorpayOrder(orderId, principal.getId())));
    }

    /**
     * Step 2 of checkout: verify the payment signature returned by Razorpay.
     *
     * Verifies HMAC-SHA256, enforces order ownership, marks the order CONFIRMED,
     * and sends the order confirmation email.
     */
    @PostMapping("/verify")
    @Operation(summary = "Verify Razorpay payment signature and confirm order")
    public ResponseEntity<ApiResponse<?>> verifyPayment(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody PaymentRequest request) {

        return ResponseEntity.ok(ApiResponse.success(
            "Payment verified successfully",
            paymentService.verifyPayment(request, principal.getId())));
    }

    /**
     * Called when the Razorpay modal fires a payment.failed event.
     * Records the failure reason so the user can safely retry.
     */
    @PostMapping("/failure")
    @Operation(summary = "Record a Razorpay payment failure from the frontend")
    public ResponseEntity<ApiResponse<?>> reportFailure(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody PaymentFailureRequest request) {

        paymentService.recordFailure(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Payment failure recorded"));
    }

    /**
     * Returns payment details for an order.
     * Enforces ownership so users cannot inspect other users' payment data.
     */
    @GetMapping("/{orderId}")
    @Operation(summary = "Get payment details for an order")
    public ResponseEntity<ApiResponse<?>> getPayment(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID orderId) {

        return ResponseEntity.ok(ApiResponse.success(
            "Payment fetched",
            paymentService.getPaymentByOrderId(orderId, principal.getId())));
    }

    /**
     * Razorpay webhook endpoint — intentionally public (no JWT) because Razorpay
     * cannot authenticate as a user.  Security is enforced via HMAC-SHA256
     * verification of the X-Razorpay-Signature header inside PaymentService.
     *
     * Handles: payment.captured (confirms missed frontend callbacks)
     *          payment.failed   (records webhook-reported failures)
     */
    @PostMapping("/webhook")
    @Operation(summary = "Razorpay webhook endpoint — secured by signature verification")
    public ResponseEntity<String> webhook(
        @RequestHeader(value = "X-Razorpay-Signature", required = false) String razorpaySignature,
        @RequestBody String payload) {

        if (razorpaySignature == null || razorpaySignature.isBlank()) {
            log.warn("Webhook received without X-Razorpay-Signature header — rejecting");
            return ResponseEntity.badRequest().body("Missing signature");
        }

        paymentService.processWebhookEvent(payload, razorpaySignature);
        return ResponseEntity.ok("OK");
    }
}
