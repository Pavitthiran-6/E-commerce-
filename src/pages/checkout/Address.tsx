import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { CheckCircle2, ChevronDown, ChevronUp, MapPin, Plus } from 'lucide-react';
import { LoadingButton } from '../../components/LoadingButton';

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

const SAVED_ADDRESSES = [
  {
    id: 'addr1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    line1: 'Flat 4B, Sunrise Apartments, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    isDefault: true,
  },
  {
    id: 'addr2',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    line1: '12, MG Road, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    isDefault: false,
  },
];

export default function CheckoutAddress() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const [selected, setSelected] = useState('addr1');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', pincode: '', line1: '', street: '', city: '', state: '' });

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 5000 ? 0 : 250;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  return (
    <main className="min-h-screen bg-[#f7f6f2] pt-28 pb-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <StepBar current={0} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ── Left: Address selector ── */}
          <div className="flex-1 flex flex-col gap-5">
            <h2 className="font-serif text-2xl text-charcoal-stone">Select Delivery Address</h2>

            {/* Saved address cards */}
            {SAVED_ADDRESSES.map(addr => (
              <label
                key={addr.id}
                onClick={() => setSelected(addr.id)}
                className={`relative flex gap-4 p-5 bg-white border-2 cursor-pointer transition-all duration-200 rounded-sm
                  ${selected === addr.id ? 'border-charcoal-stone shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selected === addr.id}
                  onChange={() => setSelected(addr.id)}
                  className="mt-1 accent-charcoal-stone flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-charcoal-stone text-sm">{addr.name}</span>
                    <span className="text-xs text-gray-400">{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="ml-auto bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-200">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{addr.line1}</p>
                  <p className="text-sm text-gray-600">{addr.city}, {addr.state} – {addr.pincode}</p>
                </div>
                <MapPin className={`w-4 h-4 mt-1 flex-shrink-0 ${selected === addr.id ? 'text-charcoal-stone' : 'text-gray-300'}`} />
              </label>
            ))}

            {/* Add new address */}
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 text-sm font-medium text-charcoal-stone border-2 border-dashed border-gray-300 hover:border-charcoal-stone transition-colors px-5 py-4 w-full rounded-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Address
              {showForm ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>

            {showForm && (
              <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="font-serif text-lg text-charcoal-stone mb-5">New Delivery Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', key: 'name', col: '' },
                    { label: 'Phone Number', key: 'phone', col: '' },
                    { label: 'Pincode', key: 'pincode', col: '' },
                    { label: 'House / Flat No.', key: 'line1', col: '' },
                    { label: 'Street / Area / Locality', key: 'street', col: 'sm:col-span-2' },
                    { label: 'City', key: 'city', col: '' },
                    { label: 'State', key: 'state', col: '' },
                  ].map(field => (
                    <div key={field.key} className={field.col}>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5">{field.label}</label>
                      <input
                        type="text"
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full border border-gray-300 focus:border-charcoal-stone outline-none px-3 py-2.5 text-sm text-charcoal-stone transition-colors bg-white rounded-none"
                      />
                    </div>
                  ))}
                </div>
                <LoadingButton
                  onClick={() => setShowForm(false)}
                  className="mt-5 bg-charcoal-stone text-white text-xs font-semibold uppercase tracking-widest px-6 py-3 hover:bg-charcoal-stone/80 transition-colors"
                >
                  Save & Deliver Here
                </LoadingButton>
              </div>
            )}

            <LoadingButton
              onClickAsync={async () => {
                await new Promise(r => setTimeout(r, 600));
                navigate('/checkout/payment');
              }}
              className="mt-2 w-full bg-charcoal-stone text-white font-semibold uppercase tracking-widest py-4 text-sm hover:bg-charcoal-stone/85 transition-colors flex items-center justify-center gap-2"
            >
              Deliver to this Address
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </LoadingButton>
          </div>

          {/* ── Right: Order Summary ── */}
          <OrderSummary items={cartItems} subtotal={subtotal} shipping={shipping} tax={tax} total={total} fmt={fmt} />
        </div>
      </div>
    </main>
  );
}

function OrderSummary({ items, subtotal, shipping, tax, total, fmt }: any) {
  return (
    <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
      <div className="sticky top-28 bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-serif text-lg text-charcoal-stone">Order Summary</h3>
          <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="px-6 py-4 flex flex-col gap-3 max-h-52 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Your cart is empty.</p>
          ) : items.map((item: any) => (
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
          <div className="flex justify-between font-semibold text-charcoal-stone text-base border-t border-gray-100 pt-2.5 mt-1">
            <span className="font-serif">Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>

        {subtotal > 0 && subtotal < 5000 && (
          <div className="px-6 pb-4">
            <div className="bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 px-3 py-2">
              Add {fmt(5000 - subtotal)} more for free shipping!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
