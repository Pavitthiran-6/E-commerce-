package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.PaymentRequest;
import com.belledonne.ecommerce.dto.response.PaymentResponse;
import com.belledonne.ecommerce.entity.Order;
import com.belledonne.ecommerce.entity.Payment;
import com.belledonne.ecommerce.enums.PaymentStatus;
import com.belledonne.ecommerce.exception.PaymentException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.OrderRepository;
import com.belledonne.ecommerce.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    public PaymentResponse createRazorpayOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        try {
            JSONObject options = new JSONObject();
            // Razorpay uses paise (1 INR = 100 paise)
            options.put("amount", order.getTotalAmount().multiply(BigDecimal.valueOf(100)).intValue());
            options.put("currency", "INR");
            options.put("receipt", order.getOrderNumber());

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(options);
            String rzpOrderId = razorpayOrder.get("id");

            Payment payment = Payment.builder()
                .order(order).amount(order.getTotalAmount())
                .currency("INR").razorpayOrderId(rzpOrderId)
                .status(PaymentStatus.INITIATED)
                .build();
            Payment saved = paymentRepository.save(payment);

            return PaymentResponse.builder()
                .paymentId(saved.getId()).orderId(orderId)
                .razorpayOrderId(rzpOrderId)
                .amount(order.getTotalAmount())
                .currency("INR").keyId(razorpayKeyId)
                .status(PaymentStatus.INITIATED.name())
                .createdAt(saved.getCreatedAt())
                .build();
        } catch (RazorpayException e) {
            throw new PaymentException("Failed to create payment order: " + e.getMessage());
        }
    }

    public PaymentResponse verifyPayment(PaymentRequest request) {
        String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
        if (!verifySignature(payload, request.getRazorpaySignature())) {
            throw new PaymentException("Payment signature verification failed. Payment may be fraudulent.");
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "razorpayOrderId", request.getRazorpayOrderId()));

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.getOrder().setPaymentStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        return PaymentResponse.builder()
            .paymentId(payment.getId()).orderId(payment.getOrder().getId())
            .razorpayOrderId(payment.getRazorpayOrderId())
            .razorpayPaymentId(payment.getRazorpayPaymentId())
            .amount(payment.getAmount()).currency(payment.getCurrency())
            .status(PaymentStatus.SUCCESS.name())
            .build();
    }

    private boolean verifySignature(String payload, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec key = new SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256");
            mac.init(key);
            byte[] hash = mac.doFinal(payload.getBytes());
            return HexFormat.of().formatHex(hash).equals(signature);
        } catch (Exception e) {
            log.error("Error verifying Razorpay signature", e);
            return false;
        }
    }

    public PaymentResponse getPaymentByOrderId(UUID orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));
        return PaymentResponse.builder()
            .paymentId(payment.getId()).orderId(orderId)
            .razorpayOrderId(payment.getRazorpayOrderId())
            .razorpayPaymentId(payment.getRazorpayPaymentId())
            .amount(payment.getAmount()).currency(payment.getCurrency())
            .status(payment.getStatus().name()).createdAt(payment.getCreatedAt())
            .build();
    }
}
