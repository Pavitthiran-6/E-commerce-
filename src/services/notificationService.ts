import axiosInstance from '../api/axiosInstance';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getNotifications = async (page = 0, size = 20): Promise<PageResponse<Notification>> => {
  const response = await axiosInstance.get('/api/notifications', {
    params: { page, size }
  });
  return response.data.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await axiosInstance.get('/api/notifications/unread-count');
  return response.data.data.unreadCount;
};

export const markAsRead = async (id: string): Promise<void> => {
  await axiosInstance.patch(`/api/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await axiosInstance.patch('/api/notifications/read-all');
};
