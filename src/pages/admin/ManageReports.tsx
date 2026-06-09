import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { FileSpreadsheet, FileText, Download, Calendar, Package, RefreshCw, Users, Database, Loader2 } from 'lucide-react';

export default function ManageReports() {
  const { showToast } = useToast();

  // Export Loading States
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Filters for Orders
  const [orderFrom, setOrderFrom] = useState('');
  const [orderTo, setOrderTo] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [orderFormat, setOrderFormat] = useState<'csv' | 'xlsx'>('xlsx');

  // Filters for Refunds
  const [refundFrom, setRefundFrom] = useState('');
  const [refundTo, setRefundTo] = useState('');
  const [refundStatus, setRefundStatus] = useState('');
  const [refundFormat, setRefundFormat] = useState<'csv' | 'xlsx'>('xlsx');

  // Filters for Customers
  const [customerFrom, setCustomerFrom] = useState('');
  const [customerTo, setCustomerTo] = useState('');
  const [customerFormat, setCustomerFormat] = useState<'csv' | 'xlsx'>('xlsx');

  // Filters for Inventory
  const [inventoryFormat, setInventoryFormat] = useState<'csv' | 'xlsx'>('xlsx');

  const triggerDownload = (data: any, fileName: string, format: 'csv' | 'xlsx') => {
    const contentType = format === 'csv' 
      ? 'text/csv' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    const blob = new Blob([data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingOrders(true);
    try {
      let query = `format=${orderFormat}`;
      if (orderFrom) query += `&from=${orderFrom}`;
      if (orderTo) query += `&to=${orderTo}`;
      if (orderStatus) query += `&status=${orderStatus}`;

      const res = await axiosInstance.get(`/api/admin/reports/orders/export?${query}`, {
        responseType: 'blob'
      });

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const ext = orderFormat === 'csv' ? 'csv' : 'xlsx';
      triggerDownload(res.data, `OrdersReport_${dateStr}.${ext}`, orderFormat);
      showToast('Orders report exported successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export orders report', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleExportRefunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRefunds(true);
    try {
      let query = `format=${refundFormat}`;
      if (refundFrom) query += `&from=${refundFrom}`;
      if (refundTo) query += `&to=${refundTo}`;
      if (refundStatus) query += `&status=${refundStatus}`;

      const res = await axiosInstance.get(`/api/admin/reports/refunds/export?${query}`, {
        responseType: 'blob'
      });

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const ext = refundFormat === 'csv' ? 'csv' : 'xlsx';
      triggerDownload(res.data, `RefundsReport_${dateStr}.${ext}`, refundFormat);
      showToast('Refunds report exported successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export refunds report', 'error');
    } finally {
      setLoadingRefunds(false);
    }
  };

  const handleExportInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingInventory(true);
    try {
      const res = await axiosInstance.get(`/api/admin/reports/inventory/export?format=${inventoryFormat}`, {
        responseType: 'blob'
      });

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const ext = inventoryFormat === 'csv' ? 'csv' : 'xlsx';
      triggerDownload(res.data, `InventorySnapshot_${dateStr}.${ext}`, inventoryFormat);
      showToast('Inventory report exported successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export inventory report', 'error');
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleExportCustomers = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCustomers(true);
    try {
      let query = `format=${customerFormat}`;
      if (customerFrom) query += `&from=${customerFrom}`;
      if (customerTo) query += `&to=${customerTo}`;

      const res = await axiosInstance.get(`/api/admin/reports/customers/export?${query}`, {
        responseType: 'blob'
      });

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const ext = customerFormat === 'csv' ? 'csv' : 'xlsx';
      triggerDownload(res.data, `CustomersReport_${dateStr}.${ext}`, customerFormat);
      showToast('Customers report exported successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export customers report', 'error');
    } finally {
      setLoadingCustomers(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8">
      {/* Page Title */}
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales & Business Reports</h1>
        <p className="text-xs text-gray-500 mt-1">Generate and download standard business reports in CSV or Excel spreadsheet formats.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. ORDERS REPORT */}
        <div className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-gray-50/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Orders & Sales Report</h3>
              <p className="text-[10px] text-gray-400">Export purchase metrics, transaction subtotals, and tracking details</p>
            </div>
          </div>
          <form onSubmit={handleExportOrders} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">From Date</label>
                <input
                  type="date"
                  value={orderFrom}
                  onChange={(e) => setOrderFrom(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">To Date</label>
                <input
                  type="date"
                  value={orderTo}
                  onChange={(e) => setOrderTo(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Export Format</label>
                <div className="flex gap-2 h-9 items-center">
                  {(['xlsx', 'csv'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setOrderFormat(fmt)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        orderFormat === fmt 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loadingOrders}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingOrders ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {loadingOrders ? 'Generating...' : 'Download Orders Report'}
            </button>
          </form>
        </div>

        {/* 2. REFUNDS REPORT */}
        <div className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-gray-50/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-xl">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Refund Requests Report</h3>
              <p className="text-[10px] text-gray-400">Export claims, returned amounts, and gateway log failure references</p>
            </div>
          </div>
          <form onSubmit={handleExportRefunds} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">From Date</label>
                <input
                  type="date"
                  value={refundFrom}
                  onChange={(e) => setRefundFrom(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">To Date</label>
                <input
                  type="date"
                  value={refundTo}
                  onChange={(e) => setRefundTo(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Refund Status</label>
                <select
                  value={refundStatus}
                  onChange={(e) => setRefundStatus(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">All Statuses</option>
                  <option value="REFUND_REQUESTED">Requested</option>
                  <option value="REFUND_APPROVED">Approved</option>
                  <option value="REFUND_REJECTED">Rejected</option>
                  <option value="REFUND_INITIATED">Initiated</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="REFUND_FAILED">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Export Format</label>
                <div className="flex gap-2 h-9 items-center">
                  {(['xlsx', 'csv'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setRefundFormat(fmt)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        refundFormat === fmt 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loadingRefunds}
              className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingRefunds ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {loadingRefunds ? 'Generating...' : 'Download Refunds Report'}
            </button>
          </form>
        </div>

        {/* 3. CUSTOMERS REPORT */}
        <div className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-gray-50/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Customers Directory Report</h3>
              <p className="text-[10px] text-gray-400">Export active buyers, join dates, purchase count, and total spend</p>
            </div>
          </div>
          <form onSubmit={handleExportCustomers} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Joined From</label>
                <input
                  type="date"
                  value={customerFrom}
                  onChange={(e) => setCustomerFrom(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Joined To</label>
                <input
                  type="date"
                  value={customerTo}
                  onChange={(e) => setCustomerTo(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Export Format</label>
              <div className="flex gap-2 h-9 items-center max-w-[50%]">
                {(['xlsx', 'csv'] as const).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setCustomerFormat(fmt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      customerFormat === fmt 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loadingCustomers}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingCustomers ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {loadingCustomers ? 'Generating...' : 'Download Customers Report'}
            </button>
          </form>
        </div>

        {/* 4. INVENTORY SNAPSHOT */}
        <div className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-gray-50/20 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Database className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Inventory Snapshot</h3>
              <p className="text-[10px] text-gray-400">Export active catalog listings, stock numbers, and low-stock alerts</p>
            </div>
          </div>
          <form onSubmit={handleExportInventory} className="space-y-4 mt-auto">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Export Format</label>
              <div className="flex gap-2 h-9 items-center max-w-[50%]">
                {(['xlsx', 'csv'] as const).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setInventoryFormat(fmt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      inventoryFormat === fmt 
                        ? 'bg-amber-500 text-white border-amber-500' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loadingInventory}
              className="w-full bg-amber-500 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingInventory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {loadingInventory ? 'Generating Snapshot...' : 'Download Inventory Snapshot'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
