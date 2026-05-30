package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.Order;
import com.belledonne.ecommerce.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {
    Page<Order> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    boolean existsByUserIdAndCouponCodeIgnoreCaseAndStatusNot(UUID userId, String couponCode, OrderStatus status);
    Optional<Order> findByOrderNumber(String orderNumber);
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    long countByStatus(OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :from")
    long countOrdersFrom(LocalDateTime from);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'DELIVERED'")
    BigDecimal getTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt >= :from AND o.status <> 'CANCELLED'")
    BigDecimal getRevenueSince(LocalDateTime from);
}
