package com.belledonne.ecommerce.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", "HEALTHY");
        response.put("message", "Belledonne E-Commerce Backend API is active and running!");
        return ResponseEntity.ok(response);
    }
}
