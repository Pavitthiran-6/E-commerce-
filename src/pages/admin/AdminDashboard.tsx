import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { 
  TrendingUp, ShoppingBag, Package, Users, ArrowUpRight, 
  AlertTriangle, RefreshCw, MessageSquare, Loader2, Info, CheckCircle
} from 'lucide-react';

interface DashboardData {
  totalRevenue: number;
  revenueToday: number;
  revenueWeekly: number;
  revenueMonthly: number;
  avgOrderValue: number;
  totalOrders: number;
  ordersToday: number;
  ordersThisMonth: number;
  pendingOrders: number;
  totalUsers: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockCount: number;
  refundCount: number;
  pendingRefunds: number;
  totalRefundAmount: number;
  pendingReviews: number;
  recentOrders: any[];
  topProducts: any[];
  topCategories: any[];
  orderStatusBreakdown: Record<string, number>;
  monthlyRevenue: any[];
  dailyTrend: any[];

  // Logistics & SLA analytics
  avgReturnApprovalTimeHours: number;
  avgRefundProcessingTimeHours: number;
  avgReturnCompletionTimeHours: number;
  logisticsAwaitingShipment: number;
  logisticsPickupScheduled: number;
  logisticsInTransit: number;
  logisticsOutForDelivery: number;
  logisticsDeliveredToday: number;
  logisticsRtoOrders: number;
  logisticsActiveReturnRequests: number;
  logisticsPendingRefunds: number;
  highReturnRiskCustomers: any[];
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  placed:     { label: 'Placed',     color: 'bg-yellow-50 text-yellow-700 border-yellow-100', dot: 'bg-yellow-500' },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
  packed:     { label: 'Packed',     color: 'bg-indigo-50 text-indigo-700 border-indigo-100', dot: 'bg-indigo-500' },
  shipped:    { label: 'Shipped',    color: 'bg-sky-50 text-sky-700 border-sky-100', dot: 'bg-sky-500' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500' },
  delivered:  { label: 'Delivered',  color: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
};

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trendDays, setTrendDays] = useState<7 | 30>(7);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get('/api/admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load dashboard metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-10 h-10 text-[#0C831F] animate-spin" />
        <p className="text-sm text-gray-500 font-semibold">Generating analytics dashboard...</p>
      </div>
    );
  }

  // Slice daily trend based on state (7 or 30 days)
  const chartTrend = trendDays === 7 ? data.dailyTrend.slice(-7) : data.dailyTrend;

  // --- Render SVG Line Chart for Revenue Trend ---
  const renderRevenueChart = () => {
    const values = chartTrend.map(d => d.revenue || 0);
    const maxVal = Math.max(...values, 1000);
    const chartHeight = 220;
    const chartWidth = 500;
    const padding = 40;
    
    // Generate points
    const points = chartTrend.map((d, i) => {
      const x = padding + (i * (chartWidth - padding * 2)) / (chartTrend.length - 1 || 1);
      const y = chartHeight - padding - ((d.revenue || 0) * (chartHeight - padding * 2)) / maxVal;
      return { x, y, val: d.revenue, label: d.date };
    });

    // Generate Path Data
    let pathD = '';
    let areaD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaD = pathD + ` L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;
    }

    return (
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Gradients */}
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c831f" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0c831f" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + ratio * (chartHeight - padding * 2);
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#f3f3f3" strokeDasharray="4 4" />
              <text x={padding - 8} y={y + 3} textAnchor="end" className="text-[9px] fill-gray-400 font-bold">
                ₹{val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Path and Area */}
        {points.length > 1 && (
          <>
            <path d={areaD} fill="url(#chartGrad)" />
            <path d={pathD} fill="none" stroke="#0c831f" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* Tooltip nodes/dots */}
        {points.map((p, idx) => (
          <g key={idx} className="group/dot cursor-pointer">
            <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#0c831f" strokeWidth="2" />
            {/* Tooltip Overlay */}
            <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
              <rect x={p.x - 45} y={p.y - 30} width="90" height="20" rx="6" fill="#1f2937" />
              <text x={p.x} y={p.y - 17} textAnchor="middle" fill="#ffffff" className="text-[9px] font-bold">
                ₹{(p.val || 0).toLocaleString('en-IN')}
              </text>
            </g>
          </g>
        ))}

        {/* X axis labels */}
        {points.map((p, idx) => {
          // Only show alternate labels to avoid overcrowding
          if (chartTrend.length > 8 && idx % 3 !== 0) return null;
          const displayDate = p.label.slice(5); // MM-DD
          return (
            <text key={idx} x={p.x} y={chartHeight - padding + 15} textAnchor="middle" className="text-[9px] fill-gray-400 font-bold uppercase">
              {displayDate}
            </text>
          );
        })}
      </svg>
    );
  };

  // --- Render SVG Bar Chart for Orders Trend ---
  const renderOrdersChart = () => {
    const values = chartTrend.map(d => d.orders || 0);
    const maxVal = Math.max(...values, 5);
    const chartHeight = 220;
    const chartWidth = 500;
    const padding = 40;
    const barWidth = Math.max(10, (chartWidth - padding * 2) / (chartTrend.length * 2 || 1));

    return (
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + ratio * (chartHeight - padding * 2);
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#f3f3f3" strokeDasharray="4 4" />
              <text x={padding - 8} y={y + 3} textAnchor="end" className="text-[9px] fill-gray-400 font-bold">
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {chartTrend.map((d, i) => {
          const x = padding + (i * (chartWidth - padding * 2)) / (chartTrend.length || 1) + barWidth / 2;
          const y = chartHeight - padding - ((d.orders || 0) * (chartHeight - padding * 2)) / maxVal;
          const barHeight = chartHeight - padding - y;
          const displayDate = d.date.slice(5); // MM-DD

          return (
            <g key={i} className="group/bar cursor-pointer">
              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={Math.max(1, barHeight)}
                fill="#3b82f6"
                rx="3"
                className="hover:fill-blue-600 transition-colors"
              />
              <text x={x} y={chartHeight - padding + 15} textAnchor="middle" className="text-[9px] fill-gray-400 font-bold uppercase">
                {chartTrend.length > 8 && i % 3 !== 0 ? '' : displayDate}
              </text>
              {/* Tooltip Overlay */}
              <g className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect x={x - 30} y={y - 25} width="60" height="18" rx="5" fill="#1f2937" />
                <text x={x} y={y - 13} textAnchor="middle" fill="#ffffff" className="text-[9px] font-bold">
                  {d.orders} Order{d.orders !== 1 ? 's' : ''}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Business Analytics Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">Real-time overview of sales performance, refunds, inventory alerts, and customer trends.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 bg-white transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
        </button>
      </div>

      {/* Row 1: Key Metric Cards (8 cards grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today Revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4.5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-[#0c831f]" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Today's Revenue</p>
          <p className="text-xl sm:text-2xl font-black text-gray-900">₹{(data.revenueToday || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Live sales today
          </p>
        </div>

        {/* Metric 2: Weekly Revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4.5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-[#0c831f]" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Weekly Revenue</p>
          <p className="text-xl sm:text-2xl font-black text-gray-900">₹{(data.revenueWeekly || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-gray-400 font-semibold mt-1">Last 7 days revenue</p>
        </div>

        {/* Metric 3: Monthly Revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4.5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-[#0c831f]" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Monthly Revenue</p>
          <p className="text-xl sm:text-2xl font-black text-gray-900">₹{(data.revenueMonthly || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-gray-400 font-semibold mt-1">This month totals</p>
        </div>

        {/* Metric 4: Total Revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4.5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-emerald-600" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Revenue</p>
          <p className="text-xl sm:text-2xl font-black text-gray-900">₹{(data.totalRevenue || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Verified earnings</p>
        </div>

        {/* Metric 5: Orders Today */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4.5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-blue-500" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Orders Today</p>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{data.ordersToday}</p>
          <p className="text-[10px] text-blue-600 font-bold mt-1">Received today</p>
        </div>

        {/* Metric 6: Orders This Month */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4.5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-blue-500" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Orders This Month</p>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{data.ordersThisMonth}</p>
          <p className="text-[10px] text-gray-400 font-semibold mt-1">Monthly frequency</p>
        </div>

        {/* Metric 7: Total Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4.5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-indigo-600" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Orders</p>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{data.totalOrders}</p>
          <p className="text-[10px] text-gray-400 font-semibold mt-1">Lifetime order volume</p>
        </div>

        {/* Metric 8: Average Order Value */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4.5 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-violet-600" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Avg Order Value</p>
          <p className="text-xl sm:text-2xl font-black text-gray-900">₹{Math.round(data.avgOrderValue || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-violet-600 font-bold mt-1">⚡ Average spend per basket</p>
        </div>
      </div>

      {/* Row 2: Charts (Revenue Trend & Order Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Revenue Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Revenue Performance Trend</h3>
              <p className="text-[10px] text-gray-400">Daily sales trends analysis</p>
            </div>
            {/* Day Toggle */}
            <div className="bg-gray-150 p-1 rounded-xl flex gap-1 border border-gray-200">
              {([7, 30] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                    trendDays === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            {chartTrend.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No sales trend records</p>
            ) : renderRevenueChart()}
          </div>
        </div>

        {/* Chart B: Orders Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Daily Order Intake</h3>
              <p className="text-[10px] text-gray-400">Order count distribution frequency</p>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{trendDays} Days View</span>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            {chartTrend.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No order volume records</p>
            ) : renderOrdersChart()}
          </div>
        </div>
      </div>

      {/* Row 3: Product Insights (Top Selling & Categories) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List A: Top Selling Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="border-b border-gray-50 pb-4 mb-4">
            <h3 className="text-sm font-bold text-gray-900">Top Selling Products</h3>
            <p className="text-[10px] text-gray-400">Top 5 items by total quantity sold</p>
          </div>
          {data.topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-1.5">
              <Package className="w-8 h-8 text-gray-300" />
              <p className="text-xs text-gray-400 italic">No products sold yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 flex-1">
              {data.topProducts.map((p, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 flex items-center justify-center rounded-lg bg-gray-50 text-[10px] font-bold text-gray-500 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{p.productName}</p>
                      <p className="text-[9px] text-gray-400 font-mono truncate">{p.productId}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-gray-900 whitespace-nowrap bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                    {p.totalSold} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* List B: Top Categories */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="border-b border-gray-50 pb-4 mb-4">
            <h3 className="text-sm font-bold text-gray-900">Top Categories by Revenue</h3>
            <p className="text-[10px] text-gray-400">Top 5 departments by sales revenue</p>
          </div>
          {data.topCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-1.5">
              <Package className="w-8 h-8 text-gray-300" />
              <p className="text-xs text-gray-400 italic">No category sales recorded</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {data.topCategories.map((c, idx) => {
                const totalRevSum = data.topCategories.reduce((s, cat) => s + (cat.revenue || 0), 0) || 1;
                const percentage = Math.round(((c.revenue || 0) / totalRevSum) * 100);
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-gray-800">{c.category}</span>
                      <span className="font-semibold text-gray-500">₹{(c.revenue || 0).toLocaleString('en-IN')} ({percentage}%)</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                      <div 
                        className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Refund Summary & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card A: Refund Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2 flex flex-col">
          <div className="border-b border-gray-50 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Claims & Refunds Summary</h3>
              <p className="text-[10px] text-gray-400">Activity audit for customer returns</p>
            </div>
            <Link to="/admin/refunds" className="text-xs font-bold text-purple-600 hover:underline">
              Manage Refunds →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 my-auto py-2">
            <div className="text-center p-3 rounded-2xl border border-gray-50 bg-gray-50/20">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Claims</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{data.refundCount}</p>
            </div>
            <div className="text-center p-3 rounded-2xl border border-red-50 bg-red-50/20">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Pending Claims</p>
              <p className="text-2xl font-black text-red-600 mt-1">{data.pendingRefunds}</p>
            </div>
            <div className="text-center p-3 rounded-2xl border border-gray-50 bg-gray-50/20">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Refunded Sum</p>
              <p className="text-2xl font-black text-gray-900 mt-1">₹{(data.totalRefundAmount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Card B: Inventory Alert Feed */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
          <div className="border-b border-gray-50 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Inventory Status</h3>
              <p className="text-[10px] text-gray-400">Stock health checks and actions</p>
            </div>
            <Link to="/admin/inventory" className="text-xs font-bold text-amber-600 hover:underline">
              Restock →
            </Link>
          </div>
          <div className="space-y-3 my-auto">
            {/* Out of Stock Alert */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-red-100 bg-red-50/30">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-950">{data.outOfStockCount} Out of Stock</p>
                <p className="text-[9px] text-red-700">Products currently blocking purchases</p>
              </div>
            </div>
            {/* Low Stock Alert */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-amber-100 bg-amber-50/30">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-950">{data.lowStockProducts} Low Stock Items</p>
                <p className="text-[9px] text-amber-700">Products running below low threshold</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Recent Orders & Moderate Pending Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table: Recent Orders (2 cols) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-headline-sm">Recent Store Orders</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest transactions processed</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-50 px-3 py-1.5 border border-gray-250 rounded-xl transition-all">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {data.recentOrders.slice(0, 5).map((o) => {
                  const cfg = ORDER_STATUS_CONFIG[o.status.toLowerCase()] || { label: o.status, color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-medium text-gray-500">
                        {o.orderNumber}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-700">
                        {o.address?.fullName || 'Anonymous'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                          <span className={`w-1.2 h-1.2 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card: Pending Reviews Notification */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Pending Review Audits</h3>
            <p className="text-[10px] text-gray-400">Moderation queue for user feedback</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6 gap-2 my-auto">
            <MessageSquare className="w-10 h-10 text-gray-300" />
            <p className="text-xl font-black text-gray-900">{data.pendingReviews}</p>
            <p className="text-[11px] text-gray-400 font-semibold text-center">Reviews awaiting approval before displaying in catalog</p>
          </div>

          <Link
            to="/admin/reviews"
            className="w-full text-center py-2.5 rounded-xl border-2 border-gray-100 hover:border-gray-300 font-bold text-xs text-gray-700 hover:text-gray-900 transition-all bg-white block"
          >
            Open Review queue
          </Link>
        </div>
      </div>

      {/* Row: Logistics Operations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Logistics & Shipments Operations</h3>
          <p className="text-[10px] text-gray-400">Real-time shipping milestones and returns tracking</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Awaiting Shipment</p>
              <p className="text-2xl font-black text-blue-900 mt-1">{data.logisticsAwaitingShipment}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400 opacity-80" />
          </div>
          
          <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Pickup Scheduled</p>
              <p className="text-2xl font-black text-indigo-900 mt-1">{data.logisticsPickupScheduled}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-indigo-400 opacity-80" />
          </div>

          <div className="p-4 rounded-2xl border border-sky-100 bg-sky-50/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">In Transit</p>
              <p className="text-2xl font-black text-sky-900 mt-1">{data.logisticsInTransit}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-sky-400 opacity-80" />
          </div>

          <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Out For Delivery</p>
              <p className="text-2xl font-black text-orange-900 mt-1">{data.logisticsOutForDelivery}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-orange-400 opacity-80" />
          </div>

          <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Delivered Today</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{data.logisticsDeliveredToday}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-400 opacity-80" />
          </div>

          <div className="p-4 rounded-2xl border border-red-100 bg-red-50/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">RTO Orders</p>
              <p className="text-2xl font-black text-red-900 mt-1">{data.logisticsRtoOrders}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400 opacity-80" />
          </div>

          <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Active Returns</p>
              <p className="text-2xl font-black text-purple-900 mt-1">{data.logisticsActiveReturnRequests}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-purple-400 opacity-80" />
          </div>

          <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Refunds</p>
              <p className="text-2xl font-black text-amber-900 mt-1">{data.logisticsPendingRefunds}</p>
            </div>
            <Info className="w-8 h-8 text-amber-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* Row: SLA Analytics & High Risk Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Analytics Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Return & Refund SLA Performance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Average operational lifecycle resolution times</p>
          </div>
          <div className="divide-y divide-gray-150">
            <div className="py-3 flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Average Return Approval SLA</span>
              <span className="font-bold text-gray-950 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-150">
                {data.avgReturnApprovalTimeHours ? `${data.avgReturnApprovalTimeHours.toFixed(1)} hrs` : 'N/A'}
              </span>
            </div>
            <div className="py-3 flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Average Refund Processing SLA</span>
              <span className="font-bold text-gray-950 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-150">
                {data.avgRefundProcessingTimeHours ? `${data.avgRefundProcessingTimeHours.toFixed(1)} hrs` : 'N/A'}
              </span>
            </div>
            <div className="py-3 flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Average Return Completion SLA</span>
              <span className="font-bold text-gray-950 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-150">
                {data.avgReturnCompletionTimeHours ? `${data.avgReturnCompletionTimeHours.toFixed(1)} hrs` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* High Return Risk Customers Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">High Return Risk Customers</h3>
            <p className="text-[10px] text-gray-400">Customers with return rates exceeding 40% for review</p>
          </div>

          <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-56 mt-4">
            {(!data.highReturnRiskCustomers || data.highReturnRiskCustomers.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 gap-1.5 h-full">
                <Users className="w-8 h-8 text-gray-300" />
                <p className="text-xs text-gray-400 italic">No customers flagged for high returns risk</p>
              </div>
            ) : (
              data.highReturnRiskCustomers.map((user: any) => (
                <div key={user.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div>
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-[10px] text-gray-400">{user.email}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-red-150">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {user.returnPercentage.toFixed(1)}% Return Rate
                    </span>
                    <p className="text-[9px] text-gray-400 mt-0.5">{user.ordersCount} Orders / {user.totalReturns} Returns</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
