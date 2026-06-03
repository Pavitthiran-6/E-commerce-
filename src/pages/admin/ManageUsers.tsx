import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

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
    <td className="px-5 py-4 text-right"><div className="h-8 admin-skeleton rounded-xl w-16 inline-block" /></td>
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

  // Blocking Modal States
  const [blockingUser, setBlockingUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  // Debounce search input to avoid spamming the backend
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset to first page when query changes
    }, 450);

    return () => clearTimeout(handler);
  }, [search]);

  // Load users from backend
  const loadUsers = async (p = 0, query = '') => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/api/admin/users?page=${p}&size=15&search=${encodeURIComponent(query)}`);
      const data = res.data.data;
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError('Failed to load registered users. Please make sure the backend is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(page, debouncedSearch);
  }, [page, debouncedSearch]);

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
        `User ${user.name || user.email} successfully ${reason === null ? 'unblocked' : 'blocked'}!`,
        'success'
      );
      setBlockingUser(null);
      loadUsers(page, debouncedSearch);
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

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalElements > 0 ? (
              <>
                <span className="inline-flex items-center bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-1.5">{totalElements}</span>
                registered accounts
              </>
            ) : 'View and manage registered user accounts'}
          </p>
        </div>
      </div>

      {/* ── Search Input ── */}
      <div className="relative max-w-sm">
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
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-4 whitespace-nowrap">User</th>
                  <th className="px-5 py-4 whitespace-nowrap">Email</th>
                  <th className="px-5 py-4 whitespace-nowrap">Phone</th>
                  <th className="px-5 py-4 whitespace-nowrap">Role</th>
                  <th className="px-5 py-4 whitespace-nowrap">Joined</th>
                  <th className="px-5 py-4 whitespace-nowrap">Status</th>
                  <th className="px-5 py-4 whitespace-nowrap">Activity & Spend</th>
                  <th className="px-5 py-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-gray-700">No users found</p>
                      <p className="text-xs text-gray-400 mt-1">{search ? `No matches for "${search}"` : 'No customers have registered yet.'}</p>
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Avatar & Name */}
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

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          user.role === 'ROLE_ADMIN' || user.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {user.role === 'ROLE_ADMIN' || user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'}
                        </span>
                      </td>

                      {/* Joined */}
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

                      {/* E-commerce Metrics */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5 text-xs text-gray-500 font-medium">
                          <span className="font-semibold text-gray-800">{user.ordersCount} {user.ordersCount === 1 ? 'Order' : 'Orders'}</span>
                          <span className="text-[#0C831F] font-bold">{formatSpent(user.totalAmountSpent)} Spent</span>
                          <span className="text-[10px] text-gray-400">{formatRelativeTime(user.lastLoginAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => triggerBlockToggle(user)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors shadow-sm ${
                            user.isBlocked
                              ? 'text-emerald-700 hover:text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200'
                              : 'text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 border-red-200'
                          }`}
                        >
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                Block Account
              </h3>
              <button onClick={() => setBlockingUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
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
    </div>
  );
}
