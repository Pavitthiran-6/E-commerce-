package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.*;
import com.belledonne.ecommerce.dto.response.AuthResponse;
import com.belledonne.ecommerce.dto.response.UserResponse;
import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.UserRepository;
import com.belledonne.ecommerce.security.JwtTokenProvider;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.util.OtpUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.belledonne.ecommerce.exception.UnauthorizedException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    private final java.util.Set<String> refreshTokenBlacklist = java.util.concurrent.ConcurrentHashMap.newKeySet();

    public String refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadRequestException("Refresh token is missing");
        }
        if (refreshTokenBlacklist.contains(refreshToken)) {
            throw new UnauthorizedException("Refresh token is blacklisted");
        }
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }
        String userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new UnauthorizedException("User not found"));
        if (user.getIsBlocked() != null && user.getIsBlocked()) {
            throw new UnauthorizedException("User account is blocked");
        }
        return tokenProvider.generateAccessTokenFromId(userId);
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenBlacklist.add(refreshToken);
        }
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists");
        }
        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .phone(request.getPhone())
            .isEmailVerified(false)
            .build();
        userRepository.save(user);
        emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        return AuthResponse.builder()
            .accessToken(tokenProvider.generateAccessToken(auth))
            .refreshToken(tokenProvider.generateRefreshToken(auth))
            .user(toUserResponse(user))
            .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
        return AuthResponse.builder()
            .accessToken(tokenProvider.generateAccessToken(auth))
            .refreshToken(tokenProvider.generateRefreshToken(auth))
            .user(toUserResponse(user))
            .build();
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));
        String otp = OtpUtil.generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    public boolean verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));
        if (user.getOtp() == null || !user.getOtp().equals(request.getOtp())) {
            throw new BadRequestException("Invalid OTP");
        }
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }
        return true;
    }

    public void resetPassword(ResetPasswordRequest request) {
        verifyOtp(new VerifyOtpRequest() {{
            setEmail(request.getEmail());
            setOtp(request.getOtp());
        }});
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .phone(user.getPhone())
            .dateOfBirth(user.getDateOfBirth())
            .gender(user.getGender())
            .role(user.getRole().name())
            .isEmailVerified(user.getIsEmailVerified())
            .isBlocked(user.getIsBlocked())
            .blockedReason(user.getBlockedReason())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
