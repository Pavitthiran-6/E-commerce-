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

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

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
    public void sendOrderConfirmationEmail(String toEmail, Order order) {
        sendOrderConfirmationEmail(toEmail, order, null);
    }

    @Async
    public void sendOrderConfirmationEmail(String toEmail, Order order, byte[] invoicePdf) {
        log.info("[EmailService] Email request started: Order Confirmation to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", order);
            htmlContent = templateEngine.process("order-confirmation-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for order-confirmation-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        if (invoicePdf != null && invoicePdf.length > 0) {
            sendEmailWithAttachment(toEmail, "Order Confirmed — " + order.getOrderNumber(), htmlContent,
                invoicePdf, "invoice-" + order.getOrderNumber() + ".pdf");
        } else {
            sendEmail(toEmail, "Order Confirmed — " + order.getOrderNumber(), htmlContent);
        }
    }

    @Async
    public void sendInvoiceReadyEmail(String toEmail, Order order, byte[] invoicePdf) {
        log.info("[EmailService] Email request started: Invoice Ready to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", order);
            htmlContent = templateEngine.process("invoice-ready-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for invoice-ready-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        if (invoicePdf != null && invoicePdf.length > 0) {
            sendEmailWithAttachment(toEmail, "Your BELLEDONNE Tax Invoice is Ready — " + order.getOrderNumber(), htmlContent,
                invoicePdf, "invoice-" + order.getOrderNumber() + ".pdf");
        } else {
            sendEmail(toEmail, "Your BELLEDONNE Tax Invoice is Ready — " + order.getOrderNumber(), htmlContent);
        }
    }

    @Async
    public void sendOrderShippedEmail(String toEmail, Order order, String trackingNumber) {
        log.info("[EmailService] Email request started: Order Shipped to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", order);
            context.setVariable("trackingNumber", trackingNumber);
            htmlContent = templateEngine.process("order-shipped-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for order-shipped-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Your Order is on its Way! 🚚 — " + order.getOrderNumber(), htmlContent);
    }

    @Async
    public void sendOrderDeliveredEmail(String toEmail, Order order) {
        log.info("[EmailService] Email request started: Order Delivered to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", order);
            htmlContent = templateEngine.process("order-delivered-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for order-delivered-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Your Order Has Been Delivered! 📦 — " + order.getOrderNumber(), htmlContent);
    }

    @Async
    public void sendRefundInitiatedEmail(String toEmail, Order order, String refundId) {
        log.info("[EmailService] Email request started: Refund Initiated to {}", toEmail);
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", order);
            context.setVariable("refundId", refundId);
            htmlContent = templateEngine.process("refund-initiated-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for refund-initiated-email to {}: {}", toEmail, e.getMessage(), e);
            return;
        }
        sendEmail(toEmail, "Refund Initiated — " + order.getOrderNumber(), htmlContent);
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
    public void sendOrderStatusUpdateEmail(Order order, String statusLabel, String messageText) {
        log.info("[EmailService] Email request started: Order Status Update to {}", order.getUser().getEmail());
        String htmlContent;
        try {
            Context context = new Context();
            context.setVariable("order", order);
            context.setVariable("statusLabel", statusLabel);
            context.setVariable("messageText", messageText);
            htmlContent = templateEngine.process("order-status-update-email", context);
        } catch (Exception e) {
            log.error("[EmailService] ❌ Template rendering failure for order-status-update-email: {}", e.getMessage(), e);
            return;
        }
        sendEmail(order.getUser().getEmail(), "Order Update: #" + order.getOrderNumber() + " is " + statusLabel, htmlContent);
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
}
