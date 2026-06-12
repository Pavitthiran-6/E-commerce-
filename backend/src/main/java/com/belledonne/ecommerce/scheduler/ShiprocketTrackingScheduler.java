package com.belledonne.ecommerce.scheduler;

import com.belledonne.ecommerce.entity.Order;
import com.belledonne.ecommerce.repository.OrderRepository;
import com.belledonne.ecommerce.service.OrderService;
import com.belledonne.ecommerce.service.ShiprocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ShiprocketTrackingScheduler {

    private final OrderRepository orderRepository;
    private final ShiprocketService shiprocketService;
    private final OrderService orderService;

    /**
     * Scheduled job to fetch tracking updates for active shipments every 30 minutes.
     */
    @Scheduled(cron = "0 */30 * * * *")
    public void pollTrackingUpdates() {
        log.info("[ShiprocketTrackingScheduler] Starting scheduled tracking update task...");
        List<Order> activeOrders = orderRepository.findActiveShipments();
        log.info("[ShiprocketTrackingScheduler] Found {} active shipments to track", activeOrders.size());

        for (Order order : activeOrders) {
            try {
                ShiprocketService.TrackingData trackingData = shiprocketService.trackShipment(order.getAwbCode());
                if (trackingData == null) {
                    continue;
                }
                
                log.info("[ShiprocketTrackingScheduler] Polling status update for Order {}: AWB={}, current_status={}",
                    order.getOrderNumber(), order.getAwbCode(), trackingData.getStatus());
                    
                orderService.syncOrderTrackingStatus(
                    order.getAwbCode(),
                    trackingData.getStatus(),
                    trackingData.getLatestEvent(),
                    trackingData.getEstimatedDelivery()
                );
            } catch (Exception e) {
                log.error("[ShiprocketTrackingScheduler] Error updating tracking for Order {}: {}", 
                    order.getOrderNumber(), e.getMessage());
            }
        }
        log.info("[ShiprocketTrackingScheduler] Scheduled tracking update task completed.");
    }
}
