package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.service.HeroService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hero")
@RequiredArgsConstructor
@Tag(name = "Hero", description = "Public Hero Section endpoints")
public class HeroController {

    private final HeroService heroService;

    @GetMapping
    @Operation(summary = "Get current active Home Page Hero content")
    public ResponseEntity<ApiResponse<?>> getHeroSection() {
        return ResponseEntity.ok(ApiResponse.success(
            "Hero content fetched successfully",
            heroService.getHeroSection()
        ));
    }
}
