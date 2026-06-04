package com.belledonne.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingRegistration {
    private String name;
    private String email;
    private String hashedPassword;
    private String phone;
    private String otp;
    private LocalDateTime otpExpiry;
}
