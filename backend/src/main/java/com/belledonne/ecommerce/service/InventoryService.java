package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.InventoryAdjustmentRequest;
import com.belledonne.ecommerce.dto.response.InventoryReportResponse;
import com.belledonne.ecommerce.dto.response.InventoryResponse;
import com.belledonne.ecommerce.entity.*;
import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.enums.SecurityAction;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class InventoryService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryHistoryRepository inventoryHistoryRepository;
    private final OrderRepository orderRepository;
    private final SecurityAuditService securityAuditService;

    /**
     * Deducts inventory stock during checkout. Throws BadRequestException if stock is insufficient.
     */
    public void deductStock(Order order) {
        log.info("[InventoryService] Deducting stock for order: {}", order.getOrderNumber());
        
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product == null) {
                // Should not happen for valid orders
                continue;
            }

            if (item.getVariant() != null) {
                // Deduct from variant
                ProductVariant variant = productVariantRepository.findById(item.getVariant().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", item.getVariant().getId()));

                if (variant.getStockQuantity() < item.getQuantity()) {
                    throw new BadRequestException("Insufficient stock for product variant " 
                        + product.getName() + " (" + variant.getColor() + " / " + variant.getSize() + "). "
                        + "Available: " + variant.getStockQuantity() + ", Requested: " + item.getQuantity());
                }

                int oldStock = variant.getStockQuantity();
                variant.setStockQuantity(oldStock - item.getQuantity());
                productVariantRepository.save(variant);

                // Keep product aggregate stock in sync
                product.setStockQuantity(Math.max(0, product.getStockQuantity() - item.getQuantity()));
                if (product.getStockQuantity() <= 0) {
                    product.setInStock(false);
                }
                productRepository.save(product);

                // Log ledger entry
                InventoryHistory history = InventoryHistory.builder()
                    .product(product)
                    .variant(variant)
                    .quantityChanged(-item.getQuantity())
                    .resultingStock(variant.getStockQuantity())
                    .actionType("ORDER_PLACED")
                    .notes("Deducted for Order " + order.getOrderNumber())
                    .changedBy(order.getUser().getEmail())
                    .build();
                inventoryHistoryRepository.save(history);

                log.info("[InventoryService] Deducted {} units of variant ID {} (new stock: {})", 
                    item.getQuantity(), variant.getId(), variant.getStockQuantity());
            } else {
                // Deduct from product-level stock
                if (product.getStockQuantity() < item.getQuantity()) {
                    throw new BadRequestException("Insufficient stock for product " + product.getName() + ". "
                        + "Available: " + product.getStockQuantity() + ", Requested: " + item.getQuantity());
                }

                int oldStock = product.getStockQuantity();
                product.setStockQuantity(oldStock - item.getQuantity());
                if (product.getStockQuantity() <= 0) {
                    product.setInStock(false);
                }
                productRepository.save(product);

                // Log ledger entry
                InventoryHistory history = InventoryHistory.builder()
                    .product(product)
                    .quantityChanged(-item.getQuantity())
                    .resultingStock(product.getStockQuantity())
                    .actionType("ORDER_PLACED")
                    .notes("Deducted for Order " + order.getOrderNumber())
                    .changedBy(order.getUser().getEmail())
                    .build();
                inventoryHistoryRepository.save(history);

                log.info("[InventoryService] Deducted {} units of product ID {} (new stock: {})", 
                    item.getQuantity(), product.getId(), product.getStockQuantity());
            }
        }
    }

    /**
     * Restores stock for a cancelled order or refund request. Fully idempotent.
     */
    public void restoreStock(Order order, String actionType, String changedBy) {
        if (order.isStockRestored()) {
            log.info("[InventoryService] Stock already restored for order {}, skipping", order.getOrderNumber());
            return;
        }

        log.info("[InventoryService] Restoring stock for order {} via {}", order.getOrderNumber(), actionType);

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product == null) {
                continue;
            }

            if (item.getVariant() != null) {
                // Restore variant stock
                ProductVariant variant = productVariantRepository.findById(item.getVariant().getId()).orElse(null);
                if (variant != null) {
                    variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
                    productVariantRepository.save(variant);

                    // Sync product aggregate
                    product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                    product.setInStock(true);
                    productRepository.save(product);

                    // Log ledger entry
                    InventoryHistory history = InventoryHistory.builder()
                        .product(product)
                        .variant(variant)
                        .quantityChanged(item.getQuantity())
                        .resultingStock(variant.getStockQuantity())
                        .actionType(actionType)
                        .notes("Restored from Order " + order.getOrderNumber())
                        .changedBy(changedBy)
                        .build();
                    inventoryHistoryRepository.save(history);
                }
            } else {
                // Restore product-level stock
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                product.setInStock(true);
                productRepository.save(product);

                // Log ledger entry
                InventoryHistory history = InventoryHistory.builder()
                    .product(product)
                    .quantityChanged(item.getQuantity())
                    .resultingStock(product.getStockQuantity())
                    .actionType(actionType)
                    .notes("Restored from Order " + order.getOrderNumber())
                    .changedBy(changedBy)
                    .build();
                inventoryHistoryRepository.save(history);
            }
        }

        order.setStockRestored(true);
        orderRepository.save(order);
    }

    /**
     * Manually adjusts stock of a product or variant (Admin only).
     */
    public InventoryResponse adjustStock(InventoryAdjustmentRequest request, String adminEmail, String ipAddress, String userAgent) {
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        int oldStock;
        int newStock = request.getNewQuantity();
        int diff;
        InventoryResponse response;

        if (request.getVariantId() != null) {
            ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", request.getVariantId()));

            oldStock = variant.getStockQuantity();
            diff = newStock - oldStock;

            variant.setStockQuantity(newStock);
            productVariantRepository.save(variant);

            // Sync aggregate product stock
            product.setStockQuantity(Math.max(0, product.getStockQuantity() + diff));
            product.setInStock(product.getStockQuantity() > 0);
            productRepository.save(product);

            // Log ledger entry
            InventoryHistory history = InventoryHistory.builder()
                .product(product)
                .variant(variant)
                .quantityChanged(diff)
                .resultingStock(newStock)
                .actionType("MANUAL_ADJUSTMENT")
                .notes(request.getNotes())
                .changedBy(adminEmail)
                .build();
            inventoryHistoryRepository.save(history);

            response = toResponse(product, variant);
        } else {
            oldStock = product.getStockQuantity();
            diff = newStock - oldStock;

            product.setStockQuantity(newStock);
            product.setInStock(newStock > 0);
            productRepository.save(product);

            // Log ledger entry
            InventoryHistory history = InventoryHistory.builder()
                .product(product)
                .quantityChanged(diff)
                .resultingStock(newStock)
                .actionType("MANUAL_ADJUSTMENT")
                .notes(request.getNotes())
                .changedBy(adminEmail)
                .build();
            inventoryHistoryRepository.save(history);

            response = toResponse(product, null);
        }

        // Security Audit Log
        securityAuditService.log(
            null,
            adminEmail,
            SecurityAction.INVENTORY_ADJUSTED,
            ipAddress,
            userAgent,
            "SUCCESS",
            "Manual stock adjustment for product " + product.getName() 
                + (request.getVariantId() != null ? " (Variant ID " + request.getVariantId() + ")" : "")
                + " | Changed: " + (diff >= 0 ? "+" : "") + diff + " units | New stock: " + newStock
        );

        return response;
    }

    /**
     * Lists inventory items with filters and search for the dashboard.
     */
    @Transactional(readOnly = true)
    public Page<InventoryResponse> getInventoryList(String search, Boolean lowStock, Boolean outOfStock, Pageable pageable) {
        // Since products can have variants, we want to represent each inventory unit (either base product or variant)
        // Let's load the products that match the search query
        List<Product> products;
        if (search != null && !search.isBlank()) {
            products = productRepository.findByNameContainingIgnoreCase(search.trim());
        } else {
            products = productRepository.findAll();
        }

        List<InventoryResponse> responses = new ArrayList<>();

        for (Product product : products) {
            String image = product.getImages() != null && product.getImages().length > 0 ? product.getImages()[0] : null;
            int threshold = product.getLowStockThreshold() != null ? product.getLowStockThreshold() : 5;
            if (product.getVariants() != null && !product.getVariants().isEmpty()) {
                for (ProductVariant variant : product.getVariants()) {
                    boolean isLow = variant.getStockQuantity() <= threshold;
                    boolean isOut = variant.getStockQuantity() == 0;

                    if ((lowStock == null || !lowStock || isLow) && (outOfStock == null || !outOfStock || isOut)) {
                        responses.add(InventoryResponse.builder()
                            .productId(product.getId())
                            .productName(product.getName())
                            .slug(product.getSlug())
                            .productImage(image)
                            .variantId(variant.getId())
                            .size(variant.getSize())
                            .color(variant.getColor())
                            .stockQuantity(variant.getStockQuantity())
                            .lowStockThreshold(threshold)
                            .isLowStock(isLow)
                            .isOutOfStock(isOut)
                            .build());
                    }
                }
            } else {
                boolean isLow = product.getStockQuantity() <= threshold;
                boolean isOut = product.getStockQuantity() == 0;

                if ((lowStock == null || !lowStock || isLow) && (outOfStock == null || !outOfStock || isOut)) {
                    responses.add(InventoryResponse.builder()
                        .productId(product.getId())
                        .productName(product.getName())
                        .slug(product.getSlug())
                        .productImage(image)
                        .stockQuantity(product.getStockQuantity())
                        .lowStockThreshold(threshold)
                        .isLowStock(isLow)
                        .isOutOfStock(isOut)
                        .build());
                }
            }
        }

        // Apply manual in-memory pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), responses.size());
        
        List<InventoryResponse> subList = start < responses.size() ? responses.subList(start, end) : new ArrayList<>();
        return new PageImpl<>(subList, pageable, responses.size());
    }

    /**
     * Aggregates total stock, reserved stock, and sold stock.
     */
    @Transactional(readOnly = true)
    public InventoryReportResponse getInventoryReports() {
        // Current Stock = sum of stock of all products/variants
        long currentStock = productRepository.findAll().stream()
            .mapToLong(p -> {
                if (p.getVariants() != null && !p.getVariants().isEmpty()) {
                    return p.getVariants().stream().mapToLong(ProductVariant::getStockQuantity).sum();
                } else {
                    return p.getStockQuantity();
                }
            }).sum();

        // Reserved Stock = sum of quantity in PLACED, CONFIRMED, PACKED orders
        List<OrderStatus> reservedStatuses = List.of(OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PACKED, OrderStatus.PROCESSING);
        long reservedStock = orderRepository.findByStatusIn(reservedStatuses).stream()
            .flatMap(o -> o.getItems().stream())
            .mapToLong(OrderItem::getQuantity).sum();

        // Sold Stock = sum of quantity in SHIPPED, DELIVERED orders
        List<OrderStatus> soldStatuses = List.of(OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED);
        long soldStock = orderRepository.findByStatusIn(soldStatuses).stream()
            .flatMap(o -> o.getItems().stream())
            .mapToLong(OrderItem::getQuantity).sum();

        // Count of low stock and out of stock inventory units
        long lowStockCount = 0;
        long outOfStockCount = 0;

        for (Product product : productRepository.findAll()) {
            int threshold = product.getLowStockThreshold() != null ? product.getLowStockThreshold() : 5;
            if (product.getVariants() != null && !product.getVariants().isEmpty()) {
                for (ProductVariant variant : product.getVariants()) {
                    if (variant.getStockQuantity() == 0) {
                        outOfStockCount++;
                    } else if (variant.getStockQuantity() <= threshold) {
                        lowStockCount++;
                    }
                }
            } else {
                if (product.getStockQuantity() == 0) {
                    outOfStockCount++;
                } else if (product.getStockQuantity() <= threshold) {
                    lowStockCount++;
                }
            }
        }

        return InventoryReportResponse.builder()
            .currentStock(currentStock)
            .reservedStock(reservedStock)
            .soldStock(soldStock)
            .lowStockCount(lowStockCount)
            .outOfStockCount(outOfStockCount)
            .build();
    }

    private InventoryResponse toResponse(Product product, ProductVariant variant) {
        String image = product.getImages() != null && product.getImages().length > 0 ? product.getImages()[0] : null;
        int threshold = product.getLowStockThreshold() != null ? product.getLowStockThreshold() : 5;
        if (variant != null) {
            return InventoryResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .slug(product.getSlug())
                .productImage(image)
                .variantId(variant.getId())
                .size(variant.getSize())
                .color(variant.getColor())
                .stockQuantity(variant.getStockQuantity())
                .lowStockThreshold(threshold)
                .isLowStock(variant.getStockQuantity() <= threshold)
                .isOutOfStock(variant.getStockQuantity() == 0)
                .build();
        } else {
            return InventoryResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .slug(product.getSlug())
                .productImage(image)
                .stockQuantity(product.getStockQuantity())
                .lowStockThreshold(threshold)
                .isLowStock(product.getStockQuantity() <= threshold)
                .isOutOfStock(product.getStockQuantity() == 0)
                .build();
        }
    }
}
