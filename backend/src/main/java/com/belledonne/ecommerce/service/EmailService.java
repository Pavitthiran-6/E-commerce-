package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.transaction.annotation.Transactional;
import com.belledonne.ecommerce.repository.OrderRepository;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final OrderRepository orderRepository;

    @Value("${app.mail.from:pavitthiran6@gmail.com}")
    private String fromEmail;

    @Async
    public void sendWelcomeEmail(String toEmail, String name) {
        log.info("[EmailService] Email request started: Welcome Email to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("name", name);
            htmlContent = templateEngine.process("welcome-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for welcome-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Welcome to BELLEDONNE! 🎉", htmlContent);
    }

    /**
     * Sends password reset OTP. Executes synchronously to report delivery status.
     */
    public boolean sendOtpEmail(String toEmail, String otp) {
        log.info("[EmailService] Email request started: Password Reset OTP to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("otp", otp);
            htmlContent = templateEngine.process("otp-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for otp-email to {}: {}", toEmail, e.getMessage(), e);
            return false;
        }
        return sendEmail(toEmail, "Your Password Reset OTP", htmlContent);
    }

    /**
     * Sends registration OTP. Executes synchronously to report delivery status.
     */
    public boolean sendRegistrationOtpEmail(String toEmail, String otp) {
        log.info("[EmailService] Email request started: Registration OTP to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("otp", otp);
            htmlContent = templateEngine.process("registration-otp-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for registration-otp-email to {}: {}", toEmail, e.getMessage(), e);
            return false;
        }
        return sendEmail(toEmail, "Verify Your Email Address — OTP", htmlContent);
    }

    @Async
    public void sendPasswordResetSuccessEmail(String toEmail, String name) {
        log.info("[EmailService] Email request started: Password Reset Confirmation to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("name", name);
            htmlContent = templateEngine.process("password-reset-success-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for password-reset-success-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Password Reset Successful", htmlContent);
    }

    @Async
    public void sendAccountLockedEmail(String toEmail, String name) {
        log.info("[EmailService] Email request started: Account Locked Alert to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("name", name);
            htmlContent = templateEngine.process("account-locked-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for account-locked-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Security Alert - Account Temporarily Locked", htmlContent);
    }

    @Async
    @Transactional(readOnly = true)
    public void sendOrderConfirmationEmail(String toEmail, Order order) {
        sendOrderConfirmationEmail(toEmail, order, null);
    }

    @Async
    @Transactional(readOnly = true)
    public void sendOrderConfirmationEmail(String toEmail, Order order, byte[] invoicePdf) {
        Order freshOrder = orderRepository.findById(order.getId())
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + order.getId()));
        log.info("[EmailService] Email request started: Order Confirmation to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", freshOrder);
            htmlContent = templateEngine.process("order-confirmation-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for order-confirmation-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        if (invoicePdf != null && invoicePdf.length > 0) {
            sendEmailWithAttachment(toEmail, "Order Confirmed — " + freshOrder.getOrderNumber(), htmlContent,
                invoicePdf, "invoice-" + freshOrder.getOrderNumber() + ".pdf");
        } else {
            sendEmail(toEmail, "Order Confirmed — " + freshOrder.getOrderNumber(), htmlContent);
        }
    }

    @Async
    @Transactional(readOnly = true)
    public void sendInvoiceReadyEmail(String toEmail, Order order, byte[] invoicePdf) {
        Order freshOrder = orderRepository.findById(order.getId())
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + order.getId()));
        log.info("[EmailService] Email request started: Invoice Ready to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", freshOrder);
            htmlContent = templateEngine.process("invoice-ready-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for invoice-ready-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        if (invoicePdf != null && invoicePdf.length > 0) {
            sendEmailWithAttachment(toEmail, "Your BELLEDONNE Tax Invoice is Ready — " + freshOrder.getOrderNumber(), htmlContent,
                invoicePdf, "invoice-" + freshOrder.getOrderNumber() + ".pdf");
        } else {
            sendEmail(toEmail, "Your BELLEDONNE Tax Invoice is Ready — " + freshOrder.getOrderNumber(), htmlContent);
        }
    }

    @Async
    @Transactional(readOnly = true)
    public void sendOrderShippedEmail(String toEmail, Order order, String trackingNumber) {
        Order freshOrder = orderRepository.findById(order.getId())
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + order.getId()));
        log.info("[EmailService] Email request started: Order Shipped to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", freshOrder);
            context.setVariable("trackingNumber", trackingNumber);
            htmlContent = templateEngine.process("order-shipped-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for order-shipped-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Your Order is on its Way! 🚚 — " + freshOrder.getOrderNumber(), htmlContent);
    }

    @Async
    @Transactional(readOnly = true)
    public void sendOrderDeliveredEmail(String toEmail, Order order) {
        Order freshOrder = orderRepository.findById(order.getId())
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + order.getId()));
        log.info("[EmailService] Email request started: Order Delivered to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", freshOrder);
            htmlContent = templateEngine.process("order-delivered-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for order-delivered-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Your Order Has Been Delivered! 📦 — " + freshOrder.getOrderNumber(), htmlContent);
    }

    @Async
    @Transactional(readOnly = true)
    public void sendShipmentCreatedEmail(String toEmail, Order order) {
        Order freshOrder = orderRepository.findById(order.getId())
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + order.getId()));
        log.info("[EmailService] Email request started: Shipment Created to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", freshOrder);
            htmlContent = templateEngine.process("shipment-shipped-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for shipment-shipped-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Your BELLEDONNE Order Has Been Shipped", htmlContent);
    }

    @Async
    @Transactional(readOnly = true)
    public void sendShipmentOutEmail(String toEmail, Order order) {
        Order freshOrder = orderRepository.findById(order.getId())
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + order.getId()));
        log.info("[EmailService] Email request started: Shipment Out For Delivery to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", freshOrder);
            htmlContent = templateEngine.process("shipment-out-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for shipment-out-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Your Order Is Out For Delivery", htmlContent);
    }

    @Async
    @Transactional(readOnly = true)
    public void sendShipmentDeliveredEmail(String toEmail, Order order) {
        Order freshOrder = orderRepository.findById(order.getId())
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + order.getId()));
        log.info("[EmailService] Email request started: Shipment Delivered to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", freshOrder);
            htmlContent = templateEngine.process("shipment-delivered-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for shipment-delivered-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Your Order Has Been Delivered", htmlContent);
    }

    @Async
    @Transactional(readOnly = true)
    public void sendRefundInitiatedEmail(String toEmail, Order order, String refundId) {
        Order freshOrder = orderRepository.findById(order.getId())
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + order.getId()));
        log.info("[EmailService] Email request started: Refund Initiated to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", freshOrder);
            context.setVariable("refundId", refundId);
            htmlContent = templateEngine.process("refund-initiated-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for refund-initiated-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Refund Initiated — " + freshOrder.getOrderNumber(), htmlContent);
    }

    @Value("${app.security.alert-email:admin@belledonne.in}")
    private String adminAlertEmail;

    @Async
    public void sendSecurityAlertEmail(String triggerType, String ipAddress, String timeWindow, String details) {
        log.info("[EmailService] Email request started: Security Alert to {}", adminAlertEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("triggerType", triggerType);
            context.setVariable("ipAddress", ipAddress);
            context.setVariable("timeWindow", timeWindow);
            context.setVariable("details", details);
            htmlContent = templateEngine.process("security-alert-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for security-alert-email to {}: {}", adminAlertEmail, e.getMessage(), e);
            return;
        }
        sendEmail(adminAlertEmail, "🚨 Security Alert Detected - " + triggerType, htmlContent);
    }

    @Async
    public void sendRefundRequestReceivedEmail(String toEmail, String name, String orderNumber, java.math.BigDecimal refundAmount, String cancellationReason) {
        log.info("[EmailService] Email request started: Refund Request Received to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("orderNumber", orderNumber);
            context.setVariable("refundAmount", refundAmount);
            context.setVariable("cancellationReason", cancellationReason);
            htmlContent = templateEngine.process("refund-request-received-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for refund-request-received-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Refund Request Received — " + orderNumber, htmlContent);
    }

    @Async
    public void sendRefundRequestAdminNotification(String orderNumber, String customerName, String customerEmail, java.math.BigDecimal refundAmount, String cancellationReason) {
        log.info("[EmailService] Email request started: Admin Refund Request Notification for {}", orderNumber);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("orderNumber", orderNumber);
            context.setVariable("customerName", customerName);
            context.setVariable("customerEmail", customerEmail);
            context.setVariable("refundAmount", refundAmount);
            context.setVariable("cancellationReason", cancellationReason);
            htmlContent = templateEngine.process("refund-request-admin-notification", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for refund-request-admin-notification: {}", e.getMessage(), e);
            return;
        }
        sendEmail(adminAlertEmail, "🚨 Action Required: Refund Request Pending — " + orderNumber, htmlContent);
    }

    @Async
    public void sendRefundApprovedEmail(String toEmail, String name, String orderNumber, java.math.BigDecimal refundAmount, String adminNotes, String razorpayRefundId) {
        log.info("[EmailService] Email request started: Refund Approved to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("orderNumber", orderNumber);
            context.setVariable("refundAmount", refundAmount);
            context.setVariable("adminNotes", adminNotes);
            context.setVariable("razorpayRefundId", razorpayRefundId);
            htmlContent = templateEngine.process("refund-approved-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for refund-approved-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Refund Request Approved — " + orderNumber, htmlContent);
    }

    @Async
    public void sendRefundRejectedEmail(String toEmail, String name, String orderNumber, java.math.BigDecimal refundAmount, String rejectionReason) {
        log.info("[EmailService] Email request started: Refund Rejected to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("orderNumber", orderNumber);
            context.setVariable("refundAmount", refundAmount);
            context.setVariable("rejectionReason", rejectionReason);
            htmlContent = templateEngine.process("refund-rejected-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for refund-rejected-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Refund Request Update — " + orderNumber, htmlContent);
    }

    @Async
    public void sendRefundFailedAdminNotification(String orderNumber, java.math.BigDecimal refundAmount, String failureReason) {
        log.info("[EmailService] Email request started: Refund Failure Admin Notification for Order {}", orderNumber);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("orderNumber", orderNumber);
            context.setVariable("refundAmount", refundAmount);
            context.setVariable("failureReason", failureReason);
            htmlContent = templateEngine.process("refund-failed-admin-notification", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for refund-failed-admin-notification: {}", e.getMessage(), e);
            return;
        }
        sendEmail("admin@belledonne.in", "ALERT: Refund Failed for Order " + orderNumber, htmlContent);
    }

    @Async
    @Transactional(readOnly = true)
    public void sendOrderStatusUpdateEmail(Order order, String statusLabel, String messageText) {
        Order freshOrder = orderRepository.findById(order.getId())
            .orElseThrow(() -> new IllegalArgumentException("Order not found: " + order.getId()));
        log.info("[EmailService] Email request started: Order Status Update to {}", freshOrder.getUser().getEmail());
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", freshOrder);
            context.setVariable("statusLabel", statusLabel);
            context.setVariable("messageText", messageText);
            htmlContent = templateEngine.process("order-status-update-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for order-status-update-email: {}", e.getMessage(), e);
            return;
        }
        sendEmail(freshOrder.getUser().getEmail(), "Order Update: #" + freshOrder.getOrderNumber() + " is " + statusLabel, htmlContent);
    }

    /**
     * Sends a dedicated "Return Pickup Scheduled" email to the customer.
     * Called when admin schedules a return courier pickup.
     */
    @Async
    public void sendReturnPickupScheduledEmail(String toEmail, String customerName, String orderNumber) {
        log.info("[EmailService] Sending Return Pickup Scheduled email to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("customerName", customerName);
            context.setVariable("orderNumber", orderNumber);
            htmlContent = templateEngine.process("return-pickup-scheduled-email", context);
        } catch (Exception e) {
            // Fallback to simple HTML if template doesn't exist yet
            log.warn("[EmailService] Template 'return-pickup-scheduled-email' not found, using fallback. Error: {}", e.getMessage());
            htmlContent = "<html><body style='font-family:Arial,sans-serif;'>"
                + "<h2 style='color:#2a2a2a;'>Return Pickup Scheduled</h2>"
                + "<p>Dear <strong>" + customerName + "</strong>,</p>"
                + "<p>A courier has been arranged to pick up your return for order <strong>#" + orderNumber + "</strong>.</p>"
                + "<p>Please ensure the package is properly sealed and ready for collection. The courier will arrive within 1–3 business days.</p>"
                + "<p style='color:#666;'>If you have any questions, please contact our support team.</p>"
                + "<br><p>Thank you,<br><strong>BELLEDONNE Team</strong></p>"
                + "</body></html>";
        }
        sendEmail(toEmail, "Return Pickup Scheduled — Order #" + orderNumber, htmlContent);
    }

    /**
     * Sends an email to the customer requesting their UPI/Bank details for a COD return refund.
     * Called when admin marks a COD return as received and triggers the payout details request.
     */
    @Async
    public void sendPayoutDetailsRequestEmail(String toEmail, String customerName, String orderNumber, java.math.BigDecimal refundAmount) {
        log.info("[EmailService] Sending Payout Details Request email to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("customerName", customerName);
            context.setVariable("orderNumber", orderNumber);
            context.setVariable("refundAmount", refundAmount);
            htmlContent = templateEngine.process("payout-details-request-email", context);
        } catch (Exception e) {
            // Fallback to simple HTML if template doesn't exist yet
            log.warn("[EmailService] Template 'payout-details-request-email' not found, using fallback. Error: {}", e.getMessage());
            htmlContent = "<html><body style='font-family:Arial,sans-serif;'>"
                + "<h2 style='color:#2a2a2a;'>Action Required: Provide Refund Details</h2>"
                + "<p>Dear <strong>" + customerName + "</strong>,</p>"
                + "<p>We have received your returned items for order <strong>#" + orderNumber + "</strong>.</p>"
                + "<p>To process your refund of <strong>₹" + refundAmount + "</strong>, please log in to your account and provide your UPI ID or bank account details.</p>"
                + "<p><a href='https://belledonne.in/profile/orders' style='background:#c8a96e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;'>Provide Refund Details</a></p>"
                + "<p style='color:#666;margin-top:20px;'>This is required to transfer your refund. If you have already provided your details, please ignore this email.</p>"
                + "<br><p>Thank you,<br><strong>BELLEDONNE Team</strong></p>"
                + "</body></html>";
        }
        sendEmail(toEmail, "Action Required: Provide Your Refund Details — Order #" + orderNumber, htmlContent);
    }

    private boolean sendEmail(String to, String subject, String htmlContent) {
        log.info("[EmailService] Attempting to send email to {} with subject: '{}'...", to, subject);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("[EmailService] ✅ Email sent successfully to {}", to);
            return true;
        } catch (MailAuthenticationException e) {
            log.error("[EmailService] ❌ SMTP authentication failure while sending to {}: {}", to, e.getMessage(), e);
        } catch (MailSendException e) {
            Throwable rootCause = e.getMostSpecificCause();
            if (rootCause instanceof jakarta.mail.SendFailedException || rootCause.getMessage().contains("Invalid Addresses")) {
                log.error("[EmailService] ❌ Recipient rejected (invalid address) for {}: {}", to, rootCause.getMessage(), e);
            } else if (rootCause instanceof java.net.ConnectException || rootCause instanceof java.net.SocketTimeoutException || rootCause.getMessage().contains("Connect timed out")) {
                log.error("[EmailService] ❌ SMTP connection failure (timeout/refused) while sending to {}: {}", to, rootCause.getMessage(), e);
            } else {
                log.error("[EmailService] ❌ Mail send failure (MailSendException) to {}: {}", to, e.getMessage(), e);
            }
        } catch (Exception e) {
            Throwable cause = e.getCause();
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("authentication failed") || (cause != null && cause.getMessage() != null && cause.getMessage().contains("authentication failed"))) {
                log.error("[EmailService] ❌ SMTP authentication failure to {}: {}", to, msg, e);
            } else if (msg.contains("Connect timed out") || msg.contains("connection refused") || (cause != null && (cause instanceof java.net.ConnectException || cause instanceof java.net.SocketTimeoutException))) {
                log.error("[EmailService] ❌ SMTP connection failure to {}: {}", to, msg, e);
            } else {
                log.error("[EmailService] ❌ Failed to send email to {}: {}", to, msg, e);
            }
        }
        return false;
    }

    private boolean sendEmailWithAttachment(String to, String subject, String htmlContent,
                                             byte[] attachment, String filename) {
        log.info("[EmailService] Attempting to send email with attachment to {} — subject: '{}'", to, subject);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.addAttachment(filename, new ByteArrayResource(attachment));
            mailSender.send(message);
            log.info("[EmailService] ✅ Email with attachment sent successfully to {}", to);
            return true;
        } catch (Exception e) {
            log.error("[EmailService] ❌ Failed to send email with attachment to {}: {}", to, e.getMessage(), e);
            return false;
        }
    }

    @Async
    public void sendWarehouseRtoNotificationEmail(String orderNumber) {
        log.info("[EmailService] Sending Warehouse RTO Notification email for order: {}", orderNumber);
        String htmlContent = "<html><body style='font-family:Arial,sans-serif;'>"
            + "<h2 style='color:#d32f2f;'>RTO Package Received at Warehouse</h2>"
            + "<p>Hello Warehouse Team,</p>"
            + "<p>An RTO (Return to Origin) shipment has been marked as <strong>delivered back to the origin</strong> by the courier.</p>"
            + "<p>Please verify the contents of the package for order <strong>#" + orderNumber + "</strong> and log any stock updates accordingly.</p>"
            + "<br><p>Thank you,<br><strong>BELLEDONNE Logistics</strong></p>"
            + "</body></html>";
        sendEmail(fromEmail, "RTO Delivered to Warehouse — Order #" + orderNumber, htmlContent);
    }
}
