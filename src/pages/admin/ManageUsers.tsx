import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  ShoppingBag, 
  Heart, 
  ShieldAlert, 
  Award, 
  Hash, 
  UserCheck, 
  DollarSign, 
  List,
  Trash2
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  isBlocked: boolean;
  blockedReason?: string;
  ordersCount: number;
  totalAmountSpent: number;
}

interface AddressDTO {
  id: number;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

interface OrderMinDTO {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  status: string;
}

interface WishlistItemDTO {
  id: string;
  name: string;
  price: number;
  image?: string;
}

interface CartItemDTO {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
  size?: string;
  color?: string;
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  isBlocked: boolean;
  blockedReason?: string;
  addresses: AddressDTO[];
  totalOrders: number;
  totalAmountSpent: number;
  latestOrders: OrderMinDTO[];
  wishlistCount: number;
  wishlistItems: WishlistItemDTO[];
  cartCount: number;
  cartItems: CartItemDTO[];
}

const SkeletonRow = () => (
  <tr>
    {/* User Avatar + Name */}
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 admin-skeleton rounded-full flex-shrink-0" />
        <div className="h-3.5 admin-skeleton rounded w-28" />
      </div>
    </td>
    {/* Email */}
    <td className="px-5 py-4"><div className="h-3.5 admin-skeleton rounded w-40" /></td>
    {/* Phone */}
    <td className="px-5 py-4"><div className="h-3.5 admin-skeleton rounded w-24" /></td>
    {/* Role */}
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-20" /></td>
    {/* Joined */}
    <td className="px-5 py-4"><div className="h-3.5 admin-skeleton rounded w-20" /></td>
    {/* Status */}
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-16" /></td>
    {/* Activity & Spend */}
    <td className="px-5 py-4">
      <div className="space-y-1">
        <div className="h-3.5 admin-skeleton rounded w-20" />
        <div className="h-3 admin-skeleton rounded w-24" />
        <div className="h-3 admin-skeleton rounded w-16" />
      </div>
    </td>
    {/* Actions */}
    <td className="px-5 py-4 text-right"><div className="h-8 admin-skeleton rounded-xl w-32 inline-block" /></td>
  </tr>
);

export default function ManageUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and paging states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // User statistics states
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalAdministrators, setTotalAdministrators] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [blockedUsersCount, setBlockedUsersCount] = useState(0);

  // Active tab state
  const [activeTab, setActiveTab] = useState<'customers' | 'blocked' | 'admins'>('customers');

  // Blocking Modal States
  const [blockingUser, setBlockingUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  // Deleting Modal States
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Details Modal States
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Debounce search input to avoid spamming the backend
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset to first page when query changes
    }, 450);

    return () => clearTimeout(handler);
  }, [search]);

  // Load users from backend
  const loadUsers = async (p = 0, query = '', tab = 'customers') => {
    setIsLoading(true);
    setError('');
    try {
      let roleParam = '';
      let blockedParam = '';
      if (tab === 'customers') {
        roleParam = '&role=ROLE_USER';
        blockedParam = '&blocked=false';
      } else if (tab === 'blocked') {
        roleParam = '&role=ROLE_USER';
        blockedParam = '&blocked=true';
      } else if (tab === 'admins') {
        roleParam = '&role=ROLE_ADMIN';
      }

      const res = await axiosInstance.get(`/api/admin/users?page=${p}&size=15&search=${encodeURIComponent(query)}${roleParam}${blockedParam}`);
      const data = res.data.data;
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
      setTotalCustomers(data.totalCustomers || 0);
      setTotalAdministrators(data.totalAdministrators || 0);
      setActiveUsersCount(data.activeUsers || 0);
      setBlockedUsersCount(data.blockedUsers || 0);
    } catch (err) {
      setError('Failed to load registered users. Please make sure the backend is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(page, debouncedSearch, activeTab);
  }, [page, debouncedSearch, activeTab]);

  const handleTabChange = (tab: 'customers' | 'blocked' | 'admins') => {
    setActiveTab(tab);
    setPage(0);
  };

  const executeDeleteUser = async (user: User) => {
    setIsSubmittingDelete(true);
    try {
      await axiosInstance.delete(`/api/admin/users/${user.id}`);
      showToast('User account successfully deleted!', 'success');
      setDeletingUser(null);
      
      // If details modal is open, close it
      if (detailsUserId === user.id) {
        setDetailsUserId(null);
      }
      
      loadUsers(page, debouncedSearch, activeTab);
    } catch (err) {
      showToast('Failed to delete user account.', 'error');
      console.error(err);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Fetch full user details when requested
  useEffect(() => {
    if (!detailsUserId) {
      setDetails(null);
      return;
    }
    const loadDetails = async () => {
      setIsDetailsLoading(true);
      try {
        const res = await axiosInstance.get(`/api/admin/users/${detailsUserId}`);
        setDetails(res.data.data);
      } catch (err) {
        showToast('Failed to load user details.', 'error');
        setDetailsUserId(null);
      } finally {
        setIsDetailsLoading(false);
      }
    };
    loadDetails();
  }, [detailsUserId]);

  // Formats relative time since last login
  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Never logged in';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // In case time sync is slightly off
    if (diffMs < 0) return 'Just now';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Formats total spend in INR
  const formatSpent = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Safe check for phone number display
  const displayPhone = (phone?: string) => {
    if (!phone || phone.trim() === '' || phone === 'null' || phone === 'undefined' || phone === '0') {
      return '-';
    }
    return phone;
  };

  // Handles block or unblock actions
  const triggerBlockToggle = (user: User) => {
    if (user.isBlocked) {
      // Unblock directly
      executeBlockToggle(user, null);
    } else {
      // Open modal to enter block reason
      setBlockingUser(user);
      setBlockReason('');
    }
  };

  const executeBlockToggle = async (user: User, reason: string | null) => {
    setIsSubmittingBlock(true);
    try {
      await axiosInstance.put(`/api/admin/users/${user.id}/toggle-block`, { reason });
      showToast(
        `User successfully ${reason === null ? 'unblocked' : 'blocked'}!`,
        'success'
      );
      setBlockingUser(null);
      
      // If details modal is open, refresh detail states
      if (detailsUserId === user.id) {
        setDetailsUserId(null);
        setTimeout(() => setDetailsUserId(user.id), 50);
      }
      
      loadUsers(page, debouncedSearch, activeTab);
    } catch (err) {
      showToast('Failed to change user status.', 'error');
      console.error(err);
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  // Generate initials for avatar
  const getInitials = (name?: string, email?: string) => {
    const fallback = email || 'U';
    const source = name || fallback;
    return source.trim().charAt(0).toUpperCase();
  };

  const avatarGradients = [
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-blue-500 to-sky-600',
  ];
  const getGradient = (id: string) => {
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return avatarGradients[sum % avatarGradients.length];
  };

  // Status mapping for order display
  const getOrderStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'SHIPPED':
      case 'DISPATCHED':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users Management</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-400">Customers:</span>
            <span className="font-semibold text-gray-700">{totalCustomers}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400">Administrators:</span>
            <span className="font-semibold text-gray-700">{totalAdministrators}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400">Total Accounts:</span>
            <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full text-xs">{totalCustomers + totalAdministrators}</span>
          </p>
        </div>
      </div>

      {/* ── Quick Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl flex-shrink-0">
            👥
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Total Customers</p>
            <p className="text-xl font-black text-gray-900 mt-1.5 leading-none">{totalCustomers}</p>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl flex-shrink-0">
            🟢
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Active Users</p>
            <p className="text-xl font-black text-emerald-600 mt-1.5 leading-none">{activeUsersCount}</p>
          </div>
        </div>

        {/* Blocked Customers */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 text-xl flex-shrink-0">
            🚫
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Blocked Users</p>
            <p className="text-xl font-black text-rose-600 mt-1.5 leading-none">{blockedUsersCount}</p>
          </div>
        </div>

        {/* Administrators */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-50/50 flex items-center justify-center text-amber-600 text-xl flex-shrink-0">
            👑
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Administrators</p>
            <p className="text-xl font-black text-purple-700 mt-1.5 leading-none">{totalAdministrators}</p>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all shadow-sm"
          />
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit border border-gray-200/50">
          <button
            onClick={() => handleTabChange('customers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'customers'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            👥 Customers
          </button>
          <button
            onClick={() => handleTabChange('blocked')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'blocked'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🚫 Blocked Customers
          </button>
          <button
            onClick={() => handleTabChange('admins')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'admins'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            👑 Administrators
          </button>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-800 mb-1">{error}</p>
            <p className="text-xs text-gray-400">Please check your network connection and credentials.</p>
          </div>
        ) : (
          <div className="overflow-x-auto admin-sticky-head">
            <table className="w-full text-sm">
              <thead>
                {activeTab === 'admins' ? (
                  <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-4 whitespace-nowrap">Name</th>
                    <th className="px-5 py-4 whitespace-nowrap">Email</th>
                    <th className="px-5 py-4 whitespace-nowrap">Role</th>
                    <th className="px-5 py-4 whitespace-nowrap">Created Date</th>
                    <th className="px-5 py-4 whitespace-nowrap text-right">Actions</th>
                  </tr>
                ) : (
                  <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-4 whitespace-nowrap">Name</th>
                    <th className="px-5 py-4 whitespace-nowrap">Email</th>
                    <th className="px-5 py-4 whitespace-nowrap">Phone</th>
                    <th className="px-5 py-4 whitespace-nowrap">Orders</th>
                    <th className="px-5 py-4 whitespace-nowrap">Total Spent</th>
                    <th className="px-5 py-4 whitespace-nowrap">Joined Date</th>
                    <th className="px-5 py-4 whitespace-nowrap">Status</th>
                    <th className="px-5 py-4 whitespace-nowrap text-right">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'admins' ? 5 : 8} className="px-5 py-16 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-gray-700">No users found</p>
                      <p className="text-xs text-gray-400 mt-1">{search ? `No matches for "${search}"` : 'No accounts found.'}</p>
                    </td>
                  </tr>
                ) : (
                  users.map(user => {
                    const isAdmin = user.role === 'ROLE_ADMIN' || user.role === 'ADMIN';
                    if (activeTab === 'admins') {
                      return (
                        <tr 
                          key={user.id} 
                          className="bg-purple-50/10 hover:bg-purple-50/20 border-l-2 border-l-purple-500 transition-colors"
                        >
                          {/* Name */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 via-purple-500 to-indigo-600 flex items-center justify-center text-[12px] font-black text-white flex-shrink-0 shadow-sm">
                                {getInitials(user.name, user.email)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-xs tracking-tight">{user.name || '(No name)'}</p>
                                <span className="inline-block text-[9px] text-purple-600 bg-purple-50 px-1 py-0.2 rounded border border-purple-100 mt-0.5">🔒 Protected Account</span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-4 text-gray-600 text-xs font-medium">{user.email}</td>

                          {/* Role */}
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-100 to-purple-100 text-purple-800 border border-amber-300 shadow-sm animate-pulse-subtle">
                              👑 Administrator
                            </span>
                          </td>

                          {/* Created Date */}
                          <td className="px-5 py-4 text-xs text-gray-400 font-medium">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setDetailsUserId(user.id)}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                          {/* Name */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getGradient(user.id)} flex items-center justify-center text-[12px] font-black text-white flex-shrink-0 shadow-sm`}>
                                {getInitials(user.name, user.email)}
                              </div>
                              <p className="font-semibold text-gray-900 text-xs tracking-tight">{user.name || '(No name)'}</p>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-4 text-gray-600 text-xs font-medium">{user.email}</td>

                          {/* Phone */}
                          <td className="px-5 py-4 text-gray-500 text-xs font-mono">{displayPhone(user.phone)}</td>

                          {/* Orders */}
                          <td className="px-5 py-4 text-xs text-gray-800 font-semibold">{user.ordersCount}</td>

                          {/* Total Spent */}
                          <td className="px-5 py-4 text-xs text-[#0C831F] font-bold">{formatSpent(user.totalAmountSpent)}</td>

                          {/* Joined Date */}
                          <td className="px-5 py-4 text-xs text-gray-400 font-medium">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                              !user.isBlocked
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                                : 'bg-red-50 text-red-600 border border-red-150'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${!user.isBlocked ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                              {!user.isBlocked ? 'Active' : 'Blocked'}
                            </span>
                            {user.isBlocked && user.blockedReason && (
                              <span className="block text-[10px] text-red-400 mt-0.5 italic max-w-[150px] truncate" title={user.blockedReason}>
                                Reason: {user.blockedReason}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setDetailsUserId(user.id)}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 transition-colors shadow-sm mr-2"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => triggerBlockToggle(user)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors shadow-sm mr-2 ${
                                user.isBlocked
                                  ? 'text-emerald-700 hover:text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200'
                                  : 'text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 border-red-200'
                              }`}
                            >
                              {user.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:text-white bg-red-50/10 hover:bg-red-600 transition-all shadow-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {!isLoading && !error && users.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing <span className="font-semibold text-gray-600">{users.length}</span> of <span className="font-semibold text-gray-600">{totalElements}</span> users
            </span>
            <span>
              Page <span className="font-semibold text-gray-600">{page + 1}</span> of <span className="font-semibold text-gray-600">{totalPages}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors bg-white shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Prev
          </button>
          
          {Array.from({ length: totalPages }).map((_, idx) => {
            // Only show close pages to avoid overflow
            if (idx === 0 || idx === totalPages - 1 || Math.abs(idx - page) <= 1) {
              return (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  className={`w-8 h-8 text-xs font-bold rounded-xl transition-colors ${
                    page === idx
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            }
            if (idx === 1 || idx === totalPages - 2) {
              return <span key={idx} className="text-gray-300 text-xs px-1 select-none">…</span>;
            }
            return null;
          })}

          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors bg-white shadow-sm"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Custom Blocking Modal ── */}
      {blockingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/20">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Block Account
              </h3>
              <button onClick={() => setBlockingUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Are you sure you want to block the account for <strong className="text-gray-900">{blockingUser.name || blockingUser.email}</strong>? They will be signed out immediately and restricted from logging in.
              </p>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Reason for Blocking
                </label>
                <textarea
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="e.g. Terms of Service violation, suspicious activity..."
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all min-h-[90px] resize-y"
                  required
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2.5">
              <button
                onClick={() => setBlockingUser(null)}
                className="px-5 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-100 bg-white transition-colors text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => executeBlockToggle(blockingUser, blockReason)}
                disabled={isSubmittingBlock}
                className="px-6 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingBlock ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Blocking…
                  </>
                ) : 'Block Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── User Details Modal / Drawer ── */}
      {detailsUserId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9997] flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="w-full max-h-[90vh] md:max-w-5xl bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-in-bottom md:animate-fade-in border border-gray-100">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(detailsUserId)} flex items-center justify-center text-xs font-black text-white shadow-sm flex-shrink-0`}>
                  {details ? getInitials(details.name, details.email) : '?'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 tracking-tight">
                    {isDetailsLoading ? 'Loading details…' : details?.name || '(No name)'}
                  </h2>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {isDetailsLoading ? 'Fetching profile...' : details?.email}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDetailsUserId(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/20 custom-scrollbar">
              {isDetailsLoading ? (
                <div className="space-y-6">
                  {/* Skeletal layout matching columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                      <div className="h-60 bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                        <div className="h-4 admin-skeleton rounded w-24 mb-2" />
                        <div className="h-3 admin-skeleton rounded w-full" />
                        <div className="h-3 admin-skeleton rounded w-full" />
                        <div className="h-3 admin-skeleton rounded w-2/3" />
                      </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                      <div className="h-64 bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                        <div className="h-4 admin-skeleton rounded w-32 mb-2" />
                        <div className="h-10 admin-skeleton rounded w-full" />
                        <div className="h-10 admin-skeleton rounded w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : details ? (
                details.role === 'ROLE_ADMIN' || details.role === 'ADMIN' ? (
                  /* ── Administrator Details View ── */
                  <div className="max-w-2xl mx-auto w-full bg-white border border-purple-100 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden my-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-purple-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-purple-500/20">
                        {getInitials(details.name, details.email)}
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{details.name || '(No name)'}</h3>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">{details.email}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 justify-center">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-100 to-purple-100 text-purple-800 border border-amber-300 shadow-sm">
                          👑 Administrator
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                          🔒 Protected Account
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 justify-center">
                        <Award className="w-4 h-4 text-purple-600" />
                        System Profile Details
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 md:col-span-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">System Admin ID</p>
                          <p className="text-xs font-mono text-gray-700 mt-1 select-all break-all">{details.id}</p>
                        </div>
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Administrator Role</p>
                          <p className="text-xs font-semibold text-gray-800 mt-1">Full System Administrator (Level 1)</p>
                        </div>
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Registered Date</p>
                          <p className="text-xs font-semibold text-gray-800 mt-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {details.createdAt ? new Date(details.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Access Rights</p>
                          <p className="text-xs font-semibold text-[#0C831F] mt-1">Full Read / Write / Delete Access</p>
                        </div>
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Protected Account Status</p>
                          <p className="text-xs font-semibold text-purple-700 mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                            Active & Protected
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Customer Details View ── */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Basic Info & Addresses */}
                    <div className="lg:col-span-1 space-y-6">
                      
                      {/* Basic Info Card */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-gray-100">
                          <Award className="w-3.5 h-3.5 text-gray-500" />
                          Basic Information
                        </h3>

                        <div className="space-y-3.5">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">User ID</p>
                            <p className="text-xs font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-100 select-all mt-1 break-all">{details.id}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Full Name</p>
                            <p className="text-xs font-semibold text-gray-900 mt-0.5">{details.name || '(No name)'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                            <p className="text-xs font-semibold text-gray-900 mt-0.5 flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              {details.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</p>
                            <p className="text-xs font-semibold text-gray-900 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {displayPhone(details.phone)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">System Role</p>
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                                CUSTOMER
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                            <div className="mt-1">
                              <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                                !details.isBlocked
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                                  : 'bg-rose-50 text-rose-700 border border-rose-150'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${!details.isBlocked ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                {!details.isBlocked ? 'Active' : 'Blocked'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Joined Date</p>
                            <p className="text-xs font-semibold text-gray-900 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {details.createdAt ? new Date(details.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Last Login Activity</p>
                            <p className="text-xs font-semibold text-gray-900 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {formatRelativeTime(details.lastLoginAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Address Information Card */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-gray-100">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          Saved Addresses ({details.addresses.length})
                        </h3>

                        {details.addresses.length === 0 ? (
                          <div className="p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                            <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-gray-500">No address added</p>
                          </div>
                        ) : (
                          <div className="space-y-3.5 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                            {details.addresses.map((addr) => (
                              <div 
                                key={addr.id} 
                                className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                                  addr.isDefault 
                                    ? 'border-emerald-250 bg-emerald-50/10 shadow-sm' 
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-800">{addr.fullName}</span>
                                  {addr.isDefault && (
                                    <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-emerald-100">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-500 leading-relaxed">{addr.addressLine}</p>
                                <p className="text-gray-500 leading-none">{addr.city}, {addr.state} - <span className="font-medium text-gray-700">{addr.postalCode}</span></p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <span>📞</span> {addr.phone} | {addr.country}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Right Column: Orders, Wishlist, Cart */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Orders Information */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-5">
                        
                        {/* Metric Boxes */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                              <List className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Total Orders</p>
                              <p className="text-lg font-bold text-gray-900 mt-1 leading-none">{details.totalOrders}</p>
                            </div>
                          </div>

                          <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Total Spent</p>
                              <p className="text-lg font-bold text-[#0C831F] mt-1 leading-none">{formatSpent(details.totalAmountSpent)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Latest 5 Orders List */}
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-1.5 border-b border-gray-100">
                            Latest 5 Orders
                          </h4>

                          {details.latestOrders.length === 0 ? (
                            <div className="py-8 text-center text-xs text-gray-400 font-medium">
                              No orders placed yet.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="border-b border-gray-100 text-[10px] font-bold uppercase text-gray-400">
                                    <th className="py-2.5">Order No.</th>
                                    <th className="py-2.5">Date</th>
                                    <th className="py-2.5 text-right">Amount</th>
                                    <th className="py-2.5 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {details.latestOrders.map((o) => (
                                    <tr key={o.id} className="hover:bg-gray-50/30 transition-colors">
                                      <td className="py-3 font-mono font-bold text-gray-900 uppercase tracking-wider">{o.orderNumber}</td>
                                      <td className="py-3 text-gray-500">
                                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </td>
                                      <td className="py-3 text-right font-bold text-gray-800">{formatSpent(o.totalAmount)}</td>
                                      <td className="py-3 text-right">
                                        <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border ${getOrderStatusStyle(o.status)}`}>
                                          {o.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Wishlist and Cart Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Wishlist details */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-gray-100">
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                            Wishlist Items ({details.wishlistCount})
                          </h3>

                          {details.wishlistItems.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-400 font-medium">
                              No items in wishlist.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                              {details.wishlistItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50/50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300">🖼️</div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate" title={item.name}>{item.name}</p>
                                    <p className="text-[11px] font-bold text-gray-900 mt-0.5">{formatSpent(item.price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Cart Details */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-gray-100">
                            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                            Active Cart ({details.cartCount})
                          </h3>

                          {details.cartItems.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-400 font-medium">
                              Cart is empty.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                              {details.cartItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50/50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                      <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300">🖼️</div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate" title={item.productName}>{item.productName}</p>
                                    <div className="flex items-center gap-2.5 mt-0.5">
                                      <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                                      {(item.size || item.color) && (
                                        <span className="text-[10px] text-gray-400 truncate">
                                          {item.size ? `Size: ${item.size}` : ''}
                                          {item.size && item.color ? ' | ' : ''}
                                          {item.color ? `Color: ${item.color}` : ''}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-900 mt-1">{formatSpent(item.price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>

                    </div>

                  </div>
                ) ) : null}
            </div>

            {/* Action Buttons inside detail Modal Footer */}
            {details && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-150 flex-shrink-0 flex justify-end gap-2.5">
                <button
                  onClick={() => setDetailsUserId(null)}
                  className="px-5 py-2.5 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-100 bg-white transition-colors text-gray-700"
                >
                  Close View
                </button>
                {details.role !== 'ROLE_ADMIN' && details.role !== 'ADMIN' && (
                  <>
                    <button
                      onClick={() => triggerBlockToggle(details as any)}
                      className={`text-xs font-bold px-5 py-2.5 rounded-xl border transition-colors shadow-sm ${
                        details.isBlocked
                          ? 'text-emerald-700 hover:text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200'
                          : 'text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 border-red-200'
                      }`}
                    >
                      {details.isBlocked ? 'Unblock Account' : 'Block Account'}
                    </button>
                    <button
                      onClick={() => {
                        setDeletingUser(details as any);
                      }}
                      className="text-xs font-bold px-5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-700 hover:text-white transition-all shadow-sm"
                    >
                      Delete Account
                    </button>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Custom Deleting Modal ── */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/20">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete Account
              </h3>
              <button onClick={() => setDeletingUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-gray-500 leading-relaxed">
                Are you sure you want to permanently delete the account for <strong className="text-gray-900">{deletingUser.name || deletingUser.email}</strong>? All their data, including order history and saved addresses, will be permanently removed. This action cannot be undone.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-5 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-100 bg-white transition-colors text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDeleteUser(deletingUser)}
                disabled={isSubmittingDelete}
                className="px-6 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingDelete ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deleting…
                  </>
                ) : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
