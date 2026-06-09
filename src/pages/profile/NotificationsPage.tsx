import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Inbox, Package, RefreshCw, ShieldAlert, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '../../services/notificationService';
import { Skeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ORDERS' | 'REFUNDS'>('ALL');
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setNotifications([]);
    setPage(0);
    fetchNotifications(0, true);
  }, [filter]);

  const fetchNotifications = async (pageNumber: number, initial = false) => {
    try {
      if (initial) setIsLoading(true);
      else setLoadingMore(true);
      setError(null);

      const res = await getNotifications(pageNumber, 15);
      
      let filteredContent = res.content;
      // Filter logic since backend returns all:
      if (filter === 'UNREAD') {
        filteredContent = filteredContent.filter(n => !n.isRead);
      } else if (filter === 'ORDERS') {
        filteredContent = filteredContent.filter(n => n.type.startsWith('ORDER_'));
      } else if (filter === 'REFUNDS') {
        filteredContent = filteredContent.filter(n => n.type.startsWith('REFUND_') || n.type === 'FAILED_REFUND_ALERT');
      }

      setNotifications(prev => initial ? filteredContent : [...prev, ...filteredContent]);
      // If we filtered locally, estimating hasMore can be tricky, but we can use page size as proxy
      setHasMore(res.content.length === 15);
    } catch (err) {
      setError('Failed to load notifications. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, false);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Error marking read:', err);
      }
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_SHIPPED':
      case 'ORDER_DELIVERED':
      case 'ORDER_CANCELLED':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'REFUND_REQUESTED':
      case 'REFUND_APPROVED':
      case 'REFUND_REJECTED':
      case 'REFUND_COMPLETED':
        return <RefreshCw className="w-5 h-5 text-purple-600" />;
      case 'FAILED_REFUND_ALERT':
      case 'LOW_STOCK_ALERT':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'SECURITY_ALERT':
        return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case 'COUPON_ASSIGNED':
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          <p className="text-xs text-gray-500 mt-1">Manage and view your in-app notifications and alerts</p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl border-2 border-gray-100 text-xs font-bold text-gray-700 hover:border-[#0C831F] hover:text-[#0C831F] transition-all self-start sm:self-auto bg-white"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-gray-100 pb-4 mb-4 overflow-x-auto no-scrollbar">
        {(['ALL', 'UNREAD', 'ORDERS', 'REFUNDS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === tab
                ? 'bg-charcoal-stone text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-gray-50">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4 rounded" />
                <Skeleton className="h-3.5 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchNotifications(0, true)} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          title="No notifications"
          message={
            filter === 'UNREAD'
              ? 'You have caught up with all your notifications!'
              : 'You do not have any notifications in this section.'
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-xl border border-gray-100 hover:border-[#0C831F] cursor-pointer flex gap-4 transition-all ${
                !notif.isRead ? 'bg-[#0c831f]/[0.02] border-emerald-100/50' : 'bg-white'
              }`}
            >
              <div className="flex-shrink-0">
                <div className={`p-2.5 rounded-xl ${!notif.isRead ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                  {getIcon(notif.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                    {notif.title}
                  </p>
                  <span className="text-[11px] text-gray-400">
                    {formatDateTime(notif.createdAt)}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${!notif.isRead ? 'text-gray-800' : 'text-gray-500'}`}>
                  {notif.message}
                </p>
                {notif.actionUrl && (
                  <span className="inline-flex items-center text-[11px] font-bold text-[#0C831F] hover:underline mt-2.5">
                    View Details →
                  </span>
                )}
              </div>
              {!notif.isRead && (
                <div className="flex-shrink-0 self-center">
                  <div className="w-2.5 h-2.5 bg-[#0C831F] rounded-full" />
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <div className="text-center pt-6">
              <button
                disabled={loadingMore}
                onClick={handleLoadMore}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-gray-100 hover:border-gray-300 font-bold text-sm text-gray-700 transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
