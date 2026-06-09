package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.Order;
import com.belledonne.ecommerce.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {
    Page<Order> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    long countByUserId(UUID userId);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.user.id = :userId")
    BigDecimal sumTotalAmountByUserId(@Param("userId") UUID userId);

    boolean existsByUserIdAndCouponCodeIgnoreCaseAndStatusNot(UUID userId, String couponCode, OrderStatus status);
    Optional<Order> findByOrderNumber(String orderNumber);
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    long countByStatus(OrderStatus status);
    java.util.List<Order> findByStatusIn(java.util.Collection<OrderStatus> statuses);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :from")
    long countOrdersFrom(LocalDateTime from);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'DELIVERED'")
    BigDecimal getTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt >= :from AND o.status <> 'CANCELLED'")
    BigDecimal getRevenueSince(LocalDateTime from);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.status <> 'CANCELLED'")
    BigDecimal getRevenueBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :from AND :to")
    long countOrdersBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(AVG(o.totalAmount), 0) FROM Order o WHERE o.status <> 'CANCELLED'")
    BigDecimal getAverageOrderValue();

    // Returns [date_string, order_count, revenue] per day for last N days (native)
    @Query(value = "SELECT TO_CHAR(CAST(o.created_at AS date), 'YYYY-MM-DD') as day, " +
                   "COUNT(o.id) as orders, " +
                   "COALESCE(SUM(o.total_amount), 0) as revenue " +
                   "FROM orders o " +
                   "WHERE o.created_at >= :from AND o.status <> 'CANCELLED' " +
                   "GROUP BY day ORDER BY day ASC",
           nativeQuery = true)
    java.util.List<Object[]> getDailyTrend(@Param("from") LocalDateTime from);
}

