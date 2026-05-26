package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.TrackingRequest;
import com.belledonne.ecommerce.dto.response.OrderResponse.TrackingResponse;
import com.belledonne.ecommerce.entity.Order;
import com.belledonne.ecommerce.entity.OrderTracking;
import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.OrderRepository;
import com.belledonne.ecommerce.repository.OrderTrackingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OrderTrackingService {

    private final OrderRepository orderRepository;
    private final OrderTrackingRepository orderTrackingRepository;
    private final EmailService emailService;
    private final Random random = new Random();

    public List<TrackingResponse> addTrackingEvent(UUID orderId, TrackingRequest request) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        OrderTracking tracking = OrderTracking.builder()
            .order(order)
            .status(request.getStatus())
            .message(request.getMessage())
            .location(request.getLocation())
            .build();

        orderTrackingRepository.save(tracking);
        order.getTrackingHistory().add(tracking);

        String statusStr = request.getStatus().toLowerCase();
        boolean statusChanged = false;
        OrderStatus newStatus = null;

        if (statusStr.contains("shipped")) {
            newStatus = OrderStatus.SHIPPED;
            statusChanged = true;
            if (order.getTrackingNumber() == null || order.getTrackingNumber().isBlank()) {
                String generatedTracking = "DLV" + (100000000 + random.nextInt(900000000));
                order.setTrackingNumber(generatedTracking);
            }
        } else if (statusStr.contains("out for delivery")) {
            newStatus = OrderStatus.OUT_FOR_DELIVERY;
            statusChanged = true;
        } else if (statusStr.contains("delivered")) {
            newStatus = OrderStatus.DELIVERED;
            statusChanged = true;
            order.setDeliveredAt(LocalDateTime.now());
        }

        if (statusChanged && newStatus != null) {
            order.setStatus(newStatus);
            orderRepository.save(order);

            // Send appropriate emails
            if (newStatus == OrderStatus.SHIPPED) {
                emailService.sendOrderShippedEmail(order.getUser().getEmail(), order, order.getTrackingNumber());
            } else if (newStatus == OrderStatus.DELIVERED) {
                emailService.sendOrderDeliveredEmail(order.getUser().getEmail(), order);
            }
        } else {
            orderRepository.save(order);
        }

        return getTrackingTimeline(orderId);
    }

    public List<TrackingResponse> getTrackingTimeline(UUID orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw new ResourceNotFoundException("Order", "id", orderId);
        }
        return orderTrackingRepository.findByOrderIdOrderByTrackingTimeDesc(orderId)
            .stream()
            .map(t -> TrackingResponse.builder()
                .status(t.getStatus())
                .message(t.getMessage())
                .location(t.getLocation())
                .trackingTime(t.getTrackingTime())
                .build())
            .collect(Collectors.toList());
    }
}
