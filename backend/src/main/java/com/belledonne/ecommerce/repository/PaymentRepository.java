package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    /** Used to load a payment from the internal Order UUID. */
    Optional<Payment> findByOrderId(UUID orderId);

    /** Used during checkout verification and the webhook handler. */
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    /**
     * Used for webhook idempotency — if a razorpayPaymentId is already stored
     * as SUCCESS, we skip re-processing the webhook event.
     */
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
}
