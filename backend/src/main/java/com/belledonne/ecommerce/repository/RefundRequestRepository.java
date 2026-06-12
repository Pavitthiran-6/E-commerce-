package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.RefundRequest;
import com.belledonne.ecommerce.enums.RefundStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, UUID>, JpaSpecificationExecutor<RefundRequest> {
    Optional<RefundRequest> findByOrderId(UUID orderId);
    Page<RefundRequest> findByUserId(UUID userId, Pageable pageable);
    long countByRefundStatus(RefundStatus refundStatus);
    long countByUserIdAndReturnRequestedAtIsNotNull(UUID userId);
    long countByUserIdAndRefundStatus(UUID userId, RefundStatus refundStatus);

    @org.springframework.data.jpa.repository.Query(
        "SELECT COALESCE(SUM(r.refundAmount), 0) FROM RefundRequest r WHERE r.refundStatus = :status")
    java.math.BigDecimal sumRefundAmountByStatus(
        @org.springframework.data.repository.query.Param("status") RefundStatus status);

    @org.springframework.data.jpa.repository.Query(
        "SELECT COALESCE(SUM(r.refundAmount), 0) FROM RefundRequest r " +
        "WHERE r.refundStatus IN ('REFUNDED', 'REFUND_INITIATED', 'REFUND_APPROVED')")
    java.math.BigDecimal getTotalRefundAmount();

    @org.springframework.data.jpa.repository.Query(
        "SELECT r.returnRequestedAt, r.returnApprovedAt, r.returnReceivedAt, r.refundProcessedAt " +
        "FROM RefundRequest r WHERE r.returnRequestedAt IS NOT NULL")
    java.util.List<Object[]> findSlaTimestamps();

    @org.springframework.data.jpa.repository.Query(
        "SELECT COUNT(r) FROM RefundRequest r WHERE r.refundStatus IN (" +
        "com.belledonne.ecommerce.enums.RefundStatus.REFUND_REQUESTED, " +
        "com.belledonne.ecommerce.enums.RefundStatus.RETURN_APPROVED, " +
        "com.belledonne.ecommerce.enums.RefundStatus.RETURN_PICKUP_SCHEDULED, " +
        "com.belledonne.ecommerce.enums.RefundStatus.PAYOUT_DETAILS_REQUESTED, " +
        "com.belledonne.ecommerce.enums.RefundStatus.PAYOUT_DETAILS_PROVIDED" +
        ")")
    long countActiveReturnRequests();

    @org.springframework.data.jpa.repository.Query(
        "SELECT COUNT(r) FROM RefundRequest r WHERE r.refundStatus IN (" +
        "com.belledonne.ecommerce.enums.RefundStatus.REFUND_REQUESTED, " +
        "com.belledonne.ecommerce.enums.RefundStatus.REFUND_APPROVED, " +
        "com.belledonne.ecommerce.enums.RefundStatus.REFUND_INITIATED, " +
        "com.belledonne.ecommerce.enums.RefundStatus.PAYOUT_DETAILS_PROVIDED" +
        ")")
    long countPendingRefunds();
}

