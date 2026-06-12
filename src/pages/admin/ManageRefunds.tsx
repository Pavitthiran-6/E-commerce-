import React, { useEffect, useState } from 'react';
import { 
  getRefundRequestsAdmin, 
  approveRefundAdmin, 
  rejectRefundAdmin, 
  retryRefundAdmin,
  markRefundPaidAdmin,
  approveReturnAdmin,
  scheduleReturnPickupAdmin,
  markReturnedAdmin,
  processRefundAdmin,
  requestPayoutDetailsAdmin,
  type RefundRequest 
} from '../../services/refundService';
import { 
  DollarSign, 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  User, 
  Mail, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  REFUND_REQUESTED:        { label: 'Pending Review',       color: 'bg-amber-50 text-amber-700 border border-amber-100',     dot: 'bg-amber-500' },
  REFUND_APPROVED:         { label: 'Approved — Pay Now',   color: 'bg-orange-50 text-orange-700 border border-orange-200',  dot: 'bg-orange-500' },
  REFUND_INITIATED:        { label: 'Initiated',            color: 'bg-indigo-50 text-indigo-700 border border-indigo-100',  dot: 'bg-indigo-500' },
  REFUNDED:                { label: 'Refunded',             color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', dot: 'bg-emerald-500' },
  REFUND_REJECTED:         { label: 'Rejected',             color: 'bg-red-50 text-red-700 border border-red-100',           dot: 'bg-red-500' },
  REFUND_FAILED:           { label: 'Refund Failed',        color: 'bg-red-100 text-red-800 border border-red-200',          dot: 'bg-red-600' },
  RETURN_REQUESTED:        { label: 'Return Requested',     color: 'bg-amber-50 text-amber-700 border border-amber-100',     dot: 'bg-amber-500' },
  RETURN_APPROVED:         { label: 'Return Approved',      color: 'bg-blue-50 text-blue-700 border border-blue-100',        dot: 'bg-blue-500' },
  RETURN_PICKUP_SCHEDULED: { label: 'Pickup Scheduled',     color: 'bg-teal-50 text-teal-700 border border-teal-100',        dot: 'bg-teal-500' },
  RETURNED:                { label: 'Returned to Warehouse', color: 'bg-purple-50 text-purple-700 border border-purple-100',  dot: 'bg-purple-500' },
  PAYOUT_DETAILS_REQUESTED: { label: 'Payout Details Requested', color: 'bg-amber-50 text-amber-700 border border-amber-100', dot: 'bg-amber-500' },
  PAYOUT_DETAILS_PROVIDED:  { label: 'Payout Details Provided',  color: 'bg-indigo-50 text-indigo-805 border border-indigo-100', dot: 'bg-indigo-650' },
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
    <td className="px-6 py-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 rounded w-32" />
        <div className="h-3 bg-gray-100 rounded w-40" />
      </div>
    </td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
    <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-24" /></td>
    <td className="px-6 py-4 text-right"><div className="h-8 bg-gray-100 rounded-lg w-20 ml-auto" /></td>
  </tr>
);

export default function ManageRefunds() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Detail drawer & workflow states
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'process_refund' | 'warehouse_inspection' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Warehouse inspection checklist states
  const [isProductDamaged, setIsProductDamaged] = useState(false);
  const [isWrongProductReturned, setIsWrongProductReturned] = useState(false);
  const [isMissingAccessories, setIsMissingAccessories] = useState(false);
  const [isUsedProduct, setIsUsedProduct] = useState(false);
  const [isPackagingMissing, setIsPackagingMissing] = useState(false);
  const [isQualityIssueConfirmed, setIsQualityIssueConfirmed] = useState(false);

  const loadRequests = async (p = 0, s = search, filter = statusFilter) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getRefundRequestsAdmin(s, filter, p, 10);
      setRequests(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError('Failed to fetch refund requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(page, search, statusFilter);
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadRequests(0, search, statusFilter);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionType) return;
    
    if (actionType === 'reject' && !rejectionReason.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }

    if (actionType === 'warehouse_inspection' && !notes.trim()) {
      setActionError('Warehouse inspection notes are required.');
      return;
    }

    setIsActionSubmitting(true);
    setActionError('');
    try {
      let updated: RefundRequest;
      if (actionType === 'approve') {
        updated = await approveRefundAdmin(selectedRequest.id, notes);
      } else if (actionType === 'process_refund') {
        updated = await processRefundAdmin(selectedRequest.id, notes);
      } else if (actionType === 'warehouse_inspection') {
        updated = await markReturnedAdmin(selectedRequest.id, {
          warehouseInspectionNotes: notes,
          isProductDamaged,
          isWrongProductReturned,
          isMissingAccessories,
          isUsedProduct,
          isPackagingMissing,
          isQualityIssueConfirmed
        });
      } else {
        updated = await rejectRefundAdmin(selectedRequest.id, rejectionReason);
      }

      // Update in-page lists
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedRequest(updated);
      
      // Reset action states
      setActionType(null);
      setNotes('');
      setRejectionReason('');
      setIsProductDamaged(false);
      setIsWrongProductReturned(false);
      setIsMissingAccessories(false);
      setIsUsedProduct(false);
      setIsPackagingMissing(false);
      setIsQualityIssueConfirmed(false);
      alert(`Refund/Return action successfully processed.`);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to submit action. Please try again.');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Refund Request Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and process cancellation refunds via Razorpay</p>
        </div>
        
        {/* Stats Summary Panel */}
        <div className="flex gap-4">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Requests</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{totalElements}</p>
          </div>
        </div>
      </div>

      {/* ── Search and Filters Bar ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order # or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
          />
        </form>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => { setStatusFilter(''); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              statusFilter === '' 
                ? 'bg-gray-950 text-white border-gray-950' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                statusFilter === key
                  ? 'bg-gray-950 text-white border-gray-950 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Data Table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Failed to load refund requests</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <button onClick={() => loadRequests(page)} className="mt-4 text-xs font-semibold text-gray-900 underline">
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4">Order Number</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date Requested</th>
                  <th className="px-6 py-4">Refund Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-xs">
                      No refund requests found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  requests.map(req => {
                    const cfg = STATUS_CONFIG[req.refundStatus] || { label: req.refundStatus, color: 'bg-gray-50 text-gray-600 border border-gray-100', dot: 'bg-gray-400' };
                    return (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-gray-800">
                          {req.orderNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{req.customerName}</div>
                          <div className="text-xs text-gray-400">{req.customerEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(req.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          ₹{req.refundAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => { setSelectedRequest(req); setActionType(null); setNotes(''); setRejectionReason(''); }}
                            className="bg-gray-900 text-white hover:bg-black px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Review Drawer (Right slide out) ──────────────────────────────── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedRequest(null)}
          />
          
          {/* Drawer container */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-50 flex flex-col animate-slideLeft">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Refund Request Review</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Order #{selectedRequest.orderNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-gray-700 rounded-lg transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Order Status Badge */}
              <div className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Workflow State</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {STATUS_CONFIG[selectedRequest.refundStatus]?.label || selectedRequest.refundStatus}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  STATUS_CONFIG[selectedRequest.refundStatus]?.color
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedRequest.refundStatus]?.dot}`} />
                  {selectedRequest.refundStatus.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Customer Profile */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Customer Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{selectedRequest.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate font-medium text-gray-900">{selectedRequest.customerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Cancellation Reason Box */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cancellation / Return Reason</h4>
                <div className="bg-red-50/50 border border-red-100 text-red-950 p-4 rounded-xl italic font-medium text-sm">
                  "{selectedRequest.cancellationReason || 'No reason specified'}"
                </div>
              </div>

              {/* Additional Comments */}
              {selectedRequest.additionalComments && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Additional Comments</h4>
                  <div className="bg-gray-50 border border-gray-100 text-gray-800 p-4 rounded-xl text-sm leading-relaxed">
                    {selectedRequest.additionalComments}
                  </div>
                </div>
              )}

              {/* Product Image Proof */}
              {((selectedRequest.productImageUrls && selectedRequest.productImageUrls.length > 0) || selectedRequest.productImageUrl) && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Product Image Proof</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedRequest.productImageUrls && selectedRequest.productImageUrls.length > 0 ? (
                      selectedRequest.productImageUrls.map((url, index) => (
                        <div key={index} className="w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
                          <img 
                            src={url} 
                            alt={`Return proof ${index + 1}`} 
                            className="w-full h-full object-cover cursor-pointer" 
                            onClick={() => window.open(url, '_blank')}
                            title="Click to view full image"
                          />
                        </div>
                      ))
                    ) : (
                      selectedRequest.productImageUrl && (
                        <div className="w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
                          <img 
                            src={selectedRequest.productImageUrl} 
                            alt="Return proof" 
                            className="w-full h-full object-cover cursor-pointer" 
                            onClick={() => window.open(selectedRequest.productImageUrl, '_blank')}
                            title="Click to view full image"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Products List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Products in Order</h4>
                <div className="space-y-3">
                  {selectedRequest.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-gray-50/30 p-2.5 rounded-xl border border-gray-100">
                      <div className="w-14 h-16 bg-white rounded overflow-hidden border border-gray-100 flex-shrink-0">
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover mix-blend-multiply" />
                      </div>
                      <div className="flex-1 text-xs">
                        <p className="font-bold text-gray-900 line-clamp-1">{item.productName}</p>
                        {item.size && <p className="text-gray-400 mt-0.5">Size: {item.size}</p>}
                        <p className="text-gray-500 mt-1 font-semibold">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">₹{item.totalPrice.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing Info */}
              <div className="bg-gray-50/30 border border-gray-100 p-4 rounded-2xl space-y-3 text-xs">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial breakdown</h4>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Method:</span>
                  <span className="font-bold text-gray-800">{selectedRequest.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Charged:</span>
                  <span className="font-bold text-gray-800">₹{selectedRequest.orderTotalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Refund Amount:</span>
                  <span>₹{selectedRequest.refundAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payout Information */}
              {(selectedRequest.upiId || selectedRequest.bankDetails) && (
                <div className="bg-amber-50/20 border border-amber-100 p-4 rounded-2xl space-y-3 text-xs">
                  <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Refund Payout Information</h4>
                  {selectedRequest.upiId && (
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-200/50">
                      <span className="text-gray-500 font-semibold">UPI ID:</span>
                      <span className="font-mono font-bold text-gray-800">{selectedRequest.upiId}</span>
                    </div>
                  )}
                  {selectedRequest.bankDetails && (
                    <div className="space-y-1.5">
                      <span className="text-gray-500 font-semibold block">Bank Details:</span>
                      <p className="bg-white p-2.5 rounded-lg border border-gray-200/50 font-medium whitespace-pre-line text-gray-800 leading-relaxed font-mono">
                        {selectedRequest.bankDetails}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Trail / Verification logs */}
              {/* Return & Refund SLA Tracker */}
              {selectedRequest.returnRequestedAt && (
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-2.5 text-xs">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Return SLA Timeline</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Return Requested:</span>
                      <span className="font-semibold text-gray-800">{new Date(selectedRequest.returnRequestedAt).toLocaleString()}</span>
                    </div>
                    {selectedRequest.returnApprovedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Return Approved:</span>
                        <span className="font-semibold text-gray-800">{new Date(selectedRequest.returnApprovedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedRequest.returnPickupScheduledAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pickup Scheduled:</span>
                        <span className="font-semibold text-gray-800">{new Date(selectedRequest.returnPickupScheduledAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedRequest.returnReceivedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Received at Warehouse:</span>
                        <span className="font-semibold text-gray-800">{new Date(selectedRequest.returnReceivedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedRequest.refundProcessedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Refund Processed:</span>
                        <span className="font-semibold text-gray-800">{new Date(selectedRequest.refundProcessedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warehouse Inspection Checklist and Notes */}
              {(selectedRequest.returnReceivedAt || selectedRequest.warehouseInspectionNotes) && (
                <div className="bg-teal-50/40 border border-teal-100 p-4 rounded-2xl space-y-2.5 text-xs text-teal-950">
                  <h4 className="text-[10px] font-bold text-teal-900 uppercase tracking-widest">Warehouse Inspection Report</h4>
                  <div className="flex justify-between">
                    <span>Received At:</span>
                    <span className="font-semibold">{selectedRequest.returnReceivedAt ? new Date(selectedRequest.returnReceivedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  
                  {/* Checklist Summary */}
                  <div className="mt-2 border-t border-teal-100/50 pt-2">
                    <p className="font-bold text-[10px] uppercase text-teal-900 mb-1">Checklist Details:</p>
                    <div className="grid grid-cols-2 gap-1.5 font-medium text-gray-700">
                      <span className={selectedRequest.isProductDamaged ? 'text-red-600 font-bold' : 'text-gray-400'}>
                        {selectedRequest.isProductDamaged ? '✗ Damaged' : '✓ Intact'}
                      </span>
                      <span className={selectedRequest.isWrongProductReturned ? 'text-red-600 font-bold' : 'text-gray-400'}>
                        {selectedRequest.isWrongProductReturned ? '✗ Wrong Product' : '✓ Correct Product'}
                      </span>
                      <span className={selectedRequest.isUsedProduct ? 'text-red-600 font-bold' : 'text-gray-400'}>
                        {selectedRequest.isUsedProduct ? '✗ Used' : '✓ Unused'}
                      </span>
                      <span className={selectedRequest.isMissingAccessories ? 'text-red-600 font-bold' : 'text-gray-400'}>
                        {selectedRequest.isMissingAccessories ? '✗ Missing Accessories' : '✓ Accessories Intact'}
                      </span>
                      <span className={selectedRequest.isPackagingMissing ? 'text-red-600 font-bold' : 'text-gray-400'}>
                        {selectedRequest.isPackagingMissing ? '✗ Missing Packaging' : '✓ Packaging Intact'}
                      </span>
                      <span className={selectedRequest.isQualityIssueConfirmed ? 'text-red-600 font-bold' : 'text-gray-400'}>
                        {selectedRequest.isQualityIssueConfirmed ? '✗ Quality Issue Confirmed' : '✓ Standard Quality'}
                      </span>
                    </div>
                  </div>

                  {selectedRequest.warehouseInspectionNotes && (
                    <div className="mt-2 border-t border-teal-100/50 pt-2">
                      <p className="font-bold text-[10px] uppercase text-teal-900 mb-0.5">Inspector Notes:</p>
                      <p className="italic text-gray-800 font-medium">"{selectedRequest.warehouseInspectionNotes}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Razorpay Refund Reconciliation Details */}
              {(selectedRequest.razorpayRefundId || selectedRequest.razorpayRefundStatus) && (
                <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl space-y-2.5 text-xs text-indigo-950">
                  <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">Razorpay Reconciliation</h4>
                  <div className="flex justify-between">
                    <span>Refund ID:</span>
                    <span className="font-mono bg-indigo-100 px-1 py-0.5 rounded text-indigo-900 font-bold">{selectedRequest.razorpayRefundId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Status:</span>
                    <span className="font-semibold uppercase">{selectedRequest.razorpayRefundStatus || 'N/A'}</span>
                  </div>
                  {selectedRequest.razorpayRefundTimestamp && (
                    <div className="flex justify-between">
                      <span>Processed At:</span>
                      <span>{new Date(selectedRequest.razorpayRefundTimestamp).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedRequest.razorpayRefundNotes && (
                    <div className="mt-2 border-t border-indigo-100/50 pt-2">
                      <p className="font-bold text-[10px] uppercase text-indigo-900 mb-0.5">Reconciliation Notes:</p>
                      <p className="italic text-gray-800 font-medium">"{selectedRequest.razorpayRefundNotes}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Trail / Review audit log */}
              {selectedRequest.refundStatus !== 'REFUND_REQUESTED' && (
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl space-y-2.5 text-xs text-blue-950">
                  <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Review Audit Log</h4>
                  <div className="flex justify-between">
                    <span>Reviewed By:</span>
                    <span className="font-semibold">{selectedRequest.reviewedByAdminEmail || 'Admin'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reviewed At:</span>
                    <span>{selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  {selectedRequest.razorpayRefundId && (
                    <div className="flex justify-between">
                      <span>Razorpay Refund ID:</span>
                      <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-bold">{selectedRequest.razorpayRefundId}</span>
                    </div>
                  )}
                  {selectedRequest.razorpayRefundFailureReason && (
                    <div className="mt-2 border-t border-red-100 pt-2 text-red-950">
                      <p className="font-bold text-[10px] uppercase text-red-900 mb-0.5">Refund failure reason:</p>
                      <p className="italic font-mono text-red-700">"{selectedRequest.razorpayRefundFailureReason}"</p>
                    </div>
                  )}
                  {selectedRequest.adminNotes && (
                    <div className="mt-2 border-t border-blue-100 pt-2">
                      <p className="font-bold text-[10px] uppercase text-blue-900 mb-0.5">Admin notes:</p>
                      <p className="italic">"{selectedRequest.adminNotes}"</p>
                    </div>
                  )}
                  {selectedRequest.rejectionReason && (
                    <div className="mt-2 border-t border-blue-100 pt-2 text-red-950">
                      <p className="font-bold text-[10px] uppercase text-red-900 mb-0.5">Rejection reason:</p>
                      <p className="italic">"{selectedRequest.rejectionReason}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Review Forms */}
              {(selectedRequest.refundStatus === 'REFUND_REQUESTED' || selectedRequest.refundStatus === 'REFUND_FAILED') && !actionType && (
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  {selectedRequest.refundStatus === 'REFUND_REQUESTED' ? (
                    <>
                      <button
                        onClick={() => setActionType('reject')}
                        className="flex-1 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center inline-block"
                      >
                        Reject Request
                      </button>
                      <button
                        onClick={() => setActionType('approve')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center inline-block shadow-sm"
                      >
                        Approve & Payout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setActionType('reject')}
                        className="flex-1 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center inline-block"
                      >
                        Reject Request
                      </button>
                      <button
                        onClick={async () => {
                          setIsActionSubmitting(true);
                          setActionError('');
                          try {
                            const updated = await retryRefundAdmin(selectedRequest.id);
                            setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
                            setSelectedRequest(updated);
                            alert('Refund retry successfully initiated.');
                          } catch (err: any) {
                            setActionError(err.response?.data?.message || 'Failed to retry refund.');
                          } finally {
                            setIsActionSubmitting(false);
                          }
                        }}
                        disabled={isActionSubmitting}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center inline-block shadow-sm flex items-center justify-center gap-2"
                      >
                        {isActionSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Retry Refund
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Return Lifecycle Buttons */}
              {selectedRequest.refundStatus === 'RETURN_REQUESTED' && !actionType && (
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setActionType('reject')}
                    className="flex-1 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center inline-block"
                  >
                    Reject Return
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Approve this return request?')) return;
                      setIsActionSubmitting(true);
                      setActionError('');
                      try {
                        const updated = await approveReturnAdmin(selectedRequest.id);
                        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
                        setSelectedRequest(updated);
                        alert('Return request approved successfully.');
                      } catch (err: any) {
                        setActionError(err.response?.data?.message || 'Failed to approve return.');
                      } finally {
                        setIsActionSubmitting(false);
                      }
                    }}
                    disabled={isActionSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center inline-block shadow-sm"
                  >
                    Approve Return
                  </button>
                </div>
              )}

              {selectedRequest.refundStatus === 'RETURN_APPROVED' && !actionType && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={async () => {
                      if (!confirm('Schedule return courier pickup?')) return;
                      setIsActionSubmitting(true);
                      setActionError('');
                      try {
                        const updated = await scheduleReturnPickupAdmin(selectedRequest.id);
                        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
                        setSelectedRequest(updated);
                        alert('Return pickup scheduled successfully.');
                      } catch (err: any) {
                        setActionError(err.response?.data?.message || 'Failed to schedule return pickup.');
                      } finally {
                        setIsActionSubmitting(false);
                      }
                    }}
                    disabled={isActionSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center shadow-sm flex items-center justify-center gap-2"
                  >
                    {isActionSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Schedule Return Pickup
                  </button>
                </div>
              )}

              {selectedRequest.refundStatus === 'RETURN_PICKUP_SCHEDULED' && !actionType && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setActionType('warehouse_inspection');
                      setNotes('');
                      setActionError('');
                    }}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Mark as Returned (Inspect & Process)
                  </button>
                </div>
              )}

              {selectedRequest.refundStatus === 'RETURNED' && !actionType && (
                <div className="pt-4 border-t border-gray-100">
                  {selectedRequest.paymentMethod === 'COD' ? (
                    <button
                      onClick={async () => {
                        if (!confirm('Request refund payout details (UPI/Bank) from the customer?')) return;
                        setIsActionSubmitting(true);
                        setActionError('');
                        try {
                          const updated = await requestPayoutDetailsAdmin(selectedRequest.id);
                          setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
                          setSelectedRequest(updated);
                          alert('Payout details request sent to customer successfully.');
                        } catch (err: any) {
                          setActionError(err.response?.data?.message || 'Failed to request payout details.');
                        } finally {
                          setIsActionSubmitting(false);
                        }
                      }}
                      disabled={isActionSubmitting}
                      className="w-full bg-orange-650 hover:bg-orange-750 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isActionSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Request Payout Details (COD)
                    </button>
                  ) : (
                    <button
                      onClick={() => setActionType('process_refund')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Process Refund
                    </button>
                  )}
                </div>
              )}

              {selectedRequest.refundStatus === 'PAYOUT_DETAILS_REQUESTED' && !actionType && (
                <div className="pt-4 border-t border-gray-100 text-center flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-4 py-3 bg-amber-50 rounded-xl border border-dashed border-amber-200 text-xs font-semibold text-amber-800">
                    <Clock className="w-4 h-4 animate-pulse text-amber-500" />
                    Awaiting Payout Details from Customer
                  </span>
                </div>
              )}

              {selectedRequest.refundStatus === 'PAYOUT_DETAILS_PROVIDED' && !actionType && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setActionType('process_refund')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors text-center shadow-sm flex items-center justify-center gap-2 animate-pulse cursor-pointer"
                  >
                    Process Refund (COD Payout Details Provided)
                  </button>
                </div>
              )}

              {/* Mark as Paid button — shown for REFUND_APPROVED (COD manual transfer pending) */}
              {selectedRequest.refundStatus === 'REFUND_APPROVED' && !actionType && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 font-medium">
                    <p className="font-bold text-orange-900 mb-1">⚠️ Action Required — Manual Transfer Pending</p>
                    <p>This refund has been approved. Please manually transfer <span className="font-bold">₹{selectedRequest.refundAmount.toLocaleString()}</span> to the customer via UPI or Bank Transfer using the payout details provided above, then click <strong>Mark as Paid</strong> to confirm.</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Confirm that you have physically transferred ₹${selectedRequest.refundAmount.toLocaleString()} to the customer? This cannot be undone.`)) return;
                      setIsActionSubmitting(true);
                      setActionError('');
                      try {
                        const updated = await markRefundPaidAdmin(selectedRequest.id);
                        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
                        setSelectedRequest(updated);
                        alert('Refund marked as paid. Customer has been notified.');
                      } catch (err: any) {
                        setActionError(err.response?.data?.message || 'Failed to mark refund as paid.');
                      } finally {
                        setIsActionSubmitting(false);
                      }
                    }}
                    disabled={isActionSubmitting}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    {isActionSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    ✓ Mark as Paid / Transferred
                  </button>
                  {actionError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{actionError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Form Confirmation */}
              {actionType && (
                <form onSubmit={handleAction} className="border-t border-gray-100 pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      {actionType === 'approve' || actionType === 'process_refund' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600" /> Confirm Refund {actionType === 'approve' ? 'Approval' : 'Processing'}
                        </>
                      ) : actionType === 'warehouse_inspection' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-teal-600" /> Warehouse Product Quality Inspection
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" /> Confirm Refund Rejection
                        </>
                      )}
                    </h5>
                    <button 
                      type="button" 
                      onClick={() => setActionType(null)} 
                      className="text-xs text-gray-400 hover:text-gray-600 font-bold underline"
                    >
                      Back
                    </button>
                  </div>

                  {actionType === 'warehouse_inspection' && (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[11px] text-gray-500 font-medium mb-1">Verify returned item status before updating inventory and authorizing refunds:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isProductDamaged} 
                            onChange={e => setIsProductDamaged(e.target.checked)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                          />
                          Product Damaged
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isWrongProductReturned} 
                            onChange={e => setIsWrongProductReturned(e.target.checked)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                          />
                          Wrong Product
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isUsedProduct} 
                            onChange={e => setIsUsedProduct(e.target.checked)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                          />
                          Product Used
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isMissingAccessories} 
                            onChange={e => setIsMissingAccessories(e.target.checked)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                          />
                          Missing Accessories
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isPackagingMissing} 
                            onChange={e => setIsPackagingMissing(e.target.checked)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                          />
                          Packaging Missing
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isQualityIssueConfirmed} 
                            onChange={e => setIsQualityIssueConfirmed(e.target.checked)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                          />
                          Quality Issue Confirmed
                        </label>
                      </div>
                    </div>
                  )}

                  {actionType === 'approve' || actionType === 'process_refund' || actionType === 'warehouse_inspection' ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        {actionType === 'warehouse_inspection' ? 'Warehouse Inspection Notes (Required)' : 'Internal Notes (Optional)'}
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder={actionType === 'warehouse_inspection' ? 'Describe the product condition, serial numbers matched, or reason for validation...' : 'Add internal verification notes or comments...'}
                        rows={3}
                        required={actionType === 'warehouse_inspection'}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-colors resize-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Rejection Reason (Required)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        placeholder="Please specify why this refund is being rejected (the customer will see this)..."
                        rows={3}
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
                      />
                    </div>
                  )}

                  {actionError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActionType(null)}
                      className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isActionSubmitting}
                      className={`flex-1 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${
                        actionType === 'approve' || actionType === 'process_refund' ? 'bg-emerald-600 hover:bg-emerald-700' : actionType === 'warehouse_inspection' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isActionSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isActionSubmitting ? 'Processing...' : 'Confirm Action'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
