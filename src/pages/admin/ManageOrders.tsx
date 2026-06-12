import React, { useEffect, useState } from 'react';
import { 
  getOrders, 
  createShipmentAdmin, 
  requestPickupAdmin, 
  cancelShipmentAdmin, 
  trackShipmentAdmin,
  getShippingSettings,
  updateShippingSettings,
  type ShippingSettings
} from '../../services/orderService';
import axiosInstance from '../../api/axiosInstance';
import type { Order } from '../../services/orderService';
import { Loader2, Search, Truck, MapPin, X, ChevronRight, Package, CheckCircle2, AlertCircle, Settings } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  // New Statuses
  PLACED:           { label: 'Placed',           color: 'bg-yellow-50 text-yellow-700 border border-yellow-100', dot: 'bg-yellow-500' },
  CONFIRMED:        { label: 'Confirmed',        color: 'bg-blue-50 text-blue-700 border border-blue-100',       dot: 'bg-blue-500' },
  PACKED:           { label: 'Packed',           color: 'bg-indigo-50 text-indigo-700 border border-indigo-100', dot: 'bg-indigo-500' },
  SHIPPED:          { label: 'Shipped',          color: 'bg-orange-50 text-orange-700 border border-orange-100', dot: 'bg-orange-500' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-purple-50 text-purple-700 border border-purple-100', dot: 'bg-purple-500' },
  DELIVERED:        { label: 'Delivered',        color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', dot: 'bg-emerald-500' },
  CANCELLED:        { label: 'Cancelled',        color: 'bg-red-50 text-red-700 border border-red-100',          dot: 'bg-red-500' },
  
  // Legacy / Lowercase Support
  pending:          { label: 'Placed',           color: 'bg-yellow-50 text-yellow-700 border border-yellow-100', dot: 'bg-yellow-500' },
  processing:       { label: 'Confirmed',        color: 'bg-blue-50 text-blue-700 border border-blue-100',       dot: 'bg-blue-500' },
  shipped:          { label: 'Shipped',          color: 'bg-orange-50 text-orange-700 border border-orange-100', dot: 'bg-orange-500' },
  delivered:        { label: 'Delivered',        color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', dot: 'bg-emerald-500' },
  cancelled:        { label: 'Cancelled',        color: 'bg-red-50 text-red-700 border border-red-100',          dot: 'bg-red-500' },
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PLACED:           ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PACKED', 'CANCELLED'],
  PACKED:           ['SHIPPED', 'CANCELLED'],
  SHIPPED:          ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        [],
  CANCELLED:        [],

  // Legacy / Lowercase Support
  pending:          ['CONFIRMED', 'CANCELLED'],
  processing:       ['PACKED', 'CANCELLED'],
  shipped:          ['OUT_FOR_DELIVERY'],
  delivered:        [],
  cancelled:        [],
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
  const [trackingSearch, setTrackingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUpdatingPaymentId, setIsUpdatingPaymentId] = useState<string | null>(null);

  // Shiprocket states
  const [isShiprocketLoading, setIsShiprocketLoading] = useState<Record<string, boolean>>({});
  const [showShippingSettingsModal, setShowShippingSettingsModal] = useState(false);
  const [shippingSettings, setShippingSettingsState] = useState<ShippingSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsThreshold, setSettingsThreshold] = useState('');
  const [settingsCharge, setSettingsCharge] = useState('');

  // Fulfillment Modal Form State
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [selectedOrderForFulfill, setSelectedOrderForFulfill] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentNotes, setShipmentNotes] = useState('');

  const load = async (p = 0, status = statusFilter, tracking = trackingSearch) => {
    setIsLoading(true);
    setError('');
    try {
      let url = `/api/admin/orders?page=${p}&size=10`;
      if (status) url += `&status=${status}`;
      if (tracking) url += `&trackingNumber=${encodeURIComponent(tracking)}`;

      const res = await axiosInstance.get(url);
      const data = res.data.data;
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError('Failed to load orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(page, statusFilter, trackingSearch);
  }, [page, statusFilter, trackingSearch]);

  const handleTransitionClick = (order: Order, next: string) => {
    setSelectedOrderForFulfill(order);
    setNextStatus(next);
    setCourierName(order.courierName || '');
    setTrackingNumber(order.trackingNumber || '');
    setShipmentNotes(order.shipmentNotes || '');
    setShowFulfillmentModal(true);
  };

  const handleFulfillOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForFulfill) return;
    setUpdatingId(selectedOrderForFulfill.id);
    try {
      await axiosInstance.put(`/api/admin/orders/${selectedOrderForFulfill.id}/status`, {
        status: nextStatus,
        courierName: courierName || null,
        trackingNumber: trackingNumber || null,
        shipmentNotes: shipmentNotes || null
      });

      setOrders(prev =>
        prev.map(o => o.id === selectedOrderForFulfill.id ? {
          ...o,
          status: nextStatus,
          courierName: courierName || undefined,
          trackingNumber: trackingNumber || undefined,
          shipmentNotes: shipmentNotes || undefined
        } : o)
      );
      setShowFulfillmentModal(false);
      // Reset inputs
      setSelectedOrderForFulfill(null);
      setNextStatus('');
      setCourierName('');
      setTrackingNumber('');
      setShipmentNotes('');
    } catch {
      alert('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    setIsUpdatingPaymentId(orderId);
    try {
      await axiosInstance.put(`/api/admin/orders/${orderId}/payment-status`, {
        paymentStatus: 'PAID'
      });
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, paymentStatus: 'PAID' } : o)
      );
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to update payment status.';
      alert(errMsg);
    } finally {
      setIsUpdatingPaymentId(null);
    }
  };

  const handleCreateShipment = async (orderId: string) => {
    setIsShiprocketLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const updated = await createShipmentAdmin(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      alert('Shipment successfully created on Shiprocket! AWB: ' + updated.awbCode);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create shipment on Shiprocket.';
      alert(msg);
    } finally {
      setIsShiprocketLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleRequestPickup = async (orderId: string) => {
    setIsShiprocketLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const updated = await requestPickupAdmin(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      alert('Pickup request scheduled successfully with courier partner!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to request pickup.';
      alert(msg);
    } finally {
      setIsShiprocketLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCancelShipment = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this Shiprocket shipment? The order will also be cancelled.')) return;
    setIsShiprocketLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const updated = await cancelShipmentAdmin(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      alert('Shipment and order cancelled successfully.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to cancel shipment.';
      alert(msg);
    } finally {
      setIsShiprocketLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleTrackShipment = async (orderId: string) => {
    setIsShiprocketLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const updated = await trackShipmentAdmin(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      alert('Shipment tracking updated! Status: ' + updated.shipmentStatus);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch tracking update.';
      alert(msg);
    } finally {
      setIsShiprocketLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleOpenShippingSettings = async () => {
    try {
      const settings = await getShippingSettings();
      setShippingSettingsState(settings);
      setSettingsThreshold(String(settings.freeShippingThreshold));
      setSettingsCharge(String(settings.shippingCharge));
      setShowShippingSettingsModal(true);
    } catch (err) {
      alert('Failed to load shipping settings.');
    }
  };

  const handleSaveShippingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const updated = await updateShippingSettings({
        freeShippingThreshold: parseFloat(settingsThreshold),
        shippingCharge: parseFloat(settingsCharge)
      });
      setShippingSettingsState(updated);
      alert('Shipping settings saved successfully!');
      setShowShippingSettingsModal(false);
    } catch (err) {
      alert('Failed to save shipping settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Local filter for in-page search (secondary fallback filter)
  const filtered = orders.filter(o =>
    (o.orderNumber || o.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.address?.fullName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders & Fulfillment</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage shipments, assign tracking numbers, and fulfill orders</p>
          </div>
          <button
            onClick={handleOpenShippingSettings}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors mt-1"
            title="Shipping Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        {/* Status Legend */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            // Only show uppercase status legend
            if (key !== key.toUpperCase()) return null;
            return (
              <span key={key} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Order Search */}
          <div className="relative max-w-sm flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order # or customer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
            />
          </div>

          {/* Tracking Number Search */}
          <div className="relative max-w-sm flex-1 sm:flex-initial">
            <Truck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by tracking #…"
              value={trackingSearch}
              onChange={e => {
                setTrackingSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
            />
          </div>
        </div>

        {/* Shipping Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
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
                      <p className="text-xs text-gray-400 mt-1">{search || trackingSearch || statusFilter ? 'No results match search filters' : 'No orders have been placed yet.'}</p>
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
                              order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : order.paymentStatus === 'FAILED'
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'PAID' ? 'bg-emerald-500' : order.paymentStatus === 'FAILED' ? 'bg-red-500' : 'bg-amber-500'}`} />
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
                                      onClick={() => handleTransitionClick(order, next)}
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
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {/* Left: Items details */}
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Order Items</p>
                                    <div className="space-y-2">
                                      {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                                            <img
                                              src={item.productImage || 'https://via.placeholder.com/40'}
                                              alt={item.productName}
                                              className="w-full h-full object-cover mix-blend-multiply"
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
                                  </div>

                                  {/* Right: Courier / Shipping Info details */}
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery & Tracking Status</p>
                                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3 text-xs">
                                      <div className="flex items-start gap-1.5 text-gray-500">
                                        <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" />
                                        <span>
                                          <span className="font-semibold text-gray-700">Address: </span>
                                          {order.address?.fullName} — {order.address?.addressLine1}, {order.address?.city}, {order.address?.state} — {order.address?.postalCode}
                                        </span>
                                      </div>

                                      {(order.courierName || order.trackingNumber || order.shipmentNotes) && (
                                        <div className="border-t border-gray-100 pt-3 space-y-2">
                                          {order.courierName && (
                                            <div>
                                              <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Courier Name: </span>
                                              <span className="font-medium text-gray-800">{order.courierName}</span>
                                            </div>
                                          )}
                                          {order.trackingNumber && (
                                            <div>
                                              <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Tracking Number: </span>
                                              <span className="font-mono font-bold text-primary">{order.trackingNumber}</span>
                                            </div>
                                          )}
                                          {order.shipmentNotes && (
                                            <div>
                                              <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Fulfillment Notes: </span>
                                              <span className="text-gray-700 italic">"{order.shipmentNotes}"</span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Shiprocket Details */}
                                      {(order.shiprocketOrderId || order.shipmentId || order.awbCode || order.shipmentStatus) && (
                                        <div className="border-t border-gray-100 pt-3 space-y-2">
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shiprocket Details</p>
                                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            {order.shiprocketOrderId && (
                                              <div>
                                                <span className="text-gray-400">Order ID: </span>
                                                <span className="font-semibold text-gray-700">{order.shiprocketOrderId}</span>
                                              </div>
                                            )}
                                            {order.shipmentId && (
                                              <div>
                                                <span className="text-gray-400">Shipment ID: </span>
                                                <span className="font-semibold text-gray-700">{order.shipmentId}</span>
                                              </div>
                                            )}
                                            {order.awbCode && (
                                              <div>
                                                <span className="text-gray-400">AWB Code: </span>
                                                <span className="font-semibold text-gray-700 font-mono">{order.awbCode}</span>
                                              </div>
                                            )}
                                            {order.shipmentStatus && (
                                              <div>
                                                <span className="text-gray-400">Status: </span>
                                                <span className="font-bold text-indigo-600">{order.shipmentStatus}</span>
                                              </div>
                                            )}
                                          </div>
                                          {order.trackingUrl && (
                                            <div className="text-[11px] pt-1">
                                              <span className="text-gray-400">Tracking Link: </span>
                                              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium break-all">
                                                {order.trackingUrl}
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Shiprocket Actions Panel */}
                                      <div className="border-t border-gray-100 pt-3 space-y-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shiprocket Actions</p>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                          {!order.awbCode && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                            <button
                                              type="button"
                                              onClick={() => handleCreateShipment(order.id)}
                                              disabled={isShiprocketLoading[order.id]}
                                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 disabled:opacity-60"
                                            >
                                              {isShiprocketLoading[order.id] && <Loader2 className="w-3 h-3 animate-spin" />}
                                              Create Shipment
                                            </button>
                                          )}

                                          {order.shipmentId && !['Pickup Scheduled', 'Shipped', 'Delivered', 'Cancelled'].includes(order.shipmentStatus || '') && !['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) && (
                                            <button
                                              type="button"
                                              onClick={() => handleRequestPickup(order.id)}
                                              disabled={isShiprocketLoading[order.id]}
                                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 disabled:opacity-60"
                                            >
                                              {isShiprocketLoading[order.id] && <Loader2 className="w-3 h-3 animate-spin" />}
                                              Request Pickup
                                            </button>
                                          )}

                                          {order.awbCode && (
                                            <button
                                              type="button"
                                              onClick={() => handleTrackShipment(order.id)}
                                              disabled={isShiprocketLoading[order.id]}
                                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 disabled:opacity-60"
                                            >
                                              {isShiprocketLoading[order.id] && <Loader2 className="w-3 h-3 animate-spin" />}
                                              Track Shipment
                                            </button>
                                          )}

                                          {order.shiprocketOrderId && order.status !== 'CANCELLED' && (
                                            <button
                                              type="button"
                                              onClick={() => handleCancelShipment(order.id)}
                                              disabled={isShiprocketLoading[order.id]}
                                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 disabled:opacity-60"
                                            >
                                              {isShiprocketLoading[order.id] && <Loader2 className="w-3 h-3 animate-spin" />}
                                              Cancel Shipment
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {order.paymentStatus !== 'SUCCESS' && order.paymentStatus !== 'PAID' && (
                                      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-xs mt-4">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Actions</p>
                                        <div className="flex items-center justify-between gap-4">
                                          <div>
                                            <p className="font-semibold text-gray-700">Status: <span className="text-amber-600 font-bold">{order.paymentStatus}</span></p>
                                            <p className="text-gray-400 text-[10px] mt-0.5">Marking as paid will generate the invoice and notify the customer.</p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleMarkAsPaid(order.id);
                                            }}
                                            disabled={isUpdatingPaymentId === order.id}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap"
                                          >
                                            {isUpdatingPaymentId === order.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            Mark as Paid
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
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

      {/* ── Fulfillment Status Update Modal ── */}
      {showFulfillmentModal && selectedOrderForFulfill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-950"></div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-800" />
              Update Fulfillment Status
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Updating Order <span className="font-mono font-bold text-gray-850">#{selectedOrderForFulfill.orderNumber || selectedOrderForFulfill.id.slice(0, 8)}</span> to <span className="font-bold text-gray-950">{(STATUS_CONFIG[nextStatus]?.label || nextStatus)}</span>.
            </p>

            <form onSubmit={handleFulfillOrder} className="space-y-4">
              {/* Courier Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Courier Name
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={e => setCourierName(e.target.value)}
                  placeholder="e.g., Blue Dart, Delhivery, DHL..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-450 transition-colors"
                />
              </div>

              {/* Tracking Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="e.g., AW827361849..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-450 transition-colors"
                />
              </div>

              {/* Shipment Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Shipment Notes / Status message (Customer sees this)
                </label>
                <textarea
                  value={shipmentNotes}
                  onChange={e => setShipmentNotes(e.target.value)}
                  placeholder="e.g., Your package is ready for shipment and will be picked up today..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-450 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFulfillmentModal(false);
                    setSelectedOrderForFulfill(null);
                  }}
                  className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === selectedOrderForFulfill.id}
                  className="flex-1 bg-gray-950 text-white rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                >
                  {updatingId === selectedOrderForFulfill.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {updatingId === selectedOrderForFulfill.id ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Shipping Settings Modal ── */}
      {showShippingSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" data-lenis-prevent="true">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-650"></div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-800" />
              Configure Shipping Settings
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Set rules for free shipping thresholds and default flat delivery charges.
            </p>

            <form onSubmit={handleSaveShippingSettings} className="space-y-4">
              {/* Free Shipping Threshold */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Free Shipping Threshold (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={settingsThreshold}
                  onChange={e => setSettingsThreshold(e.target.value)}
                  placeholder="e.g., 999"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              {/* Shipping Charge */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Flat Shipping Charge (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={settingsCharge}
                  onChange={e => setSettingsCharge(e.target.value)}
                  placeholder="e.g., 79"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShippingSettingsModal(false)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                >
                  {isSavingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
