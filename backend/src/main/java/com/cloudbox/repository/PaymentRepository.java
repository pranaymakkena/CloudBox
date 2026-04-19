package com.cloudbox.repository;

import com.cloudbox.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRazorpayOrderId(String orderId);

    List<Payment> findByUserEmailOrderByCreatedAtDesc(String email);

    List<Payment> findByStatusOrderByCreatedAtDesc(String status);

    List<Payment> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(p.amountPaise), 0) FROM Payment p WHERE p.status = 'APPROVED'")
    Long sumApprovedAmountPaise();

    @Query("SELECT COALESCE(SUM(p.amountPaise), 0) FROM Payment p WHERE p.status IN ('REJECTED', 'REFUNDED')")
    Long sumRefundedAmountPaise();

    long countByStatus(String status);

    java.util.Optional<Payment> findTopByUserEmailAndStatusOrderByPaidAtDesc(String email, String status);
}
