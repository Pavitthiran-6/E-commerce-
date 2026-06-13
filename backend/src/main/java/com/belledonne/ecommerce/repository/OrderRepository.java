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
    Optional<Order> findByAwbCode(String awbCode);
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

    @Query(value = "SELECT TO_CHAR(CAST(o.created_at AS date), 'YYYY-MM-DD') as day, " +
                   "COUNT(o.id) as orders, " +
                   "COALESCE(SUM(o.total_amount), 0) as revenue " +
                   "FROM orders o " +
                   "WHERE o.created_at >= :from AND o.status <> 'CANCELLED' " +
                   "GROUP BY day ORDER BY day ASC",
           nativeQuery = true)
    java.util.List<Object[]> getDailyTrend(@Param("from") LocalDateTime from);

    @Query("SELECT o FROM Order o WHERE o.awbCode IS NOT NULL AND o.status NOT IN (" +
           "com.belledonne.ecommerce.enums.OrderStatus.DELIVERED, " +
           "com.belledonne.ecommerce.enums.OrderStatus.CANCELLED, " +
           "com.belledonne.ecommerce.enums.OrderStatus.RETURNED, " +
           "com.belledonne.ecommerce.enums.OrderStatus.REFUNDED" +
           ")")
    java.util.List<Order> findActiveShipments();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status IN (com.belledonne.ecommerce.enums.OrderStatus.PLACED, com.belledonne.ecommerce.enums.OrderStatus.CONFIRMED) AND o.awbCode IS NULL")
    long countAwaitingShipment();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = com.belledonne.ecommerce.enums.OrderStatus.PACKED OR o.shipmentStatus = 'pickup scheduled'")
    long countPickupScheduled();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = com.belledonne.ecommerce.enums.OrderStatus.SHIPPED")
    long countInTransit();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = com.belledonne.ecommerce.enums.OrderStatus.OUT_FOR_DELIVERY")
    long countOutForDelivery();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = com.belledonne.ecommerce.enums.OrderStatus.DELIVERED AND o.deliveryTimestamp >= :from")
    long countDeliveredToday(@Param("from") LocalDateTime from);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = com.belledonne.ecommerce.enums.OrderStatus.RETURNED OR LOWER(o.shipmentStatus) LIKE '%rto%'")
    long countRtoOrders();

    @Query("SELECT MAX(o.orderNumber) FROM Order o WHERE o.orderNumber LIKE :prefix")
    java.util.Optional<String> findMaxOrderNumberByPrefix(@Param("prefix") String prefix);
}

