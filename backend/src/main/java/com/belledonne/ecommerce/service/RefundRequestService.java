package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.RefundApprovalRequest;
import com.belledonne.ecommerce.dto.request.RefundRejectionRequest;
import com.belledonne.ecommerce.dto.request.RefundRequestRequest;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
            // Trigger Razorpay Refund
            String razorpayRefundId = paymentService.initiateRazorpayRefund(
                    refundRequest.getOrder().getId(),
                    refundRequest.getRefundAmount()
            );

            // Update RefundRequest entity
            refundRequest.setRefundStatus(RefundStatus.REFUND_INITIATED);
            refundRequest.setRazorpayRefundId(razorpayRefundId);
            refundRequest.setRazorpayRefundFailureReason(null);
            refundRequest.setAdminNotes(request.getAdminNotes());
            refundRequest.setReviewedByAdminId(adminPrincipal.getId());
            refundRequest.setReviewedByAdminEmail(adminPrincipal.getEmail());
            refundRequest.setReviewedAt(LocalDateTime.now());
            
            RefundRequest saved = refundRequestRepository.save(refundRequest);

            // Audit log
            securityAuditService.log(
                    adminPrincipal.getId(),
                    adminPrincipal.getEmail(),
                    SecurityAction.REFUND_APPROVED,
                    ipAddress,
                    userAgent,
                    "SUCCESS",
                    "Refund approved for Order " + refundRequest.getOrder().getOrderNumber() + " | Razorpay Refund ID: " + razorpayRefundId
            );

            // Send Email to Customer
            try {
                emailService.sendRefundApprovedEmail(
                        refundRequest.getUser().getEmail(),
                        refundRequest.getUser().getName(),
                        refundRequest.getOrder().getOrderNumber(),
                        refundRequest.getRefundAmount(),
                        request.getAdminNotes(),
                        razorpayRefundId
                );
            } catch (Exception e) {
                log.error("Failed to send refund approved email for refundRequestId={}: {}", refundRequestId, e.getMessage());
            }

            // In-app notification
            notificationService.createNotification(
                refundRequest.getUser().getId(),
                "Refund Approved ✓",
                "Your refund of ₹" + refundRequest.getRefundAmount() + " for order " + refundRequest.getOrder().getOrderNumber() + " has been approved and initiated.",
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
        order.setPaymentStatus(PaymentStatus.REFUND_REJECTED);
        orderRepository.save(order);

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", order.getId()));
        payment.setStatus(PaymentStatus.REFUND_REJECTED);
        paymentRepository.save(payment);

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
                .refundStatus(request.getRefundStatus().name())
                .refundAmount(request.getRefundAmount())
                .adminNotes(request.getAdminNotes())
                .rejectionReason(request.getRejectionReason())
                .reviewedByAdminId(request.getReviewedByAdminId())
                .reviewedByAdminEmail(request.getReviewedByAdminEmail())
                .reviewedAt(request.getReviewedAt())
                .razorpayRefundId(request.getRazorpayRefundId())
                .razorpayRefundFailureReason(request.getRazorpayRefundFailureReason())
                .requestedAt(request.getRequestedAt())
                .updatedAt(request.getUpdatedAt())
                .orderTotalAmount(request.getOrder().getTotalAmount())
                .paymentMethod(request.getOrder().getPaymentMethod() != null ? request.getOrder().getPaymentMethod().name() : null)
                .paymentStatus(request.getOrder().getPaymentStatus().name())
                .orderDate(request.getOrder().getCreatedAt())
                .items(items)
                .build();
    }
}
