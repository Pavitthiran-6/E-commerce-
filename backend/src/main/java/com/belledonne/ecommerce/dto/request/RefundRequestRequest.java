package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RefundRequestRequest {
    @NotBlank(message = "Cancellation reason is required")
    @Size(max = 2000, message = "Cancellation reason must be less than 2000 characters")
    private String cancellationReason;
}
