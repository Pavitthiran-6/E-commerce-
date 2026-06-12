package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.Order;
import com.belledonne.ecommerce.entity.OrderItem;
import com.belledonne.ecommerce.exception.BadRequestException;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShiprocketService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${shiprocket.email}")
    private String shiprocketEmail;

    @Value("${shiprocket.password}")
    private String shiprocketPassword;

    private String cachedToken;
    private LocalDateTime tokenExpiry;

    private static final String BASE_URL = "https://apiv2.shiprocket.in/v1/external";

    /**
     * Get or refresh token.
     */
    public synchronized String getToken() {
        if (cachedToken != null && tokenExpiry != null && LocalDateTime.now().isBefore(tokenExpiry)) {
            return cachedToken;
        }

        log.info("[ShiprocketService] Initiating authentication login for email: {}", shiprocketEmail);
        try {
            Map<String, String> body = new HashMap<>();
            body.put("email", shiprocketEmail);
            body.put("password", shiprocketPassword);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL + "/auth/login", request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String token = (String) response.getBody().get("token");
                if (token != null) {
                    cachedToken = token;
                    // Cache for 23 hours (usually valid for 24 hours)
                    tokenExpiry = LocalDateTime.now().plusHours(23);
                    log.info("[ShiprocketService] Authentication login successful, token cached.");
                    return cachedToken;
                }
            }
            throw new BadRequestException("Failed to retrieve authentication token from Shiprocket.");
        } catch (Exception e) {
            log.error("[ShiprocketService] Authentication error: {}", e.getMessage(), e);
            throw new BadRequestException("Shiprocket authentication failed: " + e.getMessage());
        }
    }

    private HttpHeaders getAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(getToken());
        return headers;
    }

    /**
     * Check serviceability for a delivery pincode.
     */
    public ServiceabilityResponse checkServiceability(String pickupPincode, String deliveryPincode, Double weight, boolean cod) {
        log.info("[ShiprocketService] Checking serviceability from {} to {}, weight: {} kg, cod: {}", 
            pickupPincode, deliveryPincode, weight, cod);
        
        try {
            String url = String.format("%s/courier/serviceability?pickup_postcode=%s&delivery_postcode=%s&weight=%s&cod=%d",
                    BASE_URL, pickupPincode, deliveryPincode, String.valueOf(weight), cod ? 1 : 0);

            HttpEntity<Void> request = new HttpEntity<>(getAuthHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map body = response.getBody();
                Integer status = (Integer) body.get("status");
                if (status != null && status == 200) {
                    Map data = (Map) body.get("data");
                    if (data != null) {
                        List<Map> couriersList = (List<Map>) data.get("available_courier_companies");
                        List<CourierCompany> availableCouriers = new ArrayList<>();

                        if (couriersList != null) {
                            for (Map courier : couriersList) {
                                Object rateVal = courier.get("rate");
                                BigDecimal rate = rateVal != null ? new BigDecimal(String.valueOf(rateVal)) : BigDecimal.ZERO;

                                Object ratingVal = courier.get("rating");
                                Double rating = ratingVal != null ? Double.valueOf(String.valueOf(ratingVal)) : 0.0;

                                availableCouriers.add(CourierCompany.builder()
                                        .courierCompanyId(((Number) courier.get("courier_company_id")).longValue())
                                        .courierName((String) courier.get("courier_name"))
                                        .rate(rate)
                                        .rating(rating)
                                        .etd((String) courier.get("etd"))
                                        .cod(courier.get("cod") != null && String.valueOf(courier.get("cod")).equals("1"))
                                        .build());
                            }
                        }

                        Long recommendedId = null;
                        Map recommendationMeta = (Map) data.get("recommendation_metadata");
                        if (recommendationMeta != null && recommendationMeta.get("recommended_courier_company_id") != null) {
                            recommendedId = ((Number) recommendationMeta.get("recommended_courier_company_id")).longValue();
                        }

                        return ServiceabilityResponse.builder()
                                .status(200)
                                .availableCouriers(availableCouriers)
                                .recommendedCourierId(recommendedId)
                                .build();
                    }
                }
            }
            log.warn("[ShiprocketService] Serviceability check returned unserviceable or empty response");
            return ServiceabilityResponse.builder().status(404).availableCouriers(Collections.emptyList()).build();
        } catch (Exception e) {
            log.error("[ShiprocketService] Error checking serviceability: {}", e.getMessage());
            return ServiceabilityResponse.builder().status(500).availableCouriers(Collections.emptyList()).build();
        }
    }

    /**
     * Create shipment adhoc order on Shiprocket.
     */
    public ShipmentResponse createShipment(Order order) {
        log.info("[ShiprocketService] Creating Shiprocket order for orderNumber: {}", order.getOrderNumber());

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("order_id", order.getOrderNumber() + "-" + System.currentTimeMillis() / 1000); // Unique Order reference
            body.put("order_date", order.getCreatedAt() != null 
                ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
            body.put("pickup_location", "Primary");

            // Billing address
            String fullName = order.getAddress().getFullName();
            String firstName = fullName;
            String lastName = "";
            int spaceIdx = fullName.indexOf(' ');
            if (spaceIdx > 0) {
                firstName = fullName.substring(0, spaceIdx);
                lastName = fullName.substring(spaceIdx + 1);
            }

            body.put("billing_customer_name", firstName);
            body.put("billing_last_name", lastName);
            body.put("billing_address", order.getAddress().getAddressLine1());
            body.put("billing_address_2", order.getAddress().getAddressLine2() != null ? order.getAddress().getAddressLine2() : "");
            body.put("billing_city", order.getAddress().getCity());
            body.put("billing_pincode", order.getAddress().getPincode());
            body.put("billing_state", order.getAddress().getState());
            body.put("billing_country", "India");
            body.put("billing_email", order.getUser().getEmail());
            body.put("billing_phone", order.getAddress().getPhone());

            body.put("shipping_is_billing", true);

            // Order items list
            List<Map<String, Object>> itemsList = new ArrayList<>();
            for (OrderItem item : order.getItems()) {
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("name", item.getProductName());
                itemMap.put("sku", "SKU-" + item.getProduct().getId().toString().substring(0, 8));
                itemMap.put("units", item.getQuantity());
                itemMap.put("selling_price", item.getUnitPrice().doubleValue());
                itemsList.add(itemMap);
            }
            body.put("order_items", itemsList);

            body.put("payment_method", order.getPaymentMethod() == com.belledonne.ecommerce.enums.PaymentMethod.COD ? "COD" : "Prepaid");
            body.put("sub_total", order.getTotalAmount().doubleValue());

            // Use product dimensions from the first item (or aggregate / use largest)
            // Falls back to sensible defaults if product has no dimensions set
            double totalWeight = 0.0;
            double maxLength = 10.0;
            double maxWidth = 10.0;
            double maxHeight = 10.0;
            for (OrderItem item : order.getItems()) {
                com.belledonne.ecommerce.entity.Product p = item.getProduct();
                if (p != null) {
                    double w = p.getWeight() != null ? p.getWeight().doubleValue() : 0.5;
                    totalWeight += w * item.getQuantity();
                    if (p.getLength() != null) maxLength = Math.max(maxLength, p.getLength().doubleValue());
                    if (p.getWidth()  != null) maxWidth  = Math.max(maxWidth,  p.getWidth().doubleValue());
                    if (p.getHeight() != null) maxHeight = Math.max(maxHeight, p.getHeight().doubleValue());
                }
            }
            if (totalWeight == 0.0) totalWeight = 0.5; // minimum safe weight
            body.put("length", Math.round(maxLength * 10.0) / 10.0);
            body.put("width",  Math.round(maxWidth  * 10.0) / 10.0);
            body.put("height", Math.round(maxHeight * 10.0) / 10.0);
            body.put("weight", Math.round(totalWeight * 100.0) / 100.0);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, getAuthHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL + "/orders/create/adhoc", request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map resBody = response.getBody();
                Object srOrderIdVal = resBody.get("order_id");
                Object srShipmentIdVal = resBody.get("shipment_id");

                if (srOrderIdVal != null && srShipmentIdVal != null) {
                    return ShipmentResponse.builder()
                            .shiprocketOrderId(String.valueOf(srOrderIdVal))
                            .shipmentId(String.valueOf(srShipmentIdVal))
                            .status("NEW")
                            .build();
                }
            }
            throw new BadRequestException("Shiprocket returned incomplete order response.");
        } catch (Exception e) {
            log.error("[ShiprocketService] Error creating shipment order: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to create shipment on Shiprocket: " + e.getMessage());
        }
    }

    /**
     * Assign AWB code for a shipment.
     */
    public AwbResponse assignAwb(String shipmentId, Long courierId) {
        log.info("[ShiprocketService] Allocating AWB for shipmentId: {}, courierId: {}", shipmentId, courierId);

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("shipment_id", Long.valueOf(shipmentId));
            if (courierId != null) {
                body.put("courier_id", courierId);
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, getAuthHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL + "/courier/assign/awb", request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map resBody = response.getBody();
                Map responseData = (Map) resBody.get("response");
                if (responseData != null) {
                    Map data = (Map) responseData.get("data");
                    if (data != null) {
                        String awbCode = (String) data.get("awb_code");
                        String courierName = (String) data.get("courier_name");
                        if (awbCode != null) {
                            return AwbResponse.builder()
                                    .awbCode(awbCode)
                                    .courierName(courierName != null ? courierName : "Shiprocket Partner")
                                    .build();
                        }
                    }
                }
            }
            throw new BadRequestException("Failed to retrieve AWB code from Shiprocket allocation API.");
        } catch (Exception e) {
            log.error("[ShiprocketService] Error assigning AWB: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to allocate AWB: " + e.getMessage());
        }
    }

    /**
     * Request carrier pickup.
     */
    public boolean requestPickup(String shipmentId) {
        log.info("[ShiprocketService] Requesting pickup schedule for shipmentId: {}", shipmentId);

        try {
            Map<String, Object> body = new HashMap<>();
            List<Long> idsList = new ArrayList<>();
            idsList.add(Long.valueOf(shipmentId));
            body.put("shipment_id", idsList);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, getAuthHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL + "/courier/generate/pickup", request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map resBody = response.getBody();
                Object pickupStatusVal = resBody.get("pickup_status");
                if (pickupStatusVal != null && (String.valueOf(pickupStatusVal).equals("1") || String.valueOf(pickupStatusVal).equals("true"))) {
                    log.info("[ShiprocketService] Carrier pickup scheduled successfully.");
                    return true;
                }
            }
            log.warn("[ShiprocketService] Pickup scheduling API returned failure response");
            return false;
        } catch (Exception e) {
            log.error("[ShiprocketService] Error scheduling pickup: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Get tracking updates for an AWB code.
     */
    public TrackingData trackShipment(String awbCode) {
        log.info("[ShiprocketService] Fetching tracking status for AWB: {}", awbCode);

        try {
            String url = BASE_URL + "/courier/track/awb/" + awbCode;
            HttpEntity<Void> request = new HttpEntity<>(getAuthHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map body = response.getBody();
                Map trackingDataMap = (Map) body.get("tracking_data");
                if (trackingDataMap != null) {
                    List<Map> shipmentTrackList = (List<Map>) trackingDataMap.get("shipment_track");
                    if (shipmentTrackList != null && !shipmentTrackList.isEmpty()) {
                        Map trackDetails = shipmentTrackList.get(0);
                        String currentStatus = (String) trackDetails.get("current_status");
                        String edd = (String) trackDetails.get("edd");

                        List<Map> scans = (List<Map>) trackDetails.get("scans");
                        String latestActivity = null;
                        String latestLocation = null;
                        if (scans != null && !scans.isEmpty()) {
                            Map latestScan = scans.get(0); // usually first item is latest scan
                            latestActivity = (String) latestScan.get("activity");
                            latestLocation = (String) latestScan.get("location");
                        }

                        String deliveredDate = (String) trackDetails.get("delivered_date");
                        String podUrl = (String) trackDetails.get("pod_url");
                        String receivedBy = (String) trackDetails.get("received_by");

                        return TrackingData.builder()
                                .status(currentStatus)
                                .latestEvent(latestActivity != null ? (latestActivity + (latestLocation != null ? " (" + latestLocation + ")" : "")) : currentStatus)
                                .estimatedDelivery(edd)
                                .deliveryTimestamp(deliveredDate)
                                .proofOfDeliveryUrl(podUrl)
                                .receiverName(receivedBy)
                                .courierRemarks(latestActivity)
                                .build();
                    }
                }
            }
        } catch (Exception e) {
            log.error("[ShiprocketService] Error tracking AWB {}: {}", awbCode, e.getMessage());
        }
        return null;
    }

    /**
     * Cancel shipment on Shiprocket.
     */
    public void cancelShipment(String shiprocketOrderId) {
        log.info("[ShiprocketService] Cancelling Shiprocket order ID: {}", shiprocketOrderId);

        try {
            Map<String, Object> body = new HashMap<>();
            List<Long> ids = new ArrayList<>();
            ids.add(Long.valueOf(shiprocketOrderId));
            body.put("ids", ids);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, getAuthHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(BASE_URL + "/orders/cancel", request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("[ShiprocketService] Cancel shipment completed on Shiprocket.");
            } else {
                log.warn("[ShiprocketService] Cancel shipment returned status: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[ShiprocketService] Error calling cancel shipment: {}", e.getMessage(), e);
        }
    }

    // ── Shiprocket Service DTOs ───────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CourierCompany {
        private Long courierCompanyId;
        private String courierName;
        private BigDecimal rate;
        private Double rating;
        private String etd;
        private boolean cod;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServiceabilityResponse {
        private int status;
        private List<CourierCompany> availableCouriers;
        private Long recommendedCourierId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShipmentResponse {
        private String shiprocketOrderId;
        private String shipmentId;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AwbResponse {
        private String awbCode;
        private String courierName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrackingData {
        private String status;
        private String latestEvent;
        private String estimatedDelivery;
        private String deliveryTimestamp;
        private String courierRemarks;
        private String receiverName;
        private String proofOfDeliveryUrl;
    }
}
