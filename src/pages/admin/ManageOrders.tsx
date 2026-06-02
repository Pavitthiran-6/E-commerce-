import React, { useEffect, useState } from 'react';
import { getOrders } from '../../services/orderService';
import axiosInstance from '../../api/axiosInstance';
import type { Order } from '../../services/orderService';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: 'Pending',    color: 'bg-amber-50 text-amber-700 border border-amber-100',     dot: 'bg-amber-500' },
  processing: { label: 'Processing', color: 'bg-blue-50 text-blue-700 border border-blue-100',        dot: 'bg-blue-500' },
  shipped:    { label: 'Shipped',    color: 'bg-indigo-50 text-indigo-700 border border-indigo-100',  dot: 'bg-indigo-500' },
  delivered:  { label: 'Delivered',  color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-50 text-red-700 border border-red-100',           dot: 'bg-red-500' },
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:    ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
};

const SkeletonRow = () => (
  <tr>
    <td className="px-5 py-4"><div className="h-3 admin-skeleton rounded w-20" /></td>
    <td className="px-5 py-4">
      <div className="space-y-1.5">
        <div className="h-3.5 admin-skeleton rounded w-28" />
        <div className="h-3 admin-skeleton rounded w-36" />
      </div>
    </td>
    <td className="px-5 py-4"><div className="h-3 admin-skeleton rounded w-12" /></td>
    <td className="px-5 py-4"><div className="h-4 admin-skeleton rounded w-20" /></td>
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-14" /></td>
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-20" /></td>
    <td className="px-5 py-4"><div className="h-3 admin-skeleton rounded w-20" /></td>
    <td className="px-5 py-4"><div className="flex justify-end gap-2"><div className="h-7 admin-skeleton rounded-lg w-24" /></div></td>
  </tr>
);

export default function ManageOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async (p = 0) => {
    setIsLoading(true);
    setError('');
    try {
      // Try admin endpoint first, fallback to regular orders
      let data: { content: Order[]; totalPages: number };
      try {
        const res = await axiosInstance.get(`/api/admin/orders?page=${p}&size=10`);
        data = res.data.data;
      } catch {
        data = await getOrders(p, 10);
      }
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError('Failed to load orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await axiosInstance.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o)
      );
    } catch {
      alert('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter(o =>
    (o.orderNumber || o.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.address?.fullName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage all customer orders</p>
        </div>
        {/* Status Legend */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span key={key} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder="Search by order # or customer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
        />
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-gray-700">Failed to load orders</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <button onClick={() => load(page)} className="mt-3 text-xs font-semibold text-gray-900 underline">Try again</button>
          </div>
        ) : (
          <div className="overflow-x-auto admin-sticky-head">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 whitespace-nowrap">Order #</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Customer</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Items</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Amount</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Payment</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Date</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">No orders found</p>
                      <p className="text-xs text-gray-400 mt-1">{search ? `No results for "${search}"` : 'No orders have been placed yet.'}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(order => {
                    const cfg = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' };
                    const transitions = ALLOWED_TRANSITIONS[order.status] || [];
                    const isExpanded = expandedId === order.id;

                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          className={`hover:bg-gray-50/70 transition-colors cursor-pointer select-none ${isExpanded ? 'bg-gray-50/40' : ''}`}
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        >
                          {/* Order # */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                                className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                              </svg>
                              <span className="font-mono text-xs text-gray-600 font-medium">
                                {order.orderNumber || order.id?.slice(0, 8)}
                              </span>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900 text-[13px] leading-none">{order.address?.fullName || '—'}</p>
                            <p className="text-xs text-gray-400 mt-1 truncate max-w-[160px]">{order.address?.email || ''}</p>
                          </td>

                          {/* Items */}
                          <td className="px-5 py-4">
                            <span className="text-xs font-medium text-gray-600">
                              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="px-5 py-4 font-bold text-gray-900 text-[13px]">
                            ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Payment */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${order.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {order.paymentStatus || '—'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-5 py-4 text-xs text-gray-400">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                            {transitions.length > 0 ? (
                              <div className="flex gap-1.5 justify-end flex-wrap">
                                {transitions.map(next => {
                                  const nextCfg = STATUS_CONFIG[next];
                                  return (
                                    <button
                                      key={next}
                                      disabled={updatingId === order.id}
                                      onClick={() => updateStatus(order.id, next)}
                                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all disabled:opacity-50 whitespace-nowrap ${nextCfg?.color || 'bg-gray-100 text-gray-600 border-gray-200'} hover:shadow-sm`}
                                    >
                                      {updatingId === order.id ? '…' : `→ ${nextCfg?.label || next}`}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded row: order items */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="px-0 py-0">
                              <div className="bg-gray-50 border-t border-b border-gray-100 px-8 py-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Order Items</p>
                                <div className="space-y-2">
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                                        <img
                                          src={item.productImage || 'https://via.placeholder.com/40'}
                                          alt={item.productName}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.productName}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          Qty: {item.quantity}
                                          {item.size ? ` · Size: ${item.size}` : ''}
                                          {item.color ? ` · ${item.color}` : ''}
                                        </p>
                                      </div>
                                      <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                                        ₹{item.totalPrice?.toLocaleString('en-IN')}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 flex items-start gap-1.5 text-xs text-gray-500 bg-white rounded-lg border border-gray-100 px-4 py-2.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                  </svg>
                                  <span>
                                    <span className="font-semibold text-gray-700">Deliver to: </span>
                                    {order.address?.addressLine1}, {order.address?.city}, {order.address?.state} — {order.address?.postalCode}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Prev
          </button>
          <span className="text-sm font-semibold text-gray-600 px-3 py-2 bg-gray-900 text-white rounded-xl min-w-[80px] text-center">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}
