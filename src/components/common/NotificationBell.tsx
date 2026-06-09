import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, Inbox, Package, RefreshCw, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from '../../services/notificationService';
import type { Notification } from '../../services/notificationService';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Poll unread count every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch latest 10 notifications when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      const fetchLatest = async () => {
        setLoading(true);
        try {
          const res = await getNotifications(0, 10);
          setNotifications(res.content);
          // Re-fetch unread count to sync
          const count = await getUnreadCount();
          setUnreadCount(count);
        } catch (err) {
          console.error('Error fetching notifications:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchLatest();
    }
  }, [dropdownOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    setDropdownOpen(false);
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
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
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'REFUND_REQUESTED':
      case 'REFUND_APPROVED':
      case 'REFUND_REJECTED':
      case 'REFUND_COMPLETED':
        return <RefreshCw className="w-4 h-4 text-purple-600" />;
      case 'FAILED_REFUND_ALERT':
      case 'LOW_STOCK_ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'SECURITY_ALERT':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'COUPON_ASSIGNED':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      default:
        return <Inbox className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `${interval}y ago`;
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `${interval}mo ago`;
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `${interval}d ago`;
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `${interval}h ago`;
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `${interval}m ago`;
      return 'just now';
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative flex p-2 text-gray-700 hover:text-[#0C831F] transition-colors rounded-full hover:bg-gray-50"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1 max-h-[420px] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-bold text-sm text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#0C831F] font-bold hover:underline flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                <Inbox className="w-8 h-8 text-gray-300" />
                <span>No notifications yet.</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex gap-3 border-b border-gray-50 transition-colors ${
                    !notif.isRead ? 'bg-emerald-50/20' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`p-1.5 rounded-lg ${!notif.isRead ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                      {getIcon(notif.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <p className={`text-xs truncate ${!notif.isRead ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs leading-normal line-clamp-2 ${!notif.isRead ? 'text-gray-800' : 'text-gray-500'}`}>
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="flex-shrink-0 self-center">
                      <div className="w-2 h-2 bg-[#0C831F] rounded-full" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 text-center">
            <Link
              to="/profile/notifications"
              onClick={() => setDropdownOpen(false)}
              className="block w-full py-2.5 text-xs text-gray-600 hover:text-[#0C831F] font-bold transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
