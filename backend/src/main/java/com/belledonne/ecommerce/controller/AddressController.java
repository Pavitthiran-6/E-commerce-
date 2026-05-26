package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.AddressRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/addresses")
@RequiredArgsConstructor
@Tag(name = "Addresses", description = "Delivery address management")
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    @Operation(summary = "Get all saved addresses")
    public ResponseEntity<ApiResponse<?>> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Addresses fetched", addressService.getAll(principal)));
    }

    @PostMapping
    @Operation(summary = "Add new address")
    public ResponseEntity<ApiResponse<?>> add(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Address added", addressService.add(principal, request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update address")
    public ResponseEntity<ApiResponse<?>> update(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id,
        @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Address updated", addressService.update(principal, id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete address")
    public ResponseEntity<ApiResponse<?>> delete(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id) {
        addressService.delete(principal, id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted"));
    }

    @PutMapping("/{id}/default")
    @Operation(summary = "Set address as default")
    public ResponseEntity<ApiResponse<?>> setDefault(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Default address set", addressService.setDefault(principal, id)));
    }
}
