package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RefundApprovalRequest {
    @Size(max = 2000, message = "Admin notes must be less than 2000 characters")
    private String adminNotes;
}
