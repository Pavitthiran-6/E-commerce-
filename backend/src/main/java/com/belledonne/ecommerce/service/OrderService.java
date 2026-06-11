package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.OrderRequest;
import com.belledonne.ecommerce.dto.response.AddressResponse;
import com.belledonne.ecommerce.dto.response.OrderResponse;
import com.belledonne.ecommerce.entity.*;
import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.enums.PaymentMethod;
import com.belledonne.ecommerce.enums.PaymentStatus;
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

    @Autowired @Lazy
    private PaymentService paymentService;

    private static final AtomicInteger orderCounter = new AtomicInteger(1);

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

        BigDecimal shippingCharge = PriceUtil.calculateShipping(subtotal.subtract(discount));
        BigDecimal taxAmount = PriceUtil.calculateGst(subtotal.subtract(discount));
        BigDecimal total = subtotal.subtract(discount).add(shippingCharge);

        String orderNumber = generateOrderNumber();
        Order order = Order.builder()
            .orderNumber(orderNumber)
            .user(user).address(address)
            .subtotal(subtotal).shippingCharge(shippingCharge)
            .taxAmount(taxAmount).discountAmount(discount)
            .totalAmount(PriceUtil.round(total))
            .couponCode(request.getCouponCode())
            .paymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()))
            .estimatedDelivery(LocalDate.now().plusDays(5))
            .status(OrderStatus.PLACED)
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
            try {
                byte[] invoicePdf = invoiceService.generateInvoicePdf(saved);
                emailService.sendOrderConfirmationEmail(user.getEmail(), saved, invoicePdf);
            } catch (Exception e) {
                log.error("Failed to generate/send invoice for COD order: {}", e.getMessage());
                emailService.sendOrderConfirmationEmail(user.getEmail(), saved);
            }
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
        if (order.getStatus() != OrderStatus.PLACED && order.getStatus() != OrderStatus.CONFIRMED)
            throw new BadRequestException("Order cannot be cancelled at this stage");
            
        // Block direct cancellation for paid online orders — they must submit a refund request
        if (order.getPaymentMethod() != null
                && order.getPaymentMethod() != PaymentMethod.COD
                && order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new BadRequestException("Prepaid orders must be cancelled via the refund request workflow.");
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

    private String generateOrderNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "ORD-" + date + "-" + String.format("%04d", orderCounter.getAndIncrement());
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
            .trackingNumber(o.getTrackingNumber())
            .courierName(o.getCourierName())
            .shipmentNotes(o.getShipmentNotes())
            .stockRestored(o.isStockRestored())
            .address(addressResponse).items(items).trackingHistory(tracking)
            .createdAt(o.getCreatedAt())
            .cancellationReason(o.getRefundRequest() != null ? o.getRefundRequest().getCancellationReason() : null)
            .refundStatus(o.getRefundRequest() != null && o.getRefundRequest().getRefundStatus() != null ? o.getRefundRequest().getRefundStatus().name() : null)
            .refundRequestedAt(o.getRefundRequest() != null ? o.getRefundRequest().getRequestedAt() : null)
            .refundNotes(o.getRefundRequest() != null ? o.getRefundRequest().getAdminNotes() : null)
            .rejectionReason(o.getRefundRequest() != null ? o.getRefundRequest().getRejectionReason() : null)
            .razorpayRefundId(o.getRefundRequest() != null ? o.getRefundRequest().getRazorpayRefundId() : null)
            .razorpayRefundFailureReason(o.getRefundRequest() != null ? o.getRefundRequest().getRazorpayRefundFailureReason() : null)
            .build();
    }
}
