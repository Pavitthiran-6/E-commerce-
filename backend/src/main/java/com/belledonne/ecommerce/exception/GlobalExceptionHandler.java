package com.belledonne.ecommerce.exception;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private record ErrorResponse(
        boolean success,
        String message,
        String errorCode,
        LocalDateTime timestamp,
        String path,
        Object errors
    ) {}

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, String errorCode,
                                                 String path, Object errors) {
        return ResponseEntity.status(status).body(new ErrorResponse(
            false, message, errorCode, LocalDateTime.now(), path, errors
        ));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), "RESOURCE_NOT_FOUND", req.getRequestURI(), null);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), "BAD_REQUEST", req.getRequestURI(), null);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, ex.getMessage(), "UNAUTHORIZED", req.getRequestURI(), null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "Access denied", "FORBIDDEN", req.getRequestURI(), null);
    }

    @ExceptionHandler(CouponException.class)
    public ResponseEntity<ErrorResponse> handleCoupon(CouponException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), "COUPON_ERROR", req.getRequestURI(), null);
    }

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<ErrorResponse> handlePayment(PaymentException ex, HttpServletRequest req) {
        return build(HttpStatus.PAYMENT_REQUIRED, ex.getMessage(), "PAYMENT_ERROR", req.getRequestURI(), null);
    }

    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<ErrorResponse> handleExpiredJwt(ExpiredJwtException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "JWT token has expired", "TOKEN_EXPIRED", req.getRequestURI(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        return build(HttpStatus.BAD_REQUEST, "Validation failed", "VALIDATION_ERROR", req.getRequestURI(), fieldErrors);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DataIntegrityViolationException ex, HttpServletRequest req) {
        String message = ex.getMessage() != null && ex.getMessage().contains("email")
            ? "An account with this email already exists" : "Data integrity violation";
        return build(HttpStatus.CONFLICT, message, "DATA_CONFLICT", req.getRequestURI(), null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest req) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred. Please try again.",
            "INTERNAL_SERVER_ERROR", req.getRequestURI(), null);
    }
}
