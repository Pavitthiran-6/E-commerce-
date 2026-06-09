package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.Order;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.util.UUID;

/**
 * InvoiceService — generates a branded PDF invoice for an order using Thymeleaf + Flying Saucer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InvoiceService {

    private final OrderRepository orderRepository;
    private final TemplateEngine templateEngine;

    /**
     * Generates an invoice PDF for the given Order entity.
     */
    public byte[] generateInvoicePdf(Order order) {
        try {
            Context context = new Context();
            context.setVariable("order", order);
            
            // Render HTML using Thymeleaf
            String htmlContent = templateEngine.process("invoice-pdf", context);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();
            
            // Flying Saucer requires well-formed XML/XHTML
            renderer.setDocumentFromString(htmlContent);
            renderer.layout();
            renderer.createPDF(baos);
            
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate HTML-to-PDF invoice for orderId={}: {}", order.getId(), e.getMessage(), e);
            throw new RuntimeException("Invoice generation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Generates an invoice PDF by orderId with ownership and role-based checks.
     * Allowed for the order owner (customer) OR any administrator.
     */
    public byte[] generateInvoicePdf(UUID orderId, UUID userId, String userRole) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        // Enforce role-based security
        if (!"ROLE_ADMIN".equals(userRole) && !order.getUser().getId().equals(userId)) {
            log.warn("Unauthorized invoice download attempt — orderId={}, userId={}, role={}", orderId, userId, userRole);
            throw new ResourceNotFoundException("Order", "id", orderId);
        }
        
        return generateInvoicePdf(order);
    }

    /**
     * Fallback method keeping signature compatibility.
     */
    public byte[] generateInvoicePdf(UUID orderId, UUID userId) {
        return generateInvoicePdf(orderId, userId, "ROLE_USER");
    }
}
