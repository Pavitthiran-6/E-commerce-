import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { Package, Truck, CheckCircle2, XCircle, Clock, MapPin, Download, HelpCircle, AlertCircle, Loader2, DollarSign, ArrowLeftRight } from 'lucide-react';
import { getOrderById, trackOrder, cancelOrder } from '../services/orderService';
import type { Order, OrderTracking } from '../services/orderService';
import { downloadInvoice } from '../services/paymentService';
import { cancelWithRefund } from '../services/refundService';

export default function TrackOrder() {
  const { orderId } = useParams<{ orderId?: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const orderIdParam = orderId || queryParams.get('orderId') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<OrderTracking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!orderIdParam) {
      setError("No order ID provided");
      setIsLoading(false);
      return;
    }
    
    Promise.all([
      getOrderById(orderIdParam),
      trackOrder(orderIdParam).catch(() => []) // Fallback to empty if tracking API fails
    ])
      .then(([orderData, trackingData]) => {
        setOrder(orderData);
        // If tracking history is already in orderData, use it, else use trackingData
        setTrackingHistory(orderData.trackingHistory || trackingData || []);
      })
      .catch(err => {
        console.error("Error fetching tracking info", err);
        setError("Failed to load tracking information. Please check your Order ID.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [orderIdParam]);

  const status = order?.status ? (order.status.replace(/_/g, ' ').charAt(0).toUpperCase() + order.status.replace(/_/g, ' ').slice(1).toLowerCase()) : 'Unknown';
  const isPaid = order && (order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'PAID');
  const showInvoice = order && order.status !== 'cancelled' && order.status !== 'CANCELLED' && isPaid;

  const timelineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-4');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    timelineRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [isLoading]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setIsDownloadingInvoice(true);
    try {
      await downloadInvoice(order.id, order.orderNumber);
    } catch (e) {
      alert('Failed to download invoice. Please try again.');
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setIsCancelling(true);
    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
    } catch (e) {
      alert('Failed to cancel order. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelWithRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!cancellationReason || cancellationReason.trim().length < 10) {
      setRefundError('Please provide a detailed reason (at least 10 characters).');
      return;
    }

    setIsSubmittingRefund(true);
    setRefundError(null);
    try {
      const refundRequest = await cancelWithRefund(order.id, cancellationReason);
      
      // Update local order state with the cancellation and refund fields
      setOrder(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'cancelled',
          paymentStatus: 'REFUND_REQUESTED',
          cancellationReason: refundRequest.cancellationReason,
          refundStatus: refundRequest.refundStatus,
          refundRequestedAt: refundRequest.requestedAt,
          refundNotes: refundRequest.adminNotes,
          rejectionReason: refundRequest.rejectionReason,
          razorpayRefundId: refundRequest.razorpayRefundId
        };
      });
      
      setShowRefundModal(false);
      setCancellationReason('');
      alert('Order cancelled and refund request submitted successfully.');
    } catch (err: any) {
      console.error(err);
      setRefundError(err.response?.data?.message || 'Failed to submit refund request. Please try again.');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">{error || 'Could not locate the requested order.'}</p>
        <Link to="/" className="px-6 py-3 bg-primary text-white font-bold uppercase text-sm tracking-widest rounded hover:bg-primary/90 transition-colors">
          Return to Home
        </Link>
      </div>
    );
  }

  // Determine Banner Data
  const getBannerData = () => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'placed':
        return { color: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: <Package className="w-6 h-6 text-yellow-600" />, title: 'Order Placed', desc: 'We have received your order and are currently verifying it.' };
      case 'confirmed':
        return { color: 'bg-blue-50 text-blue-800 border-blue-200', icon: <CheckCircle2 className="w-6 h-6 text-blue-600" />, title: 'Confirmed', desc: 'Your order has been confirmed and is being prepared.' };
      case 'packed':
        return { color: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: <Package className="w-6 h-6 text-indigo-600" />, title: 'Packed', desc: 'Your order has been packed and is ready for shipment.' };
      case 'processing':
        return { color: 'bg-blue-50 text-blue-800 border-blue-200', icon: <Clock className="w-6 h-6 text-blue-600" />, title: 'Processing', desc: 'We are preparing your order. It will be shipped soon!' };
      case 'shipped':
        return { color: 'bg-orange-50 text-orange-800 border-orange-200', icon: <Truck className="w-6 h-6 text-orange-600" />, title: 'Shipped', desc: 'Your order has been shipped and is in transit.' };
      case 'out for delivery':
        return { color: 'bg-orange-50 text-orange-800 border-orange-200', icon: <Truck className="w-6 h-6 text-orange-600" />, title: 'Out For Delivery', desc: 'Your order is out for delivery today!' };
      case 'delivered':
        return { color: 'bg-green-50 text-green-800 border-green-200', icon: <CheckCircle2 className="w-6 h-6 text-green-600" />, title: 'Delivered', desc: 'Your order was delivered successfully. We hope you love it!' };
      case 'cancelled': {
        let desc = 'This order has been cancelled.';
        if (order?.paymentStatus === 'REFUND_REQUESTED') {
          desc = `Order cancelled. Refund request of ₹${order.totalAmount.toLocaleString()} is pending admin review.`;
        } else if (order?.paymentStatus === 'REFUND_APPROVED') {
          desc = 'Order cancelled. Refund request has been approved and is being processed.';
        } else if (order?.paymentStatus === 'REFUND_INITIATED') {
          desc = `Order cancelled. Refund of ₹${order.totalAmount.toLocaleString()} has been initiated via Razorpay.`;
        } else if (order?.paymentStatus === 'REFUNDED') {
          desc = `Order cancelled. Refund of ₹${order.totalAmount.toLocaleString()} has been successfully credited.`;
        } else if (order?.paymentStatus === 'REFUND_REJECTED') {
          desc = `Order cancelled. Refund request was rejected. Reason: ${order.rejectionReason || 'Contact support.'}`;
        } else if (order?.paymentStatus === 'REFUND_FAILED' || order?.refundStatus === 'REFUND_FAILED') {
          desc = `Order cancelled. Refund of ₹${order.totalAmount.toLocaleString()} failed. Our admin team will retry processing shortly.`;
        }
        return { color: 'bg-red-50 text-red-800 border-red-200', icon: <XCircle className="w-6 h-6 text-red-600" />, title: 'Cancelled', desc };
      }
      default:
        return { color: 'bg-gray-50 text-gray-800 border-gray-200', icon: <AlertCircle className="w-6 h-6" />, title: 'Unknown', desc: 'Status unknown.' };
    }
  };
  const banner = getBannerData();

  const steps = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const getStepStatus = (stepName: string, index: number) => {
    if (status.toLowerCase() === 'cancelled') return { completed: false, current: false };
    
    let currentIndex = 0;
    const currentStatus = status.toLowerCase();
    if (currentStatus === 'pending' || currentStatus === 'placed') currentIndex = 0;
    if (currentStatus === 'confirmed' || currentStatus === 'processing') currentIndex = 1;
    if (currentStatus === 'packed') currentIndex = 2;
    if (currentStatus === 'shipped') currentIndex = 3;
    if (currentStatus === 'out_for_delivery' || currentStatus === 'out for delivery') currentIndex = 4;
    if (currentStatus === 'delivered') currentIndex = 5;

    if (index < currentIndex) return { completed: true, current: false };
    if (index === currentIndex) return { completed: false, current: true };
    return { completed: false, current: false };
  };

  const getStepDate = (stepName: string) => {
    let targetStatuses: string[] = [];
    const name = stepName.toLowerCase();
    if (name === 'placed') {
      targetStatuses = ['placed', 'order_placed', 'pending'];
    } else if (name === 'confirmed') {
      targetStatuses = ['confirmed', 'processing'];
    } else if (name === 'packed') {
      targetStatuses = ['packed'];
    } else if (name === 'shipped') {
      targetStatuses = ['shipped'];
    } else if (name === 'out for delivery' || name === 'out_for_delivery') {
      targetStatuses = ['out_for_delivery', 'out for delivery'];
    } else if (name === 'delivered') {
      targetStatuses = ['delivered'];
    }

    const event = trackingHistory.find(h => 
      targetStatuses.includes(h.status.toLowerCase())
    );
    
    if (event) {
      return new Date(event.trackingTime).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return null;
  };

  const getProgressPercentage = () => {
    const currentStatus = status.toLowerCase();
    if (currentStatus === 'delivered') return '100%';
    if (currentStatus === 'out_for_delivery' || currentStatus === 'out for delivery') return '80%';
    if (currentStatus === 'shipped') return '60%';
    if (currentStatus === 'packed') return '40%';
    if (currentStatus === 'confirmed' || currentStatus === 'processing') return '20%';
    return '0%';
  };
  const progressPercentage = getProgressPercentage();

  const getEventIcon = (eventStatus: string) => {
    const s = eventStatus.toLowerCase();
    if (s.includes('deliver')) return <CheckCircle2 className="w-4 h-4 text-white" />;
    if (s.includes('transit') || s.includes('ship') || s.includes('out')) return <Truck className="w-4 h-4 text-white" />;
    if (s.includes('process') || s.includes('pack')) return <MapPin className="w-4 h-4 text-white" />;
    return <Package className="w-4 h-4 text-white" />;
  };

  const getEventColor = (eventStatus: string) => {
    const s = eventStatus.toLowerCase();
    if (s.includes('deliver')) return 'bg-green-500';
    if (s.includes('cancel')) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const visibleEvents = trackingHistory.map(history => ({
    date: new Date(history.trackingTime).toLocaleString(),
    event: history.message,
    loc: history.location || '',
    statusReq: [], 
    icon: getEventIcon(history.status),
    color: getEventColor(history.status)
  })).reverse(); // newest first if backend returns chronological

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* SECTION 1: Page Header */}
      <div className="bg-charcoal-stone text-white pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="font-headline-display text-4xl mb-3">Track Your Order</h1>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-on-surface-variant font-body-sm">
            <span className="font-mono text-warm-sand text-lg tracking-wider">Order #{order.orderNumber}</span>
            <span className="hidden md:inline text-gray-500">•</span>
            <span>Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-6">
        
        {/* SECTION 2: Order Status Banner */}
        <div className={`w-full rounded-xl border p-5 md:p-6 mb-8 flex items-start gap-4 shadow-sm ${banner.color}`}>
          <div className="mt-1 flex-shrink-0 bg-white p-2 rounded-full shadow-sm">
            {banner.icon}
          </div>
          <div>
            <h2 className="font-headline-md text-xl md:text-2xl font-bold mb-1">{banner.title}</h2>
            <p className="font-body-md opacity-90">{banner.desc}</p>
          </div>
        </div>

        {/* SECTION 2.5: Shipping & Tracking Details */}
        {(order.trackingNumber || order.courierName || order.shipmentNotes) && (
          <div className="bg-white rounded-xl border border-outline-variant/30 p-6 md:p-8 mb-8 shadow-sm">
            <h3 className="font-headline-md text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Truck className="w-5 h-5 text-primary" />
              Shipment Tracking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              {order.courierName && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Courier Partner</p>
                  <p className="font-semibold text-gray-900">{order.courierName}</p>
                </div>
              )}
              {order.trackingNumber && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tracking Number</p>
                  <p className="font-mono font-bold text-primary select-all">{order.trackingNumber}</p>
                </div>
              )}
              {order.shipmentNotes && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 md:col-span-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Shipment Notes</p>
                  <p className="text-gray-700 italic font-medium">{order.shipmentNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: Visual Progress Tracker */}
        {status !== 'Cancelled' && (
          <div className="bg-white rounded-xl border border-outline-variant/30 p-6 md:p-10 mb-8 shadow-sm overflow-hidden">
            <h3 className="font-headline-md text-xl mb-8">Delivery Progress</h3>
            
            {/* Desktop Horizontal */}
            <div className="hidden md:flex relative items-center justify-between w-full">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full">
                 <div 
                   className="h-full bg-green-500 rounded-full transition-all duration-1000" 
                   style={{ width: progressPercentage }}
                 />
              </div>

              {steps.map((step, idx) => {
                const { completed, current } = getStepStatus(step, idx);
                return (
                  <div key={idx} className="flex flex-col items-center w-1/6 relative bg-white px-2">
                    {completed ? (
                      <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md z-10 mb-3 border-4 border-white">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : current ? (
                      <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md z-10 mb-3 border-4 border-white relative">
                        <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-30"></span>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center z-10 mb-3 border-4 border-white">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                    <span className={`text-sm font-semibold text-center ${completed || current ? 'text-charcoal-stone' : 'text-gray-400'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile Vertical */}
            <div className="md:hidden flex flex-col gap-8 relative pl-4">
              <div className="absolute top-4 bottom-4 left-6 w-0.5 bg-gray-200">
                <div 
                   className="w-full bg-green-500 transition-all duration-1000" 
                   style={{ height: progressPercentage }}
                 />
              </div>

              {steps.map((step, idx) => {
                const { completed, current } = getStepStatus(step, idx);
                return (
                  <div key={idx} className="flex gap-4 items-start relative z-10">
                    {completed ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-white ring-2 ring-white">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    ) : current ? (
                      <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 relative border-2 border-white ring-2 ring-white">
                        <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-30"></span>
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-white ring-2 ring-white"></div>
                    )}
                    <div>
                      <p className={`text-sm font-bold ${completed || current ? 'text-charcoal-stone' : 'text-gray-400'}`}>{step}</p>
                      {(completed || current) && getStepDate(step) && (
                        <span className="text-xs text-gray-500">{getStepDate(step)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: Refund Status Tracker */}
        {order.refundStatus && (
          <div className="bg-white rounded-xl border border-outline-variant/30 p-6 md:p-8 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline-md text-xl font-bold text-gray-900">Refund Request Information</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Timeline and processing updates</p>
                </div>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  order.refundStatus === 'REFUNDED' 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : order.refundStatus === 'REFUND_REJECTED'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    order.refundStatus === 'REFUNDED' ? 'bg-green-500' : order.refundStatus === 'REFUND_REJECTED' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                  }`} />
                  {order.refundStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Details */}
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cancellation Reason</p>
                  <p className="mt-1.5 text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 font-medium italic">
                    "{order.cancellationReason || 'No reason specified'}"
                  </p>
                </div>
                {order.refundRequestedAt && (
                  <div>
                    <span className="font-semibold text-gray-700">Requested On: </span>
                    <span>{new Date(order.refundRequestedAt).toLocaleString()}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-700">Refund Amount: </span>
                  <span className="font-bold text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
                </div>
                {order.razorpayRefundId && (
                  <div>
                    <span className="font-semibold text-gray-700">Razorpay Refund ID: </span>
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 text-xs font-bold">
                      {order.razorpayRefundId}
                    </span>
                  </div>
                )}
                {order.refundNotes && (
                  <div className="mt-4 bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1 text-blue-900">Admin Response Notes</p>
                    <p className="text-sm font-medium">{order.refundNotes}</p>
                  </div>
                )}
                {order.rejectionReason && (
                  <div className="mt-4 bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1 text-red-900">Rejection Reason</p>
                    <p className="text-sm font-medium">{order.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Refund Lifecycle Steps */}
              <div className="relative border-l-2 border-gray-100 pl-6 ml-2 space-y-6">
                {/* Step 1: Request Submitted */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full bg-green-500 border-4 border-white shadow-sm flex items-center justify-center"></div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Refund Request Submitted</p>
                    <p className="text-xs text-gray-400 mt-0.5">Awaiting admin review</p>
                  </div>
                </div>

                {/* Step 2: Review Result */}
                {order.refundStatus !== 'REFUND_REQUESTED' && (
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-white shadow-sm ${
                      order.refundStatus === 'REFUND_REJECTED' ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {order.refundStatus === 'REFUND_REJECTED' ? 'Refund Rejected' : 'Refund Approved'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.refundStatus === 'REFUND_REJECTED' ? 'Admin rejected the request' : 'Review completed by admin'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Refund Initiated (Online payout) */}
                {(order.refundStatus === 'REFUND_INITIATED' || order.refundStatus === 'REFUNDED') && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Refund Initiated</p>
                      <p className="text-xs text-gray-400 mt-0.5">Payout initiated via Razorpay</p>
                    </div>
                  </div>
                )}

                {/* Step 4: Refund Completed */}
                {order.refundStatus === 'REFUNDED' && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Refund Credited</p>
                      <p className="text-xs text-gray-400 mt-0.5">Money returned to your account</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* SECTION 4: Timeline */}
          {visibleEvents.length > 0 && (
            <div className="lg:col-span-2 w-full">
              <h3 className="font-headline-md text-2xl mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" />
                Tracking History
              </h3>
              
              <div className="relative border-l-2 border-gray-200 ml-4 md:ml-6 space-y-8 pb-8">
                {visibleEvents.map((event, idx) => (
                  <div 
                    key={idx} 
                    ref={el => { timelineRefs.current[idx] = el; }}
                    className="relative pl-8 md:pl-10 opacity-0 translate-y-4 transition-all duration-700 ease-out"
                    style={{ transitionDelay: `${idx * 150}ms` }}
                  >
                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full ${event.color} flex items-center justify-center shadow-sm border-2 border-white`}>
                      {event.icon}
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-1 mb-2">
                        <h4 className="font-bold text-charcoal-stone text-lg">{event.event}</h4>
                        <span className="text-sm font-medium text-primary whitespace-nowrap bg-warm-sand/30 px-2 py-0.5 rounded">
                          {event.date}
                        </span>
                      </div>
                      {event.loc && (
                        <p className="text-on-surface-variant text-sm flex items-center gap-1.5 mt-2 bg-gray-50 w-fit px-2 py-1 rounded">
                          <MapPin className="w-3.5 h-3.5" /> {event.loc}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Order Details Summary */}
          <div className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm sticky top-24">
            <div className="bg-gray-50 border-b border-outline-variant/30 px-5 py-4 flex justify-between items-center">
              <h3 className="font-headline-md text-lg">Order Details</h3>
              {showInvoice && (
                <button onClick={handleDownloadInvoice} disabled={isDownloadingInvoice} className="text-primary hover:bg-gray-200 p-1.5 rounded transition-colors disabled:opacity-50" title="Download Invoice">
                  {isDownloadingInvoice
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Download className="w-4 h-4" />}
                </button>
              )}
            </div>
            
            <div className="p-5">
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Shipping Address</p>
                <p className="font-body-md font-medium">{order.address.fullName}</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  {order.address.addressLine1}<br />
                  {order.address.addressLine2 && <>{order.address.addressLine2}<br/></>}
                  {order.address.city}, {order.address.state} {order.address.postalCode}
                </p>
              </div>
              
              <div className="space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold border-b pb-2">Items</p>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.productId ? (
                        <Link to={`/product/${item.productId}`}>
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover mix-blend-multiply hover:opacity-85 transition-opacity" />
                        </Link>
                      ) : (
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover mix-blend-multiply" />
                      )}
                    </div>
                    <div className="flex-1 text-sm">
                      {item.productId ? (
                        <Link to={`/product/${item.productId}`} className="font-bold text-charcoal-stone leading-tight line-clamp-2 hover:text-primary transition-colors">
                          {item.productName}
                        </Link>
                      ) : (
                        <p className="font-bold text-charcoal-stone leading-tight line-clamp-2">{item.productName}</p>
                      )}
                      <p className="text-gray-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-bold text-right whitespace-nowrap">
                      ₹{item.totalPrice.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">{order.shippingCharge === 0 ? 'Free' : `₹${order.shippingCharge.toLocaleString()}`}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                    <span className="font-medium">-₹{order.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-charcoal-stone text-lg">
                    <span>Total</span>
                    <span>₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-[#0C831F] font-semibold text-right leading-none mt-1">
                    ✓ Prices include all applicable taxes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 8: Action Buttons */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white rounded-xl border border-outline-variant/30 p-6 shadow-sm mb-12">
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <Link 
              to={order.items[0]?.productId ? `/product/${order.items[0].productId}` : '/collection'}
              className="flex-1 md:flex-none bg-charcoal-stone text-white px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors text-center shadow-md"
            >
              Buy Again
            </Link>
            {showInvoice && (
              <button 
                onClick={handleDownloadInvoice}
                disabled={isDownloadingInvoice}
                className="flex-1 md:flex-none border-2 border-charcoal-stone text-charcoal-stone px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isDownloadingInvoice
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />}
                Invoice
              </button>
            )}
            {!isPaid && order.status !== 'cancelled' && order.status !== 'CANCELLED' && (
              <span className="text-xs text-gray-500 font-semibold italic flex items-center gap-1.5 px-4 py-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <AlertCircle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
                Tax Invoice will be available after payment confirmation.
              </span>
            )}
            {/* Cancel button — hidden once order is Shipped or beyond */}
            {status !== 'Delivered' && status !== 'Cancelled' && status !== 'Shipped' && status !== 'Out for delivery' && (
              order.paymentMethod !== 'COD' && order.paymentStatus === 'SUCCESS' ? (
                <button 
                  onClick={() => setShowRefundModal(true)}
                  className="flex-1 md:flex-none border-2 border-red-500 text-red-600 px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  Cancel & Request Refund
                </button>
              ) : (
                <button 
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="flex-1 md:flex-none border-2 border-red-500 text-red-600 px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )
            )}
            {/* Non-cancellable notice shown when order has been shipped */}
            {(status === 'Shipped' || status === 'Out for delivery') && (
              <span className="flex-1 md:flex-none text-xs text-gray-500 font-semibold italic flex items-center gap-1.5 px-4 py-3 bg-orange-50 rounded-lg border border-dashed border-orange-200">
                <Truck className="w-4 h-4 text-orange-400 flex-shrink-0" />
                Order cannot be cancelled once shipped.
              </span>
            )}
          </div>
          
          <Link to="/contact" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 mt-4 md:mt-0 mx-auto md:mx-0">
            <HelpCircle className="w-4 h-4" /> Need Help?
          </Link>
        </div>

      </div>

      {/* Cancellation & Refund Request Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-orange-500"></div>
            
            <h3 className="font-headline-md text-2xl font-bold text-gray-900 mb-2">Cancel Order & Request Refund</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              You are cancelling order <span className="font-semibold text-gray-800">#{order.orderNumber}</span>. Since this order was paid online, your cancellation request will be submitted to our admin team for verification and refund processing.
            </p>

            <form onSubmit={handleCancelWithRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Why are you cancelling?
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please specify a cancellation reason (e.g., changed my mind, wrong address, wrong size)..."
                  rows={4}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
                <div className="text-[10px] text-gray-400 mt-1.5 flex justify-between">
                  <span>Minimum 10 characters required</span>
                  <span className={cancellationReason.trim().length >= 10 ? 'text-green-500 font-bold' : 'text-gray-400'}>
                    {cancellationReason.trim().length} chars
                  </span>
                </div>
              </div>

              {refundError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{refundError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    setCancellationReason('');
                    setRefundError(null);
                  }}
                  className="flex-1 border-2 border-gray-200 text-gray-600 rounded-lg py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund || cancellationReason.trim().length < 10}
                  className="flex-1 bg-red-600 text-white rounded-lg py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md text-center"
                >
                  {isSubmittingRefund && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmittingRefund ? 'Submitting...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
