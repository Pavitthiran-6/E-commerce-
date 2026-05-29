import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { SparkleHeart } from '../components/icons/SparkleHeart';
import { useToast } from '../context/ToastContext';

export default function Wishlist() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'string' 
        ? parseInt(product.price.replace(/[^0-9]/g, '')) 
        : product.price,
      image: product.image,
      quantity: 1,
      size: '8',
      color: 'Default'
    });
    showToast(`${product.name} added to cart!`, 'success', { label: 'View Cart', href: '/cart' });
  };

  if (wishlistItems.length === 0) {
    return (
      <main className="w-full min-h-[80vh] flex flex-col items-center justify-center pt-32 pb-24 px-6 bg-surface">
        <div className="text-center max-w-md flex flex-col items-center">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-300">
            <SparkleHeart className="w-10 h-10" filled />
          </div>
          <h1 className="font-headline-display text-4xl text-primary mb-4">Your Wishlist is Empty</h1>
          <p className="font-body-md text-on-surface-variant mb-8">
            Save items you love to your wishlist and easily find them later!
          </p>
          <Link 
            to="/collection"
            className="inline-flex items-center gap-2 bg-primary text-white font-button uppercase tracking-[0.1em] px-8 py-4 hover:bg-primary/90 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen pt-32 pb-24 px-6 md:px-12 xl:px-24 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <h1 className="font-headline-display text-4xl text-primary tracking-wide">My Wishlist</h1>
          <span className="text-sm font-medium text-on-surface-variant">{wishlistItems.length} items</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlistItems.map((product) => (
            <div key={product.id} className="group/card block cursor-pointer flex flex-col h-full">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f6f5f0] mb-4">
                <Link to={`/product/${product.id}`} className="w-full h-full block">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="object-cover object-center w-full h-full transition-transform ease-out duration-500 group-hover/card:scale-105 group-hover/card:opacity-90 mix-blend-multiply"
                  />
                </Link>
                <div className="absolute inset-0 bg-surface-tint/0 group-hover/card:bg-surface-tint/5 pointer-events-none transition-colors duration-400"></div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFromWishlist(product.id);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-charcoal-stone hover:scale-110 transition-transform z-10"
                  title="Remove from wishlist"
                >
                  <SparkleHeart filled className="w-6 h-6 text-red-500" />
                </button>
              </div>
              <div className="flex flex-col flex-grow">
                <div className="flex justify-between items-center w-full">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-serif text-[17px] text-charcoal-stone hover:opacity-70 transition-opacity">{product.name}</h3>
                  </Link>
                  <span className="text-xl font-bold tracking-wider text-charcoal-stone">{typeof product.price === 'number' ? `₹${product.price.toLocaleString('en-IN')}` : product.price}</span>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  className="mt-6 w-full flex items-center justify-center gap-2 border border-charcoal-stone/30 text-charcoal-stone px-4 py-3 text-xs font-medium uppercase tracking-widest hover:border-charcoal-stone transition-colors"
                >
                  <ShoppingBag className="w-3 h-3" />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
