import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Users, 
  RefreshCw, 
  Lock, 
  AlertTriangle,
  UserCheck,
  Smartphone,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TrendEntry {
  date: string;
  failedLogins: number;
  successfulLogins: number;
  suspiciousActivities: number;
}

interface TopIpEntry {
  ipAddress: string;
  totalEvents: number;
}

interface TopLockedEntry {
  email: string;
  lockCount: number;
}

interface OverviewStats {
  trend: TrendEntry[];
  topIps: TopIpEntry[];
  topLocked: TopLockedEntry[];
  summary: {
    failedLoginsToday: number;
    lockedAccounts: number;
    successfulLoginsToday: number;
    suspiciousActivitiesToday: number;
    adminActionsToday: number;
    activeAlert: boolean;
    alertDetails: string | null;
  };
  activeAlert: boolean;
  alertDetails: string | null;
}

export default function SecurityOverview() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = async (isManual = false) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api/admin/security-overview');
      setStats(res.data.data);
      if (isManual) {
        showToast('Overview analytics updated', 'success');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load security overview analytics. Verify the backend service.');
      showToast('Error loading overview', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // Poll every 60 seconds
    const interval = setInterval(() => fetchOverview(false), 60000);
    return () => clearInterval(interval);
  }, []);

  // Custom SVG Trend Chart Helper
  const renderTrendChart = (
    data: TrendEntry[],
    key: 'failedLogins' | 'successfulLogins' | 'suspiciousActivities',
    colorStroke: string,
    colorFill?: string
  ) => {
    if (!data || data.length === 0) return null;

    const width = 600;
    const height = 180;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const values = data.map(d => d[key]);
    const maxVal = Math.max(...values, 5); // Minimum cap of 5

    const points = data.map((d, index) => {
      const x = padding + (index * (chartWidth / (data.length - 1)));
      const y = padding + chartHeight - ((d[key] / maxVal) * chartHeight);
      return { x, y, val: d[key], date: d.date };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    let areaPath = '';
    if (colorFill) {
      areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    }

    return (
      <div className="relative group/chart">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            {colorFill && (
              <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorFill} stopOpacity="0.4" />
                <stop offset="100%" stopColor={colorFill} stopOpacity="0.0" />
              </linearGradient>
            )}
            <linearGradient id={`stroke-grad-${key}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={colorStroke} stopOpacity="0.75" />
              <stop offset="100%" stopColor={colorStroke} stopOpacity="1.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3" />
          <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3" />
          <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Area fill */}
          {colorFill && <path d={areaPath} fill={`url(#grad-${key})`} className="transition-all duration-300" />}

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={`url(#stroke-grad-${key})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Points circles */}
          {points.map((p, idx) => {
            // Draw circle triggers on every 3rd day to avoid clutter, or on hover
            const showPoint = idx === 0 || idx === points.length - 1 || idx % 5 === 0;
            if (!showPoint) return null;
            return (
              <g key={idx} className="cursor-pointer group/point">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#ffffff"
                  stroke={colorStroke}
                  strokeWidth="2.5"
                  className="transition-transform group-hover/point:scale-125 duration-150"
                />
                {/* Tooltip on circle point */}
                <title>{`${p.date}: ${p.val}`}</title>
              </g>
            );
          })}
        </svg>

        {/* Dynamic X-Axis labels (start, middle, end) */}
        <div className="flex justify-between text-[9px] font-bold text-gray-400 px-5 pt-1 uppercase">
          <span>{data[0]?.date}</span>
          <span>{data[Math.floor(data.length / 2)]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  const maxIpEvents = stats?.topIps ? Math.max(...stats.topIps.map(i => i.totalEvents), 1) : 1;
  const maxLockouts = stats?.topLocked ? Math.max(...stats.topLocked.map(l => l.lockCount), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Active Alert Banner */}
      {stats?.activeAlert && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-950">🚨 Critical Security Alert Triggered</p>
              <p className="text-xs text-red-700 font-semibold mt-0.5">{stats.alertDetails}</p>
            </div>
          </div>
          <Link
            to="/admin/security-logs"
            className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm flex-shrink-0 cursor-pointer"
          >
            View Audit Logs
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-gray-900" />
            Security Overview
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Enterprise analytics, login trends, and abnormal behavior tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            Cached: 1 Min
          </span>
          <button
            onClick={() => fetchOverview(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 bg-white text-gray-700 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Failed Logins */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-red-500" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Failed Logins Today</p>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          {isLoading ? (
            <div className="h-8 w-16 admin-skeleton rounded mt-2 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-red-600 mt-1.5">{stats?.summary.failedLoginsToday ?? 0}</p>
          )}
        </div>

        {/* Locked Accounts */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-amber-500" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Locked Accounts</p>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          {isLoading ? (
            <div className="h-8 w-16 admin-skeleton rounded mt-2 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-amber-600 mt-1.5">{stats?.summary.lockedAccounts ?? 0}</p>
          )}
        </div>

        {/* Successful Logins */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-emerald-500" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Successful Logins Today</p>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          {isLoading ? (
            <div className="h-8 w-16 admin-skeleton rounded mt-2 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-emerald-600 mt-1.5">{stats?.summary.successfulLoginsToday ?? 0}</p>
          )}
        </div>

        {/* Suspicious Activities */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-rose-600" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Suspicious Today</p>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          {isLoading ? (
            <div className="h-8 w-16 admin-skeleton rounded mt-2 animate-pulse" />
          ) : (
            <p className={`text-3xl font-black text-rose-600 mt-1.5 ${stats && stats.summary.suspiciousActivitiesToday > 0 ? 'animate-bounce' : ''}`}>
              {stats?.summary.suspiciousActivitiesToday ?? 0}
            </p>
          )}
        </div>

        {/* Admin Actions */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-purple-600" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Actions Today</p>
            <Smartphone className="w-4 h-4 text-purple-400" />
          </div>
          {isLoading ? (
            <div className="h-8 w-16 admin-skeleton rounded mt-2 animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-purple-600 mt-1.5">{stats?.summary.adminActionsToday ?? 0}</p>
          )}
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Successful Logins Chart */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm lg:col-span-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Successful Logins (Last 30 Days)
          </h3>
          {isLoading ? (
            <div className="h-40 admin-skeleton rounded-2xl animate-pulse" />
          ) : stats?.trend ? (
            renderTrendChart(stats.trend, 'successfulLogins', '#10b981')
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-gray-400 font-medium">No trend data available</div>
          )}
        </div>

        {/* Failed Logins Chart */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm lg:col-span-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Failed Logins (Last 30 Days)
          </h3>
          {isLoading ? (
            <div className="h-40 admin-skeleton rounded-2xl animate-pulse" />
          ) : stats?.trend ? (
            renderTrendChart(stats.trend, 'failedLogins', '#f59e0b')
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-gray-400 font-medium">No trend data available</div>
          )}
        </div>

        {/* Suspicious Activities Area Chart */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm lg:col-span-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            Suspicious Trend (Last 30 Days)
          </h3>
          {isLoading ? (
            <div className="h-40 admin-skeleton rounded-2xl animate-pulse" />
          ) : stats?.trend ? (
            renderTrendChart(stats.trend, 'suspiciousActivities', '#f43f5e', '#f43f5e')
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-gray-400 font-medium">No trend data available</div>
          )}
        </div>
      </div>

      {/* Bar Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 IP Addresses Bar Chart */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-purple-600" />
            Top 10 IP Addresses (Event Generation)
          </h3>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 admin-skeleton rounded animate-pulse" />
              ))}
            </div>
          ) : stats?.topIps && stats.topIps.length > 0 ? (
            <div className="space-y-4">
              {stats.topIps.map((entry, idx) => {
                const pct = (entry.totalEvents / maxIpEvents) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span className="font-mono text-gray-800">{entry.ipAddress}</span>
                      <span>{entry.totalEvents} Events</span>
                    </div>
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-gray-400 font-medium">No security logs recorded yet.</div>
          )}
        </div>

        {/* Top 10 Locked Accounts Bar Chart */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-purple-600" />
            Top 10 Locked User Accounts
          </h3>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 admin-skeleton rounded animate-pulse" />
              ))}
            </div>
          ) : stats?.topLocked && stats.topLocked.length > 0 ? (
            <div className="space-y-4">
              {stats.topLocked.map((entry, idx) => {
                const pct = (entry.lockCount / maxLockouts) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span className="truncate max-w-[280px]">{entry.email}</span>
                      <span>{entry.lockCount} Locks</span>
                    </div>
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-orange-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-gray-400 font-medium">No account locks recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
