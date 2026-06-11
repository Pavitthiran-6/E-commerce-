import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { CheckCircle2, MapPin, Package, Truck, Download, Loader2 } from 'lucide-react';
import { downloadInvoice } from '../../services/paymentService';
import { getOrderById, type Order } from '../../services/orderService';

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

function getDeliveryDate(estimatedDelivery?: string) {
  if (!estimatedDelivery) return '—';
  const d = new Date(estimatedDelivery);
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

export default function CheckoutConfirmation() {
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const realOrderId = localStorage.getItem('lastOrderId');

  useEffect(() => {
    // Clear cart immediately on mount so checkout flow finishes cleanly
    clearCart().catch(err => console.warn('Failed to clear cart:', err));

    const fetchOrder = async () => {
      if (!realOrderId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getOrderById(realOrderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch order details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [realOrderId]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      await downloadInvoice(order.id, order.orderNumber);
    } catch (e) {
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2] pt-28 pb-20 px-4 sm:px-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-charcoal-stone" />
          <p className="text-sm text-gray-500 font-medium">Loading confirmation details...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#f7f6f2] pt-28 pb-20 px-4 sm:px-8 flex flex-col items-center justify-center text-center">
        <h1 className="font-serif text-2xl text-charcoal-stone mb-2">Order Not Found</h1>
        <p className="text-gray-500 mb-6 text-sm">We couldn't retrieve your order details. Please check your profile orders.</p>
        <Link to="/collection" className="bg-charcoal-stone text-white font-semibold uppercase tracking-widest py-3 px-6 text-xs hover:bg-charcoal-stone/85 transition-all text-center">
          Continue Shopping
        </Link>
      </main>
    );
  }

  const deliveryDate = getDeliveryDate(order.estimatedDelivery);
  const paymentMethod = order.paymentMethod?.toLowerCase() || 'card';
  const paymentDetails = order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment';

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
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium mb-0.5">Order Number</p>
              <p className="font-mono font-semibold text-charcoal-stone text-sm">{order.orderNumber}</p>
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
          {!order.items || order.items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No items found.</p>
          ) : order.items.map(item => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-b-0">
              <div className="w-16 h-20 bg-[#f6f5f0] flex-shrink-0 overflow-hidden rounded-sm">
                <img src={item.productImage || 'https://via.placeholder.com/60'} alt={item.productName} className="w-full h-full object-cover mix-blend-multiply" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-charcoal-stone text-[15px] mb-1">{item.productName}</p>
                <p className="text-xs text-gray-400">
                  {item.size ? `Size: ${item.size}` : ''}
                  {item.size && item.color ? ' · ' : ''}
                  {item.color ? `Color: ${item.color}` : ''}
                  {item.size || item.color ? ' · ' : ''}
                  Qty: {item.quantity}
                </p>
              </div>
              <span className="font-semibold text-charcoal-stone">{fmt(Number(item.totalPrice))}</span>
            </div>
          ))}

          {/* Price breakdown */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(Number(order.subtotal))}</span></div>
            <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{order.shippingCharge === 0 ? <span className="text-emerald-600">Free</span> : fmt(Number(order.shippingCharge))}</span></div>
            {order.couponCode && (
              <div className="flex justify-between text-emerald-600 font-medium"><span>Discount ({order.couponCode})</span><span>- {fmt(Number(order.discountAmount))}</span></div>
            )}
            {order.paymentMethod === 'COD' && <div className="flex justify-between text-orange-500"><span>COD Fee</span><span>+₹49</span></div>}
            <div className="flex flex-col gap-0.5 border-t border-gray-200 pt-2 mt-1">
              <div className="flex justify-between font-semibold text-charcoal-stone text-base items-baseline">
                <span className="font-serif">Total Amount</span>
                <span className="text-emerald-600">{fmt(Number(order.totalAmount))}</span>
              </div>
              <p className="text-[10px] text-[#0C831F] font-semibold text-right leading-none">
                ✓ Prices include all applicable taxes
              </p>
            </div>
          </div>
        </div>

        {/* ── Delivery address ── */}
        {order.address && (
          <div className="bg-white border border-gray-200 rounded-sm px-6 py-4 mb-8 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 bg-charcoal-stone/5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 text-charcoal-stone" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium mb-1.5">Delivering To</p>
              <p className="font-semibold text-charcoal-stone text-sm">{order.address.fullName} · {order.address.phone}</p>
              <p className="text-sm text-gray-500 mt-0.5">{order.address.addressLine1}</p>
              {order.address.addressLine2 && <p className="text-sm text-gray-500">{order.address.addressLine2}</p>}
              <p className="text-sm text-gray-500">{order.address.city}, {order.address.state} – {order.address.postalCode}</p>
            </div>
          </div>
        )}

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
          {paymentMethod === 'cod' ? (
            <div className="flex-1 flex flex-col justify-center items-center py-2 px-4 bg-gray-50 border border-dashed border-gray-300 rounded-sm">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Invoice Info</span>
              <p className="text-[11px] text-gray-500 font-semibold mt-1 text-center">Tax Invoice will be available after payment confirmation.</p>
            </div>
          ) : (
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
