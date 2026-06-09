import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface RefundRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  cancellationReason: string;
  refundStatus: 'REFUND_REQUESTED' | 'REFUND_APPROVED' | 'REFUND_INITIATED' | 'REFUNDED' | 'REFUND_REJECTED' | 'REFUND_FAILED';
  refundAmount: number;
  adminNotes?: string;
  rejectionReason?: string;
  reviewedByAdminId?: string;
  reviewedByAdminEmail?: string;
  reviewedAt?: string;
  razorpayRefundId?: string;
  razorpayRefundFailureReason?: string;
  requestedAt: string;
  updatedAt: string;
  orderTotalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
  items: {
    id: number;
    productId: string;
    productName: string;
    productImage: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface RefundRequestsPage {
  content: RefundRequest[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

// ---- CUSTOMER APIS ----

export const cancelWithRefund = async (orderId: string, cancellationReason: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.put(ENDPOINTS.CANCEL_WITH_REFUND(orderId), {
      cancellationReason
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error submitting refund request for order ${orderId}`, error);
    throw error;
  }
};

export const getRefundStatus = async (orderId: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.REFUND_STATUS(orderId));
    return response.data.data;
  } catch (error) {
    console.error(`Error getting refund status for order ${orderId}`, error);
    throw error;
  }
};

// ---- ADMIN APIS ----

export const getRefundRequestsAdmin = async (
  search = '',
  status = '',
  page = 0,
  size = 20
): Promise<RefundRequestsPage> => {
  try {
    let url = `${ENDPOINTS.ADMIN_REFUND_REQUESTS}?page=${page}&size=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${status}`;

    const response = await axiosInstance.get(url);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching refund requests for admin', error);
    throw error;
  }
};

export const getRefundRequestByIdAdmin = async (id: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.ADMIN_REFUND_REQUEST_BY_ID(id));
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching refund request details for ${id}`, error);
    throw error;
  }
};

export const approveRefundAdmin = async (id: string, adminNotes?: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ADMIN_APPROVE_REFUND(id), {
      adminNotes
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error approving refund request ${id}`, error);
    throw error;
  }
};

export const rejectRefundAdmin = async (id: string, rejectionReason: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ADMIN_REJECT_REFUND(id), {
      rejectionReason
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error rejecting refund request ${id}`, error);
    throw error;
  }
};

export const retryRefundAdmin = async (id: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ADMIN_RETRY_REFUND(id));
    return response.data.data;
  } catch (error) {
    console.error(`Error retrying failed refund ${id}`, error);
    throw error;
  }
};
