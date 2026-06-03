import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  MapPin,
  Laptop,
  Mail,
  User,
  Activity,
  SlidersHorizontal
} from 'lucide-react';

interface SecurityAuditLog {
  id: number;
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  status: string;
  details: string;
  createdAt: string;
}

const actionTypes = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_SUCCESS',
  'OTP_VERIFIED',
  'OTP_FAILED',
  'TOKEN_REFRESH',
  'LOGOUT',
  'ADMIN_UNLOCK_ACCOUNT',
  'ADMIN_BLOCK_USER',
  'ADMIN_UNBLOCK_USER',
  'ADMIN_DELETE_USER',
  'ADMIN_LOGIN',
  'ADMIN_ACTION',
  'ADMIN_EXPORT_LOGS',
  'SUSPICIOUS_ACTIVITY'
];

interface SecurityStats {
  failedLoginsToday: number;
  lockedAccounts: number;
  successfulLoginsToday: number;
  suspiciousActivitiesToday: number;
  adminActionsToday: number;
}

export default function SecurityLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Analytics summary card stats
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Filtering states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Advanced filter toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 15;

  // Modal detail state
  const [selectedLog, setSelectedLog] = useState<SecurityAuditLog | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset page on new search
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch stats from backend
  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const res = await axiosInstance.get('/api/admin/security-logs/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch security statistics:', err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Fetch logs from backend
  const fetchLogs = async () => {
    setIsLoading(true);
    setError('');
    try {
      let queryParams = `page=${page}&size=${pageSize}`;
      if (debouncedSearch) queryParams += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (selectedAction) queryParams += `&action=${selectedAction}`;
      if (selectedStatus) queryParams += `&status=${selectedStatus}`;
      if (emailFilter) queryParams += `&email=${encodeURIComponent(emailFilter)}`;
      if (ipFilter) queryParams += `&ipAddress=${encodeURIComponent(ipFilter)}`;
      if (dateFrom) queryParams += `&dateFrom=${dateFrom}`;
      if (dateTo) queryParams += `&dateTo=${dateTo}`;

      const res = await axiosInstance.get(`/api/admin/security-logs?${queryParams}`);
      const data = res.data.data;
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch security logs. Make sure the backend is active.');
      showToast('Error fetching security logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, debouncedSearch, selectedAction, selectedStatus, emailFilter, ipFilter, dateFrom, dateTo]);

  // Real-time automatic polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [page, debouncedSearch, selectedAction, selectedStatus, emailFilter, ipFilter, dateFrom, dateTo]);

  const handleRefreshAll = () => {
    fetchLogs();
    fetchStats();
    showToast('Logs and statistics refreshed', 'success');
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedAction('');
    setSelectedStatus('');
    setEmailFilter('');
    setIpFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
    showToast('Filters cleared', 'success');
  };

  const handleExport = async (format: 'CSV' | 'EXCEL' | 'PDF') => {
    try {
      showToast(`Generating ${format} export...`, 'info');
      
      let queryParams = `format=${format}`;
      if (debouncedSearch) queryParams += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (selectedAction) queryParams += `&action=${selectedAction}`;
      if (selectedStatus) queryParams += `&status=${selectedStatus}`;
      if (emailFilter) queryParams += `&email=${encodeURIComponent(emailFilter)}`;
      if (ipFilter) queryParams += `&ipAddress=${encodeURIComponent(ipFilter)}`;
      if (dateFrom) queryParams += `&dateFrom=${dateFrom}`;
      if (dateTo) queryParams += `&dateTo=${dateTo}`;

      const response = await axiosInstance.get(`/api/admin/security-logs/export?${queryParams}`, {
        responseType: 'blob'
      });

      const ext = format === 'CSV' ? 'csv' : format === 'EXCEL' ? 'xlsx' : 'pdf';
      const contentType = format === 'CSV' ? 'text/csv' : format === 'EXCEL' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.setAttribute('download', `SecurityLogs_${dateStr}.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`${format} export downloaded successfully`, 'success');
      
      // Auto refresh table so the ADMIN_EXPORT_LOGS log action appears immediately
      fetchLogs();
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast(`Failed to export logs as ${format}`, 'error');
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
      case 'ADMIN_LOGIN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'LOGIN_FAILED':
      case 'OTP_FAILED':
        return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'ACCOUNT_LOCKED':
        return 'bg-red-100 text-red-700 border-red-200 font-bold';
      case 'ACCOUNT_UNLOCKED':
      case 'ADMIN_UNLOCK_ACCOUNT':
        return 'bg-sky-50 text-sky-700 border-sky-150';
      case 'ADMIN_BLOCK_USER':
      case 'ADMIN_DELETE_USER':
      case 'ADMIN_EXPORT_LOGS':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'SUSPICIOUS_ACTIVITY':
        return 'bg-rose-600 text-white border-rose-700 animate-pulse font-extrabold';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'SUCCESS') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'FAILED') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (status === 'ALERT') return 'bg-red-500 text-white border-red-600';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            Security Audit Logs
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Real-time compliance monitoring, user access auditing, and anomaly detection.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative inline-block text-left group">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 bg-white text-gray-700 transition-colors shadow-sm cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-gray-455" />
              Export Logs
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-gray-150 rounded-xl shadow-lg hidden group-hover:block hover:block z-20 transition-all duration-150">
              <div className="py-1">
                <button
                  onClick={() => handleExport('CSV')}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('EXCEL')}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport('PDF')}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Export as PDF
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 bg-white text-gray-700 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isStatsLoading ? 'animate-spin' : ''}`} />
            Refresh Log Feed
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Failed Logins Today */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-red-500" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Failed Logins Today</p>
          {isStatsLoading ? (
            <div className="h-8 w-16 admin-skeleton rounded mt-2 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-red-600 mt-1.5">{stats?.failedLoginsToday ?? 0}</p>
          )}
        </div>

        {/* Locked Accounts */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-amber-500" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Locked Accounts</p>
          {isStatsLoading ? (
            <div className="h-8 w-16 admin-skeleton rounded mt-2 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-amber-600 mt-1.5">{stats?.lockedAccounts ?? 0}</p>
          )}
        </div>

        {/* Successful Logins */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-emerald-500" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Successful Logins</p>
          {isStatsLoading ? (
            <div className="h-8 w-16 admin-skeleton rounded mt-2 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-emerald-600 mt-1.5">{stats?.successfulLoginsToday ?? 0}</p>
          )}
        </div>

        {/* Suspicious Activities */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-rose-600" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Suspicious Activities</p>
          {isStatsLoading ? (
            <div className="h-8 w-16 admin-skeleton rounded mt-2 animate-pulse" />
          ) : (
            <p className={`text-3xl font-black text-rose-600 mt-1.5 ${stats && stats.suspiciousActivitiesToday > 0 ? 'animate-bounce' : ''}`}>
              {stats?.suspiciousActivitiesToday ?? 0}
            </p>
          )}
        </div>

        {/* Admin Actions */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-purple-600" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Actions Today</p>
          {isStatsLoading ? (
            <div className="h-8 w-16 admin-skeleton rounded mt-2 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-purple-600 mt-1.5">{stats?.adminActionsToday ?? 0}</p>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, IP, or log details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400 bg-gray-50/50"
            />
          </div>

          {/* Action Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedAction}
              onChange={(e) => { setSelectedAction(e.target.value); setPage(0); }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-700"
            >
              <option value="">All Action Types</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border rounded-2xl transition-all cursor-pointer ${
                showAdvanced 
                  ? 'border-gray-900 bg-gray-900 text-white' 
                  : 'border-gray-200 hover:bg-gray-50 bg-white text-gray-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 text-xs font-bold border border-transparent rounded-2xl text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
            {/* Email Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">User Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by email..."
                  value={emailFilter}
                  onChange={(e) => { setEmailFilter(e.target.value); setPage(0); }}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* IP Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">IP Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. 103.123.45.67"
                  value={ipFilter}
                  onChange={(e) => { setIpFilter(e.target.value); setPage(0); }}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="ALERT">ALERT</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Logs Table */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action Type</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User / Email</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">IP Address</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client/Agent</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Details</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 text-right uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="h-3 admin-skeleton rounded w-28" /></td>
                    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-32" /></td>
                    <td className="px-5 py-4"><div className="h-3 admin-skeleton rounded w-44" /></td>
                    <td className="px-5 py-4"><div className="h-3 admin-skeleton rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-3 admin-skeleton rounded w-16" /></td>
                    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-14" /></td>
                    <td className="px-5 py-4"><div className="h-3 admin-skeleton rounded w-60" /></td>
                    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded w-5 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-rose-500 font-semibold">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-400 font-medium">
                    <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    No security audit logs found matching the filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuspicious = log.action === 'SUSPICIOUS_ACTIVITY';
                  return (
                    <tr 
                      key={log.id} 
                      className={`transition-colors hover:bg-gray-50/50 ${
                        isSuspicious ? 'bg-rose-50/30 border-l-4 border-l-rose-500' : ''
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-medium">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>

                      {/* Action Type */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getActionBadgeClass(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* User / Email */}
                      <td className="px-5 py-3.5 max-w-[200px] truncate">
                        {log.userEmail ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-gray-900 truncate">{log.userEmail}</p>
                            {log.userId && (
                              <p className="text-[10px] text-gray-400 font-mono truncate">{log.userId}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Anonymous</span>
                        )}
                      </td>

                      {/* IP Address */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-gray-600 font-medium">
                        {log.ipAddress || '—'}
                      </td>

                      {/* Client Agent */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Laptop className="w-3.5 h-3.5 text-gray-400" />
                          {log.userAgent}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getStatusBadgeClass(log.status)}`}>
                          {log.status}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-5 py-3.5 max-w-[250px] truncate text-gray-600 font-medium">
                        {log.details}
                      </td>

                      {/* Action Button */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {logs.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-semibold">
              Showing <span className="text-gray-900">{page * pageSize + 1}</span> to{' '}
              <span className="text-gray-900">
                {Math.min((page + 1) * pageSize, totalElements)}
              </span>{' '}
              of <span className="text-gray-900">{totalElements}</span> entries
            </p>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>

              {/* Page indicators */}
              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                // Simplified pagination range logic
                let pageNum = index;
                if (page > 2 && totalPages > 5) {
                  pageNum = page - 2 + index;
                  if (pageNum + (5 - index) > totalPages) {
                    pageNum = totalPages - 5 + index;
                  }
                }
                return (
                  <button
                    key={index}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors border cursor-pointer ${
                      page === pageNum
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white border border-gray-100 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-zoomIn flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-500" />
                Security Audit Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 rotate-95" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-grow">
              {/* Event Type & Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Action type</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black border mt-1 ${getActionBadgeClass(selectedLog.action)}`}>
                    {selectedLog.action.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Execution Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-[10px] font-bold mt-1.5 ${getStatusBadgeClass(selectedLog.status)}`}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              {/* Details table */}
              <div className="space-y-4">
                {/* ID */}
                <div className="grid grid-cols-3 py-2 border-b border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Log ID</span>
                  <span className="col-span-2 text-xs font-mono text-gray-700">#{selectedLog.id}</span>
                </div>

                {/* User Info */}
                <div className="grid grid-cols-3 py-2 border-b border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">User Email</span>
                  <span className="col-span-2 text-xs font-semibold text-gray-900">{selectedLog.userEmail || 'Anonymous'}</span>
                </div>

                {/* User ID */}
                {selectedLog.userId && (
                  <div className="grid grid-cols-3 py-2 border-b border-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">User UUID</span>
                    <span className="col-span-2 text-xs font-mono text-gray-500 select-all break-all">{selectedLog.userId}</span>
                  </div>
                )}

                {/* IP Address */}
                <div className="grid grid-cols-3 py-2 border-b border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">IP Address</span>
                  <span className="col-span-2 text-xs font-mono text-gray-950 font-semibold">{selectedLog.ipAddress || '—'}</span>
                </div>

                {/* Timestamp */}
                <div className="grid grid-cols-3 py-2 border-b border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Date & Time</span>
                  <span className="col-span-2 text-xs text-gray-700">
                    {new Date(selectedLog.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>

                {/* User Agent */}
                <div className="grid grid-cols-3 py-2 border-b border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">User Agent</span>
                  <span className="col-span-2 text-xs text-gray-700 break-all">{selectedLog.userAgent}</span>
                </div>

                {/* Detailed Logs Description */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Execution details</span>
                  <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl text-xs font-mono text-gray-800 break-words whitespace-pre-wrap max-h-[160px] overflow-y-auto">
                    {selectedLog.details || 'No additional details provided.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end sticky bottom-0 z-10">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
