package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.*;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.dto.response.OrderResponse;
import com.belledonne.ecommerce.dto.response.ProductResponse;
import com.belledonne.ecommerce.dto.response.SaleSettingsResponse;
import com.belledonne.ecommerce.entity.*;
import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.enums.PaymentMethod;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CouponService couponService;
    private final ReviewService reviewService;
    private final OrderService orderService;
    private final ProductService productService;
    private final CategoryService categoryService;
    private final OrderTrackingService orderTrackingService;
    private final FileUploadService fileUploadService;
    private final SaleSettingsService saleSettingsService;

    // ---- 5A: ADMIN DASHBOARD ----
    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard statistics")
    public ResponseEntity<ApiResponse<?>> dashboard() {
        long totalOrders = orderRepository.count();
        long totalUsers = userRepository.count();
        long totalProducts = productRepository.count();
        BigDecimal totalRevenue = orderRepository.getTotalRevenue();

        long pendingOrders = orderRepository.countByStatus(OrderStatus.PLACED);
        LocalDateTime midnight = LocalDateTime.now().with(LocalTime.MIN);
        long ordersToday = orderRepository.countOrdersFrom(midnight);
        BigDecimal revenueToday = orderRepository.getRevenueSince(midnight);
        long lowStockProducts = productRepository.countByStockQuantityLessThan(10);

        List<OrderResponse> recentOrders = orderRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
            .getContent()
            .stream()
            .map(orderService::toResponse)
            .collect(Collectors.toList());

        List<Object[]> topSelling = orderItemRepository.getTopSellingProducts(PageRequest.of(0, 5));
        List<Map<String, Object>> topProducts = topSelling.stream().map(row -> Map.of(
            "productId", row[0] != null ? row[0].toString() : "",
            "productName", row[1] != null ? row[1].toString() : "",
            "totalSold", row[2] != null ? row[2] : 0
        )).collect(Collectors.toList());

        Map<String, Long> orderStatusBreakdown = new HashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            orderStatusBreakdown.put(status.name(), orderRepository.countByStatus(status));
        }

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
                "month", m.getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH),
                "revenue", monthlySums.getOrDefault(m, BigDecimal.ZERO)
            ));
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalOrders", totalOrders);
        stats.put("totalUsers", totalUsers);
        stats.put("totalProducts", totalProducts);
        stats.put("pendingOrders", pendingOrders);
        stats.put("ordersToday", ordersToday);
        stats.put("revenueToday", revenueToday);
        stats.put("lowStockProducts", lowStockProducts);
        stats.put("recentOrders", recentOrders);
        stats.put("topProducts", topProducts);
        stats.put("orderStatusBreakdown", orderStatusBreakdown);
        stats.put("monthlyRevenue", monthlyRevenueList);

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
    public ResponseEntity<ApiResponse<?>> getAllOrdersFiltered(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
        @RequestParam(required = false) String paymentMethod,
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
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<OrderResponse> orders = orderRepository.findAll(spec, PageRequest.of(page, size))
            .map(orderService::toResponse);

        return ResponseEntity.ok(ApiResponse.success("Filtered orders fetched", orders));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Get details of any order")
    public ResponseEntity<ApiResponse<?>> getOrderDetails(@PathVariable UUID id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return ResponseEntity.ok(ApiResponse.success("Order details fetched", orderService.toResponse(order)));
    }

    @PutMapping("/orders/{id}/status")
    @Operation(summary = "Update status of an order")
    public ResponseEntity<ApiResponse<?>> updateOrderStatus(
        @PathVariable UUID id, @RequestBody Map<String, String> body) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        OrderStatus newStatus = OrderStatus.valueOf(body.get("status").toUpperCase());
        order.setStatus(newStatus);

        OrderTracking tracking = OrderTracking.builder()
            .order(order)
            .status(newStatus.name())
            .message(body.getOrDefault("note", "Order status updated to " + newStatus.name()))
            .build();
        order.getTrackingHistory().add(tracking);

        if (newStatus == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(ApiResponse.success("Order status updated", orderService.toResponse(saved)));
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
    @Operation(summary = "Get filtered users list with pagination")
    public ResponseEntity<ApiResponse<?>> getAllUsersFiltered(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) Boolean isBlocked,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("phone")), pattern)
                ));
            }
            if (role != null && !role.isBlank()) {
                predicates.add(cb.equal(root.get("role"), Role.valueOf(role.toUpperCase())));
            }
            if (isBlocked != null) {
                predicates.add(cb.equal(root.get("isBlocked"), isBlocked));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> users = userRepository.findAll(spec, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Users fetched successfully", users));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get details of user including order history and spent sum")
    public ResponseEntity<ApiResponse<?>> getUserDetails(@PathVariable UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        List<Order> userOrders = orderRepository.findAll((root, query, cb) -> cb.equal(root.get("user").get("id"), id));
        BigDecimal totalSpent = userOrders.stream()
            .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
            .map(Order::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> data = new HashMap<>();
        data.put("user", user);
        data.put("orders", userOrders.stream().map(orderService::toResponse).collect(Collectors.toList()));
        data.put("totalSpent", totalSpent);

        return ResponseEntity.ok(ApiResponse.success("User details fetched", data));
    }

    @PutMapping("/users/{id}/block")
    @Operation(summary = "Block or unblock a user")
    public ResponseEntity<ApiResponse<?>> blockUser(
        @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        boolean block = (Boolean) body.getOrDefault("blocked", true);
        String reason = (String) body.get("reason");

        user.setIsBlocked(block);
        user.setBlockedReason(block ? reason : null);
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success(block ? "User blocked successfully" : "User unblocked successfully"));
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Update user role")
    public ResponseEntity<ApiResponse<?>> updateUserRole(
        @PathVariable UUID id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        Role newRole = Role.valueOf(body.get("role").toUpperCase());
        user.setRole(newRole);
        userRepository.save(user);

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

    @PutMapping("/reviews/{id}/approve")
    @Operation(summary = "Approve or reject a review")
    public ResponseEntity<ApiResponse<?>> approveReview(
        @PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        boolean approve = body.getOrDefault("approved", true);
        return ResponseEntity.ok(ApiResponse.success("Review status updated", reviewService.approveReview(id, approve)));
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
}
