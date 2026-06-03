package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String role;
    private Boolean isEmailVerified;
    private Boolean isBlocked;
    private String blockedReason;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
