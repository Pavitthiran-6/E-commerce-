package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.SecurityAuditLog;
import com.belledonne.ecommerce.enums.SecurityAction;
import com.belledonne.ecommerce.repository.SecurityAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.belledonne.ecommerce.repository.UserRepository;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.format.DateTimeFormatter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityAuditService {

    private final SecurityAuditLogRepository securityAuditLogRepository;
    private final UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired(required = false)
    private org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    private final Map<String, LocalDateTime> localCooldownMap = new java.util.concurrent.ConcurrentHashMap<>();
    private Map<String, Object> cachedOverview;
    private LocalDateTime cacheExpiry;

    /**
     * Inserts a security audit log entry asynchronously to avoid blocking the HTTP request thread.
     */
    @Async
    @Transactional
    public void log(UUID userId, String email, SecurityAction action, String ipAddress, String userAgent, String status, String details) {
        try {
            String parsedUa = parseUserAgent(userAgent);
            SecurityAuditLog logEntry = SecurityAuditLog.builder()
                .userId(userId)
                .userEmail(email)
                .ipAddress(ipAddress)
                .userAgent(parsedUa)
                .action(action)
                .status(status)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();

            securityAuditLogRepository.save(logEntry);
            log.info("[SecurityAudit] Action={} Email={} IP={} Status={} Details={}", action, email, ipAddress, status, details);

            // Perform automatic suspicious activity detection checks
            checkSuspiciousActivity(logEntry);

            // Evaluate enterprise alert rules
            evaluateAlertRules(logEntry);
        } catch (Exception e) {
            log.error("[SecurityAudit] Failed to save security audit log: {}", e.getMessage(), e);
        }
    }

    /**
     * Checks thresholds for suspicious activity and logs alerts if matched.
     */
    private void checkSuspiciousActivity(SecurityAuditLog logEntry) {
        LocalDateTime time24h = LocalDateTime.now().minusHours(24);
        LocalDateTime time1h = LocalDateTime.now().minusHours(1);

        // 1. 20+ failed logins from same IP in 24 hours
        if (logEntry.getAction() == SecurityAction.LOGIN_FAILED && logEntry.getIpAddress() != null) {
            long failedLogins = securityAuditLogRepository.countByIpAddressAndActionAndCreatedAtAfter(
                logEntry.getIpAddress(), SecurityAction.LOGIN_FAILED, time24h);
            if (failedLogins == 20) { // Log exactly once at the threshold to avoid spamming alerts
                logSuspicious(logEntry.getUserId(), logEntry.getUserEmail(), logEntry.getIpAddress(), logEntry.getUserAgent(),
                    "Suspicious activity: 20+ failed login attempts from IP: " + logEntry.getIpAddress());
            }
        }

        // 2. Repeated account lockouts (2+ locks) in 24 hours
        if (logEntry.getAction() == SecurityAction.ACCOUNT_LOCKED && logEntry.getUserId() != null) {
            long lockouts = securityAuditLogRepository.countByUserIdAndActionAndCreatedAtAfter(
                logEntry.getUserId(), SecurityAction.ACCOUNT_LOCKED, time24h);
            if (lockouts == 2) {
                logSuspicious(logEntry.getUserId(), logEntry.getUserEmail(), logEntry.getIpAddress(), logEntry.getUserAgent(),
                    "Suspicious activity: Repeated account lockouts (2+ times in 24h) for user: " + logEntry.getUserEmail());
            }
        }

        // 3. Multiple OTP failures (5+ failures) in 1 hour
        if (logEntry.getAction() == SecurityAction.OTP_FAILED && logEntry.getUserEmail() != null) {
            long otpFailures = securityAuditLogRepository.countByUserEmailAndActionAndCreatedAtAfter(
                logEntry.getUserEmail(), SecurityAction.OTP_FAILED, time1h);
            if (otpFailures == 5) {
                logSuspicious(logEntry.getUserId(), logEntry.getUserEmail(), logEntry.getIpAddress(), logEntry.getUserAgent(),
                    "Suspicious activity: Multiple OTP failures (5+ in 1h) for user: " + logEntry.getUserEmail());
            }
        }

        // 4. Suspicious token refresh attempts (like blacklisted token reuse)
        if (logEntry.getAction() == SecurityAction.TOKEN_REFRESH && "FAILED".equals(logEntry.getStatus())) {
            if (logEntry.getDetails() != null && logEntry.getDetails().contains("blacklisted")) {
                logSuspicious(logEntry.getUserId(), logEntry.getUserEmail(), logEntry.getIpAddress(), logEntry.getUserAgent(),
                    "Suspicious activity: Attempted reuse of blacklisted/invalid refresh token for user: " + logEntry.getUserEmail());
            }
        }
    }

    /**
     * Logs a SUSPICIOUS_ACTIVITY alert entry.
     */
    private void logSuspicious(UUID userId, String email, String ip, String ua, String details) {
        SecurityAuditLog suspiciousLog = SecurityAuditLog.builder()
            .userId(userId)
            .userEmail(email)
            .ipAddress(ip)
            .userAgent(ua)
            .action(SecurityAction.SUSPICIOUS_ACTIVITY)
            .status("ALERT")
            .details(details)
            .createdAt(LocalDateTime.now())
            .build();
        securityAuditLogRepository.save(suspiciousLog);
        log.warn("[SECURITY ALERT] {}", details);
    }

    /**
     * Cleans up old security audit logs.
     * Enforces the 90-day minimum retention policy by auto-deleting records older than 90 days.
     * Runs daily at midnight.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void cleanupOldLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        int deleted = securityAuditLogRepository.deleteByCreatedAtBefore(cutoff);
        log.info("[SecurityAudit] Daily cleanup completed. Deleted {} security logs older than 90 days.", deleted);
    }

    /**
     * Parses the raw User-Agent header into a simplified, readable browser or client string.
     */
    public static String parseUserAgent(String rawUserAgent) {
        if (rawUserAgent == null || rawUserAgent.isBlank()) {
            return "Unknown";
        }
        String ua = rawUserAgent.toLowerCase();
        if (ua.contains("brave")) return "Brave";
        if (ua.contains("firefox")) return "Firefox";
        if (ua.contains("chrome") && !ua.contains("chromium") && !ua.contains("edge") && !ua.contains("edg")) return "Chrome";
        if (ua.contains("safari") && !ua.contains("chrome") && !ua.contains("chromium")) return "Safari";
        if (ua.contains("mobile") || ua.contains("android") || ua.contains("iphone") || ua.contains("ipad")) return "Mobile App";
        if (rawUserAgent.length() > 255) {
            return rawUserAgent.substring(0, 255);
        }
        return rawUserAgent;
    }

    /**
     * Resolves the real client IP address from request headers or remote address.
     */
    public static String getClientIp(jakarta.servlet.http.HttpServletRequest request) {
        if (request == null) return "0.0.0.0";
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank() && !"unknown".equalsIgnoreCase(xff)) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && !"unknown".equalsIgnoreCase(realIp)) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

    /**
     * Resolves today's aggregated statistics for the security dashboard.
     */
    public Map<String, Object> getSecurityStats() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        List<Object[]> results = securityAuditLogRepository.countActionsToday(startOfToday);

        long failedLoginsToday = 0;
        long successfulLoginsToday = 0;
        long suspiciousActivitiesToday = 0;
        long adminActionsToday = 0;

        for (Object[] row : results) {
            SecurityAction action = (SecurityAction) row[0];
            long count = (Long) row[1];
            if (action == SecurityAction.LOGIN_FAILED) {
                failedLoginsToday = count;
            } else if (action == SecurityAction.LOGIN_SUCCESS) {
                successfulLoginsToday = count;
            } else if (action == SecurityAction.SUSPICIOUS_ACTIVITY) {
                suspiciousActivitiesToday = count;
            } else if (action == SecurityAction.ADMIN_ACTION) {
                adminActionsToday = count;
            }
        }

        long lockedAccounts = userRepository.countByAccountLockedUntilAfter(LocalDateTime.now());

        Map<String, Object> stats = new HashMap<>();
        stats.put("failedLoginsToday", failedLoginsToday);
        stats.put("lockedAccounts", lockedAccounts);
        stats.put("successfulLoginsToday", successfulLoginsToday);
        stats.put("suspiciousActivitiesToday", suspiciousActivitiesToday);
        stats.put("adminActionsToday", adminActionsToday);

        // Active Alert Banner check (last 1 hour)
        boolean activeAlert = false;
        String alertDetails = null;
        List<SecurityAuditLog> latestAlerts = securityAuditLogRepository.findLatestAlert(PageRequest.of(0, 1));
        if (!latestAlerts.isEmpty()) {
            SecurityAuditLog alert = latestAlerts.get(0);
            if (alert.getCreatedAt().isAfter(LocalDateTime.now().minusHours(1))) {
                activeAlert = true;
                alertDetails = alert.getDetails();
            }
        }
        stats.put("activeAlert", activeAlert);
        stats.put("alertDetails", alertDetails);

        return stats;
    }

    /**
     * Generates a dynamic JPA Specification based on search and filters.
     */
    public static Specification<SecurityAuditLog> getSpec(
            String search, UUID userId, String email, String ipAddress, SecurityAction action, String status, LocalDate dateFrom, LocalDate dateTo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (userId != null) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }
            if (email != null && !email.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("userEmail")), "%" + email.toLowerCase() + "%"));
            }
            if (ipAddress != null && !ipAddress.isBlank()) {
                predicates.add(cb.equal(root.get("ipAddress"), ipAddress));
            }
            if (action != null) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom.atStartOfDay()));
            }
            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), dateTo.atTime(23, 59, 59)));
            }

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate searchPredicate = cb.or(
                    cb.like(cb.lower(root.get("userEmail")), searchPattern),
                    cb.like(cb.lower(root.get("ipAddress")), searchPattern),
                    cb.like(cb.lower(root.get("details")), searchPattern)
                );
                predicates.add(searchPredicate);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Resolves the complete analytics details for the Security Overview dashboard.
     */
    public Map<String, Object> getSecurityOverviewStats() {
        LocalDateTime thirtyDaysAgo = LocalDate.now().minusDays(30).atStartOfDay();
        List<Object[]> dailyResults = securityAuditLogRepository.getDailySecurityCounts(thirtyDaysAgo);

        Map<String, Map<SecurityAction, Long>> dataMap = new HashMap<>();
        for (Object[] row : dailyResults) {
            String dateStr = row[0].toString();
            SecurityAction action = (SecurityAction) row[1];
            long count = (Long) row[2];
            dataMap.computeIfAbsent(dateStr, k -> new HashMap<>()).put(action, count);
        }

        List<Map<String, Object>> trendData = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter df = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = 30; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dateStr = date.format(df);
            Map<SecurityAction, Long> counts = dataMap.getOrDefault(dateStr, Map.of());

            Map<String, Object> dayEntry = new HashMap<>();
            dayEntry.put("date", dateStr);
            dayEntry.put("failedLogins", counts.getOrDefault(SecurityAction.LOGIN_FAILED, 0L));
            dayEntry.put("successfulLogins", counts.getOrDefault(SecurityAction.LOGIN_SUCCESS, 0L));
            dayEntry.put("suspiciousActivities", counts.getOrDefault(SecurityAction.SUSPICIOUS_ACTIVITY, 0L));

            trendData.add(dayEntry);
        }

        Pageable top10 = PageRequest.of(0, 10);
        List<Object[]> topIpsResult = securityAuditLogRepository.getTopIPs(top10);
        List<Map<String, Object>> topIps = new ArrayList<>();
        for (Object[] row : topIpsResult) {
            topIps.add(Map.of(
                "ipAddress", row[0] != null ? row[0] : "Unknown",
                "totalEvents", row[1]
            ));
        }

        List<Object[]> topLockedResult = securityAuditLogRepository.getTopLockedAccounts(top10);
        List<Map<String, Object>> topLocked = new ArrayList<>();
        for (Object[] row : topLockedResult) {
            topLocked.add(Map.of(
                "email", row[0] != null ? row[0] : "Unknown",
                "lockCount", row[1]
            ));
        }

        Map<String, Object> summaryStats = getSecurityStats();

        // Active Alert Banner check (last 1 hour)
        boolean activeAlert = false;
        String alertDetails = null;
        List<SecurityAuditLog> latestAlerts = securityAuditLogRepository.findLatestAlert(PageRequest.of(0, 1));
        if (!latestAlerts.isEmpty()) {
            SecurityAuditLog alert = latestAlerts.get(0);
            if (alert.getCreatedAt().isAfter(LocalDateTime.now().minusHours(1))) {
                activeAlert = true;
                alertDetails = alert.getDetails();
            }
        }

        Map<String, Object> overview = new HashMap<>();
        overview.put("trend", trendData);
        overview.put("topIps", topIps);
        overview.put("topLocked", topLocked);
        overview.put("summary", summaryStats);
        overview.put("activeAlert", activeAlert);
        overview.put("alertDetails", alertDetails);

        return overview;
    }

    public synchronized Map<String, Object> getCachedSecurityOverview() {
        if (cachedOverview == null || cacheExpiry == null || LocalDateTime.now().isAfter(cacheExpiry)) {
            cachedOverview = getSecurityOverviewStats();
            cacheExpiry = LocalDateTime.now().plusMinutes(1);
        }
        return cachedOverview;
    }

    /**
     * Evaluates security alerts rules and triggers notifications/emails if thresholds are crossed.
     */
    private void evaluateAlertRules(SecurityAuditLog logEntry) {
        try {
            // Rule 1: 50+ failed logins from same IP within 30 minutes
            if (logEntry.getAction() == SecurityAction.LOGIN_FAILED && logEntry.getIpAddress() != null) {
                String ip = logEntry.getIpAddress();
                String cooldownKey = "alert-cooldown:failed-login:" + ip;
                if (!isAlertInCooldown(cooldownKey)) {
                    LocalDateTime windowStart = LocalDateTime.now().minusMinutes(30);
                    long count = securityAuditLogRepository.countByIpAddressAndActionAndCreatedAtAfter(ip, SecurityAction.LOGIN_FAILED, windowStart);
                    if (count >= 50) {
                        setAlertCooldown(cooldownKey);
                        triggerAlert("FAILED_LOGINS_SPIKE", "50+ failed logins (" + count + " attempts) from IP: " + ip + " within 30 minutes", ip);
                    }
                }
            }

            // Rule 2: 10+ suspicious activities within 1 hour
            if (logEntry.getAction() == SecurityAction.SUSPICIOUS_ACTIVITY) {
                String cooldownKey = "alert-cooldown:suspicious-activity";
                if (!isAlertInCooldown(cooldownKey)) {
                    LocalDateTime windowStart = LocalDateTime.now().minusHours(1);
                    long count = securityAuditLogRepository.countByActionAndCreatedAtAfter(SecurityAction.SUSPICIOUS_ACTIVITY, windowStart);
                    if (count >= 10) {
                        setAlertCooldown(cooldownKey);
                        triggerAlert("SUSPICIOUS_ACTIVITIES_SPIKE", "10+ suspicious activities (" + count + " occurrences) within 1 hour", logEntry.getIpAddress());
                    }
                }
            }

            // Rule 3: 5+ account lockouts within 1 hour
            if (logEntry.getAction() == SecurityAction.ACCOUNT_LOCKED) {
                String cooldownKey = "alert-cooldown:account-lockouts";
                if (!isAlertInCooldown(cooldownKey)) {
                    LocalDateTime windowStart = LocalDateTime.now().minusHours(1);
                    long count = securityAuditLogRepository.countByActionAndCreatedAtAfter(SecurityAction.ACCOUNT_LOCKED, windowStart);
                    if (count >= 5) {
                        setAlertCooldown(cooldownKey);
                        triggerAlert("ACCOUNT_LOCKOUTS_SPIKE", "5+ account lockouts (" + count + " lockouts) within 1 hour", logEntry.getIpAddress());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to evaluate security alert rules: {}", e.getMessage(), e);
        }
    }

    private void triggerAlert(String triggerType, String reason, String ipAddress) {
        log.error("[SECURITY ALERT TRIGGERED] Type={} Reason={} IP={}", triggerType, reason, ipAddress);

        // Save triggered alert log record
        SecurityAuditLog alertLog = SecurityAuditLog.builder()
            .action(SecurityAction.SECURITY_ALERT_TRIGGERED)
            .status("ALERT")
            .ipAddress(ipAddress)
            .userAgent("System")
            .details("Trigger: " + triggerType + " | Reason: " + reason)
            .createdAt(LocalDateTime.now())
            .build();
        securityAuditLogRepository.save(alertLog);

        // Send Email notification asynchronously
        String timeWindow = "FAILED_LOGINS_SPIKE".equals(triggerType) ? "30 Minutes" : "1 Hour";
        emailService.sendSecurityAlertEmail(triggerType, ipAddress, timeWindow, reason);
    }

    private boolean isAlertInCooldown(String cooldownKey) {
        if (redisTemplate != null) {
            return Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey));
        } else {
            LocalDateTime expiry = localCooldownMap.get(cooldownKey);
            return expiry != null && expiry.isAfter(LocalDateTime.now());
        }
    }

    private void setAlertCooldown(String cooldownKey) {
        if (redisTemplate != null) {
            redisTemplate.opsForValue().set(cooldownKey, "1", 1, java.util.concurrent.TimeUnit.HOURS);
        } else {
            localCooldownMap.put(cooldownKey, LocalDateTime.now().plusHours(1));
        }
    }
}
