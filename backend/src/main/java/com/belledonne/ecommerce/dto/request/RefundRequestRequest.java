package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RefundRequestRequest {
    @NotBlank(message = "Cancellation reason is required")
    @Size(max = 500, message = "Cancellation reason must be less than 500 characters")
    private String cancellationReason;
}
