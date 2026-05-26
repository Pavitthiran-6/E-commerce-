package com.belledonne.ecommerce.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateProfileRequest {
    private String name;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
}
