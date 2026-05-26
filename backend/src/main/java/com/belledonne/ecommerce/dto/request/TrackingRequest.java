package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TrackingRequest {
    @NotBlank(message = "Status is required")
    private String status;

    @NotBlank(message = "Message is required")
    private String message;

    private String location;
}
