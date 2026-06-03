package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.dto.response.UserAdminResponse;
import com.belledonne.ecommerce.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT new com.belledonne.ecommerce.dto.response.UserAdminResponse(" +
           "u.id, u.name, u.email, u.phone, u.role, u.createdAt, u.lastLoginAt, u.isBlocked, u.blockedReason, " +
           "(SELECT COUNT(o) FROM Order o WHERE o.user.id = u.id), " +
           "(SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.user.id = u.id)" +
           ") FROM User u " +
           "WHERE (:search IS NULL OR :search = '' OR " +
           "LOWER(COALESCE(u.name, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(u.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY u.createdAt DESC")
    Page<UserAdminResponse> findUsersWithMetrics(@Param("search") String search, Pageable pageable);
}
