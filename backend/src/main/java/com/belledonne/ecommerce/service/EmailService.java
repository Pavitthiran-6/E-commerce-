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

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from:noreply@belledonne.in}")
    private String fromEmail;

    @Async
    public void sendWelcomeEmail(String toEmail, String name) {
        Context context = new Context();
        context.setVariable("name", name);
        String htmlContent = templateEngine.process("welcome-email", context);
        sendEmail(toEmail, "Welcome to BELLEDONNE! 🎉", htmlContent);
    }

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        Context context = new Context();
        context.setVariable("otp", otp);
        String htmlContent = templateEngine.process("otp-email", context);
        sendEmail(toEmail, "Your Password Reset OTP", htmlContent);
    }

    @Async
    public void sendAccountLockedEmail(String toEmail, String name) {
        Context context = new Context();
        context.setVariable("name", name);
        String htmlContent = templateEngine.process("account-locked-email", context);
        sendEmail(toEmail, "Security Alert - Account Temporarily Locked", htmlContent);
    }

    @Async
    public void sendOrderConfirmationEmail(String toEmail, Order order) {
        Context context = new Context();
        context.setVariable("order", order);
        String htmlContent = templateEngine.process("order-confirmation-email", context);
        sendEmail(toEmail, "Order Confirmed — " + order.getOrderNumber(), htmlContent);
    }

    @Async
    public void sendOrderShippedEmail(String toEmail, Order order, String trackingNumber) {
        Context context = new Context();
        context.setVariable("order", order);
        context.setVariable("trackingNumber", trackingNumber);
        String htmlContent = templateEngine.process("order-shipped-email", context);
        sendEmail(toEmail, "Your Order is on its Way! 🚚 — " + order.getOrderNumber(), htmlContent);
    }

    @Async
    public void sendOrderDeliveredEmail(String toEmail, Order order) {
        Context context = new Context();
        context.setVariable("order", order);
        String htmlContent = templateEngine.process("order-delivered-email", context);
        sendEmail(toEmail, "Your Order Has Been Delivered! 📦 — " + order.getOrderNumber(), htmlContent);
    }

    @Value("${app.security.alert-email:admin@belledonne.in}")
    private String adminAlertEmail;

    @Async
    public void sendSecurityAlertEmail(String triggerType, String ipAddress, String timeWindow, String details) {
        Context context = new Context();
        context.setVariable("triggerType", triggerType);
        context.setVariable("ipAddress", ipAddress);
        context.setVariable("timeWindow", timeWindow);
        context.setVariable("details", details);
        String htmlContent = templateEngine.process("security-alert-email", context);
        sendEmail(adminAlertEmail, "🚨 Security Alert Detected - " + triggerType, htmlContent);
    }

    private void sendEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
