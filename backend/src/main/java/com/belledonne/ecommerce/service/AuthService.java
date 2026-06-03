package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.*;
import com.belledonne.ecommerce.dto.response.AuthResponse;
import com.belledonne.ecommerce.dto.response.UserResponse;
import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.exception.AccountLockedException;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.UserRepository;
import com.belledonne.ecommerce.security.JwtTokenProvider;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.util.OtpUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.belledonne.ecommerce.exception.UnauthorizedException;
import com.belledonne.ecommerce.enums.SecurityAction;
import jakarta.servlet.http.HttpServletRequest;
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
    private final TokenBlacklistService tokenBlacklistService;
    private final LoginLockoutService loginLockoutService;
    private final SecurityAuditService securityAuditService;
    private final HttpServletRequest request;

    public String refreshToken(String refreshToken) {
        String ip = SecurityAuditService.getClientIp(this.request);
        String ua = this.request.getHeader("User-Agent");

        if (refreshToken == null || refreshToken.isBlank()) {
            securityAuditService.log(null, null, SecurityAction.TOKEN_REFRESH, ip, ua, "FAILED", "Refresh token is missing");
            throw new BadRequestException("Refresh token is missing");
        }
        if (tokenBlacklistService.isBlacklisted(refreshToken)) {
            securityAuditService.log(null, null, SecurityAction.TOKEN_REFRESH, ip, ua, "FAILED", "Refresh token is blacklisted");
            throw new UnauthorizedException("Refresh token is blacklisted");
        }
        if (!tokenProvider.validateToken(refreshToken)) {
            securityAuditService.log(null, null, SecurityAction.TOKEN_REFRESH, ip, ua, "FAILED", "Refresh token is invalid or expired");
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }
        String userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new UnauthorizedException("User not found"));
        if (user.getIsBlocked() != null && user.getIsBlocked()) {
            securityAuditService.log(user.getId(), user.getEmail(), SecurityAction.TOKEN_REFRESH, ip, ua, "FAILED", "User account is blocked");
            throw new UnauthorizedException("User account is blocked");
        }

        securityAuditService.log(user.getId(), user.getEmail(), SecurityAction.TOKEN_REFRESH, ip, ua, "SUCCESS", "Token refreshed successfully");
        return tokenProvider.generateAccessTokenFromId(userId);
    }

    public void logout(String refreshToken) {
        String ip = SecurityAuditService.getClientIp(this.request);
        String ua = this.request.getHeader("User-Agent");
        UUID userId = null;
        String email = null;
        try {
            if (refreshToken != null && !refreshToken.isBlank()) {
                String id = tokenProvider.getUserIdFromToken(refreshToken);
                userId = UUID.fromString(id);
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) email = user.getEmail();
            }
        } catch (Exception ignored) {}

        tokenBlacklistService.blacklist(refreshToken);
        securityAuditService.log(userId, email, SecurityAction.LOGOUT, ip, ua, "SUCCESS", "Logged out successfully");
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
            .lastLoginAt(LocalDateTime.now())
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
        String ip = SecurityAuditService.getClientIp(this.request);
        String ua = this.request.getHeader("User-Agent");

        User user;
        try {
            user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        } catch (UnauthorizedException e) {
            securityAuditService.log(null, request.getEmail(), SecurityAction.LOGIN_FAILED, ip, ua, "FAILED", "Invalid email or password");
            throw e;
        }

        // Check if account is currently locked
        if (loginLockoutService.isLocked(user)) {
            LocalDateTime lockedUntil = loginLockoutService.getLockedUntil(user);
            securityAuditService.log(user.getId(), user.getEmail(), SecurityAction.LOGIN_FAILED, ip, ua, "FAILED", "Account is locked until " + lockedUntil);
            throw new AccountLockedException(lockedUntil);
        }

        // Attempt authentication
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            boolean locked = loginLockoutService.recordLoginFailure(user);
            if (locked) {
                securityAuditService.log(user.getId(), user.getEmail(), SecurityAction.LOGIN_FAILED, ip, ua, "FAILED", "Account locked due to 5 consecutive failures");
                throw new AccountLockedException(loginLockoutService.getLockedUntil(user));
            } else {
                securityAuditService.log(user.getId(), user.getEmail(), SecurityAction.LOGIN_FAILED, ip, ua, "FAILED", "Invalid credentials");
            }
            throw new UnauthorizedException("Invalid email or password");
        }

        // Successful login — reset lockout state
        loginLockoutService.resetLockout(user);
        
        SecurityAction loginAction = (user.getRole() == com.belledonne.ecommerce.enums.Role.ROLE_ADMIN) 
            ? SecurityAction.ADMIN_LOGIN 
            : SecurityAction.LOGIN_SUCCESS;
        securityAuditService.log(user.getId(), user.getEmail(), loginAction, ip, ua, "SUCCESS", "Logged in successfully");

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return AuthResponse.builder()
            .accessToken(tokenProvider.generateAccessToken(auth))
            .refreshToken(tokenProvider.generateRefreshToken(auth))
            .user(toUserResponse(user))
            .build();
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        String ip = SecurityAuditService.getClientIp(this.request);
        String ua = this.request.getHeader("User-Agent");

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));
        String otp = OtpUtil.generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        
        securityAuditService.log(user.getId(), user.getEmail(), SecurityAction.PASSWORD_RESET_REQUESTED, ip, ua, "SUCCESS", "OTP generated and sent");
        
        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    public boolean verifyOtp(VerifyOtpRequest request) {
        String ip = SecurityAuditService.getClientIp(this.request);
        String ua = this.request.getHeader("User-Agent");

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));
        if (user.getOtp() == null || !user.getOtp().equals(request.getOtp())) {
            securityAuditService.log(user.getId(), user.getEmail(), SecurityAction.OTP_FAILED, ip, ua, "FAILED", "Invalid OTP");
            throw new BadRequestException("Invalid OTP");
        }
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            securityAuditService.log(user.getId(), user.getEmail(), SecurityAction.OTP_FAILED, ip, ua, "FAILED", "OTP has expired");
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }
        
        securityAuditService.log(user.getId(), user.getEmail(), SecurityAction.OTP_VERIFIED, ip, ua, "SUCCESS", "OTP verified successfully");
        return true;
    }

    public void resetPassword(ResetPasswordRequest request) {
        String ip = SecurityAuditService.getClientIp(this.request);
        String ua = this.request.getHeader("User-Agent");

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
        
        securityAuditService.log(user.getId(), user.getEmail(), SecurityAction.PASSWORD_RESET_SUCCESS, ip, ua, "SUCCESS", "Password reset successfully");
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .phone(user.getPhone())
            .dateOfBirth(user.getDateOfBirth())
            .gender(user.getGender())
            .role(user.getRole() != null ? user.getRole().name() : com.belledonne.ecommerce.enums.Role.ROLE_USER.name())
            .isEmailVerified(user.getIsEmailVerified())
            .isBlocked(user.getIsBlocked())
            .blockedReason(user.getBlockedReason())
            .lastLoginAt(user.getLastLoginAt())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
