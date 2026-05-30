import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle2, XCircle, Clock, MapPin, Download, HelpCircle, RotateCcw, AlertCircle, ShoppingBag } from 'lucide-react';
import { getOrderById, trackOrder } from '../services/orderService';
import type { Order, OrderTracking } from '../services/orderService';

export default function TrackOrder() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const orderIdParam = queryParams.get('orderId') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<OrderTracking[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const status = order?.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()) : 'Unknown';

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

  const handlePrint = () => {
    window.print();
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
      case 'processing':
        return { color: 'bg-blue-50 text-blue-800 border-blue-200', icon: <Clock className="w-6 h-6 text-blue-600" />, title: 'Processing', desc: 'We are preparing your order. It will be shipped soon!' };
      case 'shipped':
      case 'out for delivery':
        return { color: 'bg-orange-50 text-orange-800 border-orange-200', icon: <Truck className="w-6 h-6 text-orange-600" />, title: 'Shipped', desc: 'Your order is on its way!' };
      case 'delivered':
        return { color: 'bg-green-50 text-green-800 border-green-200', icon: <CheckCircle2 className="w-6 h-6 text-green-600" />, title: 'Delivered', desc: 'Your order was delivered successfully. We hope you love it!' };
      case 'cancelled':
        return { color: 'bg-red-50 text-red-800 border-red-200', icon: <XCircle className="w-6 h-6 text-red-600" />, title: 'Cancelled', desc: 'This order has been cancelled.' };
      default:
        return { color: 'bg-gray-50 text-gray-800 border-gray-200', icon: <AlertCircle className="w-6 h-6" />, title: 'Unknown', desc: 'Status unknown.' };
    }
  };
  const banner = getBannerData();

  const steps = ['Placed', 'Processing', 'Shipped', 'Delivered'];
  const getStepStatus = (stepName: string, index: number) => {
    if (status.toLowerCase() === 'cancelled') return { completed: false, current: false };
    
    let currentIndex = 0;
    const currentStatus = status.toLowerCase();
    if (currentStatus === 'pending' || currentStatus === 'placed') currentIndex = 0;
    if (currentStatus === 'processing') currentIndex = 1;
    if (currentStatus === 'shipped') currentIndex = 2;
    if (currentStatus === 'delivered') currentIndex = 3;

    if (index < currentIndex) return { completed: true, current: false };
    if (index === currentIndex) return { completed: false, current: true };
    return { completed: false, current: false };
  };

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
                   style={{ 
                     width: status === 'Delivered' ? '100%' : 
                            status === 'Out for Delivery' ? '75%' : 
                            status === 'Processing' ? '25%' : '0%' 
                   }}
                 />
              </div>

              {steps.map((step, idx) => {
                const { completed, current } = getStepStatus(step, idx);
                return (
                  <div key={idx} className="flex flex-col items-center w-1/4 relative bg-white px-2">
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
                   style={{ 
                     height: status === 'Delivered' ? '100%' : 
                            status === 'Out for Delivery' ? '75%' : 
                            status === 'Processing' ? '25%' : '0%' 
                   }}
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
                      {completed && idx === 0 && <span className="text-xs text-gray-500">12 May 2024, 2:30 PM</span>}
                      {completed && idx === 1 && <span className="text-xs text-gray-500">12 May 2024, 4:00 PM</span>}
                      {completed && idx === 2 && <span className="text-xs text-gray-500">13 May 2024, 10:30 AM</span>}
                      {completed && idx === 3 && <span className="text-xs text-gray-500">15 May 2024, 9:00 AM</span>}
                      {completed && idx === 4 && <span className="text-xs text-gray-500">15 May 2024, 2:45 PM</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* SECTION 4: Timeline */}
          {visibleEvents.length > 0 && (
            <div className="w-full md:w-2/3">
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
              <button onClick={handlePrint} className="text-primary hover:bg-gray-200 p-1.5 rounded transition-colors" title="Download Invoice">
                <Download className="w-4 h-4" />
              </button>
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
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">₹{order.taxAmount.toLocaleString()}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                    <span className="font-medium">-₹{order.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-charcoal-stone text-lg pt-2 border-t border-gray-100 mt-2">
                  <span>Total</span>
                  <span>₹{order.totalAmount.toLocaleString()}</span>
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
            <button 
              onClick={handlePrint}
              className="flex-1 md:flex-none border-2 border-charcoal-stone text-charcoal-stone px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Invoice
            </button>
            {status !== 'Delivered' && status !== 'Cancelled' && (
              <button 
                className="flex-1 md:flex-none border-2 border-red-500 text-red-600 px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-red-50 transition-colors text-center"
              >
                Cancel Order
              </button>
            )}
          </div>
          
          <Link to="/contact" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 mt-4 md:mt-0 mx-auto md:mx-0">
            <HelpCircle className="w-4 h-4" /> Need Help?
          </Link>
        </div>

      </div>
    </div>
  );
}
