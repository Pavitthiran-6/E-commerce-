package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(UUID orderId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.user.id = :userId AND oi.product.id = :productId AND oi.order.status = 'DELIVERED'")
    List<OrderItem> findDeliveredByUserAndProduct(UUID userId, UUID productId);

    @Query("SELECT oi.product.id, oi.productName, SUM(oi.quantity) as totalQty " +
           "FROM OrderItem oi " +
           "GROUP BY oi.product.id, oi.productName " +
           "ORDER BY totalQty DESC")
    List<Object[]> getTopSellingProducts(Pageable pageable);
}
