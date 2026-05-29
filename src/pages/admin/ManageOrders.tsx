import React, { useEffect, useState } from 'react';
import { getOrders } from '../../services/orderService';
import axiosInstance from '../../api/axiosInstance';
import type { Order } from '../../services/orderService';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Shipped',    color: 'bg-indigo-100 text-indigo-700' },
  delivered:  { label: 'Delivered',  color: 'bg-emerald-100 text-emerald-700' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700' },
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:    ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
};

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">View and manage all customer orders</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder="Search by order # or customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
        />
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <span key={key} className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading orders...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">No orders found.</td></tr>
                ) : filtered.map(order => {
                  const cfg = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' };
                  const transitions = ALLOWED_TRANSITIONS[order.status] || [];
                  const isExpanded = expandedId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{order.orderNumber || order.id?.slice(0, 8)}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">{order.address?.fullName || '—'}</p>
                          <p className="text-xs text-gray-400">{order.address?.email || ''}</p>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{order.items?.length || 0} item(s)</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-900">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'}`}>
                            {order.paymentStatus || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                          {transitions.length > 0 ? (
                            <div className="flex gap-1 justify-end flex-wrap">
                              {transitions.map(next => {
                                const nextCfg = STATUS_CONFIG[next];
                                return (
                                  <button
                                    key={next}
                                    disabled={updatingId === order.id}
                                    onClick={() => updateStatus(order.id, next)}
                                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                                  >
                                    {updatingId === order.id ? '...' : `→ ${nextCfg?.label || next}`}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No actions</span>
                          )}
                        </td>
                      </tr>
                      {/* Expanded row: order items */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={8} className="px-8 py-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Order Items</p>
                            <div className="space-y-2">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 px-4 py-2.5">
                                  <img src={item.productImage || 'https://via.placeholder.com/32'} alt={item.productName} className="w-8 h-8 rounded object-cover border" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                                    <p className="text-xs text-gray-400">Qty: {item.quantity} · {item.size || ''} {item.color || ''}</p>
                                  </div>
                                  <p className="text-sm font-semibold text-gray-900">₹{item.totalPrice?.toLocaleString('en-IN')}</p>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                              <span className="font-medium">Delivery to: </span>
                              {order.address?.addressLine1}, {order.address?.city}, {order.address?.state} - {order.address?.postalCode}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
