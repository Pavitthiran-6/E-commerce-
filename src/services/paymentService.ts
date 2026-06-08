import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface RazorpayOrder {
  paymentId: string;   // Internal Payment UUID
  orderId: string;     // Internal Order UUID
  razorpayOrderId: string; // Razorpay order_id (e.g. "order_XXXX")
  amount: number;      // Amount in paise (INR × 100)
  currency: string;
  keyId: string;       // Razorpay public key — loaded from backend, never hardcoded
  status: string;
}

/**
 * Calls POST /api/payments/create-order
 * Idempotent: safe to call multiple times for the same orderId.
 */
export const createPaymentOrder = async (orderId: string): Promise<RazorpayOrder> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.CREATE_PAYMENT_ORDER, { orderId });
    return response.data.data;
  } catch (error) {
    console.error('Error creating payment order', error);
    throw error;
  }
};

/**
 * Calls POST /api/payments/verify
 * Submits the Razorpay callback signature for server-side HMAC verification.
 */
export const verifyPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<any> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.VERIFY_PAYMENT, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error verifying payment', error);
    throw error;
  }
};

/**
 * Calls POST /api/payments/failure
 * Reports a Razorpay payment.failed event to the backend so the payment record
 * is transitioned to FAILED, enabling safe retry on the next click.
 */
export const reportPaymentFailure = async (
  razorpayOrderId: string,
  errorCode: string,
  errorDescription: string
): Promise<void> => {
  try {
    await axiosInstance.post(ENDPOINTS.REPORT_PAYMENT_FAILURE, {
      razorpayOrderId,
      errorCode,
      errorDescription,
    });
  } catch (error) {
    // Non-fatal: log but do not re-throw — the failure UI should still show
    console.error('Error reporting payment failure to backend', error);
  }
};
