import React, { useEffect, useState } from 'react';
import { Package, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOrders, type Order } from '../../services/orderService';
import { retryPayment, downloadInvoice } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

export default function ProfileOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOrders();
      setOrders(data.content);
    } catch (err) {
      setError('Failed to load orders. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryPayment = async (order: Order) => {
    setRetryingOrderId(order.id);
    try {
      await retryPayment(
        order.id,
        user?.name || '',
        user?.email || '',
        () => {
          // On success: refresh orders to reflect updated payment status
          fetchOrders();
          setRetryingOrderId(null);
        },
        (description: string) => {
          alert('Payment failed: ' + description);
          setRetryingOrderId(null);
        }
      );
    } catch (e) {
      alert('Failed to open payment. Please try again.');
      setRetryingOrderId(null);
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
    setDownloadingOrderId(order.id);
    try {
      await downloadInvoice(order.id, order.orderNumber);
    } catch (e) {
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Delivered</span>;
      case 'confirmed':
      case 'processing':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>;
      case 'placed':
      case 'pending':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Cancelled</span>;
      case 'shipped':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Shipped</span>;
      default:
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> {status}</span>;
    }
  };

  const getPaymentBadge = (paymentStatus: string, paymentMethod: string) => {
    if (paymentStatus === 'SUCCESS') {
      return <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">✓ Paid</span>;
    }
    if (paymentStatus === 'FAILED') {
      return <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">✗ Payment Failed</span>;
    }
    if (paymentStatus === 'REFUNDED') {
      return <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">↩ Refunded</span>;
    }
    if (paymentMethod === 'COD') {
      return <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">💰 Pay on Delivery</span>;
    }
    return null;
  };

  // Show Retry button: payment failed + online order + order not delivered/cancelled
  const canRetryPayment = (order: Order) => {
    const s = order.status?.toLowerCase();
    return order.paymentStatus === 'FAILED' &&
      order.paymentMethod !== 'COD' &&
      s !== 'delivered' &&
      s !== 'cancelled';
  };

  // Show Invoice button: payment successful (online orders) OR COD order marked SUCCESS
  const canDownloadInvoice = (order: Order) => order.paymentStatus === 'SUCCESS';

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="font-headline-md text-2xl mb-2">My Orders</h2>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchOrders} />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        message="You have not placed any orders yet. Start exploring our collection to find something you'll love!"
        actionLabel="Start Shopping"
        onAction={() => { window.location.href = '/collection'; }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-headline-md text-2xl mb-2">My Orders</h2>
      
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-outline-variant/30 rounded-xl p-5 md:p-6 hover:shadow-sm transition-shadow">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order #{order.orderNumber}</p>
                <p className="font-medium">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <p className="font-semibold">₹{order.totalAmount}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(order.status)}
                  {getPaymentBadge(order.paymentStatus, order.paymentMethod)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="w-20 h-24 bg-[#f6f5f0] rounded-lg overflow-hidden flex-shrink-0 group block relative">
                    <img src={item.productImage || ''} alt={item.productName} className="w-full h-full object-cover mix-blend-multiply cursor-pointer transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-black">
                      {item.productName}
                    </p>
                    {item.size && <p className="text-sm text-gray-400 mt-0.5">Size: {item.size}</p>}
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-100">
              <Link 
                to={`/track-order/${order.id}`}
                className="flex-1 md:flex-none border border-gray-300 rounded-lg px-6 py-2.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors text-center inline-block"
              >
                Track Order
              </Link>

              {/* ── Retry Payment button: shown only when payment failed for online orders ── */}
              {canRetryPayment(order) && (
                <button
                  onClick={() => handleRetryPayment(order)}
                  disabled={retryingOrderId === order.id}
                  className="flex items-center gap-2 border border-red-300 text-red-600 rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {retryingOrderId === order.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RefreshCw className="w-4 h-4" />}
                  Retry Payment
                </button>
              )}

              {/* ── Download Invoice button: shown only when payment is confirmed ── */}
              {canDownloadInvoice(order) && (
                <button
                  onClick={() => handleDownloadInvoice(order)}
                  disabled={downloadingOrderId === order.id}
                  className="flex items-center gap-2 border border-gray-300 rounded-lg px-5 py-2.5 text-sm font-medium hover:border-charcoal-stone hover:text-charcoal-stone transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {downloadingOrderId === order.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <FileText className="w-4 h-4" />}
                  Download Invoice
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
