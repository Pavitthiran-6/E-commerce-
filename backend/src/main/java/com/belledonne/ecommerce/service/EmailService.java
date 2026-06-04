package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
        sendEmail(toEmail, "Order Confirmed — " + order.getOrderNumber(), htmlContent);
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
}
