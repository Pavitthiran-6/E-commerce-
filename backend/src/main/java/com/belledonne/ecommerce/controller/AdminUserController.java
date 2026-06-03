package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.dto.response.UserAdminResponse;
import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Users", description = "Admin user management endpoints")
public class AdminUserController {

    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get all registered users with metrics (paginated & searchable)")
    public ResponseEntity<ApiResponse<Page<UserAdminResponse>>> getUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<UserAdminResponse> users = userRepository.findUsersWithMetrics(search.trim(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Users fetched successfully", users));
    }

    @PutMapping("/{id}/toggle-block")
    @Operation(summary = "Toggle a user's block status")
    public ResponseEntity<ApiResponse<?>> toggleBlock(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        boolean currentlyBlocked = user.getIsBlocked() != null && user.getIsBlocked();
        if (currentlyBlocked) {
            user.setIsBlocked(false);
            user.setBlockedReason(null);
        } else {
            user.setIsBlocked(true);
            String reason = body != null ? body.get("reason") : null;
            user.setBlockedReason(reason != null && !reason.isBlank() ? reason.trim() : "Blocked by administrator");
        }
        
        userRepository.save(user);
        
        String action = user.getIsBlocked() ? "blocked" : "unblocked";
        return ResponseEntity.ok(ApiResponse.success("User successfully " + action, user));
    }
}
