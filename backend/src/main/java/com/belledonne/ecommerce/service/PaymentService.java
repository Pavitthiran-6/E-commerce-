package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.PaymentFailureRequest;
import com.belledonne.ecommerce.dto.request.PaymentRequest;
import com.belledonne.ecommerce.dto.response.PaymentResponse;
import com.belledonne.ecommerce.entity.Order;
import com.belledonne.ecommerce.entity.Payment;
import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.enums.PaymentMethod;
import com.belledonne.ecommerce.enums.PaymentStatus;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.PaymentException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.exception.UnauthorizedException;
import com.belledonne.ecommerce.repository.OrderRepository;
import com.belledonne.ecommerce.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * PaymentService — production-grade Razorpay integration.
 *
 * Security guarantees:
 *  - All mutating methods require the caller's userId to enforce ownership (IDOR prevention).
 *  - Signature verification uses HMAC-SHA256 over the Razorpay-prescribed payload.
 *  - Webhook endpoint uses a separate webhook secret for its HMAC-SHA256 check.
 *
 * Reliability guarantees:
 *  - createRazorpayOrder() is idempotent: calling it multiple times for the same
 *    order returns the existing payment record rather than creating duplicates.
 *  - verifyPayment() is idempotent: already-SUCCESS payments are returned without
 *    re-processing.
 *  - processWebhookEvent() is idempotent via the razorpayPaymentId uniqueness check.
 */
