package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.entity.Notification;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notification center")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get paginated notifications for current user")
    public ResponseEntity<ApiResponse<?>> getNotifications(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {

        Page<Notification> notifs = notificationService.getNotifications(
            principal.getId(), PageRequest.of(page, size));

        Page<Map<String, Object>> response = notifs.map(n -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("message", n.getMessage());
            m.put("type", n.getType());
            m.put("isRead", n.getIsRead());
            m.put("actionUrl", n.getActionUrl());
            m.put("createdAt", n.getCreatedAt());
            return m;
        });

        return ResponseEntity.ok(ApiResponse.success("Notifications fetched", response));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count for polling")
    public ResponseEntity<ApiResponse<?>> getUnreadCount(
        @AuthenticationPrincipal UserPrincipal principal) {

        long count = notificationService.getUnreadCount(principal.getId());
        Map<String, Object> data = Map.of(
            "unreadCount", count,
            "fetchedAt", LocalDateTime.now()
        );
        return ResponseEntity.ok(ApiResponse.success("Unread count fetched", data));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<?>> markAsRead(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id) {

        notificationService.markAsRead(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<?>> markAllAsRead(
        @AuthenticationPrincipal UserPrincipal principal) {

        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }
}
