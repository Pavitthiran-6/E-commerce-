import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle2, XCircle, Clock, MapPin, Download, HelpCircle, RotateCcw, AlertCircle, ShoppingBag } from 'lucide-react';

export default function TrackOrder() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('orderId') || 'ORD-20240512-001';

  // State to simulate loading and fetch
  const [isLoading, setIsLoading] = useState(true);

  // Use the orderId to determine status for demo purposes, or default to Delivered
  let status = 'Delivered';
  if (orderId.includes('089')) status = 'Processing';
  if (orderId.includes('042')) status = 'Cancelled';
  if (orderId.includes('002')) status = 'Out for Delivery'; // Just for testing
  if (orderId.includes('003')) status = 'Placed';

  const timelineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Simulate network fetch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [orderId]);

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

  // Determine Banner Data
  const getBannerData = () => {
    switch (status) {
      case 'Placed':
        return { color: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: <Package className="w-6 h-6 text-yellow-600" />, title: 'Order Placed', desc: 'We have received your order and are currently verifying it.' };
      case 'Processing':
        return { color: 'bg-blue-50 text-blue-800 border-blue-200', icon: <Clock className="w-6 h-6 text-blue-600" />, title: 'Processing', desc: 'We are preparing your order. It will be shipped soon!' };
      case 'Out for Delivery':
        return { color: 'bg-orange-50 text-orange-800 border-orange-200', icon: <Truck className="w-6 h-6 text-orange-600" />, title: 'Out for Delivery', desc: 'Your order is on its way! Expected today by 9PM.' };
      case 'Delivered':
        return { color: 'bg-green-50 text-green-800 border-green-200', icon: <CheckCircle2 className="w-6 h-6 text-green-600" />, title: 'Delivered', desc: 'Your order was delivered on 15 May 2024. We hope you love it!' };
      case 'Cancelled':
        return { color: 'bg-red-50 text-red-800 border-red-200', icon: <XCircle className="w-6 h-6 text-red-600" />, title: 'Cancelled', desc: 'This order has been cancelled.' };
      default:
        return { color: 'bg-gray-50 text-gray-800 border-gray-200', icon: <AlertCircle className="w-6 h-6" />, title: 'Unknown', desc: 'Status unknown.' };
    }
  };
  const banner = getBannerData();

  // Progress Tracker logic
  const steps = ['Order Placed', 'Order Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const getStepStatus = (stepName: string, index: number) => {
    if (status === 'Cancelled') return { completed: false, current: false };
    
    let currentIndex = 0;
    if (status === 'Placed') currentIndex = 0;
    if (status === 'Processing') currentIndex = 1;
    if (status === 'Out for Delivery') currentIndex = 3;
    if (status === 'Delivered') currentIndex = 4;

    // Special case: if processing, we assume shipped hasn't happened. If out for delivery, shipped has.
    if (index < currentIndex) return { completed: true, current: false };
    if (index === currentIndex) return { completed: false, current: true };
    return { completed: false, current: false };
  };

  // Mock Timeline events
  const allEvents = [
    { date: '15 May 2024, 2:45 PM', event: 'Delivered successfully', loc: 'Mumbai, Maharashtra', statusReq: ['Delivered'], icon: <CheckCircle2 className="w-4 h-4 text-white" />, color: 'bg-green-500' },
    { date: '15 May 2024, 9:00 AM', event: 'Out for delivery', loc: 'Mumbai Hub', statusReq: ['Out for Delivery', 'Delivered'], icon: <Truck className="w-4 h-4 text-white" />, color: 'bg-orange-500' },
    { date: '14 May 2024, 11:30 PM', event: 'Arrived at delivery hub', loc: 'Mumbai, Maharashtra', statusReq: ['Out for Delivery', 'Delivered'], icon: <MapPin className="w-4 h-4 text-white" />, color: 'bg-blue-500' },
    { date: '13 May 2024, 6:00 PM', event: 'In transit', loc: 'Pune → Mumbai', statusReq: ['Out for Delivery', 'Delivered'], icon: <Truck className="w-4 h-4 text-white" />, color: 'bg-blue-500' },
    { date: '13 May 2024, 10:30 AM', event: 'Shipped from warehouse', loc: 'Pune, Maharashtra', statusReq: ['Out for Delivery', 'Delivered'], icon: <Package className="w-4 h-4 text-white" />, color: 'bg-blue-500' },
    { date: '12 May 2024, 4:00 PM', event: 'Order confirmed & packed', loc: 'Warehouse', statusReq: ['Processing', 'Out for Delivery', 'Delivered'], icon: <CheckCircle2 className="w-4 h-4 text-white" />, color: 'bg-green-500' },
    { date: '12 May 2024, 2:30 PM', event: 'Order placed successfully', loc: 'Online', statusReq: ['Placed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'], icon: <ShoppingBag className="w-4 h-4 text-white" />, color: 'bg-green-500' },
  ];

  const visibleEvents = allEvents.filter(e => e.statusReq.includes(status));

  // Determine Product ID to link based on the order ID for demo
  const productId = orderId.includes('089') ? 'b0-classic' : orderId.includes('042') ? 'b0-walnut' : 'b0-velcro';

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* SECTION 1: Page Header */}
      <div className="bg-charcoal-stone text-white pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="font-headline-display text-4xl mb-3">Track Your Order</h1>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-on-surface-variant font-body-sm">
            <span className="font-mono text-warm-sand text-lg tracking-wider">Order #{orderId}</span>
            <span className="hidden md:inline text-gray-500">•</span>
            <span>Placed on 12 May 2024</span>
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
                  <div key={idx} className="flex flex-col items-center w-1/5 relative bg-white px-2">
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
                    {completed && idx === 0 && <span className="text-xs text-gray-500 mt-1">12 May, 2:30 PM</span>}
                    {completed && idx === 1 && <span className="text-xs text-gray-500 mt-1">12 May, 4:00 PM</span>}
                    {completed && idx === 2 && <span className="text-xs text-gray-500 mt-1">13 May, 10:30 AM</span>}
                    {completed && idx === 3 && <span className="text-xs text-gray-500 mt-1">15 May, 9:00 AM</span>}
                    {completed && idx === 4 && <span className="text-xs text-gray-500 mt-1">15 May, 2:45 PM</span>}
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
          
          {/* SECTION 4: Detailed Tracking Timeline */}
          {status !== 'Cancelled' && (
            <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant/30 p-6 md:p-8 shadow-sm">
              <h3 className="font-headline-md text-xl mb-8 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Tracking History
              </h3>
              
              <div className="relative pl-6 border-l-2 border-gray-100 ml-3 space-y-10">
                {visibleEvents.map((evt, i) => (
                  <div 
                    key={i} 
                    ref={(el) => { timelineRefs.current[i] = el; }}
                    className="relative opacity-0 translate-y-4 transition-all duration-700 ease-out"
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className={`absolute -left-[35px] w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${evt.color}`}>
                      {evt.icon}
                    </div>
                    <div>
                      <p className="font-bold text-charcoal-stone text-[15px]">{evt.event}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {evt.loc}</span>
                        <span className="hidden sm:inline text-gray-300">•</span>
                        <span>{evt.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Info Cards */}
          <div className="flex flex-col gap-6">
            
            {/* SECTION 5: Shipment Details Box */}
            <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-sm">
              <h3 className="font-label-caps uppercase tracking-widest text-xs text-gray-400 mb-4 border-b pb-2">Shipment Details</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 mb-0.5">Courier Partner</p>
                    <p className="font-semibold text-charcoal-stone">Delhivery</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-[10px] font-bold text-gray-600 flex-shrink-0">#</span>
                  <div className="w-full">
                    <p className="text-gray-500 mb-0.5">Tracking Number</p>
                    <p className="font-mono font-semibold text-charcoal-stone mb-2">DLVR20240513789456</p>
                    <a 
                      href="https://www.delhivery.com/tracking" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      Track on Courier Website <RotateCcw className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-50">
                  <p className="text-gray-500 mb-0.5">Estimated Delivery</p>
                  <p className="font-semibold text-charcoal-stone">Thursday, 15 May 2024</p>
                  {status === 'Delivered' && (
                    <p className="text-xs text-green-600 font-medium mt-1">✅ Actual Delivery: 15 May 2024, 2:45 PM</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 6: Delivery Address Box */}
            <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-sm">
              <h3 className="font-label-caps uppercase tracking-widest text-xs text-gray-400 mb-4 border-b pb-2">Delivered To</h3>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-charcoal-stone mb-1">Rahul Sharma</p>
                  <p className="text-gray-500 mb-1">+91 98765 43210</p>
                  <p className="text-gray-500 leading-relaxed">
                    Flat 4B, Sunrise Apartments<br />
                    Bandra West<br />
                    Mumbai, Maharashtra – 400050
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 7: Ordered Items Box */}
        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-headline-md text-xl">Items in this Order</h3>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center border-b border-gray-100 pb-6 mb-6">
              <Link to={`/product/${productId}`} className="w-24 h-32 bg-[#f6f5f0] rounded-md overflow-hidden flex-shrink-0 group block">
                <img 
                  src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500" 
                  alt="Product" 
                  className="w-full h-full object-cover mix-blend-multiply cursor-pointer transition-transform duration-500 group-hover:scale-110" 
                />
              </Link>
              <div className="flex-1 text-center md:text-left">
                <Link to={`/product/${productId}`} className="font-serif text-lg text-charcoal-stone hover:text-primary transition-colors block mb-1">
                  {productId === 'b0-classic' ? 'Wide Leg Linen Pants' : productId === 'b0-walnut' ? 'High-Speed Blender' : 'Bo Velcro'}
                </Link>
                <p className="text-sm text-gray-500 mb-2">Size: 8 | Color: Walnut | Qty: 1</p>
              </div>
              <div className="text-xl font-semibold text-charcoal-stone">
                ₹16,500
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="w-full md:w-1/2 ml-auto space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>₹16,500</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>GST (18%)</span>
                <span>₹2,970</span>
              </div>
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount</span>
                <span>- ₹0</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-charcoal-stone pt-3 border-t border-gray-200 mt-2">
                <span>Total Paid</span>
                <span>₹19,470</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 8: Action Buttons */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white rounded-xl border border-outline-variant/30 p-6 shadow-sm mb-12">
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <Link 
              to={`/product/${productId}`}
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
