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
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<any> => {
  const payload = {
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  };
  console.log("VERIFY PAYMENT PAYLOAD", payload);
  try {
    const response = await axiosInstance.post(ENDPOINTS.VERIFY_PAYMENT, payload);
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

/**
 * Calls POST /api/payments/{orderId}/refund
 * Initiates a Razorpay refund for a successfully paid cancelled order.
 */
export const requestRefund = async (orderId: string): Promise<void> => {
  try {
    await axiosInstance.post(ENDPOINTS.REFUND_PAYMENT(orderId));
  } catch (error) {
    console.error('Error requesting refund', error);
    throw error;
  }
};

/**
 * Opens the Razorpay modal for an existing failed/pending order without creating a new order.
 * Idempotent — calls createPaymentOrder which reuses existing Razorpay order for FAILED status.
 *
 * @param orderId     Internal order UUID
 * @param userName    Prefill name in Razorpay modal
 * @param userEmail   Prefill email in Razorpay modal
 * @param onSuccess   Called after successful payment verification
 * @param onFailure   Called if payment fails
 */
export const retryPayment = async (
  orderId: string,
  userName: string,
  userEmail: string,
  onSuccess: () => void,
  onFailure: (description: string) => void
): Promise<void> => {
  // Step 1: Get or re-initiate the Razorpay order (backend handles FAILED → re-initiate)
  const rzpOrder = await createPaymentOrder(orderId);

  const options = {
    key: rzpOrder.keyId,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    name: 'Belledonne',
    description: 'Order Payment',
    order_id: rzpOrder.razorpayOrderId,
    handler: async function (response: any) {
      try {
        await verifyPayment(
          orderId,
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
        onSuccess();
      } catch (e) {
        onFailure('Payment verification failed. Please contact support.');
      }
    },
    prefill: {
      name: userName,
      email: userEmail,
      contact: '',
    },
    theme: { color: '#333333' },
    modal: {
      ondismiss: function () {
        // User closed the modal without paying — no-op (order stays FAILED, retry is still possible)
      },
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.on('payment.failed', async function (response: any) {
    try {
      await reportPaymentFailure(
        response.error.metadata?.order_id || '',
        response.error.code,
        response.error.description
      );
    } catch (_) {
      // Non-fatal
    }
    onFailure(response.error.description);
  });
  rzp.open();
};

/**
 * Downloads the PDF invoice for an order by calling GET /api/orders/{orderId}/invoice
 * and triggering a browser file download.
 */
export const downloadInvoice = async (orderId: string, orderNumber: string): Promise<void> => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.ORDER_INVOICE(orderId), {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${orderNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice', error);
    throw error;
  }
};
