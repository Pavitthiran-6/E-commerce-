package com.belledonne.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_tracking")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Order order;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 200)
    private String location;

    @CreationTimestamp
    @Column(name = "tracking_time", updatable = false)
    private LocalDateTime trackingTime;
}
