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
  refundStatus: 'REFUND_REQUESTED' | 'REFUND_APPROVED' | 'REFUND_INITIATED' | 'REFUNDED' | 'REFUND_REJECTED' | 'REFUND_FAILED' | 'RETURN_REQUESTED' | 'RETURN_APPROVED' | 'RETURN_PICKUP_SCHEDULED' | 'RETURNED' | 'PAYOUT_DETAILS_REQUESTED' | 'PAYOUT_DETAILS_PROVIDED';
  refundAmount: number;
  adminNotes?: string;
  rejectionReason?: string;
  reviewedByAdminId?: string;
  reviewedByAdminEmail?: string;
  reviewedAt?: string;
  razorpayRefundId?: string;
  razorpayRefundFailureReason?: string;
  productImageUrl?: string;
  productImageUrls?: string[];
  additionalComments?: string;
  bankDetails?: string;
  upiId?: string;
  requestedAt: string;
  updatedAt: string;
  orderTotalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;

  returnRequestedAt?: string;
  returnApprovedAt?: string;
  returnPickupScheduledAt?: string;
  returnReceivedAt?: string;
  refundProcessedAt?: string;

  warehouseInspectionNotes?: string;
  isProductDamaged?: boolean;
  isWrongProductReturned?: boolean;
  isMissingAccessories?: boolean;
  isUsedProduct?: boolean;
  isPackagingMissing?: boolean;
  isQualityIssueConfirmed?: boolean;

  razorpayRefundStatus?: string;
  razorpayRefundTimestamp?: string;
  razorpayRefundNotes?: string;

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

export const requestReturn = async (orderId: string, reason: string, additionalComments: string, files: File[]): Promise<RefundRequest> => {
  try {
    const formData = new FormData();
    formData.append('cancellationReason', reason);
    if (additionalComments) {
      formData.append('additionalComments', additionalComments);
    }
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await axiosInstance.post(ENDPOINTS.RETURN_ORDER(orderId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error submitting return request for order ${orderId}`, error);
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

export const markRefundPaidAdmin = async (id: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ADMIN_MARK_REFUND_PAID(id));
    return response.data.data;
  } catch (error) {
    console.error(`Error marking refund as paid ${id}`, error);
    throw error;
  }
};

export const approveReturnAdmin = async (id: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ADMIN_APPROVE_RETURN(id));
    return response.data.data;
  } catch (error) {
    console.error(`Error approving return request ${id}`, error);
    throw error;
  }
};

export const scheduleReturnPickupAdmin = async (id: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ADMIN_SCHEDULE_RETURN_PICKUP(id));
    return response.data.data;
  } catch (error) {
    console.error(`Error scheduling return pickup ${id}`, error);
    throw error;
  }
};

export interface WarehouseInspection {
  warehouseInspectionNotes?: string;
  isProductDamaged?: boolean;
  isWrongProductReturned?: boolean;
  isMissingAccessories?: boolean;
  isUsedProduct?: boolean;
  isPackagingMissing?: boolean;
  isQualityIssueConfirmed?: boolean;
}

export const markReturnedAdmin = async (id: string, inspection: WarehouseInspection): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ADMIN_MARK_RETURNED(id), inspection);
    return response.data.data;
  } catch (error) {
    console.error(`Error marking returned items ${id}`, error);
    throw error;
  }
};

export const processRefundAdmin = async (id: string, adminNotes?: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ADMIN_PROCESS_REFUND(id), {
      adminNotes
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error processing refund ${id}`, error);
    throw error;
  }
};

export const requestPayoutDetailsAdmin = async (id: string): Promise<RefundRequest> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ADMIN_REQUEST_PAYOUT_DETAILS(id));
    return response.data.data;
  } catch (error) {
    console.error(`Error requesting payout details for refund ${id}`, error);
    throw error;
  }
};