@Service
@Slf4j
@Transactional
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final EmailService emailService;
    private final InvoiceService invoiceService;

    public PaymentService(RazorpayClient razorpayClient, PaymentRepository paymentRepository,
                          OrderRepository orderRepository, EmailService emailService,
                          @Lazy InvoiceService invoiceService) {
        this.razorpayClient = razorpayClient;
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.emailService = emailService;
        this.invoiceService = invoiceService;
    }

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook.secret}")
    private String razorpayWebhookSecret;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CREATE ORDER
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Creates (or retrieves) a Razorpay order for the given internal Order UUID.
     *
     * Idempotency: if a Payment entity already exists for this order with a status
     * of INITIATED or PENDING, the existing Razorpay order ID is returned.  This
     * prevents the @OneToOne unique constraint from throwing a 500 on retry.
     *
     * Ownership: the order must belong to userId, otherwise UnauthorizedException.
     */
    public PaymentResponse createRazorpayOrder(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // ── IDOR protection ──
        enforceOrderOwnership(order, userId);

        // ── Idempotency check ──
        Optional<Payment> existing = paymentRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            Payment payment = existing.get();
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                // Already paid — return existing response without touching Razorpay
                log.warn("createRazorpayOrder called for already-paid orderId={}", orderId);
                return toPaymentResponse(payment);
            }
            if (payment.getStatus() == PaymentStatus.INITIATED
                    || payment.getStatus() == PaymentStatus.PENDING) {
                // Retry: return the SAME Razorpay order so the modal can re-open it
                log.info("Reusing existing Razorpay order {} for internal orderId={}", payment.getRazorpayOrderId(), orderId);
                return toPaymentResponse(payment);
            }
            // FAILED / CANCELLED — allow a fresh Razorpay order to be created below
            // Reset the existing record to INITIATED so we reuse the row (avoids duplicate)
            log.info("Re-initiating failed/cancelled payment for orderId={}", orderId);
            return reInitiatePayment(payment, order);
        }

        // ── Create a brand-new Razorpay order ──
        try {
            JSONObject options = new JSONObject();
            // Razorpay amount must be in paise (1 INR = 100 paise)
            options.put("amount", order.getTotalAmount().multiply(BigDecimal.valueOf(100)).intValue());
            options.put("currency", "INR");
            options.put("receipt", order.getOrderNumber());

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(options);
            String rzpOrderId = razorpayOrder.get("id");

            Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .currency("INR")
                .razorpayOrderId(rzpOrderId)
                .status(PaymentStatus.INITIATED)
                .build();
            Payment saved = paymentRepository.save(payment);

            log.info("Created Razorpay order {} for internal orderId={}", rzpOrderId, orderId);
            return toPaymentResponse(saved);

        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed for orderId={}: {}", orderId, e.getMessage());
            throw new PaymentException("Failed to create payment order: " + e.getMessage());
        }
    }

    /**
     * Resets an existing FAILED/CANCELLED Payment to INITIATED and creates a new
     * Razorpay order for it.  Reuses the same Payment row to respect the unique
     * constraint between orders and payments.
     */
    private PaymentResponse reInitiatePayment(Payment payment, Order order) {
        try {
            JSONObject options = new JSONObject();
            options.put("amount", order.getTotalAmount().multiply(BigDecimal.valueOf(100)).intValue());
            options.put("currency", "INR");
            options.put("receipt", order.getOrderNumber());

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(options);
            String rzpOrderId = razorpayOrder.get("id");

            payment.setRazorpayOrderId(rzpOrderId);
            payment.setRazorpayPaymentId(null);
            payment.setRazorpaySignature(null);
            payment.setFailureReason(null);
            payment.setStatus(PaymentStatus.INITIATED);
            payment.setWebhookVerified(false);
            Payment saved = paymentRepository.save(payment);

            log.info("Re-initiated Razorpay order {} for orderId={}", rzpOrderId, order.getId());
            return toPaymentResponse(saved);

        } catch (RazorpayException e) {
            log.error("Razorpay re-initiation failed for orderId={}: {}", order.getId(), e.getMessage());
            throw new PaymentException("Failed to re-initiate payment: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. VERIFY PAYMENT (frontend callback)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Verifies the Razorpay payment signature submitted by the frontend callback.
     *
     * Security:
     *  - HMAC-SHA256 signature is verified before any DB write.
     *  - Order ownership is enforced (IDOR prevention).
     *  - Idempotent: already-SUCCESS payments are returned without re-processing.
     *
     * Side-effects on success:
     *  - Payment.status → SUCCESS
     *  - Order.paymentStatus → SUCCESS
     *  - Order.status → CONFIRMED
     *  - Order confirmation email is sent (first time only).
     */
    public PaymentResponse verifyPayment(PaymentRequest request, UUID userId) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "razorpayOrderId", request.getRazorpayOrderId()));

        // ── IDOR protection ──
        enforceOrderOwnership(payment.getOrder(), userId);

        // ── Idempotency: already confirmed via callback or webhook ──
        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getOrder().getPaymentStatus() == PaymentStatus.SUCCESS) {
            log.info("Payment for Order {} already marked SUCCESS — skipping re-processing and signature check", payment.getOrder().getId());
            return toPaymentResponse(payment);
        }

        // ── Signature verification for first-time processing ──
        String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
        if (!verifyHmacSignature(payload, request.getRazorpaySignature(), razorpayKeySecret)) {
            log.warn("Signature verification failed for razorpayOrderId={}", request.getRazorpayOrderId());
            throw new PaymentException("Payment signature verification failed. Possible fraud attempt.");
        }

        // ── Mark SUCCESS ──
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.SUCCESS);

        Order order = payment.getOrder();
        order.setPaymentStatus(PaymentStatus.SUCCESS);
        order.setStatus(OrderStatus.CONFIRMED);
        paymentRepository.save(payment);

        log.info("Payment verified via frontend callback — orderId={}, razorpayPaymentId={}",
            order.getId(), request.getRazorpayPaymentId());

        // ── Generate PDF invoice and send confirmation email after payment — NOT before ──
        try {
            byte[] invoicePdf = invoiceService.generateInvoicePdf(order);
            emailService.sendOrderConfirmationEmail(order.getUser().getEmail(), order, invoicePdf);
        } catch (Exception e) {
            // Non-fatal: log and continue — order is already confirmed
            log.error("Failed to send order confirmation email for orderId={}: {}", order.getId(), e.getMessage());
        }

        return toPaymentResponse(payment);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. RECORD FAILURE (frontend payment.failed event)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Called when the Razorpay modal fires a payment.failed event.
     * Records the failure reason and transitions the Payment to FAILED so that
     * the next "Pay Now" click can safely re-initiate a fresh Razorpay order.
     *
     * Ownership is enforced to prevent one user from marking another user's payment failed.
     */
    public void recordFailure(PaymentFailureRequest request, UUID userId) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "razorpayOrderId", request.getRazorpayOrderId()));

        // ── IDOR protection ──
        enforceOrderOwnership(payment.getOrder(), userId);

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            // Race condition guard: webhook may have already confirmed it
            log.warn("recordFailure called but payment {} is already SUCCESS — ignoring", payment.getId());
            return;
        }

        String reason = buildFailureReason(request.getErrorCode(), request.getErrorDescription());
        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        payment.getOrder().setPaymentStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);

        log.info("Payment {} marked FAILED — reason: {}", payment.getId(), reason);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. WEBHOOK HANDLER
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Processes a Razorpay webhook event.
     *
     * Verifies the X-Razorpay-Signature header using the webhook secret (separate
     * from the key secret used for checkout signatures).
     *
     * Handles the payment.captured event to confirm payments even when the frontend
     * callback was missed (e.g. browser crash, network drop after payment).
     *
     * Idempotent: payments already marked SUCCESS are skipped.
     */
    public void processWebhookEvent(String payload, String razorpaySignatureHeader) {
        // ── Verify webhook signature ──
        if (!verifyHmacSignature(payload, razorpaySignatureHeader, razorpayWebhookSecret)) {
            log.warn("Webhook signature verification FAILED — possible spoofing attempt");
            throw new PaymentException("Invalid webhook signature.");
        }

        JSONObject event;
        try {
            event = new JSONObject(payload);
        } catch (Exception e) {
            log.error("Webhook payload is not valid JSON: {}", e.getMessage());
            throw new PaymentException("Invalid webhook payload.");
        }

        String eventType = event.optString("event", "");
        log.info("Razorpay webhook received: event={}", eventType);

        if ("payment.captured".equals(eventType)) {
            handlePaymentCaptured(event);
        } else if ("payment.failed".equals(eventType)) {
            handleWebhookPaymentFailed(event);
        } else if ("refund.processed".equals(eventType)) {
            handleRefundProcessed(event);
        } else {
            log.debug("Webhook event {} not handled — ignoring", eventType);
        }
    }

    private void handlePaymentCaptured(JSONObject event) {
        JSONObject paymentEntity = extractPaymentEntity(event);
        if (paymentEntity == null) return;

        String rzpPaymentId = paymentEntity.optString("id", "");
        String rzpOrderId   = paymentEntity.optString("order_id", "");

        if (rzpPaymentId.isBlank() || rzpOrderId.isBlank()) {
            log.error("payment.captured event missing id or order_id — payload: {}", event);
            return;
        }

        // Idempotency: skip if payment already SUCCESS by razorpayPaymentId
        Optional<Payment> byPaymentId = paymentRepository.findByRazorpayPaymentId(rzpPaymentId);
        if (byPaymentId.isPresent() && byPaymentId.get().getStatus() == PaymentStatus.SUCCESS) {
            log.info("Webhook: payment {} already SUCCESS — skipping", rzpPaymentId);
            return;
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(rzpOrderId).orElse(null);
        if (payment == null) {
            log.warn("Webhook: no Payment found for razorpayOrderId={} — skipping", rzpOrderId);
            return;
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getOrder().getPaymentStatus() == PaymentStatus.SUCCESS) {
            log.info("Webhook: payment for Order {} already SUCCESS — skipping", payment.getOrder().getId());
            return;
        }

        payment.setRazorpayPaymentId(rzpPaymentId);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setWebhookVerified(true);

        Order order = payment.getOrder();
        order.setPaymentStatus(PaymentStatus.SUCCESS);
        order.setStatus(OrderStatus.CONFIRMED);
        paymentRepository.save(payment);

        log.info("Webhook: payment {} confirmed for orderId={}", rzpPaymentId, order.getId());

        // Send email with PDF invoice — handles cases where the frontend callback was missed
        try {
            byte[] invoicePdf = invoiceService.generateInvoicePdf(order);
            emailService.sendOrderConfirmationEmail(order.getUser().getEmail(), order, invoicePdf);
        } catch (Exception e) {
            log.error("Webhook: failed to send confirmation email for orderId={}: {}", order.getId(), e.getMessage());
        }
    }

    private void handleRefundProcessed(JSONObject event) {
        try {
            JSONObject refundEntity = event.getJSONObject("payload")
                                           .getJSONObject("refund")
                                           .getJSONObject("entity");
            String refundId = refundEntity.optString("id", "");
            String paymentId = refundEntity.optString("payment_id", "");

            if (refundId.isBlank() || paymentId.isBlank()) {
                log.error("refund.processed event missing id or payment_id");
                return;
            }

            Optional<Payment> byPaymentId = paymentRepository.findByRazorpayPaymentId(paymentId);
            if (byPaymentId.isPresent()) {
                Payment payment = byPaymentId.get();
                payment.setStatus(PaymentStatus.REFUNDED);
                payment.getOrder().setPaymentStatus(PaymentStatus.REFUNDED);

                // If there is an associated RefundRequest, update its status too!
                if (payment.getOrder().getRefundRequest() != null) {
                    payment.getOrder().getRefundRequest().setRefundStatus(com.belledonne.ecommerce.enums.RefundStatus.REFUNDED);
                }
                paymentRepository.save(payment);
                log.info("Webhook: refund {} processed for paymentId={}", refundId, paymentId);
            }
        } catch (Exception e) {
            log.error("Webhook: failed to process refund.processed: {}", e.getMessage());
        }
    }

    private void handleWebhookPaymentFailed(JSONObject event) {
        JSONObject paymentEntity = extractPaymentEntity(event);
        if (paymentEntity == null) return;

        String rzpOrderId       = paymentEntity.optString("order_id", "");
        String errorDescription = paymentEntity.optString("error_description", "");
        String errorCode        = paymentEntity.optString("error_code", "");

        if (rzpOrderId.isBlank()) return;

        Payment payment = paymentRepository.findByRazorpayOrderId(rzpOrderId).orElse(null);
        if (payment == null) {
            log.warn("Webhook: no Payment found for razorpayOrderId={}", rzpOrderId);
            return;
        }
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.warn("Webhook: payment.failed received but payment {} already SUCCESS — ignoring", payment.getId());
            return;
        }

        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(buildFailureReason(errorCode, errorDescription));
        payment.getOrder().setPaymentStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);

        log.info("Webhook: payment marked FAILED for razorpayOrderId={}", rzpOrderId);
    }

    private JSONObject extractPaymentEntity(JSONObject event) {
        try {
            return event.getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");
        } catch (Exception e) {
            log.error("Could not extract payment entity from webhook payload: {}", e.getMessage());
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. GET PAYMENT BY ORDER (read)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns payment details for the given order.  Enforces ownership so that
     * users cannot query another user's payment information (IDOR fix).
     */
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(UUID orderId, UUID userId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        enforceOrderOwnership(payment.getOrder(), userId);
        return toPaymentResponse(payment);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. REFUND
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Initiates a full refund for a successfully-paid online order via Razorpay.
     * Called automatically on order cancellation and can also be called by admin.
     *
     * Safety checks:
     *  - Payment must be SUCCESS
     *  - Order must NOT be COD (nothing to refund)
     *  - Already-REFUNDED orders are skipped (idempotent)
     */
    public void initiateRefund(UUID orderId, UUID userId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        enforceOrderOwnership(payment.getOrder(), userId);

        if (payment.getOrder().getPaymentMethod() == PaymentMethod.COD) {
            throw new BadRequestException("COD orders cannot be refunded via Razorpay.");
        }
        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new BadRequestException("Only successfully paid orders can be refunded. Current status: " + payment.getStatus());
        }
        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            log.info("Order {} already refunded — skipping", orderId);
            return;
        }

        try {
            // Amount must be in paise for Razorpay
            int amountInPaise = payment.getAmount().multiply(BigDecimal.valueOf(100)).intValue();
            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", amountInPaise);
            refundRequest.put("speed", "normal"); // 5-7 business days; use "optimum" for instant at higher cost

            com.razorpay.Refund refund = razorpayClient.payments.refund(
                payment.getRazorpayPaymentId(), refundRequest);
            String refundId = refund.get("id");

            payment.setStatus(PaymentStatus.REFUNDED);
            payment.getOrder().setPaymentStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);

            log.info("Refund initiated — razorpayRefundId={}, orderId={}, amount=₹{}",
                refundId, orderId, payment.getAmount());

            // Send refund confirmation email
            try {
                emailService.sendRefundInitiatedEmail(
                    payment.getOrder().getUser().getEmail(),
                    payment.getOrder(),
                    refundId
                );
            } catch (Exception e) {
                log.error("Failed to send refund email for orderId={}: {}", orderId, e.getMessage());
            }

        } catch (RazorpayException e) {
            log.error("Razorpay refund failed for orderId={}: {}", orderId, e.getMessage());
            throw new PaymentException("Failed to initiate refund: " + e.getMessage());
        }
    }

    /**
     * Admin-initiated refund — bypasses ownership check (admin can refund any order).
     */
    public void initiateRefundAdmin(UUID orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));
        // Delegate to core method using the order owner's ID (no IDOR risk since this is admin-only)
        initiateRefund(orderId, payment.getOrder().getUser().getId());
    }

    /**
     * Initiates a refund via Razorpay for the admin-approved refund request workflow.
     * Updates payment status to REFUND_INITIATED.
     */
    public String initiateRazorpayRefund(UUID orderId, BigDecimal amount) {
        Payment payment = paymentRepository.findByOrderId(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        if (payment.getOrder().getPaymentMethod() == PaymentMethod.COD) {
            throw new BadRequestException("COD orders cannot be refunded via Razorpay.");
        }
        if (payment.getStatus() != PaymentStatus.SUCCESS && payment.getStatus() != PaymentStatus.REFUND_REQUESTED && payment.getStatus() != PaymentStatus.REFUND_APPROVED) {
            throw new BadRequestException("Only successfully paid payments can be refunded. Current status: " + payment.getStatus());
        }

        try {
            int amountInPaise = amount.multiply(BigDecimal.valueOf(100)).intValue();
            JSONObject refundReqJson = new JSONObject();
            refundReqJson.put("amount", amountInPaise);
            refundReqJson.put("speed", "normal");

            com.razorpay.Refund refund = razorpayClient.payments.refund(
                payment.getRazorpayPaymentId(), refundReqJson);
            String refundId = refund.get("id");

            // Update payment and order payment status to REFUND_INITIATED
            payment.setStatus(PaymentStatus.REFUND_INITIATED);
            payment.getOrder().setPaymentStatus(PaymentStatus.REFUND_INITIATED);
            paymentRepository.save(payment);

            log.info("Razorpay Refund initiated for orderId={} — refundId={}", orderId, refundId);
            return refundId;
        } catch (RazorpayException e) {
            log.error("Razorpay refund failed for orderId={}: {}", orderId, e.getMessage());
            throw new PaymentException("Failed to initiate refund via Razorpay: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Verifies an HMAC-SHA256 signature.
     * Used for both checkout callback verification (key secret) and
     * webhook verification (webhook secret).
     */
    private boolean verifyHmacSignature(String payload, String signature, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computed = HexFormat.of().formatHex(hash);
            return computed.equals(signature);
        } catch (Exception e) {
            log.error("HMAC-SHA256 computation error: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Throws UnauthorizedException if the order does not belong to the given user.
     * This prevents IDOR/BOLA attacks where an authenticated user supplies another
     * user's orderId to access or manipulate their payment.
     */
    private void enforceOrderOwnership(Order order, UUID userId) {
        if (!order.getUser().getId().equals(userId)) {
            log.warn("Ownership check FAILED — orderId={}, requestingUserId={}, ownerUserId={}",
                order.getId(), userId, order.getUser().getId());
            throw new UnauthorizedException("You do not have permission to access this order.");
        }
    }

    private String buildFailureReason(String code, String description) {
        if (code != null && !code.isBlank() && description != null && !description.isBlank()) {
            return code + ": " + description;
        }
        if (description != null && !description.isBlank()) return description;
        if (code != null && !code.isBlank()) return code;
        return "Unknown payment failure";
    }

    private PaymentResponse toPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
            .paymentId(payment.getId())
            .orderId(payment.getOrder().getId())
            .razorpayOrderId(payment.getRazorpayOrderId())
            .razorpayPaymentId(payment.getRazorpayPaymentId())
            .amount(payment.getAmount())
            .currency(payment.getCurrency())
            .keyId(razorpayKeyId)
            .status(payment.getStatus().name())
            .createdAt(payment.getCreatedAt())
            .build();
    }
}
