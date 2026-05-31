import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, Lock, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { LoadingButton } from '../../components/LoadingButton';
import { isFreeShippingCoupon } from '../../utils/couponLogic';
import { placeOrder } from '../../services/orderService';
import { createPaymentOrder, verifyPayment } from '../../services/paymentService';
import { getProductById } from '../../services/productService';

/* ─── Custom Dropdown ─── */
interface CustomDropdownProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

function CustomDropdown({ options, value, onChange, placeholder = 'Select an option' }: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const BANK_ICONS: Record<string, string> = {
    'State Bank of India': '🟦',
    'HDFC Bank': '🔵',
    'ICICI Bank': '🟠',
    'Axis Bank': '🟣',
    'Kotak Mahindra Bank': '🔴',
    'Punjab National Bank': '🟤',
    'Bank of Baroda': '🟢',
  };

  return (
    <div ref={ref} className="relative w-full select-none">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 border px-4 py-3 text-sm transition-all duration-200 bg-white
          ${open ? 'border-charcoal-stone shadow-sm' : 'border-gray-300 hover:border-gray-400'}
          ${value ? 'text-charcoal-stone' : 'text-gray-400'}`}
      >
        <span className="flex items-center gap-2.5 truncate">
          {value && <span className="text-base leading-none">{BANK_ICONS[value] ?? '🏦'}</span>}
          <span className="truncate">{value || placeholder}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 shadow-xl overflow-hidden"
          style={{ maxHeight: '260px', overflowY: 'auto' }}
        >
          {options.map((opt) => {
            const isSelected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm text-left transition-colors duration-150
                  ${isSelected
                    ? 'bg-charcoal-stone text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-base leading-none">{BANK_ICONS[opt] ?? '🏦'}</span>
                  <span>{opt}</span>
                </span>
                {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const STEPS = ['Address', 'Payment', 'Confirmation'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                  ${done ? 'bg-emerald-500 border-emerald-500 text-white' :
                    active ? 'bg-charcoal-stone border-charcoal-stone text-white' :
                    'bg-white border-gray-300 text-gray-400'}`}
              >
                {done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-[11px] font-medium tracking-wider uppercase ${active ? 'text-charcoal-stone' : done ? 'text-emerald-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-[2px] w-20 sm:w-32 mx-1 mb-5 transition-colors ${done ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

type PayMethod = 'upi' | 'netbanking' | 'cod' | 'card' | 'wallet';

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda'];
const WALLETS = [
  { id: 'paytm', label: 'Paytm', color: '#00BAF2' },
  { id: 'phonepe', label: 'PhonePe', color: '#5F259F' },
  { id: 'amazonpay', label: 'Amazon Pay', color: '#FF9900' },
];

function detectCardType(num: string) {
  if (/^4/.test(num)) return 'VISA';
  if (/^5[1-5]/.test(num)) return 'MASTERCARD';
  if (/^3[47]/.test(num)) return 'AMEX';
  return null;
}

export default function CheckoutPayment() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { user } = useAuth();
  const [method, setMethod] = useState<PayMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [bank, setBank] = useState('');
  const [wallet, setWallet] = useState('');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [codDisabled, setCodDisabled] = useState(false);

  useEffect(() => {
    const checkCodAvailability = async () => {
      try {
        const promises = cartItems.map(item => getProductById(item.id));
        const products = await Promise.all(promises);
        const hasNoCodProduct = products.some(p => p && p.codAvailable === false);
        setCodDisabled(hasNoCodProduct);
      } catch (err) {
        console.warn('Failed to check COD availability for cart products', err);
      }
    };
    if (cartItems.length > 0) {
      checkCodAvailability();
    }
  }, [cartItems]);

  useEffect(() => {
    if (codDisabled && method === 'cod') {
      setMethod('upi');
    }
  }, [codDisabled, method]);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const appliedCoupon = sessionStorage.getItem('appliedCoupon');

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = 0; // Backend calculates final discount at order placement
  const isFreeShipping = appliedCoupon ? isFreeShippingCoupon(appliedCoupon, []) : false;

  const shipping = isFreeShipping ? 0 : (subtotal > 5000 ? 0 : 250);
  const tax = Math.round((subtotal - discountAmount) * 0.18);
  const codFee = method === 'cod' ? 49 : 0;
  const total = (subtotal - discountAmount) + shipping + tax + codFee;

  const cardType = detectCardType(card.number.replace(/\s/g, ''));

  const formatCardNum = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (v: string) =>
    v.replace(/\D/g, '').slice(0, 4).replace(/(.{2})/, '$1/');

  const ALL_METHODS: { id: PayMethod; label: string; icon: string }[] = [
    { id: 'upi', label: 'UPI', icon: '📱' },
    { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
    { id: 'cod', label: 'Cash on Delivery', icon: '💰' },
    { id: 'card', label: 'Credit / Debit Card', icon: '🃏' },
    { id: 'wallet', label: 'Wallets', icon: '👜' },
  ];

  const METHODS = ALL_METHODS.filter(m => {
    if (m.id === 'cod') {
      if (codDisabled) return false;
      if (cartItems.some(item => item.id === '376d0483-9223-4338-be12-0861da0688cb')) {
        return false;
      }
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-[#f7f6f2] pt-28 pb-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <StepBar current={1} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ── Left: Payment methods ── */}
          <div className="flex-1 flex flex-col gap-0 bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-xl text-charcoal-stone">Choose Payment Method</h2>
            </div>

            {METHODS.map((m, idx) => (
              <div key={m.id} className={`border-b border-gray-100 last:border-b-0 ${method === m.id ? 'bg-gray-50' : 'bg-white'}`}>
                <button
                  onClick={() => setMethod(m.id)}
                  className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                    ${method === m.id ? 'border-charcoal-stone' : 'border-gray-300'}`}>
                    {method === m.id && <div className="w-2.5 h-2.5 rounded-full bg-charcoal-stone" />}
                  </div>
                  <span className="text-base">{m.icon}</span>
                  <span className={`text-sm font-medium ${method === m.id ? 'text-charcoal-stone' : 'text-gray-600'}`}>{m.label}</span>
                  {m.id === 'cod' && <span className="ml-auto text-xs text-orange-500 font-medium">+₹49 fee</span>}
                </button>

                {method === m.id && (
                  <div className="px-14 pb-5">
                    {m.id === 'upi' && (
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="yourname@upi"
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                          className="flex-1 border border-gray-300 focus:border-charcoal-stone outline-none px-3 py-2.5 text-sm rounded-none transition-colors"
                        />
                        <LoadingButton className="bg-charcoal-stone text-white text-xs font-semibold uppercase tracking-widest px-4 py-2.5 hover:bg-charcoal-stone/80 transition-colors">
                          Verify
                        </LoadingButton>
                      </div>
                    )}

                    {m.id === 'netbanking' && (
                      <CustomDropdown
                        options={BANKS}
                        value={bank}
                        onChange={setBank}
                        placeholder="Select your Bank"
                      />
                    )}

                    {m.id === 'cod' && (
                      <div className="flex items-start gap-2 text-sm text-orange-600 bg-orange-50 border border-orange-100 px-3 py-2.5 rounded">
                        <span>⚠️</span>
                        <span>Extra ₹49 COD handling fee will be added. Cash payment on delivery.</span>
                      </div>
                    )}

                    {m.id === 'card' && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">Card Number</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="0000 0000 0000 0000"
                              value={card.number}
                              onChange={e => setCard(p => ({ ...p, number: formatCardNum(e.target.value) }))}
                              maxLength={19}
                              className="w-full border border-gray-300 focus:border-charcoal-stone outline-none px-3 py-2.5 text-sm rounded-none transition-colors font-mono"
                            />
                            {cardType && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {cardType}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">Name on Card</label>
                          <input
                            type="text"
                            placeholder="Full name as on card"
                            value={card.name}
                            onChange={e => setCard(p => ({ ...p, name: e.target.value }))}
                            className="w-full border border-gray-300 focus:border-charcoal-stone outline-none px-3 py-2.5 text-sm rounded-none transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={card.expiry}
                              onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                              maxLength={5}
                              className="w-full border border-gray-300 focus:border-charcoal-stone outline-none px-3 py-2.5 text-sm rounded-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">CVV</label>
                            <input
                              type="password"
                              placeholder="•••"
                              value={card.cvv}
                              onChange={e => setCard(p => ({ ...p, cvv: e.target.value.slice(0, 4) }))}
                              className="w-full border border-gray-300 focus:border-charcoal-stone outline-none px-3 py-2.5 text-sm rounded-none transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {m.id === 'wallet' && (
                      <div className="flex flex-wrap gap-3">
                        {WALLETS.map(w => (
                          <button
                            key={w.id}
                            onClick={() => setWallet(w.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 border-2 rounded text-sm font-semibold transition-all
                              ${wallet === w.id ? 'border-charcoal-stone shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: w.color }} />
                            {w.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Pay button + trust badges */}
            <div className="px-6 py-6 border-t border-gray-100 bg-gray-50">
              <LoadingButton
                onClickAsync={async () => {
                  let paymentMethodBackend = 'UPI';
                  if (method === 'upi') paymentMethodBackend = 'UPI';
                  else if (method === 'card') paymentMethodBackend = 'CREDIT_CARD';
                  else if (method === 'cod') paymentMethodBackend = 'COD';
                  else if (method === 'netbanking') paymentMethodBackend = 'NET_BANKING';
                  else if (method === 'wallet') paymentMethodBackend = 'WALLET';

                  const addressId = localStorage.getItem('checkoutAddressId');
                  if (!addressId) {
                    alert('Please select a delivery address first.');
                    navigate('/checkout/address');
                    return;
                  }


                  try {
                    // 1. Place order on backend
                    const orderData = {
                      addressId: parseInt(addressId, 10),
                      paymentMethod: paymentMethodBackend,
                      couponCode: appliedCoupon || undefined,
                      items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity }))
                    };
                    
                    const order = await placeOrder(orderData);
                    localStorage.setItem('lastOrderId', order.id);

                    let paymentDetails = '';
                    if (method === 'upi') paymentDetails = `UPI · ${upiId || 'saved@upi'}`;
                    else if (method === 'card') paymentDetails = `Card ending in •••• ${card.number.slice(-4) || '4242'}`;
                    else if (method === 'cod') paymentDetails = 'Cash on Delivery';
                    else if (method === 'netbanking') paymentDetails = `Net Banking · ${bank || 'Bank'}`;
                    else if (method === 'wallet') paymentDetails = 'Paytm Wallet';
                    
                    localStorage.setItem('lastPaymentMethod', method);
                    localStorage.setItem('lastPaymentDetails', paymentDetails);

                    if (paymentMethodBackend === 'COD') {
                      navigate('/checkout/confirmation');
                      return;
                    }

                    // 2. Razorpay Flow
                    const rzpOrder = await createPaymentOrder(order.id);
                    
                    const options = {
                      key: 'rzp_test_dummy', // Replace with real key in production or from backend response
                      amount: rzpOrder.amount,
                      currency: rzpOrder.currency,
                      name: "Belledonne",
                      description: "Order Payment",
                      order_id: rzpOrder.id,
                      handler: async function (response: any) {
                        try {
                           await verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
                           navigate('/checkout/confirmation');
                        } catch (e) {
                           alert('Payment verification failed');
                        }
                      },
                      theme: { color: "#333333" }
                    };

                    const rzp1 = new (window as any).Razorpay(options);
                    rzp1.on('payment.failed', function (response: any) {
                        alert('Payment failed: ' + response.error.description);
                    });
                    rzp1.open();
                  } catch (e) {
                    console.error("Order processing failed", e);
                    alert('Failed to process order. Please try again.');
                  }
                }}
                className="w-full bg-charcoal-stone text-white font-semibold uppercase tracking-widest py-4 text-sm hover:bg-charcoal-stone/85 transition-colors flex items-center justify-center gap-2 mb-5"
              >
                <Lock className="w-4 h-4" />
                Pay {fmt(total)} Now
              </LoadingButton>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  100% Secure Payment
                </span>
                <span className="hidden sm:inline text-gray-200">|</span>
                <span className="flex items-center gap-2">
                  <span className="font-bold text-blue-700 tracking-tight text-[13px]">VISA</span>
                  <span className="font-bold text-red-600 tracking-tight text-[13px]">MC</span>
                  <span className="font-semibold text-[#00BAF2] tracking-tight text-[13px]">Paytm</span>
                  <span className="font-semibold text-[#5F259F] text-[13px]">PhonePe</span>
                  <span className="font-semibold text-[#FF9900] text-[13px]">AmazonPay</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-28 bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-serif text-lg text-charcoal-stone">Order Summary</h3>
                <span className="text-xs text-gray-400">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="px-6 py-4 flex flex-col gap-3 max-h-52 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Your cart is empty.</p>
                ) : cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-14 bg-[#f6f5f0] flex-shrink-0 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-charcoal-stone truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400">Size {item.size} · Qty {item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold text-charcoal-stone">{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{shipping === 0 ? <span className="text-emerald-600 font-medium">Free</span> : fmt(shipping)}</span></div>
                <div className="flex justify-between text-gray-500"><span>GST (18%)</span><span>{fmt(tax)}</span></div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium"><span>Discount ({appliedCoupon})</span><span>- {fmt(discountAmount)}</span></div>
                )}
                {codFee > 0 && <div className="flex justify-between text-orange-500"><span>COD Fee</span><span>+₹49</span></div>}
                <div className="flex justify-between font-semibold text-charcoal-stone text-base border-t border-gray-100 pt-2.5 mt-1">
                  <span className="font-serif">Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
