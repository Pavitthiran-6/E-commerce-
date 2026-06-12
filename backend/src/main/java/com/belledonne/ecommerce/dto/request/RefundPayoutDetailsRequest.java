package com.belledonne.ecommerce.dto.request;

import lombok.Data;

/**
 * DTO for customers to submit their refund payout details after admin requests them.
 * Used exclusively for COD return orders where automatic Razorpay refund is not possible.
 */
@Data
public class RefundPayoutDetailsRequest {

    /** UPI ID for refund transfer (e.g., customer@upi). Provide either UPI ID or bank details. */
    private String upiId;

    /** Bank account holder's full name. */
    private String accountHolderName;

    /** Bank account number. */
    private String accountNumber;

    /** IFSC code of the bank branch. */
    private String ifscCode;

    /** Bank name (e.g., State Bank of India). */
    private String bankName;
}
