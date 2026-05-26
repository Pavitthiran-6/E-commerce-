import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';
import { SparkleHeart } from '../components/icons/SparkleHeart';
import { useWishlist } from '../context/WishlistContext';

export default function NewArrivals() {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleWishlistToggle = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.priceNum,
        image: product.image
      });
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Mocking drop dates for dummy data
  const augmentedProducts = products.map((p, index) => {
    let dropCategory = 'This Month';
    let isNew = false;
    
    if (index % 5 === 0) {
      dropCategory = 'This Week';
      isNew = true;
    } else if (index % 3 === 0) {
      dropCategory = 'Last Week';
    }

    return { ...p, dropCategory, isNew };
  });

  const thisWeek = augmentedProducts.filter(p => p.dropCategory === 'This Week');
  const lastWeek = augmentedProducts.filter(p => p.dropCategory === 'Last Week');
  const thisMonth = augmentedProducts.filter(p => p.dropCategory === 'This Month').slice(0, 8); // Just show a few

  const ProductRow = ({ title, items }: { title: string, items: any[] }) => (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
        <h2 className="font-serif text-3xl text-charcoal-stone">{title}</h2>
        <span className="text-xs uppercase tracking-widest font-bold text-gray-400">{items.length} Items</span>
      </div>
      
      {/* Horizontal Scroll Area */}
      <div className="flex overflow-x-auto gap-6 pb-8 snap-x no-scrollbar">
        {items.map((product) => (
          <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer flex flex-col min-w-[260px] md:min-w-[300px] snap-start">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#f6f5f0] flex items-center justify-center mb-4 rounded">
              
              {product.isNew && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-md">
                    NEW
                  </span>
                </div>
              )}

              <img
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform ease-out duration-500 group-hover:scale-105 group-hover:opacity-90 mix-blend-multiply"
                src={product.image}
              />
              
              <button 
                onClick={(e) => handleWishlistToggle(e, product)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-charcoal-stone hover:scale-110 transition-transform z-10 bg-white/80 rounded-full backdrop-blur-sm"
              >
                <SparkleHeart 
                  filled={isInWishlist(product.id)}
                  className={`w-4 h-4 ${isInWishlist(product.id) ? 'text-red-500' : 'text-black'}`} 
                />
              </button>
            </div>
            <div className="flex flex-col">
              <h3 className="font-serif text-[16px] text-charcoal-stone line-clamp-1">{product.name}</h3>
              <span className="text-sm font-bold tracking-widest text-charcoal-stone mt-1">{typeof product.price === 'number' ? `₹${product.price.toLocaleString('en-IN')}` : product.price}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-24 font-body-md pt-12">
      
      {/* Hero Section */}
      <section className="px-6 md:px-12 text-center mb-20 max-w-4xl mx-auto">
        <div className="inline-block border border-charcoal-stone px-4 py-1 uppercase tracking-widest text-[10px] font-bold mb-6 rounded-full">
          {currentMonthYear} Collection
        </div>
        <h1 className="font-serif text-5xl md:text-6xl text-charcoal-stone mb-6">New Arrivals</h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Fresh drops every week — be the first to shop our latest designs and exclusive limited-edition pieces before they're gone.
        </p>
      </section>

      <div className="max-w-container mx-auto px-6 md:px-margin-edge">
        <ProductRow title="This Week" items={thisWeek} />
        <ProductRow title="Last Week" items={lastWeek} />
        <ProductRow title="Earlier This Month" items={thisMonth} />

        {/* Notify Me Section */}
        <section className="bg-charcoal-stone text-white rounded-2xl p-8 md:p-16 text-center mt-8 shadow-xl">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">Want to know when new products drop?</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Join our exclusive list to get early access to our weekly drops and limited collections.
          </p>
          
          {isSubscribed ? (
            <div className="bg-green-500/20 text-green-400 border border-green-500 rounded p-4 max-w-md mx-auto flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">You are on the list! We will email you on every new drop.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address" 
                className="flex-1 bg-transparent border border-gray-600 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
              />
              <button type="submit" className="bg-white text-charcoal-stone font-bold uppercase tracking-widest text-xs px-8 py-3 rounded hover:bg-gray-200 transition-colors">
                Notify Me
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
