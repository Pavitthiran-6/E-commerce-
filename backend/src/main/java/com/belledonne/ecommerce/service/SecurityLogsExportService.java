package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.SecurityAuditLog;
import com.belledonne.ecommerce.repository.SecurityAuditLogRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
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

import java.awt.Color;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityLogsExportService {

    private final SecurityAuditLogRepository securityAuditLogRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Streams security logs as a CSV file.
     */
    public void exportLogsToCsv(OutputStream out, Specification<SecurityAuditLog> spec) throws IOException {
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(out))) {
            // Write CSV headers
            writer.write("Timestamp,User ID,Email,IP Address,User Agent,Action,Status,Details");
            writer.newLine();

            int page = 0;
            int pageSize = 1000;
            Page<SecurityAuditLog> logPage;

            do {
                Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
                logPage = securityAuditLogRepository.findAll(spec, pageable);

                for (SecurityAuditLog entry : logPage.getContent()) {
                    writer.write(escapeCsv(entry.getCreatedAt() != null ? entry.getCreatedAt().format(DATE_FORMATTER) : ""));
                    writer.write(",");
                    writer.write(escapeCsv(entry.getUserId() != null ? entry.getUserId().toString() : ""));
                    writer.write(",");
                    writer.write(escapeCsv(entry.getUserEmail()));
                    writer.write(",");
                    writer.write(escapeCsv(entry.getIpAddress()));
                    writer.write(",");
                    writer.write(escapeCsv(entry.getUserAgent()));
                    writer.write(",");
                    writer.write(escapeCsv(entry.getAction() != null ? entry.getAction().name() : ""));
                    writer.write(",");
                    writer.write(escapeCsv(entry.getStatus()));
                    writer.write(",");
                    writer.write(escapeCsv(entry.getDetails()));
                    writer.newLine();
                }
                page++;
            } while (logPage.hasNext());

            writer.flush();
        }
    }

    /**
     * Streams security logs as an Excel file using POI's streaming SXSSFWorkbook.
     */
    public void exportLogsToExcel(OutputStream out, Specification<SecurityAuditLog> spec) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) { // Keep 100 rows in memory
            Sheet sheet = workbook.createSheet("Security Audit Logs");
            
            // Enable auto-sizing for streaming sheet
            if (sheet instanceof SXSSFSheet) {
                ((SXSSFSheet) sheet).trackAllColumnsForAutoSizing();
            }

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Timestamp", "User ID", "Email", "IP Address", "User Agent", "Action", "Status", "Details"};

            // Header styling
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            int page = 0;
            int pageSize = 1000;
            Page<SecurityAuditLog> logPage;

            // Date format cell styling
            CellStyle dateStyle = workbook.createCellStyle();
            CreationHelper creationHelper = workbook.getCreationHelper();
            dateStyle.setDataFormat(creationHelper.createDataFormat().getFormat("yyyy-mm-dd hh:mm:ss"));

            do {
                Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
                logPage = securityAuditLogRepository.findAll(spec, pageable);

                for (SecurityAuditLog entry : logPage.getContent()) {
                    Row row = sheet.createRow(rowIdx++);
                    
                    // Timestamp
                    Cell timestampCell = row.createCell(0);
                    if (entry.getCreatedAt() != null) {
                        timestampCell.setCellValue(entry.getCreatedAt().format(DATE_FORMATTER));
                    }
                    
                    // User ID
                    row.createCell(1).setCellValue(entry.getUserId() != null ? entry.getUserId().toString() : "");
                    // Email
                    row.createCell(2).setCellValue(entry.getUserEmail() != null ? entry.getUserEmail() : "");
                    // IP Address
                    row.createCell(3).setCellValue(entry.getIpAddress() != null ? entry.getIpAddress() : "");
                    // User Agent
                    row.createCell(4).setCellValue(entry.getUserAgent() != null ? entry.getUserAgent() : "");
                    // Action
                    row.createCell(5).setCellValue(entry.getAction() != null ? entry.getAction().name() : "");
                    // Status
                    row.createCell(6).setCellValue(entry.getStatus() != null ? entry.getStatus() : "");
                    // Details
                    row.createCell(7).setCellValue(entry.getDetails() != null ? entry.getDetails() : "");
                }
                page++;
            } while (logPage.hasNext());

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
        }
    }

    /**
     * Streams security logs as a PDF file using OpenPDF.
     */
    public void exportLogsToPdf(OutputStream out, Specification<SecurityAuditLog> spec, Map<String, String> appliedFilters, long totalRecords) throws Exception {
        Document document = new Document(PageSize.A4.rotate()); // Landscape orientation
        PdfWriter.getInstance(document, out);
        document.open();

        // 1. Report Header
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Paragraph title = new Paragraph("BELLEDONNE SECURITY AUDIT LOGS", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(10);
        document.add(title);

        // 2. Metadata Information
        Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        Paragraph meta = new Paragraph();
        meta.add("Generated At: " + LocalDateTime.now().format(DATE_FORMATTER) + "\n");
        meta.add("Total Records: " + totalRecords + "\n");
        
        if (appliedFilters != null && !appliedFilters.isEmpty()) {
            meta.add("Applied Filters:\n");
            for (Map.Entry<String, String> filter : appliedFilters.entrySet()) {
                meta.add("  - " + filter.getKey() + ": " + filter.getValue() + "\n");
            }
        } else {
            meta.add("Applied Filters: None\n");
        }
        meta.setSpacingAfter(15);
        document.add(meta);

        // 3. Log Table
        // Columns: Timestamp, User ID, Email, IP Address, User Agent, Action, Status, Details
        float[] columnWidths = {1.5f, 2.0f, 2.0f, 1.2f, 1.5f, 1.8f, 1.0f, 3.5f};
        PdfPTable table = new PdfPTable(columnWidths);
        table.setWidthPercentage(100);

        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        headerFont.setColor(Color.WHITE);

        Color headerBackground = new Color(26, 54, 93); // Dark Indigo/Blue

        String[] headers = {"Timestamp", "User ID", "Email", "IP Address", "User Agent", "Action", "Status", "Details"};
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(headerBackground);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);
        }

        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

        int page = 0;
        int pageSize = 1000;
        Page<SecurityAuditLog> logPage;

        do {
            Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
            logPage = securityAuditLogRepository.findAll(spec, pageable);

            for (SecurityAuditLog entry : logPage.getContent()) {
                table.addCell(new Phrase(entry.getCreatedAt() != null ? entry.getCreatedAt().format(DATE_FORMATTER) : "", cellFont));
                table.addCell(new Phrase(entry.getUserId() != null ? entry.getUserId().toString() : "", cellFont));
                table.addCell(new Phrase(entry.getUserEmail() != null ? entry.getUserEmail() : "", cellFont));
                table.addCell(new Phrase(entry.getIpAddress() != null ? entry.getIpAddress() : "", cellFont));
                table.addCell(new Phrase(entry.getUserAgent() != null ? entry.getUserAgent() : "", cellFont));
                table.addCell(new Phrase(entry.getAction() != null ? entry.getAction().name() : "", cellFont));
                table.addCell(new Phrase(entry.getStatus() != null ? entry.getStatus() : "", cellFont));
                table.addCell(new Phrase(entry.getDetails() != null ? entry.getDetails() : "", cellFont));
            }
            page++;
        } while (logPage.hasNext());

        document.add(table);
        document.close();
    }

    /**
     * Helper to escape CSV cell contents according to RFC-4180.
     */
    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String val = value.trim();
        if (val.contains("\"") || val.contains(",") || val.contains("\n") || val.contains("\r")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
