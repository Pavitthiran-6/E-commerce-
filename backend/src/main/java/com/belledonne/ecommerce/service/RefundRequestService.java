package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.RefundApprovalRequest;
import com.belledonne.ecommerce.dto.request.RefundRejectionRequest;
import com.belledonne.ecommerce.dto.request.RefundRequestRequest;
import com.belledonne.ecommerce.dto.request.WarehouseInspectionRequest;
import com.belledonne.ecommerce.dto.response.OrderResponse;
import com.belledonne.ecommerce.dto.response.RefundRequestResponse;
import com.belledonne.ecommerce.entity.*;
import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.enums.PaymentMethod;
import com.belledonne.ecommerce.enums.PaymentStatus;
import com.belledonne.ecommerce.enums.RefundStatus;
import com.belledonne.ecommerce.enums.SecurityAction;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.exception.UnauthorizedException;
import com.belledonne.ecommerce.repository.OrderRepository;
import com.belledonne.ecommerce.repository.PaymentRepository;
import com.belledonne.ecommerce.repository.RefundRequestRepository;
import com.belledonne.ecommerce.repository.UserRepository;
import com.belledonne.ecommerce.security.UserPrincipal;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RefundRequestService {

    private final RefundRequestRepository refundRequestRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;
    private final EmailService emailService;
    private final SecurityAuditService securityAuditService;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    private final FileUploadService fileUploadService;
    private final ShiprocketService shiprocketService;
    private final AuditLogService auditLogService;

    /**
     * Submit a new refund request for a cancelled order.
     */
    public RefundRequestResponse submitRefundRequest(UserPrincipal principal, UUID orderId, RefundRequestRequest request, String ipAddress, String userAgent) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Enforce ownership
        if (!order.getUser().getId().equals(principal.getId())) {
            throw new UnauthorizedException("You do not have permission to access this order.");
        }

        // Validate payment method and status
        if (order.getPaymentMethod() == PaymentMethod.COD) {
            throw new BadRequestException("COD orders cannot be refunded.");
        }
        if (order.getPaymentStatus() != PaymentStatus.SUCCESS) {
            throw new BadRequestException("Only successfully paid orders can be cancelled with a refund request.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            // Check if request already exists (idempotency)
            Optional<RefundRequest> existing = refundRequestRepository.findByOrderId(orderId);
            if (existing.isPresent()) {
                log.info("Refund request already exists for orderId={} — returning existing record", orderId);
                return toResponse(existing.get());
            }
        } else if (order.getStatus() != OrderStatus.PLACED && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Order cannot be cancelled at this stage.");
        }

        // If a shipment exists on Shiprocket, attempt to cancel it automatically
        if (order.getShiprocketOrderId() != null) {
            try {
                shiprocketService.cancelShipment(order.getShiprocketOrderId());
                order.setShipmentStatus("CANCELLED");
            } catch (Exception e) {
                log.error("Failed to cancel Shiprocket shipment for order {} during customer refund request: {}", 
                    order.getOrderNumber(), e.getMessage());
            }
        }

        // Update Order to Cancelled
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.REFUND_REQUESTED);
        order.getTrackingHistory().add(OrderTracking.builder()
                .order(order)
                .status("CANCELLED")
                .message("Order cancelled by customer. Refund request submitted.")
                .build());
        orderRepository.save(order);

        // Restore stock
        inventoryService.restoreStock(order, "ORDER_CANCELLED", principal.getEmail());

        // Update Payment status to REFUND_REQUESTED
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));
        payment.setStatus(PaymentStatus.REFUND_REQUESTED);
        paymentRepository.save(payment);

        // Create RefundRequest
        RefundRequest refundRequest = RefundRequest.builder()
                .order(order)
                .user(order.getUser())
                .cancellationReason(request.getCancellationReason())
                .refundStatus(RefundStatus.REFUND_REQUESTED)
                .refundAmount(order.getTotalAmount())
                .build();

        RefundRequest saved = refundRequestRepository.save(refundRequest);

        // Audit log
        securityAuditService.log(
                principal.getId(),
                principal.getEmail(),
                SecurityAction.REFUND_REQUESTED,
                ipAddress,
                userAgent,
                "SUCCESS",
                "Refund requested for Order " + order.getOrderNumber() + " with amount ₹" + order.getTotalAmount()
        );

        // Send Email notifications
        try {
            // Customer Acknowledgement
            emailService.sendRefundRequestReceivedEmail(
                    order.getUser().getEmail(),
                    order.getUser().getName(),
                    order.getOrderNumber(),
                    order.getTotalAmount(),
                    request.getCancellationReason()
            );

            // Admin Notification
            emailService.sendRefundRequestAdminNotification(
                    order.getOrderNumber(),
                    order.getUser().getName(),
                    order.getUser().getEmail(),
                    order.getTotalAmount(),
                    request.getCancellationReason()
            );
        } catch (Exception e) {
            log.error("Failed to send refund request emails for orderId={}: {}", orderId, e.getMessage());
        }

        // In-app notifications
        notificationService.createNotification(
            order.getUser().getId(),
            "Refund Request Submitted",
            "Your refund request for order " + order.getOrderNumber() + " is being reviewed.",
            com.belledonne.ecommerce.enums.NotificationType.REFUND_REQUESTED,
            "/profile/orders"
        );
        notificationService.createAdminNotification(
            "New Refund Request 💰",
            "Customer " + order.getUser().getName() + " requested a refund of ₹" + order.getTotalAmount() + " for order " + order.getOrderNumber(),
            com.belledonne.ecommerce.enums.NotificationType.NEW_REFUND_REQUEST,
            "/admin/refunds"
        );

        return toResponse(saved);
    }

    /**
     * Submit a return request for a delivered order.
     */
    public RefundRequestResponse submitReturnRequest(UserPrincipal principal, UUID orderId, String cancellationReason, String additionalComments, java.util.List<MultipartFile> files, String ipAddress, String userAgent) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Enforce ownership
        if (!order.getUser().getId().equals(principal.getId())) {
            throw new UnauthorizedException("You do not have permission to access this order.");
        }

        // Validate status and payment status
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Only delivered orders can be returned.");
        }
        if (order.getPaymentStatus() != PaymentStatus.SUCCESS && order.getPaymentStatus() != PaymentStatus.PAID) {
            throw new BadRequestException("Only successfully paid orders can be returned.");
        }

        // Upload return proof images to Cloudinary (1–5 images)
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("At least 1 product image is required for returns.");
        }
        if (files.size() > 5) {
            throw new BadRequestException("Maximum 5 images allowed.");
        }
        String[] productImageUrls = new String[files.size()];
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            if (file == null || file.isEmpty()) {
                throw new BadRequestException("One or more uploaded files are empty.");
            }
            Map<String, String> uploadResult = fileUploadService.uploadImage(file, "returns");
            productImageUrls[i] = uploadResult.get("url");
        }

        // Check if request already exists (idempotency)
        Optional<RefundRequest> existing = refundRequestRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            log.info("Return request already exists for orderId={} — returning existing record", orderId);
            return toResponse(existing.get());
        }

        // Update Order to RETURN_REQUESTED
        order.setStatus(OrderStatus.RETURN_REQUESTED);
        order.setPaymentStatus(PaymentStatus.REFUND_REQUESTED);
        order.getTrackingHistory().add(OrderTracking.builder()
                .order(order)
                .status("RETURN_REQUESTED")
                .message("Return request submitted by customer. Reason: " + cancellationReason)
                .build());
        orderRepository.save(order);

        // Update Payment status to REFUND_REQUESTED if a payment record exists
        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
        if (payment != null) {
            payment.setStatus(PaymentStatus.REFUND_REQUESTED);
            paymentRepository.save(payment);
        }

        // Calculate refund amount: total amount minus shipping charge (shipping is non-refundable for returns)
        java.math.BigDecimal refundAmount = order.getTotalAmount();
        if (order.getShippingCharge() != null) {
            refundAmount = refundAmount.subtract(order.getShippingCharge());
            if (refundAmount.compareTo(java.math.BigDecimal.ZERO) < 0) {
                refundAmount = java.math.BigDecimal.ZERO;
            }
        }

        // Create RefundRequest — no UPI/Bank details at this stage
        RefundRequest refundRequest = RefundRequest.builder()
                .order(order)
                .user(order.getUser())
                .cancellationReason(cancellationReason)
                .additionalComments(additionalComments)
                .refundStatus(RefundStatus.REFUND_REQUESTED)
                .refundAmount(refundAmount)
                .productImageUrls(productImageUrls)
                .productImageUrl(productImageUrls.length > 0 ? productImageUrls[0] : null) // legacy compat
                .returnRequestedAt(LocalDateTime.now())
                .build();

        RefundRequest saved = refundRequestRepository.save(refundRequest);

        // Logistics operations Audit Log
        auditLogService.log(principal.getEmail(), "RETURN_REQUESTED", 
            "Customer requested return for Order " + order.getOrderNumber() + " with amount ₹" + refundAmount + ". Reason: " + cancellationReason, 
            order.getId().toString(), saved.getId().toString());

        // Audit log
        securityAuditService.log(
                principal.getId(),
                principal.getEmail(),
                SecurityAction.REFUND_REQUESTED,
                ipAddress,
                userAgent,
                "SUCCESS",
                "Return/Refund requested for Order " + order.getOrderNumber() + " with amount ₹" + refundAmount
        );

        // Send Email notifications
        try {
            // Customer Acknowledgement
            emailService.sendRefundRequestReceivedEmail(
                    order.getUser().getEmail(),
                    order.getUser().getName(),
                    order.getOrderNumber(),
                    refundAmount,
                    cancellationReason
            );

            // Admin Notification
            emailService.sendRefundRequestAdminNotification(
                    order.getOrderNumber(),
                    order.getUser().getName(),
                    order.getUser().getEmail(),
                    refundAmount,
                    cancellationReason
            );
        } catch (Exception e) {
            log.error("Failed to send return request emails for orderId={}: {}", orderId, e.getMessage());
        }

        // In-app notifications
        notificationService.createNotification(
            order.getUser().getId(),
            "Return Request Submitted",
            "Your return request for order " + order.getOrderNumber() + " is being reviewed.",
            com.belledonne.ecommerce.enums.NotificationType.REFUND_REQUESTED,
            "/profile/orders"
        );
        notificationService.createAdminNotification(
            "New Return Request 📦",
            "Customer " + order.getUser().getName() + " requested a return/refund of ₹" + refundAmount + " for order " + order.getOrderNumber(),
            com.belledonne.ecommerce.enums.NotificationType.NEW_REFUND_REQUEST,
            "/admin/refunds"
        );

        return toResponse(saved);
    }

    /**
     * Approve a refund request (triggers Razorpay Refund API).
     */
    public RefundRequestResponse approveRefund(UUID refundRequestId, UserPrincipal adminPrincipal, RefundApprovalRequest request, String ipAddress, String userAgent) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "id", refundRequestId));

        if (refundRequest.getRefundStatus() != RefundStatus.REFUND_REQUESTED && refundRequest.getRefundStatus() != RefundStatus.REFUND_FAILED) {
            throw new BadRequestException("Refund request is not in REQUESTED or FAILED status. Current status: " + refundRequest.getRefundStatus());
        }

        // Restore stock immediately if not already restored
        inventoryService.restoreStock(refundRequest.getOrder(), "REFUND_APPROVED", adminPrincipal.getEmail());

        try {
            // Trigger Razorpay Refund for prepaid online orders, skip for COD
            String razorpayRefundId = null;
            if (refundRequest.getOrder().getPaymentMethod() != PaymentMethod.COD) {
                razorpayRefundId = paymentService.initiateRazorpayRefund(
                        refundRequest.getOrder().getId(),
                        refundRequest.getRefundAmount()
                );
            }

            // Update RefundRequest entity
            // COD: set REFUND_APPROVED — admin still needs to physically transfer money
            // Online: set REFUND_INITIATED — Razorpay API has been called
            if (refundRequest.getOrder().getPaymentMethod() == PaymentMethod.COD) {
                refundRequest.setRefundStatus(RefundStatus.REFUND_APPROVED);
                refundRequest.setRazorpayRefundStatus("N/A");
                refundRequest.setRazorpayRefundTimestamp(LocalDateTime.now());
                refundRequest.setRazorpayRefundNotes("COD manual refund approved, pending payout.");
            } else {
                refundRequest.setRefundStatus(RefundStatus.REFUND_INITIATED);
                refundRequest.setRazorpayRefundId(razorpayRefundId);
                refundRequest.setRazorpayRefundStatus("processed");
                refundRequest.setRazorpayRefundTimestamp(LocalDateTime.now());
                refundRequest.setRazorpayRefundNotes("Auto-refund initiated via Razorpay API. Refund ID: " + razorpayRefundId);
                refundRequest.setRefundProcessedAt(LocalDateTime.now());
            }
            refundRequest.setRazorpayRefundFailureReason(null);
            refundRequest.setAdminNotes(request.getAdminNotes());
            refundRequest.setReviewedByAdminId(adminPrincipal.getId());
            refundRequest.setReviewedByAdminEmail(adminPrincipal.getEmail());
            refundRequest.setReviewedAt(LocalDateTime.now());

            // If the order status was RETURN_REQUESTED, update it to RETURNED
            Order order = refundRequest.getOrder();
            if (order.getStatus() == OrderStatus.RETURN_REQUESTED) {
                order.setStatus(OrderStatus.RETURNED);
            }
            // For COD: payment status is REFUND_APPROVED (pending physical transfer)
            if (refundRequest.getOrder().getPaymentMethod() == PaymentMethod.COD) {
                order.setPaymentStatus(PaymentStatus.REFUND_APPROVED);

                Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
                if (payment != null) {
                    payment.setStatus(PaymentStatus.REFUND_APPROVED);
                    paymentRepository.save(payment);
                }
            }
            orderRepository.save(order);

            RefundRequest saved = refundRequestRepository.save(refundRequest);

            // Logistics Audit Log
            auditLogService.log(adminPrincipal.getEmail(), "REFUND_PROCESSED",
                    "Refund approved for Order " + order.getOrderNumber() +
                    (razorpayRefundId != null ? " | Razorpay Refund ID: " + razorpayRefundId : " | COD manual refund approved"),
                    order.getId().toString(), saved.getId().toString());

            // Audit log
            securityAuditService.log(
                    adminPrincipal.getId(),
                    adminPrincipal.getEmail(),
                    SecurityAction.REFUND_APPROVED,
                    ipAddress,
                    userAgent,
                    "SUCCESS",
                    "Refund approved for Order " + refundRequest.getOrder().getOrderNumber() + 
                    (razorpayRefundId != null ? " | Razorpay Refund ID: " + razorpayRefundId : " | COD manual refund recorded")
            );

            // Send Email to Customer
            try {
                emailService.sendRefundApprovedEmail(
                        refundRequest.getUser().getEmail(),
                        refundRequest.getUser().getName(),
                        refundRequest.getOrder().getOrderNumber(),
                        refundRequest.getRefundAmount(),
                        request.getAdminNotes(),
                        razorpayRefundId != null ? razorpayRefundId : "COD-MANUAL"
                );
            } catch (Exception e) {
                log.error("Failed to send refund approved email for refundRequestId={}: {}", refundRequestId, e.getMessage());
            }

            // In-app notification
            notificationService.createNotification(
                refundRequest.getUser().getId(),
                "Refund Approved ✓",
                "Your refund of ₹" + refundRequest.getRefundAmount() + " for order " + refundRequest.getOrder().getOrderNumber() + " has been approved.",
                com.belledonne.ecommerce.enums.NotificationType.REFUND_APPROVED,
                "/profile/orders"
            );

            return toResponse(saved);

        } catch (Exception e) {
            log.error("Razorpay refund API call failed for refundRequestId={}: {}", refundRequestId, e.getMessage());

            refundRequest.setRefundStatus(RefundStatus.REFUND_FAILED);
            refundRequest.setRazorpayRefundFailureReason(e.getMessage());
            refundRequest.setReviewedByAdminId(adminPrincipal.getId());
            refundRequest.setReviewedByAdminEmail(adminPrincipal.getEmail());
            refundRequest.setReviewedAt(LocalDateTime.now());
            
            // Mirror failure state to Order payment status
            Order order = refundRequest.getOrder();
            order.setPaymentStatus(PaymentStatus.REFUND_FAILED);
            orderRepository.save(order);
            
            // Mirror failure state to Payment entity
            Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
            if (payment != null) {
                payment.setStatus(PaymentStatus.REFUND_FAILED);
                payment.setFailureReason(e.getMessage());
                paymentRepository.save(payment);
            }

            RefundRequest saved = refundRequestRepository.save(refundRequest);

            // Log REFUND_FAILED in security logs
            securityAuditService.log(
                    adminPrincipal.getId(),
                    adminPrincipal.getEmail(),
                    SecurityAction.REFUND_FAILED,
                    ipAddress,
                    userAgent,
                    "FAILED",
                    "Razorpay refund failed for Order " + refundRequest.getOrder().getOrderNumber() + " | Error: " + e.getMessage()
            );

            // Send failure notification email to admin
            try {
                emailService.sendRefundFailedAdminNotification(
                        refundRequest.getOrder().getOrderNumber(),
                        refundRequest.getRefundAmount(),
                        e.getMessage()
                );
            } catch (Exception ex) {
                log.error("Failed to send refund failure admin notification for refundRequestId={}: {}", refundRequestId, ex.getMessage());
            }

            // In-app notifications for failure
            notificationService.createNotification(
                refundRequest.getUser().getId(),
                "Refund Failed",
                "Your refund for order " + refundRequest.getOrder().getOrderNumber() + " could not be processed. Our team will retry shortly.",
                com.belledonne.ecommerce.enums.NotificationType.REFUND_FAILED,
                "/profile/orders"
            );
            notificationService.createAdminNotification(
                "Refund Failed ⚠️",
                "Razorpay refund failed for order " + refundRequest.getOrder().getOrderNumber() + ". Reason: " + e.getMessage(),
                com.belledonne.ecommerce.enums.NotificationType.FAILED_REFUND_ALERT,
                "/admin/refunds"
            );

            return toResponse(saved);
        }
    }

    /**
     * Mark a COD refund as actually paid (money physically transferred to customer).
     * Only applies to COD orders that are in REFUND_APPROVED status.
     */
    public RefundRequestResponse markRefundPaid(UUID refundRequestId, UserPrincipal adminPrincipal, String ipAddress, String userAgent) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "id", refundRequestId));

        if (refundRequest.getRefundStatus() != RefundStatus.REFUND_APPROVED) {
            throw new BadRequestException("Only REFUND_APPROVED requests can be marked as paid. Current status: " + refundRequest.getRefundStatus());
        }

        // Transition to fully REFUNDED
        refundRequest.setRefundStatus(RefundStatus.REFUNDED);
        refundRequest.setRefundProcessedAt(LocalDateTime.now());
        refundRequestRepository.save(refundRequest);

        Order order = refundRequest.getOrder();
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        orderRepository.save(order);

        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        if (payment != null) {
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
        }

        // Logistics operations Audit Log
        auditLogService.log(adminPrincipal.getEmail(), "REFUND_PROCESSED",
                "COD Refund marked as paid for Order " + order.getOrderNumber() + " | Amount: ₹" + refundRequest.getRefundAmount(),
                order.getId().toString(), refundRequest.getId().toString());

        // Audit log
        securityAuditService.log(
                adminPrincipal.getId(),
                adminPrincipal.getEmail(),
                SecurityAction.REFUND_APPROVED,
                ipAddress,
                userAgent,
                "SUCCESS",
                "COD refund marked as paid for Order " + order.getOrderNumber() + " | Amount: ₹" + refundRequest.getRefundAmount()
        );

        // Notify customer
        try {
            emailService.sendRefundApprovedEmail(
                    refundRequest.getUser().getEmail(),
                    refundRequest.getUser().getName(),
                    order.getOrderNumber(),
                    refundRequest.getRefundAmount(),
                    refundRequest.getAdminNotes(),
                    "COD-MANUAL"
            );
        } catch (Exception e) {
            log.error("Failed to send refund paid email for refundRequestId={}: {}", refundRequestId, e.getMessage());
        }

        notificationService.createNotification(
            refundRequest.getUser().getId(),
            "Refund Credited ✓",
            "Your refund of ₹" + refundRequest.getRefundAmount() + " for order " + order.getOrderNumber() + " has been transferred to your account.",
            com.belledonne.ecommerce.enums.NotificationType.REFUND_APPROVED,
            "/profile/orders"
        );

        return toResponse(refundRequest);
    }

    /**
     * Retry a failed refund request.
     */
    public RefundRequestResponse retryRefund(UUID refundRequestId, UserPrincipal adminPrincipal, String ipAddress, String userAgent) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "id", refundRequestId));
                
        if (refundRequest.getRefundStatus() != RefundStatus.REFUND_FAILED) {
            throw new BadRequestException("Only failed refunds can be retried. Current status: " + refundRequest.getRefundStatus());
        }
        
        RefundApprovalRequest approvalReq = new RefundApprovalRequest();
        approvalReq.setAdminNotes(refundRequest.getAdminNotes());
        
        // Temporarily reset status so approveRefund passes validation
        refundRequest.setRefundStatus(RefundStatus.REFUND_REQUESTED);
        refundRequestRepository.save(refundRequest);
        
        return approveRefund(refundRequestId, adminPrincipal, approvalReq, ipAddress, userAgent);
    }

    /**
     * Reject a refund request.
     */
    public RefundRequestResponse rejectRefund(UUID refundRequestId, UserPrincipal adminPrincipal, RefundRejectionRequest request, String ipAddress, String userAgent) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "id", refundRequestId));

        if (refundRequest.getRefundStatus() != RefundStatus.REFUND_REQUESTED) {
            throw new BadRequestException("Refund request is not in REQUESTED status. Current status: " + refundRequest.getRefundStatus());
        }

        // Update statuses
        refundRequest.setRefundStatus(RefundStatus.REFUND_REJECTED);
        refundRequest.setRejectionReason(request.getRejectionReason());
        refundRequest.setReviewedByAdminId(adminPrincipal.getId());
        refundRequest.setReviewedByAdminEmail(adminPrincipal.getEmail());
        refundRequest.setReviewedAt(LocalDateTime.now());

        RefundRequest saved = refundRequestRepository.save(refundRequest);

        Order order = refundRequest.getOrder();
        if (order.getStatus() == OrderStatus.RETURN_REQUESTED) {
            order.setStatus(OrderStatus.DELIVERED);
        }
        order.setPaymentStatus(PaymentStatus.REFUND_REJECTED);
        orderRepository.save(order);

        Optional<Payment> paymentOpt = paymentRepository.findByOrderId(order.getId());
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            payment.setStatus(PaymentStatus.REFUND_REJECTED);
            paymentRepository.save(payment);
        }

        // Audit log
        securityAuditService.log(
                adminPrincipal.getId(),
                adminPrincipal.getEmail(),
                SecurityAction.REFUND_REJECTED,
                ipAddress,
                userAgent,
                "SUCCESS",
                "Refund rejected for Order " + order.getOrderNumber() + " | Reason: " + request.getRejectionReason()
        );

        // Send Email to Customer
        try {
            emailService.sendRefundRejectedEmail(
                    refundRequest.getUser().getEmail(),
                    refundRequest.getUser().getName(),
                    order.getOrderNumber(),
                    refundRequest.getRefundAmount(),
                    request.getRejectionReason()
            );
        } catch (Exception e) {
            log.error("Failed to send refund rejected email for refundRequestId={}: {}", refundRequestId, e.getMessage());
        }

        return toResponse(saved);
    }

    /**
     * Get single refund request.
     */
    @Transactional(readOnly = true)
    public RefundRequestResponse getRefundRequest(UUID id) {
        RefundRequest request = refundRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "id", id));
        return toResponse(request);
    }

    /**
     * Get refund status for a specific order (customer-facing).
     */
    @Transactional(readOnly = true)
    public RefundRequestResponse getRefundStatusForOrder(UUID orderId, UUID userId) {
        RefundRequest request = refundRequestRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "orderId", orderId));

        if (!request.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to view this refund request.");
        }

        return toResponse(request);
    }

    /**
     * List refund requests for admin, paginated and filtered.
     */
    @Transactional(readOnly = true)
    public Page<RefundRequestResponse> getRefundRequestsAdmin(String search, RefundStatus status, Pageable pageable) {
        Specification<RefundRequest> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("refundStatus"), status));
            }

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Join<RefundRequest, Order> orderJoin = root.join("order");
                Join<RefundRequest, User> userJoin = root.join("user");

                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(orderJoin.get("orderNumber")), searchPattern),
                        cb.like(cb.lower(userJoin.get("email")), searchPattern),
                        cb.like(cb.lower(userJoin.get("name")), searchPattern)
                );
                predicates.add(searchPredicate);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return refundRequestRepository.findAll(spec, pageable).map(this::toResponse);
    }

    /**
     * Map RefundRequest entity to DTO.
     */
    public RefundRequestResponse toResponse(RefundRequest request) {
        List<OrderResponse.OrderItemResponse> items = request.getOrder().getItems().stream()
                .map(i -> OrderResponse.OrderItemResponse.builder()
                        .id(i.getId())
                        .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                        .productName(i.getProductName())
                        .productImage(i.getProductImage())
                        .size(i.getSize())
                        .color(i.getColor())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .totalPrice(i.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        return RefundRequestResponse.builder()
                .id(request.getId())
                .orderId(request.getOrder().getId())
                .orderNumber(request.getOrder().getOrderNumber())
                .userId(request.getUser().getId())
                .customerName(request.getUser().getName())
                .customerEmail(request.getUser().getEmail())
                .cancellationReason(request.getCancellationReason())
                .additionalComments(request.getAdditionalComments())
                .refundStatus(request.getRefundStatus() != null ? request.getRefundStatus().name() : null)
                .refundAmount(request.getRefundAmount())
                .adminNotes(request.getAdminNotes())
                .rejectionReason(request.getRejectionReason())
                .reviewedByAdminId(request.getReviewedByAdminId())
                .reviewedByAdminEmail(request.getReviewedByAdminEmail())
                .reviewedAt(request.getReviewedAt())
                .razorpayRefundId(request.getRazorpayRefundId())
                .razorpayRefundFailureReason(request.getRazorpayRefundFailureReason())
                .productImageUrl(request.getProductImageUrl())
                .productImageUrls(request.getProductImageUrls())
                .bankDetails(request.getBankDetails())
                .upiId(request.getUpiId())
                .requestedAt(request.getRequestedAt())
                .updatedAt(request.getUpdatedAt())
                .payoutDetailsRequestedAt(request.getPayoutDetailsRequestedAt())
                .payoutDetailsProvidedAt(request.getPayoutDetailsProvidedAt())
                .returnRequestedAt(request.getReturnRequestedAt())
                .returnApprovedAt(request.getReturnApprovedAt())
                .returnPickupScheduledAt(request.getReturnPickupScheduledAt())
                .returnReceivedAt(request.getReturnReceivedAt())
                .refundProcessedAt(request.getRefundProcessedAt())
                .warehouseInspectionNotes(request.getWarehouseInspectionNotes())
                .isProductDamaged(request.getIsProductDamaged())
                .isWrongProductReturned(request.getIsWrongProductReturned())
                .isMissingAccessories(request.getIsMissingAccessories())
                .isUsedProduct(request.getIsUsedProduct())
                .isPackagingMissing(request.getIsPackagingMissing())
                .isQualityIssueConfirmed(request.getIsQualityIssueConfirmed())
                .razorpayRefundStatus(request.getRazorpayRefundStatus())
                .razorpayRefundTimestamp(request.getRazorpayRefundTimestamp())
                .razorpayRefundNotes(request.getRazorpayRefundNotes())
                .orderTotalAmount(request.getOrder().getTotalAmount())
                .paymentMethod(request.getOrder().getPaymentMethod() != null ? request.getOrder().getPaymentMethod().name() : null)
                .paymentStatus(request.getOrder().getPaymentStatus() != null ? request.getOrder().getPaymentStatus().name() : null)
                .orderDate(request.getOrder().getCreatedAt())
                .items(items)
                .build();
    }

    /**
     * Approve a return request (Order status goes from RETURN_REQUESTED -> RETURN_APPROVED).
     */
    public RefundRequestResponse approveReturn(UUID refundRequestId, UserPrincipal adminPrincipal, String ipAddress, String userAgent) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "id", refundRequestId));

        if (refundRequest.getRefundStatus() != RefundStatus.REFUND_REQUESTED) {
            throw new BadRequestException("Return request is not in REQUESTED status. Current status: " + refundRequest.getRefundStatus());
        }

        // Update RefundRequest status to RETURN_APPROVED
        refundRequest.setRefundStatus(RefundStatus.RETURN_APPROVED);
        refundRequest.setReviewedByAdminId(adminPrincipal.getId());
        refundRequest.setReviewedByAdminEmail(adminPrincipal.getEmail());
        refundRequest.setReviewedAt(LocalDateTime.now());
        refundRequest.setReturnApprovedAt(LocalDateTime.now());
        refundRequestRepository.save(refundRequest);

        // Update Order status to RETURN_APPROVED
        Order order = refundRequest.getOrder();
        order.setStatus(OrderStatus.RETURN_APPROVED);
        order.getTrackingHistory().add(OrderTracking.builder()
                .order(order)
                .status("RETURN_APPROVED")
                .message("Your return request has been approved. A courier pickup will be scheduled shortly.")
                .build());
        orderRepository.save(order);

        // Logistics Audit Log
        auditLogService.log(adminPrincipal.getEmail(), "RETURN_APPROVED", 
            "Approved return request for Order " + order.getOrderNumber(), 
            order.getId().toString(), refundRequest.getId().toString());

        // Audit log
        securityAuditService.log(
                adminPrincipal.getId(),
                adminPrincipal.getEmail(),
                SecurityAction.ADMIN_ACTION,
                ipAddress,
                userAgent,
                "SUCCESS",
                "Approved return request for Order " + order.getOrderNumber()
        );

        // Notify customer
        try {
            emailService.sendOrderStatusUpdateEmail(order, "Return Approved", "Your return request for order " + order.getOrderNumber() + " has been approved.");
            notificationService.createNotification(
                order.getUser().getId(),
                "Return Request Approved",
                "Your return request for order " + order.getOrderNumber() + " has been approved.",
                com.belledonne.ecommerce.enums.NotificationType.ORDER_CONFIRMED,
                "/profile/orders"
            );
        } catch (Exception e) {
            log.error("Failed to send return approval notifications: {}", e.getMessage());
        }

        return toResponse(refundRequest);
    }

    /**
     * Schedule a return courier pickup (Order status goes from RETURN_APPROVED -> RETURN_PICKUP_SCHEDULED).
     */
    public RefundRequestResponse scheduleReturnPickup(UUID refundRequestId, UserPrincipal adminPrincipal, String ipAddress, String userAgent) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "id", refundRequestId));

        if (refundRequest.getRefundStatus() != RefundStatus.RETURN_APPROVED) {
            throw new BadRequestException("Pickup can only be scheduled for approved returns. Current status: " + refundRequest.getRefundStatus());
        }

        // Update RefundRequest status to RETURN_PICKUP_SCHEDULED
        refundRequest.setRefundStatus(RefundStatus.RETURN_PICKUP_SCHEDULED);
        refundRequest.setReturnPickupScheduledAt(LocalDateTime.now());
        refundRequestRepository.save(refundRequest);

        // Update Order status to RETURN_PICKUP_SCHEDULED
        Order order = refundRequest.getOrder();
        order.setStatus(OrderStatus.RETURN_PICKUP_SCHEDULED);
        order.getTrackingHistory().add(OrderTracking.builder()
                .order(order)
                .status("RETURN_PICKUP_SCHEDULED")
                .message("Return courier pickup has been scheduled. Please keep the package ready.")
                .build());
        orderRepository.save(order);

        // Logistics Audit Log
        auditLogService.log(adminPrincipal.getEmail(), "RETURN_PICKUP_SCHEDULED", 
            "Scheduled return pickup for Order " + order.getOrderNumber(), 
            order.getId().toString(), refundRequest.getId().toString());

        // Audit log
        securityAuditService.log(
                adminPrincipal.getId(),
                adminPrincipal.getEmail(),
                SecurityAction.ADMIN_ACTION,
                ipAddress,
                userAgent,
                "SUCCESS",
                "Scheduled return pickup for Order " + order.getOrderNumber()
        );

        // Notify customer — dedicated pickup scheduled email
        try {
            emailService.sendReturnPickupScheduledEmail(
                order.getUser().getEmail(),
                order.getUser().getName(),
                order.getOrderNumber()
            );
            notificationService.createNotification(
                order.getUser().getId(),
                "Return Pickup Scheduled 🚚",
                "A courier will pick up your return for order " + order.getOrderNumber() + ". Please keep the package ready.",
                com.belledonne.ecommerce.enums.NotificationType.ORDER_SHIPPED,
                "/profile/orders"
            );
        } catch (Exception e) {
            log.error("Failed to send pickup scheduled notifications: {}", e.getMessage());
        }

        return toResponse(refundRequest);
    }

    /**
     * Mark the returned products as received at the warehouse (Order status goes from RETURN_PICKUP_SCHEDULED -> RETURNED).
     * Automatically restores product stock to the inventory.
     */
    public RefundRequestResponse markReturned(UUID refundRequestId, UserPrincipal adminPrincipal, WarehouseInspectionRequest request, String ipAddress, String userAgent) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "id", refundRequestId));

        if (refundRequest.getRefundStatus() != RefundStatus.RETURN_PICKUP_SCHEDULED) {
            throw new BadRequestException("Only returns with scheduled pickup can be marked as returned. Current status: " + refundRequest.getRefundStatus());
        }

        // Restore inventory stock
        inventoryService.restoreStock(refundRequest.getOrder(), "PRODUCT_RETURNED", adminPrincipal.getEmail());

        // Update Warehouse inspection checklist and notes
        refundRequest.setWarehouseInspectionNotes(request.getWarehouseInspectionNotes());
        refundRequest.setIsProductDamaged(request.getIsProductDamaged());
        refundRequest.setIsWrongProductReturned(request.getIsWrongProductReturned());
        refundRequest.setIsMissingAccessories(request.getIsMissingAccessories());
        refundRequest.setIsUsedProduct(request.getIsUsedProduct());
        refundRequest.setIsPackagingMissing(request.getIsPackagingMissing());
        refundRequest.setIsQualityIssueConfirmed(request.getIsQualityIssueConfirmed());

        // SLA update
        refundRequest.setReturnReceivedAt(LocalDateTime.now());

        // Update RefundRequest status
        // For COD orders: move to PAYOUT_DETAILS_REQUESTED (admin will request bank/UPI from customer)
        // For Razorpay orders: admin can directly process the refund
        boolean isCod = refundRequest.getOrder().getPaymentMethod() == PaymentMethod.COD;
        refundRequest.setRefundStatus(isCod ? RefundStatus.PAYOUT_DETAILS_REQUESTED : RefundStatus.RETURN_APPROVED);
        // Note: For non-COD, status stays at a stage where admin can call processRefund
        // We actually want it in RETURNED state for processRefund to work — let's set it as follows:
        // Non-COD: stays at RETURN_APPROVED so processRefund check passes, but we also need RETURNED order status
        // Let's simplify: both get RefundStatus reflecting their state
        // Actually: for both cases set the RefundRequest status to what makes sense for UI
        // For COD: PAYOUT_DETAILS_REQUESTED — admin needs to request details
        // For Razorpay: keep as RETURN_APPROVED so the "Process Refund" button appears
        // The processRefund method checks order status (RETURNED) not refund status
        if (!isCod) {
            refundRequest.setRefundStatus(RefundStatus.RETURN_APPROVED); // admin can now process
        }
        refundRequestRepository.save(refundRequest);

        // Update Order status to RETURNED
        Order order = refundRequest.getOrder();
        order.setStatus(OrderStatus.RETURNED);
        order.getTrackingHistory().add(OrderTracking.builder()
                .order(order)
                .status("RETURNED")
                .message(isCod
                    ? "Returned products received at warehouse. Admin will contact you for refund payout details."
                    : "Returned products received and verified at warehouse. Refund is being processed.")
                .build());
        orderRepository.save(order);

        // Logistics Audit Log
        auditLogService.log(adminPrincipal.getEmail(), "RETURN_RECEIVED", 
            "Returned items received at warehouse for Order " + order.getOrderNumber() + 
            " | Damaged: " + request.getIsProductDamaged() + ", Quality Confirmed: " + request.getIsQualityIssueConfirmed(), 
            order.getId().toString(), refundRequest.getId().toString());

        // Audit log
        securityAuditService.log(
                adminPrincipal.getId(),
                adminPrincipal.getEmail(),
                SecurityAction.ADMIN_ACTION,
                ipAddress,
                userAgent,
                "SUCCESS",
                "Marked products returned for Order " + order.getOrderNumber() + " and restored inventory"
        );

        // Notify customer
        try {
            String msg = isCod
                ? "We have received your returned items for order " + order.getOrderNumber() + ". We will contact you shortly to collect your refund payout details."
                : "We have received and verified your returned items for order " + order.getOrderNumber() + ". Your refund is being processed.";
            emailService.sendOrderStatusUpdateEmail(order, "Return Received", msg);
            notificationService.createNotification(
                order.getUser().getId(),
                "Return Received ✓",
                isCod
                    ? "Your returned items for order " + order.getOrderNumber() + " are received. We'll ask for your refund payout details soon."
                    : "We have received your returned items for order " + order.getOrderNumber() + ".",
                com.belledonne.ecommerce.enums.NotificationType.ORDER_DELIVERED,
                "/profile/orders"
            );
        } catch (Exception e) {
            log.error("Failed to send return received notifications: {}", e.getMessage());
        }

        return toResponse(refundRequest);
    }

    /**
     * Admin requests payout details from the customer (for COD return orders).
     * Transitions: PAYOUT_DETAILS_REQUESTED → sends email/notification asking customer for UPI/Bank.
     */
    public RefundRequestResponse requestPayoutDetails(UUID refundRequestId, UserPrincipal adminPrincipal, String ipAddress, String userAgent) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "id", refundRequestId));

        if (refundRequest.getRefundStatus() != RefundStatus.PAYOUT_DETAILS_REQUESTED) {
            throw new BadRequestException("Payout details can only be requested when status is PAYOUT_DETAILS_REQUESTED. Current: " + refundRequest.getRefundStatus());
        }
        if (refundRequest.getOrder().getPaymentMethod() != PaymentMethod.COD) {
            throw new BadRequestException("Payout details request is only applicable for COD orders.");
        }

        refundRequest.setPayoutDetailsRequestedAt(LocalDateTime.now());
        refundRequestRepository.save(refundRequest);

        Order order = refundRequest.getOrder();

        // Audit log
        securityAuditService.log(
                adminPrincipal.getId(),
                adminPrincipal.getEmail(),
                SecurityAction.ADMIN_ACTION,
                ipAddress,
                userAgent,
                "SUCCESS",
                "Requested payout details for COD return, Order " + order.getOrderNumber()
        );

        // Notify customer to submit payout details
        try {
            emailService.sendPayoutDetailsRequestEmail(
                order.getUser().getEmail(),
                order.getUser().getName(),
                order.getOrderNumber(),
                refundRequest.getRefundAmount()
            );
            notificationService.createNotification(
                order.getUser().getId(),
                "Action Required: Refund Details Needed 💳",
                "Please provide your UPI or bank details to receive your refund of ₹" + refundRequest.getRefundAmount() + " for order " + order.getOrderNumber() + ".",
                com.belledonne.ecommerce.enums.NotificationType.REFUND_APPROVED,
                "/profile/orders/" + order.getId() + "/payout-details"
            );
        } catch (Exception e) {
            log.error("Failed to send payout details request notifications: {}", e.getMessage());
        }

        return toResponse(refundRequest);
    }

    /**
     * Customer submits their UPI/Bank payout details for COD return refund.
     * Transitions: PAYOUT_DETAILS_REQUESTED → PAYOUT_DETAILS_PROVIDED.
     */
    public RefundRequestResponse submitPayoutDetails(UserPrincipal principal, UUID orderId, com.belledonne.ecommerce.dto.request.RefundPayoutDetailsRequest request, String ipAddress, String userAgent) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Enforce ownership
        if (!order.getUser().getId().equals(principal.getId())) {
            throw new UnauthorizedException("You do not have permission to access this order.");
        }

        RefundRequest refundRequest = refundRequestRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "orderId", orderId));

        if (refundRequest.getRefundStatus() != RefundStatus.PAYOUT_DETAILS_REQUESTED) {
            throw new BadRequestException("Payout details are not currently requested for this order.");
        }

        // Validate: must provide either UPI or all bank details
        boolean hasUpi = request.getUpiId() != null && !request.getUpiId().trim().isEmpty();
        boolean hasBank = request.getAccountNumber() != null && !request.getAccountNumber().trim().isEmpty()
                && request.getIfscCode() != null && !request.getIfscCode().trim().isEmpty();
        if (!hasUpi && !hasBank) {
            throw new BadRequestException("Please provide either a UPI ID or complete bank account details.");
        }

        // Store payout details
        refundRequest.setUpiId(hasUpi ? request.getUpiId().trim() : null);
        if (hasBank) {
            String bankDetails = String.format("Bank: %s\nAccount Holder: %s\nAccount Number: %s\nIFSC: %s",
                    request.getBankName() != null ? request.getBankName() : "N/A",
                    request.getAccountHolderName() != null ? request.getAccountHolderName() : "N/A",
                    request.getAccountNumber(),
                    request.getIfscCode());
            refundRequest.setBankDetails(bankDetails);
        }
        refundRequest.setRefundStatus(RefundStatus.PAYOUT_DETAILS_PROVIDED);
        refundRequest.setPayoutDetailsProvidedAt(LocalDateTime.now());
        refundRequestRepository.save(refundRequest);

        // Audit log
        securityAuditService.log(
                principal.getId(),
                principal.getEmail(),
                SecurityAction.REFUND_REQUESTED,
                ipAddress,
                userAgent,
                "SUCCESS",
                "Customer submitted payout details for Order " + order.getOrderNumber()
        );

        // Notify admin
        notificationService.createAdminNotification(
            "Payout Details Received 💳",
            "Customer " + order.getUser().getName() + " submitted payout details for order " + order.getOrderNumber() + ". Ready to process COD refund.",
            com.belledonne.ecommerce.enums.NotificationType.NEW_REFUND_REQUEST,
            "/admin/refunds"
        );

        return toResponse(refundRequest);
    }

    /**
     * Process/Complete the refund (Order status goes from RETURNED -> REFUNDED or CANCELLED -> REFUNDED).
     */
    public RefundRequestResponse processRefund(UUID refundRequestId, UserPrincipal adminPrincipal, RefundApprovalRequest request, String ipAddress, String userAgent) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("RefundRequest", "id", refundRequestId));

        // Allow processing refund if order is RETURNED (for returns) OR if order is CANCELLED and refund is REQUESTED (for cancellations)
        boolean isReturnRefund = refundRequest.getOrder().getStatus() == OrderStatus.RETURNED;
        boolean isCancellationRefund = refundRequest.getOrder().getStatus() == OrderStatus.CANCELLED && 
                (refundRequest.getRefundStatus() == RefundStatus.REFUND_REQUESTED || refundRequest.getRefundStatus() == RefundStatus.REFUND_FAILED);

        if (!isReturnRefund && !isCancellationRefund) {
            throw new BadRequestException("Refund cannot be processed at this lifecycle stage. Order status: " + refundRequest.getOrder().getStatus());
        }

        try {
            String razorpayRefundId = null;
            if (refundRequest.getOrder().getPaymentMethod() != PaymentMethod.COD) {
                // Online prepaid order: trigger Razorpay API
                razorpayRefundId = paymentService.initiateRazorpayRefund(
                        refundRequest.getOrder().getId(),
                        refundRequest.getRefundAmount()
                );
                refundRequest.setRefundStatus(RefundStatus.REFUND_INITIATED);
                refundRequest.setRazorpayRefundId(razorpayRefundId);
                refundRequest.setRazorpayRefundStatus("processed");
                refundRequest.setRazorpayRefundTimestamp(LocalDateTime.now());
                refundRequest.setRazorpayRefundNotes("Auto-refund initiated via Razorpay API. Refund ID: " + razorpayRefundId);
            } else {
                // COD manual refund: transition straight to REFUNDED
                refundRequest.setRefundStatus(RefundStatus.REFUNDED);
                refundRequest.setRazorpayRefundStatus("N/A");
                refundRequest.setRazorpayRefundTimestamp(LocalDateTime.now());
                refundRequest.setRazorpayRefundNotes("COD manual refund processed.");
            }

            refundRequest.setRazorpayRefundFailureReason(null);
            refundRequest.setAdminNotes(request.getAdminNotes());
            refundRequest.setReviewedByAdminId(adminPrincipal.getId());
            refundRequest.setReviewedByAdminEmail(adminPrincipal.getEmail());
            refundRequest.setReviewedAt(LocalDateTime.now());
            refundRequest.setRefundProcessedAt(LocalDateTime.now()); // SLA update
            
            Order order = refundRequest.getOrder();
            order.setStatus(OrderStatus.REFUNDED);
            
            if (refundRequest.getOrder().getPaymentMethod() == PaymentMethod.COD) {
                order.setPaymentStatus(PaymentStatus.REFUNDED);
                
                Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
                if (payment != null) {
                    payment.setStatus(PaymentStatus.REFUNDED);
                    paymentRepository.save(payment);
                }
            } else {
                order.setPaymentStatus(PaymentStatus.REFUND_INITIATED);
                Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
                if (payment != null) {
                    payment.setStatus(PaymentStatus.REFUND_INITIATED);
                    paymentRepository.save(payment);
                }
            }

            order.getTrackingHistory().add(OrderTracking.builder()
                    .order(order)
                    .status("REFUNDED")
                    .message("Refund processed successfully. Amount: ₹" + refundRequest.getRefundAmount())
                    .build());
            orderRepository.save(order);
            RefundRequest saved = refundRequestRepository.save(refundRequest);

            // Logistics Audit Log
            auditLogService.log(adminPrincipal.getEmail(), "REFUND_PROCESSED",
                    "Processed refund for Order " + order.getOrderNumber() + " | Amount: ₹" + refundRequest.getRefundAmount() + 
                    (razorpayRefundId != null ? " | Razorpay Refund ID: " + razorpayRefundId : " | COD manual refund"),
                    order.getId().toString(), refundRequest.getId().toString());

            // Audit log
            securityAuditService.log(
                    adminPrincipal.getId(),
                    adminPrincipal.getEmail(),
                    SecurityAction.REFUND_APPROVED,
                    ipAddress,
                    userAgent,
                    "SUCCESS",
                    "Processed refund for Order " + order.getOrderNumber() + " | Amount: ₹" + refundRequest.getRefundAmount()
            );

            // Send Email to Customer
            try {
                emailService.sendRefundApprovedEmail(
                        refundRequest.getUser().getEmail(),
                        refundRequest.getUser().getName(),
                        order.getOrderNumber(),
                        refundRequest.getRefundAmount(),
                        request.getAdminNotes(),
                        razorpayRefundId != null ? razorpayRefundId : "COD-MANUAL"
                );
            } catch (Exception e) {
                log.error("Failed to send refund completed email: {}", e.getMessage());
            }

            notificationService.createNotification(
                refundRequest.getUser().getId(),
                "Refund Processed ✓",
                "Your refund of ₹" + refundRequest.getRefundAmount() + " for order " + order.getOrderNumber() + " has been processed.",
                com.belledonne.ecommerce.enums.NotificationType.REFUND_APPROVED,
                "/profile/orders"
            );

            return toResponse(saved);
        } catch (Exception e) {
            log.error("Refund processing failed: {}", e.getMessage(), e);
            refundRequest.setRefundStatus(RefundStatus.REFUND_FAILED);
            refundRequest.setRazorpayRefundFailureReason(e.getMessage());
            refundRequestRepository.save(refundRequest);
            throw new BadRequestException("Refund processing failed: " + e.getMessage());
        }
    }
}
