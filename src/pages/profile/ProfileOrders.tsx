import React from 'react';
import { Package, Truck, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfileOrders() {
  // Dummy order data
  const orders = [
    {
      id: 'ORD-20240512-001',
      date: '12 May 2024',
      status: 'Delivered',
      amount: '₹ 23,000',
      items: [
        {
          productId: 'b0-velcro',
          name: 'Bo Velcro',
          image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500',
          qty: 1
        }
      ]
    },
    {
      id: 'ORD-20240428-089',
      date: '28 Apr 2024',
      status: 'Processing',
      amount: '₹ 4,500',
      items: [
        {
          productId: 'b0-classic',
          name: 'Wide Leg Linen Pants',
          image: 'https://images.unsplash.com/photo-1509631179647-0c12ac9c68f2?q=80&w=500',
          qty: 1
        }
      ]
    },
    {
      id: 'ORD-20240214-042',
      date: '14 Feb 2024',
      status: 'Cancelled',
      amount: '₹ 15,500',
      items: [
        {
          productId: 'b0-walnut',
          name: 'High-Speed Blender',
          image: 'https://images.unsplash.com/photo-1585237748805-728b75fba184?q=80&w=500',
          qty: 1
        }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Delivered</span>;
      case 'Processing':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Processing</span>;
      case 'Cancelled':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Cancelled</span>;
      default:
        return null;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white p-8 border border-outline-variant/30 rounded-xl flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
          <Package className="w-10 h-10" />
        </div>
        <h3 className="font-headline-md text-xl mb-2">No orders yet</h3>
        <p className="text-gray-500 text-sm mb-8 max-w-sm">
          You have not placed any orders yet. Start exploring our collection to find something you'll love!
        </p>
        <Link 
          to="/collection"
          className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-charcoal-stone transition-colors"
        >
          Start Shopping
        </Link>
      </div>
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
                <p className="text-sm text-gray-500 mb-1">Order #{order.id}</p>
                <p className="font-medium">Placed on {order.date}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="font-semibold">{order.amount}</p>
                {getStatusBadge(order.status)}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <Link to={`/product/${item.productId}`} className="w-20 h-24 bg-[#f6f5f0] rounded-lg overflow-hidden flex-shrink-0 group block relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply cursor-pointer transition-transform duration-500 group-hover:scale-105" />
                  </Link>
                  <div className="flex-1">
                    <Link to={`/product/${item.productId}`} className="font-medium text-black hover:text-primary transition-colors">
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.qty}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-100">
              <Link 
                to={`/track-order?orderId=${order.id}`}
                className="flex-1 md:flex-none border border-gray-300 rounded-lg px-6 py-2.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors text-center inline-block"
              >
                Track Order
              </Link>
              <Link 
                to={`/product/${order.items[0]?.productId || 'b0-velcro'}`}
                className="flex-1 md:flex-none bg-primary text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-charcoal-stone transition-colors text-center inline-block"
              >
                Buy Again
              </Link>
              {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <button 
                  className="flex-1 md:flex-none border border-red-200 text-red-600 rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors text-center"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
