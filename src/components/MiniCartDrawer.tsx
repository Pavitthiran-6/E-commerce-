import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../context';
import { formatPrice } from '../utils/formatPrice';

interface MiniCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCartDrawer({ isOpen, onClose }: MiniCartDrawerProps) {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className={`fixed inset-0 z-[200] ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`absolute top-0 right-0 w-full max-w-sm h-full bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#fafaf8]">
          <h2 className="font-serif text-xl md:text-2xl text-charcoal-stone">Your Cart</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-charcoal-stone">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
              <span className="text-4xl">🛒</span>
              <p>Your cart is currently empty.</p>
              <button onClick={onClose} className="text-sm font-bold border-b border-charcoal-stone text-charcoal-stone uppercase tracking-widest mt-2 hover:text-black transition-colors">
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4 border-b border-gray-100 pb-6 last:border-0">
                <div className="w-20 h-24 bg-[#f6f5f0] rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-charcoal-stone text-sm">{item.name}</h3>
                      <button onClick={() => removeFromCart(item.id, item.size, item.color)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Size: {item.size} | Color: {item.color}</p>
                    <p className="text-sm font-bold text-charcoal-stone mt-1">{formatPrice(item.price)}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-3 border border-gray-200 w-fit rounded bg-white">
                    <button 
                      onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                      className="p-1.5 hover:bg-gray-100 transition-colors text-charcoal-stone"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                      className="p-1.5 hover:bg-gray-100 transition-colors text-charcoal-stone"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-[#fafaf8]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 uppercase tracking-widest text-xs font-bold">Subtotal</span>
              <span className="font-serif text-2xl text-charcoal-stone">{formatPrice(cartTotal)}</span>
            </div>
            <p className="text-xs text-gray-500 mb-6">Taxes and shipping calculated at checkout.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                  if (!isLoggedIn) {
                    localStorage.setItem('redirectAfterLogin', '/checkout/address');
                    onClose();
                    navigate('/auth/login');
                  } else {
                    onClose();
                    navigate('/checkout/address');
                  }
                }}
                className="w-full bg-primary text-white font-medium py-3 rounded-lg text-center hover:bg-charcoal-stone transition-colors"
              >
                Proceed to Checkout
              </button>
              <Link 
                to="/cart" 
                onClick={onClose}
                className="w-full border border-gray-300 text-charcoal-stone font-medium py-3 rounded-lg text-center hover:border-primary hover:text-primary transition-colors bg-white"
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
