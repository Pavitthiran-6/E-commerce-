package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.OrderTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Long> {
    List<OrderTracking> findByOrderIdOrderByTrackingTimeDesc(UUID orderId);
}
