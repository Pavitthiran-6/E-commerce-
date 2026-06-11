import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, ChevronDown, ChevronUp, MapPin, Plus } from 'lucide-react';
import { LoadingButton } from '../../components/LoadingButton';
import { isFreeShippingCoupon } from '../../utils/couponLogic';
import { getAddresses, addAddress } from '../../services/userService';
import type { Address } from '../../services/userService';
import { Skeleton } from '../../components/common/SkeletonLoader';

const STEPS = ['Address', 'Payment', 'Confirmation'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                  ${done ? 'bg-[#0C831F] border-[#0C831F] text-white' :
                    active ? 'bg-[#0C831F] border-[#0C831F] text-white' :
                    'bg-white border-gray-200 text-gray-400'}`}
              >
                {done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-[11px] font-semibold tracking-wider uppercase ${active ? 'text-[#0C831F]' : done ? 'text-[#0C831F]' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-[2px] w-20 sm:w-32 mx-1 mb-5 transition-colors ${done ? 'bg-[#0C831F]' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function CheckoutAddress() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ fullName: '', phone: '', pincode: '', addressLine1: '', addressLine2: '', city: '', state: '' });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await getAddresses();
      setAddresses(data);
      if (data.length > 0) {
        const defaultAddr = data.find(a => a.isDefault);
        setSelected(defaultAddr ? defaultAddr.id : data[0].id);
      } else {
        setShowForm(true);
      }
    } catch (error) {
      console.error("Failed to load addresses", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!form.fullName.trim()) {
      alert("Full Name is required.");
      return;
    }
    if (!form.phone.trim()) {
      alert("Phone Number is required.");
      return;
    }
    if (!form.pincode.trim()) {
      alert("Pincode is required.");
      return;
    }
    if (!form.addressLine1.trim()) {
      alert("House / Flat No. is required.");
      return;
    }
    if (!form.city.trim()) {
      alert("City is required.");
      return;
    }
    if (!form.state.trim()) {
      alert("State is required.");
      return;
    }

    try {
      const newAddress = await addAddress(form);
      setAddresses([...addresses, newAddress]);
      setSelected(newAddress.id);
      setShowForm(false);
      setForm({ fullName: '', phone: '', pincode: '', addressLine1: '', addressLine2: '', city: '', state: '' });
    } catch (error) {
      console.error("Failed to save address", error);
      alert("Failed to save address");
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const appliedCoupon = sessionStorage.getItem('appliedCoupon');
  
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = 0; // Preview only — backend validates and applies the real discount
  const isFreeShipping = appliedCoupon ? isFreeShippingCoupon(appliedCoupon, []) : false;

  const shipping = isFreeShipping ? 0 : (subtotal > 5000 ? 0 : 250);
  const tax = Math.round((subtotal - discountAmount) * 18 / 118);
  const total = (subtotal - discountAmount) + shipping;

  return (
    <main className="min-h-screen bg-[#F8F8F8] pb-20 px-4 sm:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        <StepBar current={0} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ── Left: Address selector ── */}
          <div className="flex-1 flex flex-col gap-5">
            <h2 className="font-serif text-2xl text-charcoal-stone">Select Delivery Address</h2>

            {isLoading ? (
              [...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-sm" />
              ))
            ) : (
              addresses.map(addr => (
    <label
                  key={addr.id}
                  onClick={() => setSelected(addr.id)}
                  className={`relative flex gap-4 p-4 bg-white border-2 cursor-pointer transition-all duration-200 rounded-2xl
                    ${selected === addr.id ? 'border-[#0C831F] shadow-md' : 'border-[#E8E8E8] hover:border-[#0C831F]/40'}`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selected === addr.id}
                    onChange={() => setSelected(addr.id)}
                    className="mt-1 accent-[#0C831F] flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-charcoal-stone text-sm">{addr.fullName}</span>
                      <span className="text-xs text-gray-400">{addr.phone}</span>
                      {addr.isDefault && (
                        <span className="ml-auto bg-[#E8F5E9] text-[#0C831F] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#0C831F]/20">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{addr.addressLine1}</p>
                    {addr.addressLine2 && <p className="text-sm text-gray-600 leading-relaxed">{addr.addressLine2}</p>}
                    <p className="text-sm text-gray-600">{addr.city}, {addr.state} – {addr.pincode}</p>
                  </div>
                  <MapPin className={`w-4 h-4 mt-1 flex-shrink-0 ${selected === addr.id ? 'text-[#0C831F]' : 'text-gray-300'}`} />
                </label>
              ))
            )}

            {/* Add new address */}
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-[#0C831F] border-2 border-dashed border-[#0C831F]/30 hover:border-[#0C831F] transition-colors px-5 py-4 w-full rounded-2xl"
            >
              <Plus className="w-4 h-4" />
              Add New Address
              {showForm ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>

            {showForm && (
              <div className="bg-white border border-[#E8E8E8] rounded-2xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-5">New Delivery Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', key: 'fullName', col: '', required: true },
                    { label: 'Phone Number', key: 'phone', col: '', required: true },
                    { label: 'Pincode', key: 'pincode', col: '', required: true },
                    { label: 'House / Flat No.', key: 'addressLine1', col: '', required: true },
                    { label: 'Street / Area / Locality', key: 'addressLine2', col: 'sm:col-span-2', required: false },
                    { label: 'City', key: 'city', col: '', required: true },
                    { label: 'State', key: 'state', col: '', required: true },
                  ].map(field => (
                    <div key={field.key} className={field.col}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.required ? 'Required' : 'Optional'}
                        className="w-full border border-[#E8E8E8] rounded-xl focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/20 outline-none px-3 py-2.5 text-sm text-gray-900 transition-colors bg-white"
                      />
                    </div>
                  ))}
                </div>
                <LoadingButton
                  onClickAsync={handleSaveAddress}
                  className="mt-5 bg-[#0C831F] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#0A6B19] transition-colors"
                >
                  Save Address
                </LoadingButton>
              </div>
            )}

            <LoadingButton
              onClickAsync={async () => {
                if (!selected) {
                  alert("Please select a delivery address.");
                  return;
                }
                localStorage.setItem('checkoutAddressId', selected.toString());
                await new Promise(r => setTimeout(r, 600));
                navigate('/checkout/payment');
              }}
              className="mt-2 w-full bg-[#0C831F] text-white font-bold py-4 text-sm rounded-xl hover:bg-[#0A6B19] transition-colors flex items-center justify-center gap-2"
              disabled={!selected && !showForm}
            >
              Deliver to this Address →
            </LoadingButton>
          </div>

          {/* ── Right: Order Summary ── */}
          <OrderSummary items={cartItems} subtotal={subtotal} discountAmount={discountAmount} appliedCoupon={appliedCoupon} shipping={shipping} tax={tax} total={total} fmt={fmt} />
        </div>
      </div>
    </main>
  );
}

function OrderSummary({ items, subtotal, discountAmount, appliedCoupon, shipping, tax, total, fmt }: any) {
  return (
    <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
      <div className="sticky top-6 bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#E8E8E8]">
          <h3 className="text-base font-bold text-gray-900">Order Summary</h3>
          <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3 max-h-52 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Your cart is empty.</p>
          ) : items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-14 bg-[#F8F8F8] flex-shrink-0 overflow-hidden rounded-xl">
                <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                <p className="text-[11px] text-gray-400">Size {item.size} · Qty {item.quantity}</p>
              </div>
              <span className="text-xs font-bold text-gray-900">{fmt(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-[#E8E8E8] flex flex-col gap-2.5 text-sm">
          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Shipping</span><span className={`font-semibold ${shipping === 0 ? 'text-[#0C831F]' : ''}`}>{shipping === 0 ? 'FREE' : fmt(shipping)}</span></div>
          {appliedCoupon && (
            <div className="flex justify-between text-[#0C831F] font-semibold"><span>Coupon ({appliedCoupon})</span><span>- {fmt(discountAmount)}</span></div>
          )}
          <div className="flex flex-col gap-0.5 border-t border-[#E8E8E8] pt-2.5 mt-1">
            <div className="flex justify-between font-bold text-gray-900 text-base items-baseline">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
            <p className="text-[10px] text-[#0C831F] font-semibold text-right leading-none">
              ✓ Prices include all applicable taxes
            </p>
          </div>
        </div>

        {subtotal > 0 && subtotal < 5000 && (
          <div className="px-5 pb-4">
            <div className="bg-[#FFF8E1] border border-amber-200 rounded-xl text-xs text-amber-700 px-3 py-2">
              Add {fmt(5000 - subtotal)} more for free shipping!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
