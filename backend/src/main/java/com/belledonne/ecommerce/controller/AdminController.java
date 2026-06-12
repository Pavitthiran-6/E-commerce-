package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.*;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.dto.response.OrderResponse;
import com.belledonne.ecommerce.dto.response.ProductResponse;
import com.belledonne.ecommerce.dto.response.RefundRequestResponse;
import com.belledonne.ecommerce.dto.response.SaleSettingsResponse;
import com.belledonne.ecommerce.dto.response.UserAdminResponse;
import com.belledonne.ecommerce.dto.response.UserDetailsAdminResponse;
import com.belledonne.ecommerce.entity.*;
import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.enums.PaymentMethod;
import com.belledonne.ecommerce.enums.PaymentStatus;
import com.belledonne.ecommerce.enums.RefundStatus;
import com.belledonne.ecommerce.enums.Role;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.*;
import com.belledonne.ecommerce.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.belledonne.ecommerce.enums.SecurityAction;
import com.belledonne.ecommerce.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin management endpoints for dashboard, products, categories, orders, users, coupons, and reviews")
@Slf4j
public class AdminController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final SecurityAuditLogRepository securityAuditLogRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final WishlistRepository wishlistRepository;
    private final CartRepository cartRepository;
    private final CouponService couponService;
    private final ReviewService reviewService;
    private final OrderService orderService;
    private final ProductService productService;
    private final CategoryService categoryService;
    private final OrderTrackingService orderTrackingService;
    private final FileUploadService fileUploadService;
    private final EmailService emailService;
    private final SaleSettingsService saleSettingsService;
    private final LoginLockoutService loginLockoutService;
    private final SecurityAuditService securityAuditService;
    private final SecurityLogsExportService securityLogsExportService;
    private final RefundRequestService refundRequestService;
    private final RefundRequestRepository refundRequestRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final ReportsExportService reportsExportService;
    private final InvoiceService invoiceService;
    private final ShippingSettingsService shippingSettingsService;
    private final ShiprocketService shiprocketService;
    private final HttpServletRequest request;

    // ---- 5A: ADMIN DASHBOARD ----
    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard statistics")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<?>> dashboard() {
        long totalOrders = orderRepository.count();
        long totalUsers = userRepository.count();
        long totalProducts = productRepository.count();
        BigDecimal totalRevenue = orderRepository.getTotalRevenue();

        LocalDateTime midnight = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime weekStart = LocalDateTime.now().minusDays(6).with(LocalTime.MIN);
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN);

        long pendingOrders      = orderRepository.countByStatus(OrderStatus.PLACED);
        long ordersToday        = orderRepository.countOrdersFrom(midnight);
        long ordersThisMonth    = orderRepository.countOrdersBetween(monthStart, LocalDateTime.now());
        BigDecimal revenueToday   = orderRepository.getRevenueSince(midnight);
        BigDecimal revenueWeekly  = orderRepository.getRevenueSince(weekStart);
        BigDecimal revenueMonthly = orderRepository.getRevenueSince(monthStart);
        BigDecimal avgOrderValue  = orderRepository.getAverageOrderValue();

        // Refund analytics
        long refundCount  = refundRequestRepository.countByRefundStatus(com.belledonne.ecommerce.enums.RefundStatus.REFUND_REQUESTED)
                         + refundRequestRepository.countByRefundStatus(com.belledonne.ecommerce.enums.RefundStatus.REFUND_APPROVED)
                         + refundRequestRepository.countByRefundStatus(com.belledonne.ecommerce.enums.RefundStatus.REFUND_INITIATED)
                         + refundRequestRepository.countByRefundStatus(com.belledonne.ecommerce.enums.RefundStatus.REFUNDED);
        long pendingRefunds = refundRequestRepository.countByRefundStatus(com.belledonne.ecommerce.enums.RefundStatus.REFUND_REQUESTED);
        BigDecimal totalRefundAmount = refundRequestRepository.getTotalRefundAmount();

        // Inventory
        long lowStockProducts  = productRepository.countByStockQuantityLessThan(10);
        long outOfStockCount   = productRepository.countByStockQuantityEquals(0);

        // Pending reviews
        long pendingReviews = reviewService.getPendingReviews(PageRequest.of(0, 1)).getTotalElements();

        // Recent orders
        List<OrderResponse> recentOrders = orderRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
            .getContent().stream().map(orderService::toResponse).collect(Collectors.toList());

        // Top selling products
        List<Object[]> topSelling = orderItemRepository.getTopSellingProducts(PageRequest.of(0, 5));
        List<Map<String, Object>> topProducts = topSelling.stream().map(row -> Map.of(
            "productId",  row[0] != null ? row[0].toString() : "",
            "productName", row[1] != null ? row[1].toString() : "",
            "totalSold",  row[2] != null ? row[2] : 0
        )).collect(Collectors.toList());

        // Top categories
        List<Object[]> topCats = orderItemRepository.getTopCategoriesByRevenue();
        List<Map<String, Object>> topCategories = topCats.stream().map(row -> Map.of(
            "category", row[0] != null ? row[0].toString() : "Uncategorized",
            "revenue",  row[1] != null ? row[1] : 0
        )).collect(Collectors.toList());

        // Order status breakdown
        Map<String, Long> orderStatusBreakdown = new HashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            orderStatusBreakdown.put(status.name(), orderRepository.countByStatus(status));
        }

        // Daily trend — last 30 days
        LocalDateTime trendFrom = LocalDateTime.now().minusDays(29).with(LocalTime.MIN);
        List<Object[]> rawTrend = orderRepository.getDailyTrend(trendFrom);
        List<Map<String, Object>> dailyTrend = rawTrend.stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date",    row[0] != null ? row[0].toString() : "");
            m.put("orders",  row[1] != null ? row[1] : 0);
            m.put("revenue", row[2] != null ? row[2] : 0);
            return m;
        }).collect(Collectors.toList());

        // Monthly revenue (current year) — replaces heavy in-memory load
        LocalDateTime startOfYear = LocalDateTime.now().withDayOfYear(1).with(LocalTime.MIN);
        List<Order> ordersThisYear = orderRepository.findAll((root, query, cb) -> cb.and(
            cb.greaterThanOrEqualTo(root.get("createdAt"), startOfYear),
            cb.equal(root.get("status"), OrderStatus.DELIVERED)
        ));
        Map<java.time.Month, BigDecimal> monthlySums = ordersThisYear.stream()
            .collect(Collectors.groupingBy(
                o -> o.getCreatedAt().getMonth(),
                Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
            ));
        List<Map<String, Object>> monthlyRevenueList = new ArrayList<>();
        for (java.time.Month m : java.time.Month.values()) {
            monthlyRevenueList.add(Map.of(
                "month",   m.getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH),
                "revenue", monthlySums.getOrDefault(m, BigDecimal.ZERO)
            ));
        }

        // Return SLA Calculations
        List<Object[]> slaTimestamps = refundRequestRepository.findSlaTimestamps();
        long totalApproveSec = 0, countApprove = 0;
        long totalProcessSec = 0, countProcess = 0;
        long totalCompleteSec = 0, countComplete = 0;

        for (Object[] row : slaTimestamps) {
            LocalDateTime req = (LocalDateTime) row[0];
            LocalDateTime app = (LocalDateTime) row[1];
            LocalDateTime rec = (LocalDateTime) row[2];
            LocalDateTime pro = (LocalDateTime) row[3];

            if (req != null && app != null) {
                totalApproveSec += java.time.Duration.between(req, app).getSeconds();
                countApprove++;
            }
            if (rec != null && pro != null) {
                totalProcessSec += java.time.Duration.between(rec, pro).getSeconds();
                countProcess++;
            }
            if (req != null && pro != null) {
                totalCompleteSec += java.time.Duration.between(req, pro).getSeconds();
                countComplete++;
            }
        }

        double avgReturnApprovalTimeHours = countApprove > 0 ? (double) totalApproveSec / 3600.0 / countApprove : 0.0;
        double avgRefundProcessingTimeHours = countProcess > 0 ? (double) totalProcessSec / 3600.0 / countProcess : 0.0;
        double avgReturnCompletionTimeHours = countComplete > 0 ? (double) totalCompleteSec / 3600.0 / countComplete : 0.0;

        // Logistics operations metrics
        long awaitingShipment = orderRepository.countAwaitingShipment();
        long pickupScheduled = orderRepository.countPickupScheduled();
        long inTransit = orderRepository.countInTransit();
        long outForDelivery = orderRepository.countOutForDelivery();
        long deliveredTodayCount = orderRepository.countDeliveredToday(midnight);
        long rtoOrders = orderRepository.countRtoOrders();
        long activeReturnRequests = refundRequestRepository.countActiveReturnRequests();
        long pendingRefundsCount = refundRequestRepository.countPendingRefunds();

        // High Return Risk Customers
        List<UserAdminResponse> highReturnRiskCustomers = userRepository.findHighReturnRiskCustomers();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRevenue",    totalRevenue);
        stats.put("revenueToday",    revenueToday);
        stats.put("revenueWeekly",   revenueWeekly);
        stats.put("revenueMonthly",  revenueMonthly);
        stats.put("avgOrderValue",   avgOrderValue);
        stats.put("totalOrders",     totalOrders);
        stats.put("ordersToday",     ordersToday);
        stats.put("ordersThisMonth", ordersThisMonth);
        stats.put("pendingOrders",   pendingOrders);
        stats.put("totalUsers",      totalUsers);
        stats.put("totalProducts",   totalProducts);
        stats.put("lowStockProducts", lowStockProducts);
        stats.put("outOfStockCount",  outOfStockCount);
        stats.put("refundCount",      refundCount);
        stats.put("pendingRefunds",   pendingRefunds);
        stats.put("totalRefundAmount", totalRefundAmount);
        stats.put("pendingReviews",   pendingReviews);
        stats.put("recentOrders",    recentOrders);
        stats.put("topProducts",     topProducts);
        stats.put("topCategories",   topCategories);
        stats.put("orderStatusBreakdown", orderStatusBreakdown);
        stats.put("monthlyRevenue",  monthlyRevenueList);
        stats.put("dailyTrend",      dailyTrend);
        stats.put("avgReturnApprovalTimeHours", avgReturnApprovalTimeHours);
        stats.put("avgRefundProcessingTimeHours", avgRefundProcessingTimeHours);
        stats.put("avgReturnCompletionTimeHours", avgReturnCompletionTimeHours);
        stats.put("logisticsAwaitingShipment", awaitingShipment);
        stats.put("logisticsPickupScheduled", pickupScheduled);
        stats.put("logisticsInTransit", inTransit);
        stats.put("logisticsOutForDelivery", outForDelivery);
        stats.put("logisticsDeliveredToday", deliveredTodayCount);
        stats.put("logisticsRtoOrders", rtoOrders);
        stats.put("logisticsActiveReturnRequests", activeReturnRequests);
        stats.put("logisticsPendingRefunds", pendingRefundsCount);
        stats.put("highReturnRiskCustomers", highReturnRiskCustomers);

        return ResponseEntity.ok(ApiResponse.success("Dashboard stats fetched successfully", stats));
    }

    // ---- 5B: PRODUCT MANAGEMENT (Admin) ----
    @PostMapping("/products")
    @Operation(summary = "Create a new product")
    public ResponseEntity<ApiResponse<?>> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Product created successfully", productService.createProductResponse(request)));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Update an existing product")
    public ResponseEntity<ApiResponse<?>> updateProduct(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", productService.updateProductResponse(id, request)));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Delete a product")
    public ResponseEntity<ApiResponse<?>> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully"));
    }

    @PutMapping("/products/{id}/toggle-status")
    @Operation(summary = "Toggle active status of a product")
    public ResponseEntity<ApiResponse<?>> toggleProductStatus(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Product status toggled", productService.toggleActiveResponse(id)));
    }

    @PutMapping("/products/{id}/toggle-featured")
    @Operation(summary = "Toggle featured status of a product")
    public ResponseEntity<ApiResponse<?>> toggleProductFeatured(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Product featured status toggled", productService.toggleFeaturedResponse(id)));
    }

    @PutMapping("/products/{id}/arrival-tag")
    @Operation(summary = "Update arrival tag of a product")
    public ResponseEntity<ApiResponse<?>> updateArrivalTag(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        String tag = body.get("arrivalTag");
        return ResponseEntity.ok(ApiResponse.success("Product arrival tag updated successfully", productService.updateArrivalTagResponse(id, tag)));
    }

    @PostMapping("/products/{id}/variants")
    @Operation(summary = "Add a new variant to product")
    public ResponseEntity<ApiResponse<?>> addProductVariant(@PathVariable UUID id, @RequestBody VariantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Product variant added", productService.addVariant(id, request)));
    }

    @PutMapping("/products/{id}/variants/{variantId}")
    @Operation(summary = "Update an existing product variant")
    public ResponseEntity<ApiResponse<?>> updateProductVariant(
        @PathVariable UUID id, @PathVariable Long variantId, @RequestBody VariantRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Product variant updated", productService.updateVariant(id, variantId, request)));
    }

    @DeleteMapping("/products/{id}/variants/{variantId}")
    @Operation(summary = "Delete a product variant")
    public ResponseEntity<ApiResponse<?>> deleteProductVariant(@PathVariable UUID id, @PathVariable Long variantId) {
        productService.deleteVariant(id, variantId);
        return ResponseEntity.ok(ApiResponse.success("Product variant deleted"));
    }

    // ---- PART 6: FILE UPLOAD & PRODUCT IMAGES ----
    @PostMapping(value = "/products/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload images for a product")
    public ResponseEntity<ApiResponse<?>> uploadProductImages(
        @PathVariable UUID id, @RequestParam("files") List<MultipartFile> files) {
        Product product = productService.getById(id);
        List<String> uploadedUrls = fileUploadService.uploadMultipleImages(files, "products/" + id);

        List<String> currentImages = product.getImages() != null ? new ArrayList<>(Arrays.asList(product.getImages())) : new ArrayList<>();
        currentImages.addAll(uploadedUrls);
        product.setImages(currentImages.toArray(new String[0]));

        return ResponseEntity.ok(ApiResponse.success("Images uploaded successfully", productService.saveProductResponse(product)));
    }

    @DeleteMapping("/products/{id}/images")
    @Operation(summary = "Delete an image of a product")
    public ResponseEntity<ApiResponse<?>> deleteProductImage(
        @PathVariable UUID id, @RequestBody Map<String, String> body) {
        Product product = productService.getById(id);
        String urlToDelete = body.get("imageUrl");

        if (urlToDelete == null || urlToDelete.isBlank()) {
            throw new BadRequestException("Image URL is required");
        }

        List<String> currentImages = product.getImages() != null ? new ArrayList<>(Arrays.asList(product.getImages())) : new ArrayList<>();
        if (!currentImages.contains(urlToDelete)) {
            throw new BadRequestException("Image URL does not belong to this product");
        }

        // Delete from Cloudinary
        if (urlToDelete.contains("/upload/")) {
            try {
                String path = urlToDelete.substring(urlToDelete.indexOf("/upload/") + 8);
                if (path.startsWith("v")) {
                    int nextSlash = path.indexOf('/');
                    if (nextSlash != -1) {
                        path = path.substring(nextSlash + 1);
                    }
                }
                int lastDot = path.lastIndexOf('.');
                if (lastDot != -1) {
                    path = path.substring(0, lastDot);
                }
                fileUploadService.deleteImage(path);
            } catch (Exception e) {
                log.error("Failed to parse public ID and delete image from Cloudinary: {}", urlToDelete, e);
            }
        }

        currentImages.remove(urlToDelete);
        product.setImages(currentImages.toArray(new String[0]));
        Product saved = productService.saveProduct(product);
        return ResponseEntity.ok(ApiResponse.success("Image deleted successfully", productService.toResponse(saved)));
    }

    // ---- 5C: ORDER MANAGEMENT (Admin) ----
    @GetMapping("/orders")
    @Operation(summary = "Get filtered orders list with pagination")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<?>> getAllOrdersFiltered(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
        @RequestParam(required = false) String paymentMethod,
        @RequestParam(required = false) String trackingNumber,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {

        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), OrderStatus.valueOf(status.toUpperCase())));
            }
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom.atStartOfDay()));
            }
            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), dateTo.atTime(23, 59, 59)));
            }
            if (paymentMethod != null && !paymentMethod.isBlank()) {
                predicates.add(cb.equal(root.get("paymentMethod"), PaymentMethod.valueOf(paymentMethod.toUpperCase())));
            }
            if (trackingNumber != null && !trackingNumber.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("trackingNumber")), "%" + trackingNumber.toLowerCase().trim() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<OrderResponse> orders = orderRepository.findAll(spec, PageRequest.of(page, size))
            .map(orderService::toResponse);

        return ResponseEntity.ok(ApiResponse.success("Filtered orders fetched", orders));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Get details of any order")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<?>> getOrderDetails(@PathVariable UUID id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return ResponseEntity.ok(ApiResponse.success("Order details fetched", orderService.toResponse(order)));
    }

    @PutMapping("/orders/{id}/status")
    @Operation(summary = "Update status of an order")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<?>> updateOrderStatus(
        @PathVariable UUID id, @Valid @RequestBody OrderStatusUpdateRequest body, HttpServletRequest httpServletRequest) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        
        OrderStatus oldStatus = order.getStatus();
        OrderStatus newStatus = OrderStatus.valueOf(body.getStatus().toUpperCase());
        order.setStatus(newStatus);

        if (body.getTrackingNumber() != null) {
            order.setTrackingNumber(body.getTrackingNumber());
        }
        if (body.getCourierName() != null) {
            order.setCourierName(body.getCourierName());
        }
        if (body.getShipmentNotes() != null) {
            order.setShipmentNotes(body.getShipmentNotes());
        }

        String trackingMsg = body.getShipmentNotes() != null && !body.getShipmentNotes().isBlank()
            ? body.getShipmentNotes()
            : "Order status updated to " + newStatus.name();

        OrderTracking tracking = OrderTracking.builder()
            .order(order)
            .status(newStatus.name())
            .message(trackingMsg)
            .build();
        order.getTrackingHistory().add(tracking);

        if (newStatus == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        Order saved = orderRepository.save(order);

        // Audit Log
        User admin = getLoggedInUser();
        String ip = SecurityAuditService.getClientIp(httpServletRequest);
        String ua = httpServletRequest.getHeader("User-Agent");
        securityAuditService.log(
            admin != null ? admin.getId() : null,
            admin != null ? admin.getEmail() : "admin@belledonne.in",
            SecurityAction.ADMIN_ACTION,
            ip,
            ua,
            "SUCCESS",
            "Updated status of order " + order.getOrderNumber() + " from " + oldStatus + " to " + newStatus
        );

        // Send Email notifications on major status changes
        try {
            if (newStatus == OrderStatus.CONFIRMED) {
                emailService.sendOrderStatusUpdateEmail(saved, "Confirmed", "Your order has been confirmed and is being prepared.");
                notificationService.createNotification(saved.getUser().getId(), "Order Confirmed ✓",
                    "Your order " + saved.getOrderNumber() + " has been confirmed.",
                    com.belledonne.ecommerce.enums.NotificationType.ORDER_CONFIRMED, "/profile/orders");
            } else if (newStatus == OrderStatus.PACKED) {
                emailService.sendOrderStatusUpdateEmail(saved, "Packed", "Your order has been packed and is ready for shipment.");
            } else if (newStatus == OrderStatus.SHIPPED) {
                emailService.sendOrderShippedEmail(saved.getUser().getEmail(), saved, saved.getTrackingNumber());
                notificationService.createNotification(saved.getUser().getId(), "Order Shipped 🚚",
                    "Your order " + saved.getOrderNumber() + " is on its way!",
                    com.belledonne.ecommerce.enums.NotificationType.ORDER_SHIPPED, "/profile/orders");
            } else if (newStatus == OrderStatus.OUT_FOR_DELIVERY) {
                emailService.sendOrderStatusUpdateEmail(saved, "Out for Delivery", "Your order is out for delivery with our courier partner.");
                notificationService.createNotification(saved.getUser().getId(), "Out for Delivery 📦",
                    "Your order " + saved.getOrderNumber() + " is out for delivery.",
                    com.belledonne.ecommerce.enums.NotificationType.ORDER_OUT_FOR_DELIVERY, "/profile/orders");
            } else if (newStatus == OrderStatus.DELIVERED) {
                emailService.sendOrderDeliveredEmail(saved.getUser().getEmail(), saved);
                notificationService.createNotification(saved.getUser().getId(), "Order Delivered 🎉",
                    "Your order " + saved.getOrderNumber() + " has been delivered. Enjoy!",
                    com.belledonne.ecommerce.enums.NotificationType.ORDER_DELIVERED, "/profile/orders");
            } else if (newStatus == OrderStatus.CANCELLED) {
                emailService.sendOrderStatusUpdateEmail(saved, "Cancelled", "Your order has been cancelled.");
                notificationService.createNotification(saved.getUser().getId(), "Order Cancelled",
                    "Your order " + saved.getOrderNumber() + " has been cancelled.",
                    com.belledonne.ecommerce.enums.NotificationType.ORDER_CANCELLED, "/profile/orders");
            }
        } catch (Exception e) {
            log.error("Failed to send order status change email for orderId={}: {}", id, e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.success("Order status updated", orderService.toResponse(saved)));
    }

    @PutMapping("/orders/{id}/payment-status")
    @Operation(summary = "Update payment status of an order")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<?>> updateOrderPaymentStatus(
        @PathVariable UUID id, @RequestBody Map<String, String> body, HttpServletRequest httpServletRequest) {
        
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        
        String statusStr = body.get("paymentStatus");
        if (statusStr == null || statusStr.isBlank()) {
            throw new BadRequestException("paymentStatus is required");
        }
        
        PaymentStatus oldStatus = order.getPaymentStatus();
        PaymentStatus newStatus = PaymentStatus.valueOf(statusStr.toUpperCase());
        
        order.setPaymentStatus(newStatus);
        
        // Mirror to payment if it exists
        if (order.getPayment() != null) {
            order.getPayment().setStatus(newStatus);
        }
        
        Order saved = orderRepository.save(order);
        
        // Audit log for payment status update
        User admin = getLoggedInUser();
        String ip = SecurityAuditService.getClientIp(httpServletRequest);
        String ua = httpServletRequest.getHeader("User-Agent");
        securityAuditService.log(
            admin != null ? admin.getId() : null,
            admin != null ? admin.getEmail() : "admin@belledonne.in",
            SecurityAction.ADMIN_ACTION,
            ip,
            ua,
            "SUCCESS",
            "Updated payment status of order " + order.getOrderNumber() + " from " + oldStatus + " to " + newStatus
        );
        
        // Trigger automatic invoice generation and email if status updated to PAID or SUCCESS
        if (newStatus == PaymentStatus.PAID || newStatus == PaymentStatus.SUCCESS) {
            try {
                byte[] invoicePdf = invoiceService.generateInvoicePdf(saved);
                emailService.sendInvoiceReadyEmail(saved.getUser().getEmail(), saved, invoicePdf);
                
                // Audit log for invoice generation
                securityAuditService.log(
                    admin != null ? admin.getId() : null,
                    admin != null ? admin.getEmail() : "admin@belledonne.in",
                    SecurityAction.ADMIN_ACTION,
                    ip,
                    ua,
                    "SUCCESS",
                    "Automatically generated invoice PDF and sent notification email for order: " + order.getOrderNumber()
                );
            } catch (Exception e) {
                log.error("Failed to generate and email invoice for order: {}", order.getOrderNumber(), e);
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success("Payment status updated", orderService.toResponse(saved)));
    }

    // ---- PART 4: ORDER TRACKING EVENTS (Admin) ----
    @PostMapping("/orders/{orderId}/tracking")
    @Operation(summary = "Add a tracking timeline event for an order")
    public ResponseEntity<ApiResponse<?>> addOrderTrackingEvent(
        @PathVariable UUID orderId, @Valid @RequestBody TrackingRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
            "Tracking event added successfully",
            orderTrackingService.addTrackingEvent(orderId, request)
        ));
    }

    // ---- 5D: USER MANAGEMENT (Admin) ----
    @GetMapping("/users")
    @Operation(summary = "Get all registered users with metrics (paginated & searchable)")
    public ResponseEntity<ApiResponse<com.belledonne.ecommerce.dto.response.UserManagementResponse>> getAllUsers(
        @RequestParam(defaultValue = "") String search,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) Boolean blocked,
        @RequestParam(required = false) Boolean locked,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "15") int size) {

        Role roleEnum = null;
        if (role != null && !role.isBlank()) {
            try {
                roleEnum = Role.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid role
            }
        }

        boolean isLocked = Boolean.TRUE.equals(locked);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        Pageable pageable = PageRequest.of(page, size);
        Page<UserAdminResponse> usersPage = userRepository.findUsersWithMetrics(search.trim(), roleEnum, blocked, isLocked, now, pageable);

        long totalCustomers = userRepository.countByRole(Role.ROLE_USER);
        long activeUsers = userRepository.countByIsBlockedFalseAndRole(Role.ROLE_USER);
        long blockedUsers = userRepository.countByIsBlockedTrueAndRole(Role.ROLE_USER);
        long lockedUsers = userRepository.countByAccountLockedUntilAfter(java.time.LocalDateTime.now());
        long totalAdministrators = userRepository.countByRole(Role.ROLE_ADMIN);

        com.belledonne.ecommerce.dto.response.UserManagementResponse response =
            com.belledonne.ecommerce.dto.response.UserManagementResponse.builder()
                .content(usersPage.getContent())
                .totalPages(usersPage.getTotalPages())
                .totalElements(usersPage.getTotalElements())
                .number(usersPage.getNumber())
                .size(usersPage.getSize())
                .totalCustomers(totalCustomers)
                .activeUsers(activeUsers)
                .blockedUsers(blockedUsers)
                .lockedUsers(lockedUsers)
                .totalAdministrators(totalAdministrators)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Users fetched successfully", response));
    }


    @GetMapping("/users/{id}")
    @Operation(summary = "Get full user details — addresses, orders, wishlist, cart")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<UserDetailsAdminResponse>> getUserDetails(@PathVariable UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // Addresses
        List<UserDetailsAdminResponse.AddressDTO> addressDTOs = user.getAddresses().stream()
            .map(addr -> UserDetailsAdminResponse.AddressDTO.builder()
                .id(addr.getId())
                .fullName(addr.getFullName())
                .phone(addr.getPhone())
                .addressLine(addr.getAddressLine1() +
                    (addr.getAddressLine2() != null && !addr.getAddressLine2().isBlank()
                        ? ", " + addr.getAddressLine2() : ""))
                .city(addr.getCity())
                .state(addr.getState())
                .country("India")
                .postalCode(addr.getPincode())
                .isDefault(addr.getIsDefault())
                .build())
            .collect(Collectors.toList());

        // Orders
        long totalOrders = orderRepository.countByUserId(id);
        BigDecimal totalSpent = orderRepository.sumTotalAmountByUserId(id);
        if (totalSpent == null) totalSpent = BigDecimal.ZERO;
        List<UserDetailsAdminResponse.OrderMinDTO> orderDTOs =
            orderRepository.findByUserIdOrderByCreatedAtDesc(id, PageRequest.of(0, 5))
                .getContent().stream()
                .map(o -> UserDetailsAdminResponse.OrderMinDTO.builder()
                    .id(o.getId())
                    .orderNumber(o.getOrderNumber())
                    .createdAt(o.getCreatedAt())
                    .totalAmount(o.getTotalAmount())
                    .status(o.getStatus() != null ? o.getStatus().name() : "PLACED")
                    .build())
                .collect(Collectors.toList());

        // Wishlist
        List<Wishlist> wishlists = wishlistRepository.findByUserId(id);
        int wishlistCount = wishlists.size();
        List<UserDetailsAdminResponse.WishlistItemDTO> wishlistDTOs = wishlists.stream()
            .map(w -> {
                Product p = w.getProduct();
                String img = p.getImages() != null && p.getImages().length > 0 ? p.getImages()[0] : null;
                return UserDetailsAdminResponse.WishlistItemDTO.builder()
                    .id(p.getId()).name(p.getName()).price(p.getPrice()).image(img).build();
            }).collect(Collectors.toList());

        // Cart
        Optional<Cart> cartOpt = cartRepository.findByUserId(id);
        int cartCount = 0;
        List<UserDetailsAdminResponse.CartItemDTO> cartDTOs = new ArrayList<>();
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            cartCount = cart.getItems().stream().mapToInt(CartItem::getQuantity).sum();
            cartDTOs = cart.getItems().stream()
                .map(ci -> {
                    Product p = ci.getProduct();
                    String img = p.getImages() != null && p.getImages().length > 0 ? p.getImages()[0] : null;
                    return UserDetailsAdminResponse.CartItemDTO.builder()
                        .id(ci.getId()).productId(p.getId()).productName(p.getName())
                        .quantity(ci.getQuantity()).price(ci.getPriceAtAddition())
                        .image(img).size(ci.getSize()).color(ci.getColor()).build();
                }).collect(Collectors.toList());
        }

        long userReturnsCount = refundRequestRepository.countByUserIdAndReturnRequestedAtIsNotNull(id);
        long userRefundsCount = refundRequestRepository.countByUserIdAndRefundStatus(id, RefundStatus.REFUNDED);
        double returnPercent = 0.0;
        if (totalOrders > 0) {
            returnPercent = (double) userReturnsCount * 100.0 / (double) totalOrders;
        }
        boolean isHighRisk = returnPercent > 40.0 && totalOrders > 0;

        UserDetailsAdminResponse details = UserDetailsAdminResponse.builder()
            .id(user.getId()).name(user.getName()).email(user.getEmail()).phone(user.getPhone())
            .role(user.getRole() != null ? user.getRole().name() : "ROLE_USER")
            .createdAt(user.getCreatedAt()).lastLoginAt(user.getLastLoginAt())
            .isBlocked(user.getIsBlocked()).blockedReason(user.getBlockedReason())
            .addresses(addressDTOs).totalOrders(totalOrders).totalAmountSpent(totalSpent)
            .latestOrders(orderDTOs).wishlistCount(wishlistCount).wishlistItems(wishlistDTOs)
            .cartCount(cartCount).cartItems(cartDTOs)
            .failedLoginAttempts(loginLockoutService.getFailedAttempts(user))
            .accountLockedUntil(loginLockoutService.getLockedUntil(user))
            .totalReturns(userReturnsCount)
            .totalRefunds(userRefundsCount)
            .returnPercentage(returnPercent)
            .isHighReturnRisk(isHighRisk)
            .build();

        return ResponseEntity.ok(ApiResponse.success("User details fetched successfully", details));
    }

    @PutMapping("/users/{id}/toggle-block")
    @Operation(summary = "Toggle block status of a user")
    public ResponseEntity<ApiResponse<?>> toggleBlockUser(
        @PathVariable UUID id, @RequestBody(required = false) Map<String, String> body) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new BadRequestException("Admin accounts cannot be blocked or protected");
        }

        boolean currentlyBlocked = user.getIsBlocked() != null && user.getIsBlocked();
        if (currentlyBlocked) {
            user.setIsBlocked(false);
            user.setBlockedReason(null);
        } else {
            user.setIsBlocked(true);
            String reason = body != null ? body.get("reason") : null;
            user.setBlockedReason(reason != null && !reason.isBlank() ? reason.trim() : "Blocked by administrator");
        }
        userRepository.save(user);
        
        // Audit log
        User admin = getLoggedInUser();
        String ip = SecurityAuditService.getClientIp(request);
        String ua = request.getHeader("User-Agent");
        SecurityAction action = user.getIsBlocked() ? SecurityAction.ADMIN_BLOCK_USER : SecurityAction.ADMIN_UNBLOCK_USER;
        String detail = user.getIsBlocked() ? "Blocked user: " + user.getEmail() + " (Reason: " + user.getBlockedReason() + ")" : "Unblocked user: " + user.getEmail();
        securityAuditService.log(admin != null ? admin.getId() : null, admin != null ? admin.getEmail() : "admin@belledonne.in", action, ip, ua, "SUCCESS", detail);

        String resultAction = user.getIsBlocked() ? "blocked" : "unblocked";
        return ResponseEntity.ok(ApiResponse.success("User successfully " + resultAction));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete a user account")
    public ResponseEntity<ApiResponse<?>> deleteUser(@PathVariable UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new BadRequestException("Admin accounts cannot be deleted");
        }

        userRepository.delete(user);

        // Audit log
        User admin = getLoggedInUser();
        String ip = SecurityAuditService.getClientIp(request);
        String ua = request.getHeader("User-Agent");
        securityAuditService.log(admin != null ? admin.getId() : null, admin != null ? admin.getEmail() : "admin@belledonne.in", SecurityAction.ADMIN_DELETE_USER, ip, ua, "SUCCESS", "Deleted user: " + user.getEmail());

        return ResponseEntity.ok(ApiResponse.success("User account deleted successfully"));
    }

    @PutMapping("/users/{id}/unlock")
    @Operation(summary = "Unlock a temporarily locked user account (admin override)")
    public ResponseEntity<ApiResponse<?>> unlockUser(@PathVariable UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new BadRequestException("Administrator accounts do not have login lockout applied.");
        }

        loginLockoutService.resetLockout(user);
        log.info("[AdminController] Account {} unlocked by admin.", user.getEmail());

        // Audit log
        User admin = getLoggedInUser();
        String ip = SecurityAuditService.getClientIp(request);
        String ua = request.getHeader("User-Agent");
        securityAuditService.log(admin != null ? admin.getId() : null, admin != null ? admin.getEmail() : "admin@belledonne.in", SecurityAction.ADMIN_UNLOCK_ACCOUNT, ip, ua, "SUCCESS", "Unlocked user account: " + user.getEmail());

        return ResponseEntity.ok(ApiResponse.success("Account unlocked successfully. User can now log in."));
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Update user role")
    public ResponseEntity<ApiResponse<?>> updateUserRole(
        @PathVariable UUID id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        Role newRole = Role.valueOf(body.get("role").toUpperCase());
        Role oldRole = user.getRole();
        user.setRole(newRole);
        userRepository.save(user);

        // Audit log
        User admin = getLoggedInUser();
        String ip = SecurityAuditService.getClientIp(request);
        String ua = request.getHeader("User-Agent");
        securityAuditService.log(admin != null ? admin.getId() : null, admin != null ? admin.getEmail() : "admin@belledonne.in", SecurityAction.ADMIN_ACTION, ip, ua, "SUCCESS", "Updated role of user " + user.getEmail() + " from " + oldRole + " to " + newRole);

        return ResponseEntity.ok(ApiResponse.success("User role updated successfully"));
    }

    // ---- 5E: COUPON MANAGEMENT (Admin) ----
    @GetMapping("/coupons")
    @Operation(summary = "Get all coupons with usage stats")
    public ResponseEntity<ApiResponse<?>> getAllCouponsAdmin() {
        return ResponseEntity.ok(ApiResponse.success("Coupons fetched", couponService.getAllCouponsAdmin()));
    }

    @PostMapping("/coupons")
    @Operation(summary = "Create a new coupon")
    public ResponseEntity<ApiResponse<?>> createCoupon(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Coupon created successfully", couponService.createCoupon(request)));
    }

    @PutMapping("/coupons/{id}")
    @Operation(summary = "Update an existing coupon")
    public ResponseEntity<ApiResponse<?>> updateCoupon(@PathVariable Long id, @Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Coupon updated successfully", couponService.updateCoupon(id, request)));
    }

    @DeleteMapping("/coupons/{id}")
    @Operation(summary = "Delete a coupon")
    public ResponseEntity<ApiResponse<?>> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon deleted successfully"));
    }

    @PutMapping("/coupons/{id}/toggle")
    @Operation(summary = "Toggle active status of a coupon")
    public ResponseEntity<ApiResponse<?>> toggleCoupon(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Coupon status toggled", couponService.toggleCoupon(id)));
    }

    @PutMapping("/coupons/{id}/toggle-home")
    @Operation(summary = "Toggle show on home status of a coupon")
    public ResponseEntity<ApiResponse<?>> toggleShowOnHome(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Coupon show-on-home status toggled", couponService.toggleShowOnHome(id)));
    }

    // ---- 5F: REVIEW MANAGEMENT (Admin) ----
    @GetMapping("/reviews")
    @Operation(summary = "Get filtered reviews list with pagination")
    public ResponseEntity<ApiResponse<?>> getAllReviewsFiltered(
        @RequestParam(required = false) Boolean approved,
        @RequestParam(required = false) UUID productId,
        @RequestParam(required = false) Integer rating,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            "Reviews fetched",
            reviewService.getReviewsAdmin(approved, productId, rating, PageRequest.of(page, size))
        ));
    }

    @GetMapping("/reviews/pending")
    @Operation(summary = "Get all pending (unapproved) reviews")
    public ResponseEntity<ApiResponse<?>> getPendingReviews(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Pending reviews fetched", reviewService.getPendingReviews(PageRequest.of(page, size))));
    }

    @PatchMapping("/reviews/{id}/approve")
    @Operation(summary = "Approve a review")
    public ResponseEntity<ApiResponse<?>> approveReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Review approved", reviewService.approveReview(id, true)));
    }

    @PatchMapping("/reviews/{id}/reject")
    @Operation(summary = "Reject a review")
    public ResponseEntity<ApiResponse<?>> rejectReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Review rejected", reviewService.approveReview(id, false)));
    }

    @DeleteMapping("/reviews/{id}")
    @Operation(summary = "Delete any review")
    public ResponseEntity<ApiResponse<?>> deleteReview(@PathVariable Long id) {
        reviewService.deleteReviewAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully"));
    }

    // ---- 5G: CATEGORY MANAGEMENT (Admin) ----
    @PostMapping("/categories")
    @Operation(summary = "Create a new category")
    public ResponseEntity<ApiResponse<?>> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Category created successfully", categoryService.createCategory(request)));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update an existing category")
    public ResponseEntity<ApiResponse<?>> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", categoryService.updateCategory(id, request)));
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "Delete a category")
    public ResponseEntity<ApiResponse<?>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully"));
    }

    @PutMapping("/categories/{id}/toggle")
    @Operation(summary = "Toggle active status of a category")
    public ResponseEntity<ApiResponse<?>> toggleCategory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Category status toggled", categoryService.toggleCategory(id)));
    }



    // ---- 5H: SALE MANAGEMENT (Admin) ----
    @GetMapping("/sales/settings")
    @Operation(summary = "Get sale banner settings")
    public ResponseEntity<ApiResponse<?>> getSaleSettings() {
        return ResponseEntity.ok(ApiResponse.success("Sale settings fetched", saleSettingsService.getResponse()));
    }

    @PutMapping("/sales/settings")
    @Operation(summary = "Update sale banner settings")
    public ResponseEntity<ApiResponse<?>> updateSaleSettings(@RequestBody SaleSettingsRequest request) {
        SaleSettingsResponse response = saleSettingsService.updateSettings(request);
        return ResponseEntity.ok(ApiResponse.success("Sale settings updated", response));
    }

    @PutMapping("/sales/deal-of-the-day")
    @Operation(summary = "Set the Deal of the Day product")
    public ResponseEntity<ApiResponse<?>> updateDealOfTheDay(@RequestBody Map<String, String> body) {
        String productIdStr = body.get("productId");
        if (productIdStr == null || productIdStr.isBlank()) {
            throw new BadRequestException("productId is required");
        }
        UUID productId = UUID.fromString(productIdStr);
        SaleSettingsResponse response = saleSettingsService.updateDealOfTheDay(productId);
        return ResponseEntity.ok(ApiResponse.success("Deal of the day updated", response));
    }

    @PutMapping("/products/{id}/discount")
    @Operation(summary = "Update product discount and sale status")
    public ResponseEntity<ApiResponse<?>> updateProductDiscount(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Integer discountPercentage = body.containsKey("discountPercentage")
            ? ((Number) body.get("discountPercentage")).intValue() : null;
        Boolean isOnSale = body.containsKey("isOnSale")
            ? (Boolean) body.get("isOnSale") : null;
        ProductResponse response = productService.updateProductDiscount(id, discountPercentage, isOnSale);
        return ResponseEntity.ok(ApiResponse.success("Product discount updated", response));
    }

    @PutMapping("/products/{id}/specifications")
    @Operation(summary = "Update product specifications (dynamic key-value pairs)")
    public ResponseEntity<ApiResponse<?>> updateProductSpecifications(
            @PathVariable UUID id,
            @RequestBody List<com.belledonne.ecommerce.dto.request.ProductRequest.SpecificationDTO> specifications) {
        Product product = productService.getById(id);
        List<com.belledonne.ecommerce.entity.Product.SpecificationEntry> entries = specifications.stream()
            .map(s -> new com.belledonne.ecommerce.entity.Product.SpecificationEntry(s.getKey(), s.getValue(), s.getDisplayOrder()))
            .collect(java.util.stream.Collectors.toList());
        product.setSpecifications(entries);
        Product saved = productService.saveProduct(product);
        return ResponseEntity.ok(ApiResponse.success("Specifications updated successfully", productService.toResponse(saved)));
    }

    // ---- 5G: SECURITY AUDIT LOGS ----
    @GetMapping("/security-logs")
    @Operation(summary = "Get filtered and paginated security audit logs")
    public ResponseEntity<ApiResponse<Page<SecurityAuditLog>>> getSecurityLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) SecurityAction action,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Specification<SecurityAuditLog> spec = SecurityAuditService.getSpec(search, userId, email, ipAddress, action, status, dateFrom, dateTo);

        org.springframework.data.domain.Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        Page<SecurityAuditLog> logs = securityAuditLogRepository.findAll(spec, pageable);

        return ResponseEntity.ok(ApiResponse.success("Security audit logs fetched successfully", logs));
    }

    @GetMapping("/security-logs/stats")
    @Operation(summary = "Get today's security logs summary statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityStats() {
        return ResponseEntity.ok(ApiResponse.success("Security statistics fetched successfully", securityAuditService.getSecurityStats()));
    }

    @GetMapping("/security-logs/export")
    @Operation(summary = "Export filtered security logs to CSV, Excel, or PDF")
    public void exportSecurityLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) SecurityAction action,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "CSV") String format,
            jakarta.servlet.http.HttpServletResponse response) {

        Specification<SecurityAuditLog> spec = SecurityAuditService.getSpec(search, userId, email, ipAddress, action, status, dateFrom, dateTo);
        long totalRecords = securityAuditLogRepository.count(spec);

        // 1. Audit Log the export action
        User admin = getLoggedInUser();
        String clientIp = SecurityAuditService.getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        // Format details for auditing
        StringBuilder detailsBuilder = new StringBuilder("Admin exported security logs in ")
            .append(format).append(" format.");
        List<String> activeFilters = new ArrayList<>();
        if (action != null) activeFilters.add("Action: " + action);
        if (status != null && !status.isBlank()) activeFilters.add("Status: " + status);
        if (dateFrom != null || dateTo != null) {
            activeFilters.add("Date Range: " + (dateFrom != null ? dateFrom : "Any") + " - " + (dateTo != null ? dateTo : "Any"));
        }
        if (email != null && !email.isBlank()) activeFilters.add("Email: " + email);
        if (ipAddress != null && !ipAddress.isBlank()) activeFilters.add("IP: " + ipAddress);
        if (search != null && !search.isBlank()) activeFilters.add("Search: " + search);

        if (!activeFilters.isEmpty()) {
            detailsBuilder.append(" Applied filters: ").append(String.join(", ", activeFilters));
        } else {
            detailsBuilder.append(" No filters applied.");
        }
        detailsBuilder.append(" Total records exported: ").append(totalRecords);

        // Write the audit log entry
        securityAuditService.log(
            admin != null ? admin.getId() : null,
            admin != null ? admin.getEmail() : "admin@belledonne.in",
            SecurityAction.ADMIN_EXPORT_LOGS,
            clientIp,
            userAgent,
            "SUCCESS",
            detailsBuilder.toString()
        );

        // 2. Setup response headers and stream output
        try {
            String filename = "SecurityLogs_" + LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            if ("EXCEL".equalsIgnoreCase(format) || "XLSX".equalsIgnoreCase(format)) {
                response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".xlsx");
                securityLogsExportService.exportLogsToExcel(response.getOutputStream(), spec);
            } else if ("PDF".equalsIgnoreCase(format)) {
                response.setContentType("application/pdf");
                response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".pdf");
                Map<String, String> filterMap = new HashMap<>();
                if (search != null && !search.isBlank()) filterMap.put("Search Query", search);
                if (action != null) filterMap.put("Action Type", action.name());
                if (status != null && !status.isBlank()) filterMap.put("Status", status);
                if (email != null && !email.isBlank()) filterMap.put("Email", email);
                if (ipAddress != null && !ipAddress.isBlank()) filterMap.put("IP Address", ipAddress);
                if (dateFrom != null) filterMap.put("Start Date", dateFrom.toString());
                if (dateTo != null) filterMap.put("End Date", dateTo.toString());
                securityLogsExportService.exportLogsToPdf(response.getOutputStream(), spec, filterMap, totalRecords);
            } else { // Fallback to CSV
                response.setContentType("text/csv");
                response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".csv");
                securityLogsExportService.exportLogsToCsv(response.getOutputStream(), spec);
            }
        } catch (Exception e) {
            log.error("Failed to export security logs: {}", e.getMessage(), e);
            response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            try {
                response.getWriter().write("Export failed: " + e.getMessage());
            } catch (IOException ignored) {}
        }
    }

    @GetMapping("/security-overview")
    @Operation(summary = "Get aggregated security analytics for trend overview charts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityOverview() {
        return ResponseEntity.ok(ApiResponse.success("Security overview analytics fetched successfully", securityAuditService.getCachedSecurityOverview()));
    }

    @GetMapping("/refund-requests")
    @Operation(summary = "Get all refund requests with search and status filters")
    public ResponseEntity<ApiResponse<Page<RefundRequestResponse>>> getRefundRequests(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) RefundStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "requestedAt"));
        Page<RefundRequestResponse> responses = refundRequestService.getRefundRequestsAdmin(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Refund requests fetched successfully", responses));
    }

    @GetMapping("/refund-requests/{id}")
    @Operation(summary = "Get detailed information for a single refund request")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> getRefundRequest(@PathVariable UUID id) {
        RefundRequestResponse response = refundRequestService.getRefundRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Refund request details fetched successfully", response));
    }

    @PostMapping("/refund-requests/{id}/approve")
    @Operation(summary = "Approve a refund request and trigger Razorpay Refund API")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> approveRefund(
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody RefundApprovalRequest request,
            HttpServletRequest httpServletRequest) {
        
        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");
        RefundRequestResponse response = refundRequestService.approveRefund(id, adminPrincipal, request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Refund approved and initiated successfully", response));
    }

    @PostMapping("/refund-requests/{id}/reject")
    @Operation(summary = "Reject a refund request and notify the customer")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> rejectRefund(
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody RefundRejectionRequest request,
            HttpServletRequest httpServletRequest) {
        
        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");
        RefundRequestResponse response = refundRequestService.rejectRefund(id, adminPrincipal, request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Refund request rejected successfully", response));
    }

    @PostMapping("/refund-requests/{id}/retry")
    @Operation(summary = "Retry a failed refund request")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> retryRefund(
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @PathVariable UUID id,
            HttpServletRequest httpServletRequest) {
        
        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");
        RefundRequestResponse response = refundRequestService.retryRefund(id, adminPrincipal, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Refund retried successfully", response));
    }

    @PostMapping("/refund-requests/{id}/mark-paid")
    @Operation(summary = "Mark a COD refund as physically paid to the customer")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> markRefundPaid(
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @PathVariable UUID id,
            HttpServletRequest httpServletRequest) {

        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");
        RefundRequestResponse response = refundRequestService.markRefundPaid(id, adminPrincipal, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Refund marked as paid successfully", response));
    }

    @PostMapping("/refund-requests/{id}/approve-return")
    @Operation(summary = "Approve a return request")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> approveReturn(
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @PathVariable UUID id,
            HttpServletRequest httpServletRequest) {

        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");
        RefundRequestResponse response = refundRequestService.approveReturn(id, adminPrincipal, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Return approved successfully", response));
    }

    @PostMapping("/refund-requests/{id}/schedule-return-pickup")
    @Operation(summary = "Schedule a return courier pickup")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> scheduleReturnPickup(
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @PathVariable UUID id,
            HttpServletRequest httpServletRequest) {

        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");
        RefundRequestResponse response = refundRequestService.scheduleReturnPickup(id, adminPrincipal, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Return pickup scheduled successfully", response));
    }

    @PostMapping("/refund-requests/{id}/mark-returned")
    @Operation(summary = "Mark returned products as received at warehouse")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> markReturned(
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody WarehouseInspectionRequest request,
            HttpServletRequest httpServletRequest) {

        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");
        RefundRequestResponse response = refundRequestService.markReturned(id, adminPrincipal, request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Products marked as returned successfully", response));
    }

    @PostMapping("/refund-requests/{id}/process-refund")
    @Operation(summary = "Process/Complete refund for returned or cancelled order")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> processRefund(
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody RefundApprovalRequest request,
            HttpServletRequest httpServletRequest) {

        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");
        RefundRequestResponse response = refundRequestService.processRefund(id, adminPrincipal, request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Refund processed successfully", response));
    }

    @PostMapping("/refund-requests/{id}/request-payout-details")
    @Operation(summary = "Request UPI/Bank payout details from customer (COD return orders only)")
    public ResponseEntity<ApiResponse<RefundRequestResponse>> requestPayoutDetails(
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @PathVariable UUID id,
            HttpServletRequest httpServletRequest) {

        String ipAddress = SecurityAuditService.getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");
        RefundRequestResponse response = refundRequestService.requestPayoutDetails(id, adminPrincipal, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Payout details requested from customer successfully", response));
    }

    // ---- SHIPROCKET AND SHIPPING SETTINGS ENDPOINTS ----


    @GetMapping("/shipping/settings")
    @Operation(summary = "Get current shipping settings")
    public ResponseEntity<ApiResponse<?>> getShippingSettings() {
        return ResponseEntity.ok(ApiResponse.success("Shipping settings fetched", shippingSettingsService.getOrCreate()));
    }

    @PutMapping("/shipping/settings")
    @Operation(summary = "Update shipping settings")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<?>> updateShippingSettings(
            @RequestBody Map<String, BigDecimal> body, HttpServletRequest httpServletRequest) {
        BigDecimal threshold = body.get("freeShippingThreshold");
        BigDecimal charge = body.get("shippingCharge");
        if (threshold == null || charge == null) {
            throw new BadRequestException("freeShippingThreshold and shippingCharge are required");
        }
        ShippingSettings updated = shippingSettingsService.updateSettings(threshold, charge);
        
        // Audit log
        User admin = getLoggedInUser();
        String ip = SecurityAuditService.getClientIp(httpServletRequest);
        String ua = httpServletRequest.getHeader("User-Agent");
        securityAuditService.log(
            admin != null ? admin.getId() : null,
            admin != null ? admin.getEmail() : "admin@belledonne.in",
            SecurityAction.ADMIN_ACTION,
            ip,
            ua,
            "SUCCESS",
            "Updated shipping settings: freeShippingThreshold=" + threshold + ", shippingCharge=" + charge
        );
        
        return ResponseEntity.ok(ApiResponse.success("Shipping settings updated successfully", updated));
    }

    @PostMapping("/orders/{id}/create-shipment")
    @Operation(summary = "Create Shiprocket shipment for an order")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<?>> createShipment(
            @PathVariable UUID id, HttpServletRequest httpServletRequest) {
        
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Cannot create shipment for order in " + order.getStatus() + " status.");
        }
        
        if (order.getAwbCode() != null || order.getShipmentId() != null) {
            throw new BadRequestException("Shipment has already been created for this order.");
        }
        
        String pickupPincode = "560001"; // Standard warehouse pincode
        String deliveryPincode = order.getAddress().getPincode();
        double weight = 0.5; // default weight
        boolean isCod = order.getPaymentMethod() == PaymentMethod.COD;
        
        ShiprocketService.ServiceabilityResponse serviceability = shiprocketService.checkServiceability(
            pickupPincode, deliveryPincode, weight, isCod
        );
        
        if (serviceability.getAvailableCouriers() == null || serviceability.getAvailableCouriers().isEmpty()) {
            throw new BadRequestException("No serviceable courier found for pincode: " + deliveryPincode);
        }
        
        // Prefer recommended, fallback to highest rated
        ShiprocketService.CourierCompany selectedCourier = null;
        if (serviceability.getRecommendedCourierId() != null) {
            selectedCourier = serviceability.getAvailableCouriers().stream()
                .filter(c -> c.getCourierCompanyId().equals(serviceability.getRecommendedCourierId()))
                .findFirst().orElse(null);
        }
        if (selectedCourier == null) {
            selectedCourier = serviceability.getAvailableCouriers().stream()
                .max(java.util.Comparator.comparingDouble(ShiprocketService.CourierCompany::getRating))
                .orElse(serviceability.getAvailableCouriers().get(0));
        }
        
        // 1. Create Shipment Order on Shiprocket
        ShiprocketService.ShipmentResponse shipmentRes = shiprocketService.createShipment(order);
        order.setShiprocketOrderId(shipmentRes.getShiprocketOrderId());
        order.setShipmentId(shipmentRes.getShipmentId());
        
        // 2. Assign AWB
        ShiprocketService.AwbResponse awbRes = shiprocketService.assignAwb(shipmentRes.getShipmentId(), selectedCourier.getCourierCompanyId());
        order.setAwbCode(awbRes.getAwbCode());
        order.setCourierName(awbRes.getCourierName());
        order.setTrackingUrl("https://shiprocket.co/tracking/" + awbRes.getAwbCode());
        order.setShipmentStatus("AWB Assigned");
        order.setShipmentCreatedAt(LocalDateTime.now());
        
        // Set Order Status to PACKED
        order.setStatus(OrderStatus.PACKED);
        
        order.getTrackingHistory().add(OrderTracking.builder()
            .order(order)
            .status("PACKED")
            .message("Shipment created on Shiprocket. Courier: " + awbRes.getCourierName() + ", AWB: " + awbRes.getAwbCode())
            .build());
        
        Order saved = orderRepository.save(order);
        
        // Audit log
        User admin = getLoggedInUser();
        String ip = SecurityAuditService.getClientIp(httpServletRequest);
        String ua = httpServletRequest.getHeader("User-Agent");
        securityAuditService.log(
            admin != null ? admin.getId() : null,
            admin != null ? admin.getEmail() : "admin@belledonne.in",
            SecurityAction.ADMIN_ACTION,
            ip,
            ua,
            "SUCCESS",
            "Created Shiprocket shipment for order: " + order.getOrderNumber() + ", AWB: " + awbRes.getAwbCode()
        );
        
        // Send Shipment Created Email
        try {
            emailService.sendShipmentCreatedEmail(saved.getUser().getEmail(), saved);
            notificationService.createNotification(saved.getUser().getId(), "Shipment Created 📦",
                "Your order " + saved.getOrderNumber() + " has been packed and tracking code generated.",
                com.belledonne.ecommerce.enums.NotificationType.ORDER_CONFIRMED, "/profile/orders");
        } catch (Exception e) {
            log.error("Failed to send shipment confirmation email/notification: {}", e.getMessage());
        }
        
        return ResponseEntity.ok(ApiResponse.success("Shipment created successfully", orderService.toResponse(saved)));
    }

    @PostMapping("/orders/{id}/request-pickup")
    @Operation(summary = "Request courier pickup for a shipment")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<?>> requestPickup(
            @PathVariable UUID id, HttpServletRequest httpServletRequest) {
        
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        
        if (order.getShipmentId() == null) {
            throw new BadRequestException("Shipment has not been created yet.");
        }
        
        boolean success = shiprocketService.requestPickup(order.getShipmentId());
        if (!success) {
            throw new BadRequestException("Failed to request pickup from Shiprocket. Please check Shiprocket panel.");
        }
        
        order.setShipmentStatus("Pickup Scheduled");
        order.getTrackingHistory().add(OrderTracking.builder()
            .order(order)
            .status("PROCESSING")
            .message("Pickup request generated and scheduled with courier partner.")
            .build());
        
        Order saved = orderRepository.save(order);
        
        // Audit log
        User admin = getLoggedInUser();
        String ip = SecurityAuditService.getClientIp(httpServletRequest);
        String ua = httpServletRequest.getHeader("User-Agent");
        securityAuditService.log(
            admin != null ? admin.getId() : null,
            admin != null ? admin.getEmail() : "admin@belledonne.in",
            SecurityAction.ADMIN_ACTION,
            ip,
            ua,
            "SUCCESS",
            "Requested carrier pickup for order: " + order.getOrderNumber()
        );
        
        return ResponseEntity.ok(ApiResponse.success("Pickup requested successfully", orderService.toResponse(saved)));
    }

    @PostMapping("/orders/{id}/cancel-shipment")
    @Operation(summary = "Cancel Shiprocket shipment and set order status to CANCELLED")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<?>> cancelShipment(
            @PathVariable UUID id, HttpServletRequest httpServletRequest) {
        
        User admin = getLoggedInUser();
        String adminEmail = admin != null ? admin.getEmail() : "admin@belledonne.in";
        OrderResponse res = orderService.cancelShipmentAdmin(id, adminEmail);
        
        // Audit log
        String ip = SecurityAuditService.getClientIp(httpServletRequest);
        String ua = httpServletRequest.getHeader("User-Agent");
        securityAuditService.log(
            admin != null ? admin.getId() : null,
            adminEmail,
            SecurityAction.ADMIN_ACTION,
            ip,
            ua,
            "SUCCESS",
            "Cancelled shipment and order for order ID: " + id
        );
        
        return ResponseEntity.ok(ApiResponse.success("Shipment and order cancelled successfully", res));
    }

    @GetMapping("/orders/{id}/track")
    @Operation(summary = "Fetch tracking update for a shipment")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<?>> trackShipment(
            @PathVariable UUID id, HttpServletRequest httpServletRequest) {
        
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        
        if (order.getAwbCode() == null) {
            throw new BadRequestException("No AWB code associated with this order.");
        }
        
        ShiprocketService.TrackingData trackingData = shiprocketService.trackShipment(order.getAwbCode());
        if (trackingData == null) {
            throw new BadRequestException("Unable to retrieve tracking details from Shiprocket.");
        }
        
        OrderResponse updated = orderService.syncOrderTrackingStatus(
            order.getAwbCode(),
            trackingData.getStatus(),
            trackingData.getLatestEvent(),
            trackingData.getEstimatedDelivery()
        );
        
        return ResponseEntity.ok(ApiResponse.success("Tracking updated", updated));
    }

    private User getLoggedInUser() {
        org.springframework.security.core.context.SecurityContext context = org.springframework.security.core.context.SecurityContextHolder.getContext();
        if (context.getAuthentication() != null && context.getAuthentication().getPrincipal() instanceof UserPrincipal) {
            UserPrincipal principal = (UserPrincipal) context.getAuthentication().getPrincipal();
            return userRepository.findById(principal.getId()).orElse(null);
        }
        return null;
    }


    // ══════════════════════════════════════════════════════════════════════════
    // ---- REPORTS EXPORT ----
    // ══════════════════════════════════════════════════════════════════════════

    @GetMapping("/reports/orders/export")
    @Operation(summary = "Export orders as CSV or Excel")
    public void exportOrders(
        @RequestParam(defaultValue = "csv") String format,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String status,
        jakarta.servlet.http.HttpServletResponse httpResponse) throws Exception {

        LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDt   = to   != null ? to.atTime(LocalTime.MAX) : null;
        OrderStatus statusFilter = status != null && !status.isBlank()
            ? OrderStatus.valueOf(status.toUpperCase()) : null;

        if ("xlsx".equalsIgnoreCase(format)) {
            httpResponse.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            httpResponse.setHeader("Content-Disposition", "attachment; filename=\"orders.xlsx\"");
            reportsExportService.exportOrdersToExcel(httpResponse.getOutputStream(), fromDt, toDt, statusFilter);
        } else {
            httpResponse.setContentType("text/csv");
            httpResponse.setHeader("Content-Disposition", "attachment; filename=\"orders.csv\"");
            reportsExportService.exportOrdersToCsv(httpResponse.getOutputStream(), fromDt, toDt, statusFilter);
        }
    }

    @GetMapping("/reports/refunds/export")
    @Operation(summary = "Export refund requests as CSV or Excel")
    public void exportRefunds(
        @RequestParam(defaultValue = "csv") String format,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String status,
        jakarta.servlet.http.HttpServletResponse httpResponse) throws Exception {

        LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDt   = to   != null ? to.atTime(LocalTime.MAX) : null;
        RefundStatus statusFilter = status != null && !status.isBlank()
            ? RefundStatus.valueOf(status.toUpperCase()) : null;

        if ("xlsx".equalsIgnoreCase(format)) {
            httpResponse.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            httpResponse.setHeader("Content-Disposition", "attachment; filename=\"refunds.xlsx\"");
            reportsExportService.exportRefundsToExcel(httpResponse.getOutputStream(), fromDt, toDt, statusFilter);
        } else {
            httpResponse.setContentType("text/csv");
            httpResponse.setHeader("Content-Disposition", "attachment; filename=\"refunds.csv\"");
            reportsExportService.exportRefundsToCsv(httpResponse.getOutputStream(), fromDt, toDt, statusFilter);
        }
    }

    @GetMapping("/reports/inventory/export")
    @Operation(summary = "Export inventory snapshot as CSV or Excel")
    public void exportInventory(
        @RequestParam(defaultValue = "csv") String format,
        jakarta.servlet.http.HttpServletResponse httpResponse) throws Exception {

        if ("xlsx".equalsIgnoreCase(format)) {
            httpResponse.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            httpResponse.setHeader("Content-Disposition", "attachment; filename=\"inventory.xlsx\"");
            reportsExportService.exportInventoryToExcel(httpResponse.getOutputStream());
        } else {
            httpResponse.setContentType("text/csv");
            httpResponse.setHeader("Content-Disposition", "attachment; filename=\"inventory.csv\"");
            reportsExportService.exportInventoryToCsv(httpResponse.getOutputStream());
        }
    }

    @GetMapping("/reports/customers/export")
    @Operation(summary = "Export customers as CSV or Excel")
    public void exportCustomers(
        @RequestParam(defaultValue = "csv") String format,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        jakarta.servlet.http.HttpServletResponse httpResponse) throws Exception {

        LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDt   = to   != null ? to.atTime(LocalTime.MAX) : null;

        if ("xlsx".equalsIgnoreCase(format)) {
            httpResponse.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            httpResponse.setHeader("Content-Disposition", "attachment; filename=\"customers.xlsx\"");
            reportsExportService.exportCustomersToExcel(httpResponse.getOutputStream(), fromDt, toDt);
        } else {
            httpResponse.setContentType("text/csv");
            httpResponse.setHeader("Content-Disposition", "attachment; filename=\"customers.csv\"");
            reportsExportService.exportCustomersToCsv(httpResponse.getOutputStream(), fromDt, toDt);
        }
    }

    @lombok.Data
    public static class DeliveryProofUpdateRequest {
        private String deliveryRemarks;
        private String receiverName;
        private String deliveryConfirmationDetails;
        private String proofOfDeliveryUrl;
    }

    @PutMapping("/orders/{id}/delivery-proof")
    @Operation(summary = "Manually enter or override delivery proof details for an order")
    public ResponseEntity<ApiResponse<OrderResponse>> updateDeliveryProof(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal adminPrincipal,
            @RequestBody DeliveryProofUpdateRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        order.setDeliveryTimestamp(LocalDateTime.now());
        order.setCourierDeliveryRemarks(request.getDeliveryRemarks());
        order.setReceiverName(request.getReceiverName());
        order.setDeliveryConfirmationDetails(request.getDeliveryConfirmationDetails());
        order.setProofOfDeliveryUrl(request.getProofOfDeliveryUrl());
        
        // If status was OUT_FOR_DELIVERY or SHIPPED, update it to DELIVERED
        if (order.getStatus() != OrderStatus.DELIVERED) {
            order.setStatus(OrderStatus.DELIVERED);
            order.setDeliveredAt(LocalDateTime.now());
            // Audit and notify
            auditLogService.log(adminPrincipal.getEmail(), "SHIPMENT_DELIVERED",
                    "Order " + order.getOrderNumber() + " manually marked delivered. Receiver: " + request.getReceiverName(),
                    order.getId().toString(), null);
        } else {
            auditLogService.log(adminPrincipal.getEmail(), "SHIPMENT_UPDATED",
                    "Order " + order.getOrderNumber() + " delivery proof updated manually.",
                    order.getId().toString(), null);
        }

        orderRepository.save(order);
        return ResponseEntity.ok(ApiResponse.success("Delivery proof updated successfully", orderService.toResponse(order)));
    }

    @GetMapping("/analytics/reports")
    @Operation(summary = "Get aggregated reports (revenue, collections, return rates, delivery success)")
    public ResponseEntity<ApiResponse<?>> getAnalyticsReports(@RequestParam(defaultValue = "daily") String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from;
        if ("weekly".equalsIgnoreCase(period)) {
            from = now.minusWeeks(4).with(LocalTime.MIN);
        } else if ("monthly".equalsIgnoreCase(period)) {
            from = now.minusMonths(6).with(LocalTime.MIN);
        } else { // default to daily (last 7 days)
            from = now.minusDays(7).with(LocalTime.MIN);
        }

        List<Order> orders = orderRepository.findAll((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from));
        List<RefundRequest> refunds = refundRequestRepository.findAll((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("requestedAt"), from));

        DateTimeFormatter formatter;
        if ("weekly".equalsIgnoreCase(period)) {
            formatter = DateTimeFormatter.ofPattern("yyyy-'W'ww");
        } else if ("monthly".equalsIgnoreCase(period)) {
            formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        } else {
            formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        }

        Map<String, Map<String, Object>> reportMap = new LinkedHashMap<>();
        
        // Initialize buckets
        LocalDateTime temp = from;
        while (temp.isBefore(now) || temp.isEqual(now)) {
            String key = temp.format(formatter);
            if (!reportMap.containsKey(key)) {
                Map<String, Object> bucket = new LinkedHashMap<>();
                bucket.put("period", key);
                bucket.put("revenue", BigDecimal.ZERO);
                bucket.put("codCollections", BigDecimal.ZERO);
                bucket.put("razorpayCollections", BigDecimal.ZERO);
                bucket.put("shippingCosts", BigDecimal.ZERO);
                bucket.put("refunds", BigDecimal.ZERO);
                bucket.put("ordersCount", 0L);
                bucket.put("returnsCount", 0L);
                bucket.put("rtoCount", 0L);
                bucket.put("deliveredCount", 0L);
                bucket.put("cancelledCount", 0L);
                reportMap.put(key, bucket);
            }
            if ("weekly".equalsIgnoreCase(period)) {
                temp = temp.plusWeeks(1);
            } else if ("monthly".equalsIgnoreCase(period)) {
                temp = temp.plusMonths(1);
            } else {
                temp = temp.plusDays(1);
            }
        }

        for (Order o : orders) {
            String key = o.getCreatedAt().format(formatter);
            Map<String, Object> bucket = reportMap.get(key);
            if (bucket == null) continue;
            
            bucket.put("ordersCount", (long) bucket.get("ordersCount") + 1);
            
            if (o.getStatus() != OrderStatus.CANCELLED) {
                bucket.put("revenue", ((BigDecimal) bucket.get("revenue")).add(o.getTotalAmount()));
            } else {
                bucket.put("cancelledCount", (long) bucket.get("cancelledCount") + 1);
            }
            
            if (o.getShippingCharge() != null) {
                bucket.put("shippingCosts", ((BigDecimal) bucket.get("shippingCosts")).add(o.getShippingCharge()));
            }
            
            if (o.getPaymentMethod() == PaymentMethod.COD) {
                if (o.getStatus() == OrderStatus.DELIVERED || o.getPaymentStatus() == PaymentStatus.PAID) {
                    bucket.put("codCollections", ((BigDecimal) bucket.get("codCollections")).add(o.getTotalAmount()));
                }
            } else {
                if (o.getPaymentStatus() == PaymentStatus.SUCCESS || o.getPaymentStatus() == PaymentStatus.PAID) {
                    bucket.put("razorpayCollections", ((BigDecimal) bucket.get("razorpayCollections")).add(o.getTotalAmount()));
                }
            }
            
            if (o.getStatus() == OrderStatus.DELIVERED) {
                bucket.put("deliveredCount", (long) bucket.get("deliveredCount") + 1);
            }
            
            if (o.getStatus() == OrderStatus.RETURNED) {
                boolean isRto = !refundRequestRepository.findByOrderId(o.getId()).isPresent();
                if (isRto) {
                    bucket.put("rtoCount", (long) bucket.get("rtoCount") + 1);
                } else {
                    bucket.put("returnsCount", (long) bucket.get("returnsCount") + 1);
                }
            } else if (o.getShipmentStatus() != null && o.getShipmentStatus().toLowerCase().contains("rto")) {
                bucket.put("rtoCount", (long) bucket.get("rtoCount") + 1);
            }
        }

        for (RefundRequest rr : refunds) {
            String key = rr.getRequestedAt().format(formatter);
            Map<String, Object> bucket = reportMap.get(key);
            if (bucket == null) continue;
            
            if (rr.getRefundStatus() == RefundStatus.REFUNDED || rr.getRefundStatus() == RefundStatus.REFUND_INITIATED) {
                bucket.put("refunds", ((BigDecimal) bucket.get("refunds")).add(rr.getRefundAmount()));
            }
        }

        for (Map<String, Object> bucket : reportMap.values()) {
            long total = (long) bucket.get("ordersCount");
            long returns = (long) bucket.get("returnsCount");
            long rto = (long) bucket.get("rtoCount");
            long delivered = (long) bucket.get("deliveredCount");
            long cancelled = (long) bucket.get("cancelledCount");
            
            double returnRate = total > 0 ? (double) returns * 100.0 / total : 0.0;
            double rtoRate = total > 0 ? (double) rto * 100.0 / total : 0.0;
            
            long deliverable = total - cancelled;
            double deliverySuccessRate = deliverable > 0 ? (double) delivered * 100.0 / deliverable : 0.0;
            
            bucket.put("returnRate", returnRate);
            bucket.put("rtoRate", rtoRate);
            bucket.put("deliverySuccessRate", deliverySuccessRate);
        }

        return ResponseEntity.ok(ApiResponse.success("Reports analytics fetched successfully", reportMap.values()));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get logistics operations audit trail logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "timestamp"));
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("adminUser")), pattern),
                    cb.like(cb.lower(root.get("notes")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<AuditLog> logs = auditLogRepository.findAll(spec, pageable);
        return ResponseEntity.ok(ApiResponse.success("Audit logs fetched successfully", logs));
    }

}
