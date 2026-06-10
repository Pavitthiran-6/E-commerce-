package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.dto.response.UserAdminResponse;
import com.belledonne.ecommerce.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    /**
     * Fetches paginated users with order metrics.
     * Supports filtering by role, blocked status, and temporary lockout.
     *
     * @param lockedAfter When non-null, only returns users whose accountLockedUntil > lockedAfter
     *                    (i.e. currently locked). Pass null to skip the locked filter.
     */
    @Query("SELECT new com.belledonne.ecommerce.dto.response.UserAdminResponse(" +
           "u.id, u.name, u.email, u.phone, u.role, u.createdAt, u.lastLoginAt, u.isBlocked, u.blockedReason, " +
           "(SELECT COUNT(o) FROM Order o WHERE o.user.id = u.id), " +
           "(SELECT SUM(o.totalAmount) FROM Order o WHERE o.user.id = u.id), " +
           "u.accountLockedUntil" +
           ") FROM User u " +
           "WHERE (:role IS NULL OR u.role = :role) AND " +
           "(:blocked IS NULL OR u.isBlocked = :blocked) AND " +
           "(:locked = false OR (u.accountLockedUntil IS NOT NULL AND u.accountLockedUntil > :now)) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(COALESCE(u.name, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(u.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY u.accountLockedUntil DESC, u.createdAt DESC")
    Page<UserAdminResponse> findUsersWithMetrics(
        @Param("search") String search,
        @Param("role") com.belledonne.ecommerce.enums.Role role,
        @Param("blocked") Boolean blocked,
        @Param("locked") boolean locked,
        @Param("now") LocalDateTime now,
        Pageable pageable
    );

    /** Count users whose temporary lockout has NOT yet expired. */
    long countByAccountLockedUntilAfter(LocalDateTime dateTime);

    long countByRole(com.belledonne.ecommerce.enums.Role role);
    long countByIsBlockedFalseAndRole(com.belledonne.ecommerce.enums.Role role);
    long countByIsBlockedTrueAndRole(com.belledonne.ecommerce.enums.Role role);

    java.util.List<User> findByRole(com.belledonne.ecommerce.enums.Role role);
}
