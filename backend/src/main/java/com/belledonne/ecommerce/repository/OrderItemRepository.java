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


    @Query("SELECT oi.product.id, oi.productName, SUM(oi.quantity) as totalQty " +
           "FROM OrderItem oi " +
           "GROUP BY oi.product.id, oi.productName " +
           "ORDER BY totalQty DESC")
    List<Object[]> getTopSellingProducts(Pageable pageable);

    @Query(value = "SELECT COALESCE(c.name, 'Uncategorized') as category, " +
                   "SUM(oi.quantity * oi.unit_price) as revenue " +
                   "FROM order_items oi " +
                   "JOIN products p ON oi.product_id = p.id " +
                   "LEFT JOIN categories c ON p.category_id = c.id " +
                   "GROUP BY c.name ORDER BY revenue DESC LIMIT 5",
           nativeQuery = true)
    List<Object[]> getTopCategoriesByRevenue();

    @Query("SELECT oi FROM OrderItem oi WHERE oi.order.user.id = :userId AND oi.product.id = :productId " +
           "AND oi.order.status = 'DELIVERED' AND oi.order.status NOT IN ('REFUNDED', 'RETURN_REQUESTED')")
    List<OrderItem> findDeliveredByUserAndProduct(UUID userId, UUID productId);
}

