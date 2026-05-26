import React, { useEffect, useState } from 'react';
import { Package, Truck, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOrders, type Order } from '../../services/orderService';
import { Skeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

export default function ProfileOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Delivered</span>;
      case 'processing':
      case 'pending':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> {status}</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Cancelled</span>;
      case 'shipped':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Shipped</span>;
      default:
        return null;
    }
  };

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
              <div className="flex flex-col items-end gap-2">
                <p className="font-semibold">₹{order.totalAmount}</p>
                {getStatusBadge(order.status)}
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
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-100">
              <Link 
                to={`/track-order/${order.id}`}
                className="flex-1 md:flex-none border border-gray-300 rounded-lg px-6 py-2.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors text-center inline-block"
              >
                Track Order
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
