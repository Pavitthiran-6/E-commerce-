package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.HeroRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.service.HeroService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/hero")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Hero", description = "Admin endpoints for managing home page Hero Section")
public class AdminHeroController {

    private final HeroService heroService;

    @PostMapping
    @Operation(summary = "Create or overwrite Home Page Hero content")
    public ResponseEntity<ApiResponse<?>> createHeroSection(@Valid @RequestBody HeroRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
            "Hero content updated successfully",
            heroService.updateHeroSection(request)
        ));
    }

    @PutMapping
    @Operation(summary = "Update Home Page Hero content")
    public ResponseEntity<ApiResponse<?>> updateHeroSection(@Valid @RequestBody HeroRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
            "Hero content updated successfully",
            heroService.updateHeroSection(request)
        ));
    }

    @DeleteMapping("/cards/{id}")
    @Operation(summary = "Delete a promotional Hero card")
    public ResponseEntity<ApiResponse<?>> deleteHeroCard(@PathVariable Long id) {
        heroService.deleteHeroCard(id);
        return ResponseEntity.ok(ApiResponse.success("Hero card deleted successfully"));
    }
}
