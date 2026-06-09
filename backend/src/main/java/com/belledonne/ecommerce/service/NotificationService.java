package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.Notification;
import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.enums.NotificationType;
import com.belledonne.ecommerce.enums.Role;
import com.belledonne.ecommerce.repository.NotificationRepository;
import com.belledonne.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Creates a notification for a single user asynchronously (non-blocking).
     */
    @Async
    @Transactional
    public void createNotification(UUID userId, String title, String message,
                                   NotificationType type, String actionUrl) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;

            Notification n = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .actionUrl(actionUrl)
                .build();
            notificationRepository.save(n);
        } catch (Exception e) {
            log.error("Failed to create notification for userId={}: {}", userId, e.getMessage());
        }
    }

    /**
     * Creates the same notification for all admins asynchronously.
     */
    @Async
    @Transactional
    public void createAdminNotification(String title, String message,
                                        NotificationType type, String actionUrl) {
        try {
            List<User> admins = userRepository.findByRole(Role.ROLE_ADMIN);
            for (User admin : admins) {
                Notification n = Notification.builder()
                    .user(admin)
                    .title(title)
                    .message(message)
                    .type(type)
                    .actionUrl(actionUrl)
                    .build();
                notificationRepository.save(n);
            }
        } catch (Exception e) {
            log.error("Failed to create admin notification: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID userId, UUID notificationId) {
        notificationRepository.markAsReadByIdAndUserId(notificationId, userId);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }
}
