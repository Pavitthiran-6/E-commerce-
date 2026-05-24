import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingButton } from '../components/LoadingButton';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const navigate = useNavigate();
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };



  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 250;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

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
                        onClick={() => removeFromCart(item.id)}
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
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant/30 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
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
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="font-serif text-lg">Total</span>
                <span className="font-serif text-2xl text-primary">{formatPrice(total)}</span>
              </div>

              <LoadingButton
                onClickAsync={async () => {
                  await new Promise(r => setTimeout(r, 600));
                  navigate('/checkout/address');
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
    </main>
  );
}
