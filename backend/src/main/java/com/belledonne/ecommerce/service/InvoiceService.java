package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.Order;
import com.belledonne.ecommerce.entity.OrderItem;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.OrderRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * InvoiceService — generates a branded PDF invoice for an order using OpenPDF.
 *
 * OpenPDF (com.github.librepdf:openpdf) is a free, LGPLv2 fork of iText 4
 * that is already in pom.xml. It runs fully in-process, requires no external
 * service, and produces consistent PDFs across all platforms.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InvoiceService {

    private final OrderRepository orderRepository;

    // Brand colours (matching the email templates)
    private static final Color BRAND_DARK  = new Color(26, 26, 46);   // #1a1a2e
    private static final Color BRAND_GOLD  = new Color(201, 169, 110); // #c9a96e
    private static final Color BRAND_LIGHT = new Color(248, 247, 244); // #f8f7f4
    private static final Color GRAY_TEXT   = new Color(102, 102, 102);
    private static final Color BORDER      = new Color(224, 220, 211); // #e0dcd3
    private static final Color SUCCESS     = new Color(40, 167, 69);

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC ENTRY POINTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generates an invoice PDF for the given Order entity (used internally by
     * PaymentService so no ownership check needed — caller already verified it).
     */
    public byte[] generateInvoicePdf(Order order) {
        try {
            return buildPdf(order);
        } catch (Exception e) {
            log.error("Failed to generate invoice PDF for orderId={}: {}", order.getId(), e.getMessage(), e);
            throw new RuntimeException("Invoice generation failed", e);
        }
    }

    /**
     * Generates an invoice PDF by orderId with ownership check — called from
     * the HTTP endpoint so users can only download their own invoices.
     */
    public byte[] generateInvoicePdf(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (!order.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Order", "id", orderId);
        }
        return generateInvoicePdf(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PDF BUILDER
    // ─────────────────────────────────────────────────────────────────────────

    private byte[] buildPdf(Order order) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter writer = PdfWriter.getInstance(doc, baos);
        doc.open();

        // ── Fonts ──────────────────────────────────────────────────────────
        Font titleFont    = new Font(Font.HELVETICA, 22, Font.BOLD, Color.WHITE);
        Font subtitleFont = new Font(Font.HELVETICA, 9,  Font.NORMAL, BRAND_GOLD);
        Font headingFont  = new Font(Font.HELVETICA, 13, Font.BOLD, BRAND_DARK);
        Font labelFont    = new Font(Font.HELVETICA, 9,  Font.NORMAL, GRAY_TEXT);
        Font valueFont    = new Font(Font.HELVETICA, 9,  Font.BOLD, BRAND_DARK);
        Font normalFont   = new Font(Font.HELVETICA, 9,  Font.NORMAL, BRAND_DARK);
        Font tableHeader  = new Font(Font.HELVETICA, 9,  Font.BOLD, Color.WHITE);
        Font totalFont    = new Font(Font.HELVETICA, 11, Font.BOLD, BRAND_DARK);
        Font smallGray    = new Font(Font.HELVETICA, 8,  Font.NORMAL, GRAY_TEXT);

        // ── Header band ───────────────────────────────────────────────────
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{1.5f, 1f});

        PdfPCell brandCell = new PdfPCell();
        brandCell.setBackgroundColor(BRAND_DARK);
        brandCell.setPadding(20);
        brandCell.setBorder(Rectangle.NO_BORDER);
        Paragraph brand = new Paragraph("BELLEDONNE", titleFont);
        brand.add(Chunk.NEWLINE);
        Phrase parisTag = new Phrase("PARIS", subtitleFont);
        brand.add(parisTag);
        brandCell.addElement(brand);
        header.addCell(brandCell);

        PdfPCell invoiceCell = new PdfPCell();
        invoiceCell.setBackgroundColor(BRAND_DARK);
        invoiceCell.setPadding(20);
        invoiceCell.setBorder(Rectangle.NO_BORDER);
        invoiceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Font invoiceLabel = new Font(Font.HELVETICA, 18, Font.BOLD, BRAND_GOLD);
        Font invNumFont   = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.WHITE);
        Paragraph invoiceTitle = new Paragraph("INVOICE", invoiceLabel);
        invoiceTitle.setAlignment(Element.ALIGN_RIGHT);
        String dateStr = order.getCreatedAt() != null
            ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
            : "—";
        Paragraph invNum = new Paragraph(order.getOrderNumber(), invNumFont);
        invNum.setAlignment(Element.ALIGN_RIGHT);
        Paragraph invDate = new Paragraph("Date: " + dateStr, new Font(Font.HELVETICA, 9, Font.NORMAL, new Color(165, 165, 181)));
        invDate.setAlignment(Element.ALIGN_RIGHT);
        invoiceCell.addElement(invoiceTitle);
        invoiceCell.addElement(invNum);
        invoiceCell.addElement(invDate);
        header.addCell(invoiceCell);
        doc.add(header);

        doc.add(new Paragraph(" ")); // spacer

        // ── Order info + Address ──────────────────────────────────────────
        PdfPTable infoSection = new PdfPTable(2);
        infoSection.setWidthPercentage(100);
        infoSection.setWidths(new float[]{1f, 1f});
        infoSection.setSpacingBefore(10);

        // Left: order meta
        PdfPCell orderMetaCell = new PdfPCell();
        orderMetaCell.setBorderColor(BORDER);
        orderMetaCell.setBackgroundColor(BRAND_LIGHT);
        orderMetaCell.setPadding(14);
        orderMetaCell.setBorderWidth(0.5f);
        addKeyValue(orderMetaCell, "Order Number", order.getOrderNumber(), labelFont, valueFont);
        addKeyValue(orderMetaCell, "Order Status", prettify(order.getStatus().name()), labelFont, valueFont);
        addKeyValue(orderMetaCell, "Payment Method", order.getPaymentMethod() != null ? prettify(order.getPaymentMethod().name()) : "—", labelFont, valueFont);
        addKeyValue(orderMetaCell, "Payment Status", order.getPaymentStatus() != null ? prettify(order.getPaymentStatus().name()) : "—", labelFont, valueFont);
        if (order.getEstimatedDelivery() != null) {
            addKeyValue(orderMetaCell, "Est. Delivery", order.getEstimatedDelivery().toString(), labelFont, valueFont);
        }
        infoSection.addCell(orderMetaCell);

        // Right: delivery address
        PdfPCell addrCell = new PdfPCell();
        addrCell.setBorderColor(BORDER);
        addrCell.setBackgroundColor(BRAND_LIGHT);
        addrCell.setPadding(14);
        addrCell.setBorderWidth(0.5f);
        Paragraph addrTitle = new Paragraph("Ship To", headingFont);
        addrTitle.setSpacingAfter(6);
        addrCell.addElement(addrTitle);
        if (order.getAddress() != null) {
            addrCell.addElement(new Paragraph(order.getAddress().getFullName(), valueFont));
            addrCell.addElement(new Paragraph(order.getAddress().getAddressLine1(), normalFont));
            if (order.getAddress().getAddressLine2() != null && !order.getAddress().getAddressLine2().isBlank()) {
                addrCell.addElement(new Paragraph(order.getAddress().getAddressLine2(), normalFont));
            }
            addrCell.addElement(new Paragraph(
                order.getAddress().getCity() + ", " + order.getAddress().getState() + " - " + order.getAddress().getPincode(),
                normalFont));
            addrCell.addElement(new Paragraph("Phone: " + order.getAddress().getPhone(), normalFont));
        } else {
            addrCell.addElement(new Paragraph("—", normalFont));
        }
        infoSection.addCell(addrCell);
        doc.add(infoSection);

        doc.add(new Paragraph(" "));

        // ── Items table ───────────────────────────────────────────────────
        PdfPTable itemsTable = new PdfPTable(5);
        itemsTable.setWidthPercentage(100);
        itemsTable.setWidths(new float[]{3.5f, 1f, 1f, 1f, 1.2f});
        itemsTable.setSpacingBefore(4);

        String[] cols = {"Product", "Size", "Qty", "Unit Price", "Total"};
        for (String col : cols) {
            PdfPCell th = new PdfPCell(new Phrase(col, tableHeader));
            th.setBackgroundColor(BRAND_DARK);
            th.setPadding(8);
            th.setBorder(Rectangle.NO_BORDER);
            th.setHorizontalAlignment(col.equals("Unit Price") || col.equals("Total") ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
            itemsTable.addCell(th);
        }

        boolean alt = false;
        for (OrderItem item : order.getItems()) {
            Color rowBg = alt ? new Color(243, 242, 238) : Color.WHITE;
            addItemRow(itemsTable, item, normalFont, labelFont, rowBg);
            alt = !alt;
        }
        doc.add(itemsTable);

        doc.add(new Paragraph(" "));

        // ── Totals ────────────────────────────────────────────────────────
        PdfPTable totals = new PdfPTable(2);
        totals.setWidthPercentage(45);
        totals.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totals.setWidths(new float[]{1.5f, 1f});

        addTotalRow(totals, "Subtotal",        formatAmount(order.getSubtotal()),        labelFont, normalFont, false, BRAND_DARK);
        addTotalRow(totals, "Shipping",        formatAmount(order.getShippingCharge()),  labelFont, normalFont, false, BRAND_DARK);
        addTotalRow(totals, "GST (18%)",       formatAmount(order.getTaxAmount()),       labelFont, normalFont, false, BRAND_DARK);
        if (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            addTotalRow(totals, "Discount", "-" + formatAmount(order.getDiscountAmount()), labelFont,
                new Font(Font.HELVETICA, 9, Font.NORMAL, SUCCESS), false, BRAND_DARK);
        }

        // Separator row
        PdfPCell sep1 = new PdfPCell(new Phrase(""));
        PdfPCell sep2 = new PdfPCell(new Phrase(""));
        sep1.setBorder(Rectangle.TOP); sep1.setBorderColor(BRAND_DARK); sep1.setPadding(2);
        sep2.setBorder(Rectangle.TOP); sep2.setBorderColor(BRAND_DARK); sep2.setPadding(2);
        totals.addCell(sep1); totals.addCell(sep2);

        addTotalRow(totals, "TOTAL PAID",     formatAmount(order.getTotalAmount()),     totalFont, totalFont, true, BRAND_DARK);
        doc.add(totals);

        // ── Footer ────────────────────────────────────────────────────────
        doc.add(new Paragraph(" "));
        Paragraph footer = new Paragraph(
            "Thank you for shopping with BELLEDONNE.\nFor support: support@belledonne.in | belledonne.in",
            smallGray);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(20);
        doc.add(footer);

        doc.close();
        return baos.toByteArray();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private void addKeyValue(PdfPCell cell, String key, String value, Font keyFont, Font valFont) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(key + ": ", keyFont));
        p.add(new Chunk(value, valFont));
        p.setSpacingAfter(4);
        cell.addElement(p);
    }

    private void addItemRow(PdfPTable table, OrderItem item, Font font, Font small, Color bg) {
        PdfPCell name = new PdfPCell(new Phrase(item.getProductName(), font));
        name.setBackgroundColor(bg); name.setPadding(7); name.setBorderColor(BORDER); name.setBorderWidth(0.5f);
        if (item.getColor() != null && !item.getColor().isBlank()) {
            name.addElement(new Paragraph("Color: " + item.getColor(), small));
        }
        table.addCell(name);

        table.addCell(styledCell(item.getSize() != null ? item.getSize() : "—", font, bg, Element.ALIGN_LEFT));
        table.addCell(styledCell(String.valueOf(item.getQuantity()), font, bg, Element.ALIGN_LEFT));
        table.addCell(styledCell(formatAmount(item.getUnitPrice()), font, bg, Element.ALIGN_RIGHT));
        table.addCell(styledCell(formatAmount(item.getTotalPrice()), font, bg, Element.ALIGN_RIGHT));
    }

    private PdfPCell styledCell(String text, Font font, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(7);
        cell.setBorderColor(BORDER);
        cell.setBorderWidth(0.5f);
        cell.setHorizontalAlignment(align);
        return cell;
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font lFont, Font vFont, boolean highlight, Color bg) {
        PdfPCell lc = new PdfPCell(new Phrase(label, lFont));
        PdfPCell vc = new PdfPCell(new Phrase(value, vFont));
        lc.setBorder(Rectangle.NO_BORDER); lc.setPadding(4); lc.setHorizontalAlignment(Element.ALIGN_LEFT);
        vc.setBorder(Rectangle.NO_BORDER); vc.setPadding(4); vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        if (highlight) {
            lc.setBackgroundColor(BRAND_LIGHT);
            vc.setBackgroundColor(BRAND_LIGHT);
        }
        table.addCell(lc);
        table.addCell(vc);
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "₹0.00";
        return "₹" + amount.toPlainString();
    }

    private String prettify(String enumName) {
        if (enumName == null) return "—";
        return enumName.charAt(0) + enumName.substring(1).toLowerCase().replace('_', ' ');
    }
}
