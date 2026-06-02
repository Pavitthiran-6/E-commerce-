import React, { useEffect, useState } from 'react';
import { getAllProducts } from '../../services/productService';
import axiosInstance from '../../api/axiosInstance';

interface StatsCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  color: string;
  iconColor: string;
}

// ── Skeleton card for loading state ───────────────────────────────────────────
const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
    <div className="w-12 h-12 rounded-xl admin-skeleton flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 admin-skeleton rounded w-24" />
      <div className="h-7 admin-skeleton rounded w-20" />
      <div className="h-3 admin-skeleton rounded w-32" />
    </div>
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, change, positive, icon, color, iconColor }: StatsCard) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color} group-hover:scale-105 transition-transform duration-200`}>
      <span className={iconColor}>{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className={`text-xs font-medium mt-1.5 flex items-center gap-1 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${positive ? 'bg-emerald-500' : 'bg-red-500'}`} />
        {change}
      </p>
    </div>
  </div>
);

// ── Order status config ────────────────────────────────────────────────────────
const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: 'Pending',    color: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
  processing: { label: 'Processing', color: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-500' },
  shipped:    { label: 'Shipped',    color: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
  delivered:  { label: 'Delivered',  color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-50 text-red-700',       dot: 'bg-red-500' },
};

export default function AdminDashboard() {
  const [productCount, setProductCount] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [products, ordersRes] = await Promise.all([
          getAllProducts(),
          axiosInstance.get('/api/admin/orders?page=0&size=5'),
        ]);
        setProductCount(products.length);
        setOrders(ordersRes.data?.data?.content || []);

        // Try to fetch total user count (admin endpoint)
        try {
          const res = await axiosInstance.get('/api/admin/users?page=0&size=1');
          setUserCount(res.data?.data?.totalElements ?? null);
        } catch {
          setUserCount(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const stats: StatsCard[] = [
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      change: 'From latest orders',
      positive: true,
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      label: 'Total Orders',
      value: orders.length.toString(),
      change: 'Recent orders loaded',
      positive: true,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
    },
    {
      label: 'Products',
      value: productCount.toString(),
      change: 'Total catalogue items',
      positive: true,
      color: 'bg-violet-50',
      iconColor: 'text-violet-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
    },
    {
      label: 'Customers',
      value: userCount !== null ? userCount.toString() : '—',
      change: 'Registered users',
      positive: true,
      color: 'bg-orange-50',
      iconColor: 'text-orange-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your store today.</p>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
          Live data
        </span>
      </div>

      {/* ── Stats Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => <StatCard key={stat.label} {...stat} />)
        }
      </div>

      {/* ── Recent Orders ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Recent Orders</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest 5 orders from your store</p>
          </div>
          <a
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-all"
          >
            View all
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 admin-skeleton rounded w-20" />
                <div className="h-4 admin-skeleton rounded w-28 flex-1" />
                <div className="h-4 admin-skeleton rounded w-16" />
                <div className="h-5 admin-skeleton rounded-full w-20" />
                <div className="h-4 admin-skeleton rounded w-16" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">No orders yet</p>
            <p className="text-xs text-gray-400 mt-1">Orders will appear here once customers start purchasing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto admin-sticky-head">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Order #</th>
                  <th className="px-5 sm:px-6 py-3.5">Customer</th>
                  <th className="px-5 sm:px-6 py-3.5">Amount</th>
                  <th className="px-5 sm:px-6 py-3.5">Status</th>
                  <th className="px-5 sm:px-6 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const cfg = ORDER_STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 sm:px-6 py-4 font-mono text-xs text-gray-500 font-medium">
                        {order.orderNumber || order.id?.slice(0, 8)}
                      </td>
                      <td className="px-5 sm:px-6 py-4">
                        <p className="font-medium text-gray-900 text-[13px]">{order.address?.fullName || '—'}</p>
                      </td>
                      <td className="px-5 sm:px-6 py-4 font-bold text-gray-900 text-[13px]">
                        ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 sm:px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-gray-400 text-xs">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
