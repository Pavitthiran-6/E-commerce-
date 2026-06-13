package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.OrderRequest;
import com.belledonne.ecommerce.dto.response.AddressResponse;
import com.belledonne.ecommerce.dto.response.OrderResponse;
import com.belledonne.ecommerce.entity.*;
import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.enums.PaymentMethod;
import com.belledonne.ecommerce.enums.PaymentStatus;
import com.belledonne.ecommerce.enums.RefundStatus;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.*;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.util.PriceUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CouponService couponService;
    private final EmailService emailService;
    private final InventoryService inventoryService;
    private final InvoiceService invoiceService;
    private final NotificationService notificationService;
    private final ShippingSettingsService shippingSettingsService;
    private final ShiprocketService shiprocketService;
    private final RefundRequestRepository refundRequestRepository;
    private final AuditLogService auditLogService;

    @Autowired @Lazy
    private PaymentService paymentService;

    private String lastGeneratedDate = "";
    private final AtomicInteger orderCounter = new AtomicInteger(1);

    public OrderResponse placeOrder(UserPrincipal principal, OrderRequest request) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
        Address address = addressRepository.findById(request.getAddressId())
            .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));

        // Calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));
            
            ProductVariant variant = null;
            String size = null;
            String color = null;
            BigDecimal unitPrice = product.getPrice();
            
            if (itemReq.getVariantId() != null) {
                variant = productVariantRepository.findById(itemReq.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", itemReq.getVariantId()));
                size = variant.getSize();
                color = variant.getColor();
                if (variant.getAdditionalPrice() != null) {
                    unitPrice = unitPrice.add(variant.getAdditionalPrice());
                }
            }
            
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemTotal);
            String image = product.getImages() != null && product.getImages().length > 0 ? product.getImages()[0] : null;
            
            orderItems.add(OrderItem.builder()
                .product(product)
                .variant(variant)
                .productName(product.getName())
                .productImage(image)
                .size(size)
                .color(color)
                .quantity(itemReq.getQuantity())
                .unitPrice(unitPrice)
                .totalPrice(itemTotal)
                .build());
        }

        BigDecimal discount = BigDecimal.ZERO;
        Coupon coupon = null;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Map<String, Object> couponResult = couponService.validateCoupon(request.getCouponCode(), subtotal, user.getId());
            discount = (BigDecimal) couponResult.get("discountAmount");
            couponService.incrementUsage(request.getCouponCode());
        }

        com.belledonne.ecommerce.entity.ShippingSettings shippingSettings = shippingSettingsService.getOrCreate();
        BigDecimal subtotalAfterDiscount = subtotal.subtract(discount);
        
        BigDecimal shippingCharge = BigDecimal.ZERO;
        boolean hasGlobalShippingItems = false;
        
        for (OrderItem item : orderItems) {
            Product product = item.getProduct();
            if (Boolean.TRUE.equals(product.getFreeShipping())) {
                // Product-level free shipping
                continue;
            } else if (product.getShippingCharge() != null && product.getShippingCharge().compareTo(BigDecimal.ZERO) > 0) {
                // Product-level custom shipping charge (multiplied by quantity)
                BigDecimal itemShipping = product.getShippingCharge().multiply(BigDecimal.valueOf(item.getQuantity()));
                shippingCharge = shippingCharge.add(itemShipping);
            } else {
                // Falls back to global settings
                hasGlobalShippingItems = true;
            }
        }
        
        if (hasGlobalShippingItems) {
            // Apply global flat charge if subtotal falls below the threshold
            if (subtotalAfterDiscount.compareTo(shippingSettings.getFreeShippingThreshold()) < 0) {
                shippingCharge = shippingCharge.add(shippingSettings.getShippingCharge());
            }
        }

        BigDecimal taxAmount = PriceUtil.calculateGst(subtotalAfterDiscount);
        BigDecimal total = subtotalAfterDiscount.add(shippingCharge);

        String orderNumber = generateOrderNumber();
        PaymentMethod paymentMethod = PaymentMethod.valueOf(request.getPaymentMethod());
        OrderStatus initialStatus = PaymentMethod.COD.equals(paymentMethod) 
            ? OrderStatus.PENDING_PAYMENT 
            : OrderStatus.PLACED;

        Order order = Order.builder()
            .orderNumber(orderNumber)
            .user(user).address(address)
            .subtotal(subtotal).shippingCharge(shippingCharge)
            .taxAmount(taxAmount).discountAmount(discount)
            .totalAmount(PriceUtil.round(total))
            .couponCode(request.getCouponCode())
            .paymentMethod(paymentMethod)
            .estimatedDelivery(LocalDate.now().plusDays(5))
            .status(initialStatus)
            .build();

        Order saved = orderRepository.save(order);
        orderItems.forEach(item -> { item.setOrder(saved); saved.getItems().add(item); });

        // Deduct inventory
        inventoryService.deductStock(saved);

        // Add first tracking event
        saved.getTrackingHistory().add(OrderTracking.builder()
            .order(saved).status("PLACED")
            .message("Your order has been placed successfully").build());

        orderRepository.save(saved);

        // ── Email strategy ──────────────────────────────────────────────────
        // COD orders: email immediately (no online payment step follows).
        // Prepaid orders: email is deferred to PaymentService.verifyPayment()
        // so the customer is only notified after the payment is confirmed.
        if (PaymentMethod.COD.equals(order.getPaymentMethod())) {
            // COD: Send order confirmation email immediately, but DO NOT attach invoice PDF.
            emailService.sendOrderConfirmationEmail(user.getEmail(), saved, null);
            // In-app notification for COD order placed
            notificationService.createNotification(
                user.getId(),
                "Order Placed ✓",
                "Your order " + saved.getOrderNumber() + " has been placed successfully.",
                com.belledonne.ecommerce.enums.NotificationType.ORDER_CONFIRMED,
                "/profile/orders"
            );
        }
        // ─────────────────────────────────────────────────────────────────────

        return toResponse(saved);
    }

    public Page<OrderResponse> getUserOrders(UserPrincipal principal, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(principal.getId(), pageable)
            .map(this::toResponse);
    }

    public OrderResponse getOrder(UserPrincipal principal, UUID orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (!order.getUser().getId().equals(principal.getId()))
            throw new ResourceNotFoundException("Order", "id", orderId);
        return toResponse(order);
    }

    public OrderResponse cancelOrder(UserPrincipal principal, UUID orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (!order.getUser().getId().equals(principal.getId()))
            throw new ResourceNotFoundException("Order", "id", orderId);
        if (order.getStatus() != OrderStatus.PLACED && order.getStatus() != OrderStatus.CONFIRMED && order.getStatus() != OrderStatus.PACKED)
            throw new BadRequestException("Order cannot be cancelled at this stage");
            
        // Block direct cancellation for paid online orders — they must submit a refund request
        if (order.getPaymentMethod() != null
                && order.getPaymentMethod() != PaymentMethod.COD
                && order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new BadRequestException("Prepaid orders must be cancelled via the refund request workflow.");
        }

        // If a shipment exists on Shiprocket, attempt to cancel it automatically
        if (order.getShiprocketOrderId() != null) {
            try {
                shiprocketService.cancelShipment(order.getShiprocketOrderId());
                order.setShipmentStatus("CANCELLED");
            } catch (Exception e) {
                log.error("Failed to cancel Shiprocket shipment for order {} during customer cancellation: {}", 
                    order.getOrderNumber(), e.getMessage());
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.getTrackingHistory().add(OrderTracking.builder()
            .order(order).status("CANCELLED").message("Order cancelled by customer").build());
        
        // Restore stock
        inventoryService.restoreStock(order, "ORDER_CANCELLED", principal.getEmail());

        Order saved = orderRepository.save(order);

        // In-app notification for cancellation
        notificationService.createNotification(
            order.getUser().getId(),
            "Order Cancelled",
            "Your order " + order.getOrderNumber() + " has been cancelled.",
            com.belledonne.ecommerce.enums.NotificationType.ORDER_CANCELLED,
            "/profile/orders"
        );

        return toResponse(saved);
    }

    public OrderResponse cancelShipmentAdmin(UUID orderId, String adminEmail) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (order.getShiprocketOrderId() != null) {
            shiprocketService.cancelShipment(order.getShiprocketOrderId());
        }
        order.setShipmentStatus("CANCELLED");
        order.setStatus(OrderStatus.CANCELLED);
        order.getTrackingHistory().add(OrderTracking.builder()
            .order(order).status("CANCELLED").message("Shipment cancelled by administrator").build());
        
        // Restore stock
        inventoryService.restoreStock(order, "SHIPMENT_CANCELLED", adminEmail);
        Order saved = orderRepository.save(order);
        
        try {
            emailService.sendOrderStatusUpdateEmail(saved, "Cancelled", "Your order shipment has been cancelled by the administrator.");
            notificationService.createNotification(saved.getUser().getId(), "Shipment Cancelled",
                "Your shipment for order " + saved.getOrderNumber() + " has been cancelled.",
                com.belledonne.ecommerce.enums.NotificationType.ORDER_CANCELLED, "/profile/orders");
        } catch (Exception e) {
            log.error("Failed to send cancellation notification: {}", e.getMessage());
        }
        return toResponse(saved);
    }

    private synchronized String generateOrderNumber() {
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        if (!today.equals(lastGeneratedDate)) {
            String prefix = "ORD-" + today + "-";
            Optional<String> maxOrderOpt = orderRepository.findMaxOrderNumberByPrefix(prefix + "%");
            int startSeq = 1;
            if (maxOrderOpt.isPresent()) {
                String maxOrder = maxOrderOpt.get();
                try {
                    String[] parts = maxOrder.split("-");
                    if (parts.length >= 3) {
                        String seqPart = parts[2];
                        if (seqPart.matches("\\d+")) {
                            startSeq = Integer.parseInt(seqPart) + 1;
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse max order number: {}, starting at 1", maxOrder, e);
                }
            }
            orderCounter.set(startSeq);
            lastGeneratedDate = today;
        }

        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "ORD-" + today + "-" + String.format("%04d", orderCounter.getAndIncrement()) + "-" + randomSuffix;
    }

    public OrderResponse toResponse(Order o) {
        List<OrderResponse.OrderItemResponse> items = o.getItems().stream()
            .map(i -> OrderResponse.OrderItemResponse.builder()
                .id(i.getId())
                .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                .productName(i.getProductName())
                .productImage(i.getProductImage()).size(i.getSize()).color(i.getColor())
                .quantity(i.getQuantity()).unitPrice(i.getUnitPrice()).totalPrice(i.getTotalPrice())
                .build()).collect(Collectors.toList());

        List<OrderResponse.TrackingResponse> tracking = o.getTrackingHistory().stream()
            .map(t -> OrderResponse.TrackingResponse.builder()
                .status(t.getStatus()).message(t.getMessage())
                .location(t.getLocation()).trackingTime(t.getTrackingTime())
                .build()).collect(Collectors.toList());

        AddressResponse addressResponse = o.getAddress() != null ? AddressResponse.builder()
            .id(o.getAddress().getId()).fullName(o.getAddress().getFullName())
            .phone(o.getAddress().getPhone()).addressLine1(o.getAddress().getAddressLine1())
            .addressLine2(o.getAddress().getAddressLine2()).city(o.getAddress().getCity())
            .state(o.getAddress().getState()).pincode(o.getAddress().getPincode())
            .build() : null;

        return OrderResponse.builder()
            .id(o.getId()).orderNumber(o.getOrderNumber())
            .status(o.getStatus() != null ? o.getStatus().name() : null).subtotal(o.getSubtotal())
            .shippingCharge(o.getShippingCharge()).taxAmount(o.getTaxAmount())
            .discountAmount(o.getDiscountAmount()).totalAmount(o.getTotalAmount())
            .couponCode(o.getCouponCode()).paymentMethod(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : null)
            .paymentStatus(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : null)
            .estimatedDelivery(o.getEstimatedDelivery()).deliveredAt(o.getDeliveredAt())
            .paymentCollectedAt(o.getPaymentCollectedAt())
            .trackingNumber(o.getTrackingNumber())
            .courierName(o.getCourierName())
            .shipmentNotes(o.getShipmentNotes())
            .stockRestored(o.isStockRestored())
            .address(addressResponse).items(items).trackingHistory(tracking)
            .createdAt(o.getCreatedAt())
            .shiprocketOrderId(o.getShiprocketOrderId())
            .shipmentId(o.getShipmentId())
            .awbCode(o.getAwbCode())
            .trackingUrl(o.getTrackingUrl())
            .shipmentStatus(o.getShipmentStatus())
            .shipmentCreatedAt(o.getShipmentCreatedAt())
            .deliveryTimestamp(o.getDeliveryTimestamp())
            .courierDeliveryRemarks(o.getCourierDeliveryRemarks())
            .receiverName(o.getReceiverName())
            .deliveryConfirmationDetails(o.getDeliveryConfirmationDetails())
            .proofOfDeliveryUrl(o.getProofOfDeliveryUrl())
            .cancellationReason(o.getRefundRequest() != null ? o.getRefundRequest().getCancellationReason() : null)
            .additionalComments(o.getRefundRequest() != null ? o.getRefundRequest().getAdditionalComments() : null)
            .refundStatus(o.getRefundRequest() != null && o.getRefundRequest().getRefundStatus() != null ? o.getRefundRequest().getRefundStatus().name() : null)
            .refundRequestedAt(o.getRefundRequest() != null ? o.getRefundRequest().getRequestedAt() : null)
            .refundNotes(o.getRefundRequest() != null ? o.getRefundRequest().getAdminNotes() : null)
            .rejectionReason(o.getRefundRequest() != null ? o.getRefundRequest().getRejectionReason() : null)
            .razorpayRefundId(o.getRefundRequest() != null ? o.getRefundRequest().getRazorpayRefundId() : null)
            .razorpayRefundFailureReason(o.getRefundRequest() != null ? o.getRefundRequest().getRazorpayRefundFailureReason() : null)
            .productImageUrl(o.getRefundRequest() != null ? o.getRefundRequest().getProductImageUrl() : null)
            .productImageUrls(o.getRefundRequest() != null ? o.getRefundRequest().getProductImageUrls() : null)
            .bankDetails(o.getRefundRequest() != null ? o.getRefundRequest().getBankDetails() : null)
            .upiId(o.getRefundRequest() != null ? o.getRefundRequest().getUpiId() : null)
            .payoutDetailsRequestedAt(o.getRefundRequest() != null ? o.getRefundRequest().getPayoutDetailsRequestedAt() : null)
            .payoutDetailsProvidedAt(o.getRefundRequest() != null ? o.getRefundRequest().getPayoutDetailsProvidedAt() : null)
            .build();
    }

    @Transactional
    public OrderResponse syncOrderTrackingStatus(String awbCode, String newShipmentStatus, String latestEvent, String estimatedDelivery) {
        Order order = orderRepository.findByAwbCode(awbCode)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "awbCode", awbCode));

        String oldStatus = order.getShipmentStatus();
        if (newShipmentStatus != null && !newShipmentStatus.equalsIgnoreCase(oldStatus)) {
            order.setShipmentStatus(newShipmentStatus);
            
            OrderStatus mappedOrderStatus = mapShiprocketStatus(newShipmentStatus);
            if (mappedOrderStatus != null && mappedOrderStatus != order.getStatus()) {
                order.setStatus(mappedOrderStatus);
                if (mappedOrderStatus == OrderStatus.DELIVERED) {
                    order.setDeliveredAt(LocalDateTime.now());
                    order.setDeliveryTimestamp(LocalDateTime.now());
                    try {
                        ShiprocketService.TrackingData details = shiprocketService.trackShipment(awbCode);
                        if (details != null) {
                            if (details.getDeliveryTimestamp() != null && !details.getDeliveryTimestamp().isEmpty()) {
                                try {
                                    order.setDeliveryTimestamp(LocalDateTime.parse(details.getDeliveryTimestamp(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                                } catch (Exception e) {
                                    log.warn("Failed to parse delivery timestamp: {}", details.getDeliveryTimestamp());
                                }
                            }
                            order.setCourierDeliveryRemarks(details.getCourierRemarks());
                            order.setReceiverName(details.getReceiverName() != null ? details.getReceiverName() : order.getAddress().getFullName());
                            order.setProofOfDeliveryUrl(details.getProofOfDeliveryUrl());
                            order.setDeliveryConfirmationDetails("Delivered via Shiprocket. Receiver: " + order.getReceiverName());
                        }
                    } catch (Exception e) {
                        log.warn("Failed to fetch detailed delivery proof from Shiprocket for AWB {}: {}", awbCode, e.getMessage());
                    }
                    // For COD orders, record when cash was collected
                    if (order.getPaymentMethod() == com.belledonne.ecommerce.enums.PaymentMethod.COD) {
                        order.setPaymentCollectedAt(order.getDeliveryTimestamp() != null ? order.getDeliveryTimestamp() : LocalDateTime.now());
                        order.setPaymentStatus(com.belledonne.ecommerce.enums.PaymentStatus.PAID);
                    }
                    
                    // Audit log
                    auditLogService.log("system@belledonne.in", "SHIPMENT_DELIVERED", 
                        "Order " + order.getOrderNumber() + " delivered. Receiver: " + order.getReceiverName() + ", POD URL: " + order.getProofOfDeliveryUrl(), 
                        order.getId().toString(), null);
                }
                
                if (mappedOrderStatus == OrderStatus.RETURNED) {
                    // Update any associated refund request if present
                    final com.belledonne.ecommerce.enums.PaymentMethod payMethod = order.getPaymentMethod();
                    refundRequestRepository.findByOrderId(order.getId()).ifPresent(refundRequest -> {
                        boolean isCod = payMethod == com.belledonne.ecommerce.enums.PaymentMethod.COD;
                        refundRequest.setRefundStatus(isCod ? RefundStatus.PAYOUT_DETAILS_REQUESTED : RefundStatus.RETURN_APPROVED);
                        refundRequestRepository.save(refundRequest);
                    });
                    // Trigger warehouse notification email
                    emailService.sendWarehouseRtoNotificationEmail(order.getOrderNumber());
                }
                
                order.getTrackingHistory().add(OrderTracking.builder()
                    .order(order)
                    .status(mappedOrderStatus.name())
                    .message("Shipment status updated to " + newShipmentStatus + ". Latest event: " + latestEvent)
                    .build());
                
                sendShipmentEmailForStatus(order, mappedOrderStatus);
            } else {
                order.getTrackingHistory().add(OrderTracking.builder()
                    .order(order)
                    .status(order.getStatus().name())
                    .message("Shipment tracking update: " + latestEvent)
                    .build());
            }
            
            order = orderRepository.save(order);
        }
        return toResponse(order);
    }

    private OrderStatus mapShiprocketStatus(String status) {
        if (status == null) return null;
        switch (status.toLowerCase()) {
            case "packed":
            case "ready to ship":
            case "awb assigned":
            case "pickup scheduled":
            case "pickup generated":
                return OrderStatus.PACKED;
            case "picked up":
            case "in transit":
            case "reached hub":
            case "shipped":
                return OrderStatus.SHIPPED;
            case "out for delivery":
                return OrderStatus.OUT_FOR_DELIVERY;
            case "delivered":
                return OrderStatus.DELIVERED;
            case "cancelled":
                return OrderStatus.CANCELLED;
            case "rto delivered":
            case "returned":
            case "rto closed":
                return OrderStatus.RETURNED;
            default:
                return null;
        }
    }

    private void sendShipmentEmailForStatus(Order order, OrderStatus status) {
        try {
            if (status == OrderStatus.SHIPPED) {
                emailService.sendShipmentCreatedEmail(order.getUser().getEmail(), order);
                notificationService.createNotification(order.getUser().getId(), "Order Shipped 🚚",
                    "Your order " + order.getOrderNumber() + " is on its way!",
                    com.belledonne.ecommerce.enums.NotificationType.ORDER_SHIPPED, "/profile/orders");
            } else if (status == OrderStatus.OUT_FOR_DELIVERY) {
                emailService.sendShipmentOutEmail(order.getUser().getEmail(), order);
                notificationService.createNotification(order.getUser().getId(), "Out for Delivery 📦",
                    "Your order " + order.getOrderNumber() + " is out for delivery.",
                    com.belledonne.ecommerce.enums.NotificationType.ORDER_OUT_FOR_DELIVERY, "/profile/orders");
            } else if (status == OrderStatus.DELIVERED) {
                emailService.sendShipmentDeliveredEmail(order.getUser().getEmail(), order);
                notificationService.createNotification(order.getUser().getId(), "Order Delivered 🎉",
                    "Your order " + order.getOrderNumber() + " has been delivered.",
                    com.belledonne.ecommerce.enums.NotificationType.ORDER_DELIVERED, "/profile/orders");
            }
        } catch (Exception e) {
            log.error("Failed to send shipment update email/notification: {}", e.getMessage());
        }
    }
}
