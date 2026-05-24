import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingButton } from '../components/LoadingButton';
import { Minus, Plus, Trash2, ArrowRight, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { coupons, calculateDiscount, getCouponError } from '../utils/couponLogic';

export default function Cart() {
  const navigate = useNavigate();
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => sessionStorage.getItem('appliedCoupon'));

  const handleApplyCoupon = (code: string) => {
    if (appliedCoupon) {
      if (window.confirm('A coupon is already applied. Remove it first?')) {
        handleRemoveCoupon();
      } else {
        return;
      }
    }
    const error = getCouponError(code, subtotal);
    if (error) {
      setCouponError(error);
      return;
    }
    setCouponError(null);
    setAppliedCoupon(code.toUpperCase());
    sessionStorage.setItem('appliedCoupon', code.toUpperCase());
    setIsCouponModalOpen(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    sessionStorage.removeItem('appliedCoupon');
    setCouponInput('');
    setCouponError(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };



  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Discount Calculations
  const discountAmount = appliedCoupon ? calculateDiscount(appliedCoupon, subtotal) : 0;
  const isFreeShipping = appliedCoupon ? coupons.find(c => c.code === appliedCoupon)?.type === 'freeshipping' : false;

  const shipping = isFreeShipping ? 0 : (subtotal > 5000 ? 0 : 250);
  const tax = (subtotal - discountAmount) * 0.18;
  const total = (subtotal - discountAmount) + shipping + tax;

  // Auto-remove coupon if cart subtotal drops below minimum
  useEffect(() => {
    if (appliedCoupon) {
      const error = getCouponError(appliedCoupon, subtotal);
      if (error) handleRemoveCoupon();
    }
  }, [subtotal, appliedCoupon]);

  if (cartItems.length === 0) {
    return (
      <main className="w-full min-h-[80vh] flex flex-col items-center justify-center pt-32 pb-24 px-6 bg-surface">
        <div className="text-center max-w-md">
          <h1 className="font-headline-display text-4xl text-primary mb-4">Your Cart is Empty</h1>
          <p className="font-body-md text-on-surface-variant mb-8">
            Looks like you haven't added anything to your cart yet. Discover our latest collection.
          </p>
          <Link 
            to="/collection"
            className="inline-flex items-center gap-2 bg-primary text-white font-button uppercase tracking-[0.1em] px-8 py-4 hover:bg-primary/90 transition-colors"
          >
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen pt-32 pb-24 px-6 md:px-12 xl:px-24 bg-surface">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-headline-display text-4xl text-primary tracking-wide mb-10">Shopping Cart</h1>
        
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Cart Items */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-outline-variant/30 text-xs font-label-caps uppercase tracking-widest text-on-surface-variant">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <div className="flex flex-col gap-6">
              {cartItems.map(item => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-4 border-b border-outline-variant/20">
                  {/* Product Info */}
                  <div className="col-span-1 md:col-span-6 flex gap-4">
                    <Link to={`/product/${item.id}`} className="shrink-0">
                      <img src={item.image} alt={item.name} className="w-24 h-32 object-cover bg-surface-variant/30 mix-blend-multiply" />
                    </Link>
                    <div className="flex flex-col justify-center">
                      <Link to={`/product/${item.id}`} className="font-serif text-lg hover:text-primary/70 transition-colors mb-1">
                        {item.name}
                      </Link>
                      <p className="text-sm text-on-surface-variant mb-2">Color: {item.color} | Size: {item.size}</p>
                      <button 
                        onClick={() => removeFromCart(item.id, item.size, item.color)}
                        className="text-xs text-red-500 flex items-center gap-1 w-fit hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Price (Desktop) */}
                  <div className="hidden md:block col-span-2 text-center font-medium">
                    {formatPrice(item.price)}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1 md:col-span-2 flex items-center md:justify-center mt-2 md:mt-0">
                    <div className="flex items-center border border-outline-variant rounded-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.color, -1)}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant/30 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.size, item.color, 1)}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant/30 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Total & Mobile Price */}
                  <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center mt-2 md:mt-0">
                    <span className="md:hidden text-sm text-on-surface-variant">Total:</span>
                    <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white border border-outline-variant/30 p-8 sticky top-32">
              <h2 className="font-serif text-2xl mb-6">Order Summary</h2>
              
              <div className="flex flex-col gap-4 text-sm mb-6 border-b border-outline-variant/30 pb-6">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Estimated Tax</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount ({appliedCoupon})</span>
                    <span>- {formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Apply Coupon Section */}
              <div className="mb-6">
                {!appliedCoupon ? (
                  <button 
                    onClick={() => setIsCouponModalOpen(true)}
                    className="w-full border border-charcoal-stone bg-white text-charcoal-stone font-bold uppercase tracking-widest text-xs py-3 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>🎟️</span> Apply Coupon Code
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-4 py-3">
                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                      <span>✅</span>
                      <span>{appliedCoupon} applied — You saved {formatPrice(discountAmount)}!</span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-xs text-green-700 underline hover:text-green-800 font-bold ml-2">
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end mb-8 border-t border-outline-variant/30 pt-6">
                <span className="font-serif text-lg">Total</span>
                <span className="font-serif text-2xl text-primary">{formatPrice(total)}</span>
              </div>

              <LoadingButton
                onClickAsync={async () => {
                  await new Promise(r => setTimeout(r, 600));
                  navigate('/checkout');
                }}
                className="w-full bg-primary text-white font-button uppercase tracking-[0.1em] py-4 hover:bg-primary/90 transition-colors text-center block"
              >
                Proceed to Checkout
              </LoadingButton>

              <div className="mt-4 text-center">
                <Link to="/collection" className="text-xs text-on-surface-variant underline underline-offset-4 hover:text-primary transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCouponModalOpen(false)}></div>
          
          <div className="bg-[#fafaf8] rounded-xl shadow-2xl relative z-10 w-full max-w-md max-h-[85vh] flex flex-col transform transition-all scale-100 opacity-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl">
              <h3 className="font-serif text-xl text-charcoal-stone">Available Coupons 🎁</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-gray-400 hover:text-charcoal-stone p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6" data-lenis-prevent="true">
              
              {/* Manual Input */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter coupon code manually..."
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-charcoal-stone uppercase font-mono"
                  />
                  <button 
                    onClick={() => handleApplyCoupon(couponInput)}
                    className="bg-charcoal-stone text-white px-6 font-bold text-xs uppercase tracking-widest rounded hover:bg-gray-800"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-red-500 text-xs font-medium">{couponError}</p>}
              </div>

              <div className="border-t border-dashed border-gray-300"></div>

              {/* Coupon List */}
              <div className="flex flex-col gap-4">
                {coupons.map(coupon => {
                  const meetsMinCart = subtotal >= coupon.minCart;
                  return (
                    <div key={coupon.code} className={`border rounded-lg p-4 flex flex-col gap-3 ${meetsMinCart ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-75'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono bg-gray-100 border border-gray-200 px-2 py-1 rounded text-sm font-bold text-charcoal-stone inline-block w-fit">
                            {coupon.code}
                          </span>
                          <p className="text-charcoal-stone text-sm font-medium">{coupon.description}</p>
                          <p className="text-xs text-gray-500">Min order {formatPrice(coupon.minCart)}</p>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">{coupon.expiry}</p>
                        </div>
                        {meetsMinCart ? (
                          <button 
                            onClick={() => handleApplyCoupon(coupon.code)}
                            className="text-primary font-bold text-xs uppercase tracking-widest hover:underline whitespace-nowrap pt-2"
                          >
                            Apply
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 text-right max-w-[100px] pt-2 leading-tight">
                            Add {formatPrice(coupon.minCart - subtotal)} more to unlock
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}
