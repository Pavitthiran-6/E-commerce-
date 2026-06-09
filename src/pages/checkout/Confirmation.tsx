import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { CheckCircle2, MapPin, Package, Truck, Download, Loader2 } from 'lucide-react';
import { isFreeShippingCoupon } from '../../utils/couponLogic';
import { downloadInvoice } from '../../services/paymentService';

const STEPS = ['Address', 'Payment', 'Confirmation'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                  ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-medium tracking-wider uppercase ${done ? 'text-emerald-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-[2px] w-20 sm:w-32 mx-1 mb-5 transition-colors ${i < current ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Generate a random order ID
function genOrderId() {
  const date = new Date();
  const d = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${d}-${rand}`;
}

function getDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Animated checkmark SVG
function AnimatedCheck() {
  return (
    <div className="relative flex items-center justify-center w-28 h-28 mx-auto mb-6">
      {/* Pulsing ring */}
      <span className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-50" style={{ animationDuration: '2s' }} />
      <span className="absolute inset-2 rounded-full bg-emerald-50" />
      <svg
        className="relative w-16 h-16 text-emerald-500"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 52 52"
      >
        <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2" className="opacity-20" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27l8 8 16-18"
          style={{
            strokeDasharray: 48,
            strokeDashoffset: 0,
            animation: 'drawCheck 0.6s ease forwards',
          }}
        />
      </svg>
      <style>{`
        @keyframes drawCheck {
          from { stroke-dashoffset: 48; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

const DELIVERY_ADDRESS = {
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  line1: 'Flat 4B, Sunrise Apartments, Bandra West',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400050',
};

export default function CheckoutConfirmation() {
  const { cartItems, clearCart } = useCart();
  const orderId = useRef(genOrderId()).current;
  const deliveryDate = useRef(getDeliveryDate()).current;
  const [cleared, setCleared] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const realOrderId = localStorage.getItem('lastOrderId');

  const handleDownloadInvoice = async () => {
    if (!realOrderId) {
      alert("Order details not found.");
      return;
    }
    setDownloading(true);
    try {
      await downloadInvoice(realOrderId, orderId);
    } catch (e) {
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const paymentMethod = localStorage.getItem('lastPaymentMethod') || 'card';
  const paymentDetails = localStorage.getItem('lastPaymentDetails') || 'Card ending in •••• 4242';

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  // Save a snapshot of cart items before clearing
  const [orderItems] = useState([...cartItems]);

  useEffect(() => {
    if (!cleared) {
      setCleared(true);
      // Give the component time to render with the snapshot, then clear cart
      const timer = setTimeout(() => clearCart(), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const appliedCoupon = sessionStorage.getItem('appliedCoupon');

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = 0; // Discount already applied by backend — shown for display only
  const isFreeShipping = appliedCoupon ? isFreeShippingCoupon(appliedCoupon, []) : false;

  const shipping = isFreeShipping ? 0 : (subtotal > 5000 ? 0 : 250);
  const tax = Math.round((subtotal - discountAmount) * 0.18);
  const codFee = paymentMethod === 'cod' ? 49 : 0;
  const total = (subtotal - discountAmount) + shipping + tax + codFee;



  return (
    <main className="min-h-screen bg-[#f7f6f2] pt-28 pb-20 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <StepBar current={2} />

        {/* ── Success hero ── */}
        <div className="text-center mb-10">
          <AnimatedCheck />
          <h1 className="font-serif text-3xl sm:text-4xl text-charcoal-stone mb-3">Order Placed Successfully!</h1>
          <p className="text-gray-500 text-sm">Thank you for shopping with us. Your order is confirmed.</p>
        </div>

        {/* ── Order ID + delivery date ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-sm px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-charcoal-stone/5 rounded-full flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-charcoal-stone" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium mb-0.5">Order ID</p>
              <p className="font-mono font-semibold text-charcoal-stone text-sm">{orderId}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-sm px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium mb-0.5">Estimated Delivery</p>
              <p className="font-semibold text-charcoal-stone text-sm">{deliveryDate}</p>
            </div>
          </div>
        </div>

        {/* ── Order items ── */}
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-serif text-lg text-charcoal-stone">Items Ordered</h2>
          </div>
          {orderItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No items found.</p>
          ) : orderItems.map(item => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-b-0">
              <div className="w-16 h-20 bg-[#f6f5f0] flex-shrink-0 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-charcoal-stone text-[15px] mb-1">{item.name}</p>
                <p className="text-xs text-gray-400">Size: {item.size} · Color: {item.color} · Qty: {item.quantity}</p>
              </div>
              <span className="font-semibold text-charcoal-stone">{fmt(item.price * item.quantity)}</span>
            </div>
          ))}

          {/* Price breakdown */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{shipping === 0 ? <span className="text-emerald-600">Free</span> : fmt(shipping)}</span></div>
            <div className="flex justify-between text-gray-500"><span>GST (18%)</span><span>{fmt(tax)}</span></div>
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-600 font-medium"><span>Discount ({appliedCoupon})</span><span>- {fmt(discountAmount)}</span></div>
            )}
            {codFee > 0 && <div className="flex justify-between text-orange-500"><span>COD Fee</span><span>+₹49</span></div>}
            <div className="flex justify-between font-semibold text-charcoal-stone text-base border-t border-gray-200 pt-2 mt-1">
              <span className="font-serif">Total Paid</span>
              <span className="text-emerald-600">{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* ── Delivery address ── */}
        <div className="bg-white border border-gray-200 rounded-sm px-6 py-4 mb-8 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 bg-charcoal-stone/5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-5 h-5 text-charcoal-stone" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium mb-1.5">Delivering To</p>
            <p className="font-semibold text-charcoal-stone text-sm">{DELIVERY_ADDRESS.name} · {DELIVERY_ADDRESS.phone}</p>
            <p className="text-sm text-gray-500 mt-0.5">{DELIVERY_ADDRESS.line1}</p>
            <p className="text-sm text-gray-500">{DELIVERY_ADDRESS.city}, {DELIVERY_ADDRESS.state} – {DELIVERY_ADDRESS.pincode}</p>
          </div>
        </div>

        {/* ── Payment Method ── */}
        <div className="bg-white border border-gray-200 rounded-sm px-6 py-4 mb-8 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 bg-charcoal-stone/5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-base">
            {paymentMethod === 'upi' && '📱'}
            {paymentMethod === 'card' && '💳'}
            {paymentMethod === 'cod' && '💵'}
            {paymentMethod === 'netbanking' && '🏦'}
            {paymentMethod === 'wallet' && '👛'}
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium mb-1.5">Payment Method</p>
            <p className="font-semibold text-charcoal-stone text-sm">{paymentDetails}</p>
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-14">
          <Link
            to="/profile?tab=orders"
            className="flex-1 bg-charcoal-stone text-white font-semibold uppercase tracking-widest py-4 text-sm hover:bg-charcoal-stone/85 transition-colors text-center flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            Track My Order
          </Link>
          {realOrderId && (
            <button
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="flex-1 border-2 border-charcoal-stone text-charcoal-stone font-semibold uppercase tracking-widest py-4 text-sm hover:bg-charcoal-stone hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download Invoice
            </button>
          )}
          <Link
            to="/collection"
            className="flex-1 border-2 border-charcoal-stone text-charcoal-stone font-semibold uppercase tracking-widest py-4 text-sm hover:bg-charcoal-stone hover:text-white transition-all text-center"
          >
            Continue Shopping
          </Link>
        </div>


      </div>
    </main>
  );
}
