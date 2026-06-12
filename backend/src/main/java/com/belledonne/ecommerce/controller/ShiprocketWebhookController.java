package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/shiprocket")
@RequiredArgsConstructor
@Tag(name = "Shiprocket Webhook", description = "Endpoints for Shiprocket real-time tracking webhooks")
@Slf4j
public class ShiprocketWebhookController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Handle incoming webhook from Shiprocket for real-time tracking updates")
    public ResponseEntity<?> handleWebhook(@RequestBody Map<String, Object> payload) {
        log.info("[ShiprocketWebhookController] Received webhook event payload: {}", payload);
        
        try {
            String awb = (String) payload.get("awb");
            if (awb == null) {
                Map<String, Object> trackingHistory = (Map<String, Object>) payload.get("tracking_history");
                if (trackingHistory != null) {
                    awb = (String) trackingHistory.get("awb");
                }
            }
            
            if (awb == null) {
                log.warn("[ShiprocketWebhookController] Webhook payload does not contain an AWB code.");
                return ResponseEntity.badRequest().body(ApiResponse.error("Missing AWB code in payload."));
            }
            
            String currentStatus = (String) payload.get("current_status");
            if (currentStatus == null) {
                Map<String, Object> trackingHistory = (Map<String, Object>) payload.get("tracking_history");
                if (trackingHistory != null) {
                    currentStatus = (String) trackingHistory.get("current_status");
                }
            }
            
            String latestEvent = (String) payload.get("latest_event");
            if (latestEvent == null) {
                latestEvent = currentStatus;
            }
            
            String edd = (String) payload.get("edd");
            
            log.info("[ShiprocketWebhookController] Processing tracking status sync for AWB: {}, status: {}", awb, currentStatus);
            orderService.syncOrderTrackingStatus(awb, currentStatus, latestEvent, edd);
            
            return ResponseEntity.ok(ApiResponse.success("Webhook processed successfully"));
        } catch (Exception e) {
            log.error("[ShiprocketWebhookController] Error processing webhook: {}", e.getMessage(), e);
            // Return 200 OK so that Shiprocket doesn't retry indefinitely
            return ResponseEntity.ok(ApiResponse.success("Webhook ignored due to parsing error: " + e.getMessage()));
        }
    }
}
