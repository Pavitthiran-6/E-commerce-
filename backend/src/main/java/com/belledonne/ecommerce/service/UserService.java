package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.*;
import com.belledonne.ecommerce.dto.response.UserResponse;
import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.UserRepository;
import com.belledonne.ecommerce.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public UserResponse getProfile(UserPrincipal principal) {
        User user = findUser(principal.getId());
        return authService.toUserResponse(user);
    }

    public UserResponse updateProfile(UserPrincipal principal, UpdateProfileRequest request) {
        User user = findUser(principal.getId());
        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) user.setGender(request.getGender());
        return authService.toUserResponse(userRepository.save(user));
    }

    public void changePassword(UserPrincipal principal, ChangePasswordRequest request) {
        User user = findUser(principal.getId());
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void deleteAccount(UserPrincipal principal) {
        User user = findUser(principal.getId());
        userRepository.delete(user);
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }
}
