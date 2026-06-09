package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.Order;
import com.belledonne.ecommerce.entity.Product;
import com.belledonne.ecommerce.entity.RefundRequest;
import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.enums.RefundStatus;
import com.belledonne.ecommerce.repository.OrderRepository;
import com.belledonne.ecommerce.repository.ProductRepository;
import com.belledonne.ecommerce.repository.RefundRequestRepository;
import com.belledonne.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportsExportService {

    private final OrderRepository orderRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // ── Orders ────────────────────────────────────────────────────────────────

    public void exportOrdersToCsv(OutputStream out, LocalDateTime from, LocalDateTime to, OrderStatus status) throws IOException {
        try (BufferedWriter w = new BufferedWriter(new OutputStreamWriter(out))) {
            w.write("Order#,Date,Customer,Email,Phone,Items,Subtotal,Discount,Coupon,Tax,Total,Payment Method,Payment Status,Status");
            w.newLine();

            Specification<Order> spec = buildOrderSpec(from, to, status);
            int page = 0;
            Page<Order> pg;
            do {
                Pageable pageable = PageRequest.of(page, 500, Sort.by("createdAt").descending());
                pg = orderRepository.findAll(spec, pageable);
                for (Order o : pg.getContent()) {
                    w.write(csv(o.getOrderNumber()));
                    w.write("," + csv(o.getCreatedAt() != null ? o.getCreatedAt().format(FMT) : ""));
                    w.write("," + csv(o.getAddress() != null ? o.getAddress().getFullName() : ""));
                    w.write("," + csv(o.getUser() != null ? o.getUser().getEmail() : ""));
                    w.write("," + csv(o.getAddress() != null ? o.getAddress().getPhone() : ""));
                    w.write("," + (o.getItems() != null ? o.getItems().size() : 0));
                    w.write("," + csv(o.getSubtotal() != null ? o.getSubtotal().toPlainString() : "0"));
                    w.write("," + csv(o.getDiscountAmount() != null ? o.getDiscountAmount().toPlainString() : "0"));
                    w.write("," + csv(o.getCouponCode()));
                    w.write("," + csv(o.getTaxAmount() != null ? o.getTaxAmount().toPlainString() : "0"));
                    w.write("," + csv(o.getTotalAmount() != null ? o.getTotalAmount().toPlainString() : "0"));
                    w.write("," + csv(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : ""));
                    w.write("," + csv(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : ""));
                    w.write("," + csv(o.getStatus() != null ? o.getStatus().name() : ""));
                    w.newLine();
                }
                page++;
            } while (pg.hasNext());
            w.flush();
        }
    }

    public void exportOrdersToExcel(OutputStream out, LocalDateTime from, LocalDateTime to, OrderStatus status) throws IOException {
        String[] headers = {"Order#", "Date", "Customer", "Email", "Phone", "Items", "Subtotal", "Discount", "Coupon", "Tax", "Total", "Payment Method", "Payment Status", "Status"};
        try (SXSSFWorkbook wb = new SXSSFWorkbook(100)) {
            Sheet sheet = wb.createSheet("Orders");
            if (sheet instanceof SXSSFSheet s) s.trackAllColumnsForAutoSizing();

            CellStyle hStyle = headerStyle(wb);
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) { Cell c = hRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(hStyle); }

            int rowIdx = 1;
            Specification<Order> spec = buildOrderSpec(from, to, status);
            int page = 0;
            Page<Order> pg;
            do {
                Pageable pageable = PageRequest.of(page, 500, Sort.by("createdAt").descending());
                pg = orderRepository.findAll(spec, pageable);
                for (Order o : pg.getContent()) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(safe(o.getOrderNumber()));
                    row.createCell(1).setCellValue(o.getCreatedAt() != null ? o.getCreatedAt().format(FMT) : "");
                    row.createCell(2).setCellValue(o.getAddress() != null ? safe(o.getAddress().getFullName()) : "");
                    row.createCell(3).setCellValue(o.getUser() != null ? safe(o.getUser().getEmail()) : "");
                    row.createCell(4).setCellValue(o.getAddress() != null ? safe(o.getAddress().getPhone()) : "");
                    row.createCell(5).setCellValue(o.getItems() != null ? o.getItems().size() : 0);
                    row.createCell(6).setCellValue(o.getSubtotal() != null ? o.getSubtotal().doubleValue() : 0);
                    row.createCell(7).setCellValue(o.getDiscountAmount() != null ? o.getDiscountAmount().doubleValue() : 0);
                    row.createCell(8).setCellValue(safe(o.getCouponCode()));
                    row.createCell(9).setCellValue(o.getTaxAmount() != null ? o.getTaxAmount().doubleValue() : 0);
                    row.createCell(10).setCellValue(o.getTotalAmount() != null ? o.getTotalAmount().doubleValue() : 0);
                    row.createCell(11).setCellValue(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "");
                    row.createCell(12).setCellValue(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "");
                    row.createCell(13).setCellValue(o.getStatus() != null ? o.getStatus().name() : "");
                }
                page++;
            } while (pg.hasNext());

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
        }
    }

    // ── Refunds ───────────────────────────────────────────────────────────────

    public void exportRefundsToCsv(OutputStream out, LocalDateTime from, LocalDateTime to, RefundStatus status) throws IOException {
        try (BufferedWriter w = new BufferedWriter(new OutputStreamWriter(out))) {
            w.write("Refund ID,Order#,Customer,Email,Amount,Reason,Status,Razorpay Refund ID,Failure Reason,Requested At,Reviewed At");
            w.newLine();

            Specification<RefundRequest> spec = buildRefundSpec(from, to, status);
            int page = 0;
            Page<RefundRequest> pg;
            do {
                Pageable pageable = PageRequest.of(page, 500, Sort.by("requestedAt").descending());
                pg = refundRequestRepository.findAll(spec, pageable);
                for (RefundRequest r : pg.getContent()) {
                    w.write(csv(r.getId().toString()));
                    w.write("," + csv(r.getOrder() != null ? r.getOrder().getOrderNumber() : ""));
                    w.write("," + csv(r.getUser() != null ? r.getUser().getName() : ""));
                    w.write("," + csv(r.getUser() != null ? r.getUser().getEmail() : ""));
                    w.write("," + csv(r.getRefundAmount() != null ? r.getRefundAmount().toPlainString() : "0"));
                    w.write("," + csv(r.getCancellationReason()));
                    w.write("," + csv(r.getRefundStatus() != null ? r.getRefundStatus().name() : ""));
                    w.write("," + csv(r.getRazorpayRefundId()));
                    w.write("," + csv(r.getRazorpayRefundFailureReason()));
                    w.write("," + csv(r.getRequestedAt() != null ? r.getRequestedAt().format(FMT) : ""));
                    w.write("," + csv(r.getReviewedAt() != null ? r.getReviewedAt().format(FMT) : ""));
                    w.newLine();
                }
                page++;
            } while (pg.hasNext());
            w.flush();
        }
    }

    public void exportRefundsToExcel(OutputStream out, LocalDateTime from, LocalDateTime to, RefundStatus status) throws IOException {
        String[] headers = {"Refund ID", "Order#", "Customer", "Email", "Amount", "Reason", "Status", "Razorpay ID", "Failure Reason", "Requested At", "Reviewed At"};
        try (SXSSFWorkbook wb = new SXSSFWorkbook(100)) {
            Sheet sheet = wb.createSheet("Refunds");
            if (sheet instanceof SXSSFSheet s) s.trackAllColumnsForAutoSizing();

            CellStyle hStyle = headerStyle(wb);
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) { Cell c = hRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(hStyle); }

            int rowIdx = 1;
            Specification<RefundRequest> spec = buildRefundSpec(from, to, status);
            int page = 0;
            Page<RefundRequest> pg;
            do {
                Pageable pageable = PageRequest.of(page, 500, Sort.by("requestedAt").descending());
                pg = refundRequestRepository.findAll(spec, pageable);
                for (RefundRequest r : pg.getContent()) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(safe(r.getId().toString()));
                    row.createCell(1).setCellValue(r.getOrder() != null ? safe(r.getOrder().getOrderNumber()) : "");
                    row.createCell(2).setCellValue(r.getUser() != null ? safe(r.getUser().getName()) : "");
                    row.createCell(3).setCellValue(r.getUser() != null ? safe(r.getUser().getEmail()) : "");
                    row.createCell(4).setCellValue(r.getRefundAmount() != null ? r.getRefundAmount().doubleValue() : 0);
                    row.createCell(5).setCellValue(safe(r.getCancellationReason()));
                    row.createCell(6).setCellValue(r.getRefundStatus() != null ? r.getRefundStatus().name() : "");
                    row.createCell(7).setCellValue(safe(r.getRazorpayRefundId()));
                    row.createCell(8).setCellValue(safe(r.getRazorpayRefundFailureReason()));
                    row.createCell(9).setCellValue(r.getRequestedAt() != null ? r.getRequestedAt().format(FMT) : "");
                    row.createCell(10).setCellValue(r.getReviewedAt() != null ? r.getReviewedAt().format(FMT) : "");
                }
                page++;
            } while (pg.hasNext());

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
        }
    }

    // ── Inventory ─────────────────────────────────────────────────────────────

    public void exportInventoryToCsv(OutputStream out) throws IOException {
        try (BufferedWriter w = new BufferedWriter(new OutputStreamWriter(out))) {
            w.write("Product ID,Name,Brand,Category,Price,Stock,Low Stock Threshold,Status");
            w.newLine();

            int page = 0;
            Page<Product> pg;
            do {
                Pageable pageable = PageRequest.of(page, 500, Sort.by("name").ascending());
                pg = productRepository.findAll(pageable);
                for (Product p : pg.getContent()) {
                    w.write(csv(p.getId().toString()));
                    w.write("," + csv(p.getName()));
                    w.write("," + csv(p.getBrand()));
                    w.write("," + csv(p.getCategory() != null ? p.getCategory().getName() : ""));
                    w.write("," + csv(p.getPrice() != null ? p.getPrice().toPlainString() : "0"));
                    w.write("," + (p.getStockQuantity() != null ? p.getStockQuantity() : 0));
                    w.write("," + (p.getLowStockThreshold() != null ? p.getLowStockThreshold() : 5));
                    String stockStatus = p.getStockQuantity() == null || p.getStockQuantity() == 0 ? "OUT_OF_STOCK"
                        : p.getLowStockThreshold() != null && p.getStockQuantity() <= p.getLowStockThreshold() ? "LOW_STOCK"
                        : "IN_STOCK";
                    w.write("," + stockStatus);
                    w.newLine();
                }
                page++;
            } while (pg.hasNext());
            w.flush();
        }
    }

    public void exportInventoryToExcel(OutputStream out) throws IOException {
        String[] headers = {"Product ID", "Name", "Brand", "Category", "Price", "Stock", "Low Stock Threshold", "Status"};
        try (SXSSFWorkbook wb = new SXSSFWorkbook(100)) {
            Sheet sheet = wb.createSheet("Inventory");
            if (sheet instanceof SXSSFSheet s) s.trackAllColumnsForAutoSizing();

            CellStyle hStyle = headerStyle(wb);
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) { Cell c = hRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(hStyle); }

            int rowIdx = 1;
            int page = 0;
            Page<Product> pg;
            do {
                Pageable pageable = PageRequest.of(page, 500, Sort.by("name").ascending());
                pg = productRepository.findAll(pageable);
                for (Product p : pg.getContent()) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(safe(p.getId().toString()));
                    row.createCell(1).setCellValue(safe(p.getName()));
                    row.createCell(2).setCellValue(safe(p.getBrand()));
                    row.createCell(3).setCellValue(p.getCategory() != null ? safe(p.getCategory().getName()) : "");
                    row.createCell(4).setCellValue(p.getPrice() != null ? p.getPrice().doubleValue() : 0);
                    row.createCell(5).setCellValue(p.getStockQuantity() != null ? p.getStockQuantity() : 0);
                    row.createCell(6).setCellValue(p.getLowStockThreshold() != null ? p.getLowStockThreshold() : 5);
                    String ss = p.getStockQuantity() == null || p.getStockQuantity() == 0 ? "OUT_OF_STOCK"
                        : p.getLowStockThreshold() != null && p.getStockQuantity() <= p.getLowStockThreshold() ? "LOW_STOCK"
                        : "IN_STOCK";
                    row.createCell(7).setCellValue(ss);
                }
                page++;
            } while (pg.hasNext());

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
        }
    }

    // ── Customers ─────────────────────────────────────────────────────────────

    public void exportCustomersToCsv(OutputStream out, LocalDateTime from, LocalDateTime to) throws IOException {
        try (BufferedWriter w = new BufferedWriter(new OutputStreamWriter(out))) {
            w.write("Customer ID,Name,Email,Phone,Gender,Role,Email Verified,Blocked,Joined At,Last Login");
            w.newLine();

            Specification<User> spec = buildUserSpec(from, to);
            int page = 0;
            Page<User> pg;
            do {
                Pageable pageable = PageRequest.of(page, 500, Sort.by("createdAt").descending());
                pg = userRepository.findAll(spec, pageable);
                for (User u : pg.getContent()) {
                    w.write(csv(u.getId().toString()));
                    w.write("," + csv(u.getName()));
                    w.write("," + csv(u.getEmail()));
                    w.write("," + csv(u.getPhone()));
                    w.write("," + csv(u.getGender()));
                    w.write("," + csv(u.getRole() != null ? u.getRole().name() : ""));
                    w.write("," + (Boolean.TRUE.equals(u.getIsEmailVerified()) ? "Yes" : "No"));
                    w.write("," + (Boolean.TRUE.equals(u.getIsBlocked()) ? "Yes" : "No"));
                    w.write("," + csv(u.getCreatedAt() != null ? u.getCreatedAt().format(FMT) : ""));
                    w.write("," + csv(u.getLastLoginAt() != null ? u.getLastLoginAt().format(FMT) : ""));
                    w.newLine();
                }
                page++;
            } while (pg.hasNext());
            w.flush();
        }
    }

    public void exportCustomersToExcel(OutputStream out, LocalDateTime from, LocalDateTime to) throws IOException {
        String[] headers = {"Customer ID", "Name", "Email", "Phone", "Gender", "Role", "Email Verified", "Blocked", "Joined At", "Last Login"};
        try (SXSSFWorkbook wb = new SXSSFWorkbook(100)) {
            Sheet sheet = wb.createSheet("Customers");
            if (sheet instanceof SXSSFSheet s) s.trackAllColumnsForAutoSizing();

            CellStyle hStyle = headerStyle(wb);
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) { Cell c = hRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(hStyle); }

            int rowIdx = 1;
            Specification<User> spec = buildUserSpec(from, to);
            int page = 0;
            Page<User> pg;
            do {
                Pageable pageable = PageRequest.of(page, 500, Sort.by("createdAt").descending());
                pg = userRepository.findAll(spec, pageable);
                for (User u : pg.getContent()) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(safe(u.getId().toString()));
                    row.createCell(1).setCellValue(safe(u.getName()));
                    row.createCell(2).setCellValue(safe(u.getEmail()));
                    row.createCell(3).setCellValue(safe(u.getPhone()));
                    row.createCell(4).setCellValue(safe(u.getGender()));
                    row.createCell(5).setCellValue(u.getRole() != null ? u.getRole().name() : "");
                    row.createCell(6).setCellValue(Boolean.TRUE.equals(u.getIsEmailVerified()) ? "Yes" : "No");
                    row.createCell(7).setCellValue(Boolean.TRUE.equals(u.getIsBlocked()) ? "Yes" : "No");
                    row.createCell(8).setCellValue(u.getCreatedAt() != null ? u.getCreatedAt().format(FMT) : "");
                    row.createCell(9).setCellValue(u.getLastLoginAt() != null ? u.getLastLoginAt().format(FMT) : "");
                }
                page++;
            } while (pg.hasNext());

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Specification<Order> buildOrderSpec(LocalDateTime from, LocalDateTime to, OrderStatus status) {
        return (root, query, cb) -> {
            var preds = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (from   != null) preds.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to     != null) preds.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            if (status != null) preds.add(cb.equal(root.get("status"), status));
            return cb.and(preds.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private Specification<RefundRequest> buildRefundSpec(LocalDateTime from, LocalDateTime to, RefundStatus status) {
        return (root, query, cb) -> {
            var preds = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (from   != null) preds.add(cb.greaterThanOrEqualTo(root.get("requestedAt"), from));
            if (to     != null) preds.add(cb.lessThanOrEqualTo(root.get("requestedAt"), to));
            if (status != null) preds.add(cb.equal(root.get("refundStatus"), status));
            return cb.and(preds.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private Specification<User> buildUserSpec(LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            var preds = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (from != null) preds.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to   != null) preds.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            return cb.and(preds.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private CellStyle headerStyle(Workbook wb) {
        org.apache.poi.ss.usermodel.Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private String csv(String val) {
        if (val == null) return "";
        String v = val.trim();
        if (v.contains("\"") || v.contains(",") || v.contains("\n")) return "\"" + v.replace("\"", "\"\"") + "\"";
        return v;
    }

    private String safe(String val) { return val != null ? val : ""; }
}
