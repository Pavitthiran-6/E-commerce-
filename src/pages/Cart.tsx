import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingButton } from '../components/LoadingButton';
import { Minus, Plus, Trash2, X, ShoppingBag, Tag, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getActiveCoupons, validateCoupon } from '../services/couponService';
import type { Coupon } from '../services/couponService';
import { getPublicShippingSettings } from '../services/orderService';

export default function Cart() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const { isLoggedIn } = useAuth();

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(() => sessionStorage.getItem('appliedCoupon'));
  const [appliedCouponDetails, setAppliedCouponDetails] = useState<Coupon | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [shippingThreshold, setShippingThreshold] = useState(999);
  const [shippingChargeVal, setShippingChargeVal] = useState(79);

  useEffect(() => {
    getActiveCoupons().then(setAvailableCoupons).catch(console.error);
    getPublicShippingSettings()
      .then((settings) => {
        setShippingThreshold(settings.freeShippingThreshold);
        setShippingChargeVal(settings.shippingCharge);
      })
      .catch((err) => {
        console.warn('Failed to load shipping settings, using default fallback (999/79)', err);
      });
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (appliedCouponCode && subtotal > 0) {
      validateCoupon(appliedCouponCode, subtotal)
        .then((details) => { setAppliedCouponDetails(details); setCouponError(null); })
        .catch(() => handleRemoveCoupon());
    } else {
      setAppliedCouponDetails(null);
    }
  }, [appliedCouponCode, subtotal]);

  const handleApplyCoupon = async (code: string) => {
    if (appliedCouponCode) {
      if (window.confirm('A coupon is already applied. Remove it first?')) {
        handleRemoveCoupon();
      } else return;
    }
    setIsValidating(true);
    setCouponError(null);
    try {
      const details = await validateCoupon(code, subtotal);
      setAppliedCouponCode(code.toUpperCase());
      setAppliedCouponDetails(details);
      sessionStorage.setItem('appliedCoupon', code.toUpperCase());
      setIsCouponModalOpen(false);
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode(null);
    setAppliedCouponDetails(null);
    sessionStorage.removeItem('appliedCoupon');
    setCouponInput('');
    setCouponError(null);
  };

  const fmt = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const calculatedDiscount = appliedCouponDetails
    ? appliedCouponDetails.discountType === 'PERCENTAGE'
      ? (subtotal * appliedCouponDetails.discountValue) / 100
      : appliedCouponDetails.discountValue
    : 0;

  const subtotalAfterDiscount = subtotal - calculatedDiscount;

  let productSpecificShipping = 0;
  let hasFallbackItem = false;
  
  cartItems.forEach(item => {
    if (item.freeShipping === true) {
      // ships free
    } else if (item.shippingCharge != null && item.shippingCharge > 0) {
      productSpecificShipping += item.quantity * item.shippingCharge;
    } else {
      hasFallbackItem = true;
    }
  });

  const fallbackShipping = hasFallbackItem
    ? (subtotalAfterDiscount >= shippingThreshold ? 0 : shippingChargeVal)
    : 0;

  const shipping = productSpecificShipping + fallbackShipping;
  const tax = Math.round(subtotalAfterDiscount * 18 / 118);
  const total = subtotalAfterDiscount + shipping;

  // Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-[#F8F8F8]">
        <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-5">
          <ShoppingBag className="w-10 h-10 text-[#0C831F]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
          Looks like you haven't added anything yet. Explore our collections!
        </p>
        <Link
          to="/collection"
          className="bg-[#0C831F] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#0A6B19] transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F8F8] min-h-screen pb-32 md:pb-8">
      <div className="max-w-[1440px] mx-auto px-3 md:px-6 lg:px-10 py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          My Cart <span className="text-sm font-medium text-gray-500">({cartItems.length} items)</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* ── Cart items list ──────────────────────── */}
          <div className="flex-1 space-y-3">
            {cartItems.map((item) => (
              <div key={`${item.id}-${item.size}-${item.color}`} className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm">
                {/* Product image */}
                <Link to={`/product/${item.id}`} className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" loading="lazy" />
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.id}`} className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-[#0C831F] transition-colors leading-snug">
                    {item.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.color !== 'Standard' && `Color: ${item.color}`}
                    {item.color !== 'Standard' && item.size !== 'Standard' && ' · '}
                    {item.size !== 'Standard' && `Size: ${item.size}`}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Stepper */}
                    <div className="flex items-center bg-[#F8F8F8] rounded-xl overflow-hidden border border-[#E8E8E8]">
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price + remove */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{fmt(item.price * item.quantity)}</span>
                      <button
                        onClick={() => removeFromCart(item.id, item.size, item.color)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue shopping */}
            <Link to="/collection" className="flex items-center gap-1.5 text-sm font-semibold text-[#0C831F] hover:text-[#0A6B19] transition-colors py-1">
              + Continue Shopping
            </Link>
          </div>

          {/* ── Order summary ───────────────────────── */}
          <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24 space-y-3">
            {/* Coupon section */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {!appliedCouponCode ? (
                <button
                  onClick={() => setIsCouponModalOpen(true)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-[#0C831F] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#0C831F]" />
                    Apply Coupon / Promo Code
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#0C831F]">
                    <span className="text-lg">✅</span>
                    <div>
                      <p className="text-xs font-bold">{appliedCouponCode}</p>
                      <p className="text-xs text-[#0C831F]">Saving {fmt(calculatedDiscount)}</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs font-bold text-red-500 hover:text-red-700">
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-3">Order Summary</h2>
              <div className="space-y-2.5 text-sm mb-3 pb-3 border-b border-[#E8E8E8]">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold">{fmt(subtotal)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-[#0C831F] font-semibold">
                    <span>Discount</span>
                    <span>− {fmt(calculatedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-[#0C831F]' : ''}`}>
                    {shipping === 0 ? 'FREE' : fmt(shipping)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-lg font-black text-gray-900">{fmt(total)}</span>
                </div>
                <p className="text-[11px] text-[#0C831F] font-semibold text-right leading-none">
                  ✓ Prices include all applicable taxes
                </p>
              </div>

              {calculatedDiscount > 0 && (
                <div className="bg-[#E8F5E9] rounded-xl px-3 py-2 mb-3 text-xs font-semibold text-[#0C831F]">
                  🎉 You're saving {fmt(calculatedDiscount)} on this order!
                </div>
              )}

              <LoadingButton
                onClickAsync={async () => {
                  if (!isLoggedIn) {
                    localStorage.setItem('redirectAfterLogin', '/checkout/address');
                    navigate('/login');
                    return;
                  }
                  await new Promise((r) => setTimeout(r, 400));
                  navigate('/checkout/address');
                }}
                className="w-full bg-[#0C831F] text-white font-bold py-3.5 rounded-xl hover:bg-[#0A6B19] transition-colors text-sm"
              >
                Proceed to Checkout →
              </LoadingButton>

              {!isLoggedIn && (
                <p className="text-center text-xs text-gray-500 mt-2">
                  You'll need to log in to checkout
                </p>
              )}

              {shipping > 0 && (
                <div className="mt-2 text-center text-xs font-semibold text-[#0C831F] bg-[#E8F5E9]/50 py-1.5 rounded-lg border border-[#E8F5E9] animate-pulse">
                  Add {fmt(shippingThreshold - (subtotal - calculatedDiscount))} more for FREE shipping
                </div>
              )}
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-2 gap-2">
              {[
                { icon: '🔒', label: 'Secure Checkout' },
                { icon: '🚚', label: 'Free Shipping ₹999+' },
                { icon: '↩️', label: '7-Day Returns' },
                { icon: '💵', label: 'COD Available' },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2">
                  <span className="text-base">{badge.icon}</span>
                  <span className="text-[11px] text-gray-600 font-medium">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky bottom checkout bar (mobile) ─── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden bg-white border-t border-[#E8E8E8] px-4 py-3 flex items-center justify-between shadow-xl">
        <div>
          <p className="text-xs text-gray-500">Total Amount</p>
          <p className="text-base font-black text-gray-900">{fmt(total)}</p>
        </div>
        <button
          onClick={async () => {
            if (!isLoggedIn) {
              localStorage.setItem('redirectAfterLogin', '/checkout/address');
              navigate('/login');
              return;
            }
            navigate('/checkout/address');
          }}
          className="bg-[#0C831F] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#0A6B19] transition-colors text-sm"
        >
          Checkout →
        </button>
      </div>

      {/* ── Coupon modal ────────────────────────── */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={() => setIsCouponModalOpen(false)}>
          <div
            className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle + header */}
            <div className="flex justify-center pt-3 md:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E8]">
              <h3 className="text-base font-bold text-gray-900">🎟️ Apply Coupon</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="p-1.5 text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Manual input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 border border-[#E8E8E8] rounded-xl px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0C831F]"
                  />
                  <button
                    onClick={() => handleApplyCoupon(couponInput)}
                    disabled={!couponInput || isValidating}
                    className="bg-[#0C831F] text-white font-bold text-sm px-4 rounded-xl disabled:opacity-50 hover:bg-[#0A6B19] transition-colors"
                  >
                    {isValidating ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-xs font-semibold text-red-500">{couponError}</p>}
              </div>

              {/* Available coupons */}
              {availableCoupons.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Available Coupons</p>
                  <div className="space-y-3">
                    {availableCoupons.map((coupon) => {
                      const meetsMin = subtotal >= (coupon.minOrderValue || 0);
                      return (
                        <div key={coupon.code} className={`border rounded-xl p-3 ${meetsMin ? 'border-[#E8E8E8] bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="font-mono text-xs font-bold bg-[#E8F5E9] text-[#0C831F] px-2 py-1 rounded-lg">
                                {coupon.code}
                              </span>
                              <p className="text-xs text-gray-700 font-medium mt-1">{coupon.description}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">Min order {fmt(coupon.minOrderValue || 0)}</p>
                            </div>
                            <button
                              onClick={() => handleApplyCoupon(coupon.code)}
                              disabled={!meetsMin || isValidating}
                              className={`text-xs font-bold uppercase whitespace-nowrap disabled:opacity-40 ${meetsMin ? 'text-[#0C831F] hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
