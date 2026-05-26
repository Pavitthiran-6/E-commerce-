import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';
import { SparkleHeart } from '../components/icons/SparkleHeart';
import { useWishlist } from '../context/WishlistContext';

export default function Sale() {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

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

  const [activeTab, setActiveTab] = useState('All Deals');
  
  // Countdown Timer Logic
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const countDownDate = new Date().getTime() + (7 * 24 * 60 * 60 * 1000); // 7 days from now

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = countDownDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Augment dummy products with sale data
  const saleProducts = products.map((p, index) => {
    // Generate some fake discounts
    const discountPercent = 20 + (index % 5) * 10; // 20%, 30%, 40%, 50%, 60%
    const originalPriceNum = Math.round(p.price / (1 - discountPercent / 100));
    
    return {
      ...p,
      originalPrice: `₹${originalPriceNum.toLocaleString()}`,
      discountPercent,
      isLowStock: index % 3 === 0 // Every 3rd item is low stock
    };
  });

  const filteredProducts = saleProducts.filter(p => {
    if (activeTab === 'All Deals') return true;
    if (activeTab === 'Men') return p.gender === 'Men';
    if (activeTab === 'Women') return p.gender === 'Women';
    if (activeTab === 'Tech & Kitchen') return p.category === 'Audio' || p.category === 'Kitchen Items';
    if (activeTab === 'Under ₹999') return p.price < 999;
    if (activeTab === 'Under ₹1999') return p.price < 1999;
    return true;
  });

  // Deal of the Day (just taking the first product as an example)
  const dealOfTheDay = saleProducts[0];

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-24 font-body-md pt-8">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-16 px-6 md:px-12 text-center mt-4">
        <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 tracking-tight">SALE IS LIVE 🔥</h1>
        <p className="text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto opacity-90">
          Limited time deals — up to 70% off on selected products!
        </p>
        
        {/* Countdown */}
        <div className="flex justify-center gap-3 md:gap-6">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Minutes', value: timeLeft.minutes },
            { label: 'Seconds', value: timeLeft.seconds }
          ].map(time => (
            <div key={time.label} className="flex flex-col items-center">
              <div className="bg-white text-red-600 font-bold text-2xl md:text-4xl w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-lg shadow-lg mb-2">
                {time.value.toString().padStart(2, '0')}
              </div>
              <span className="text-xs uppercase tracking-widest font-bold opacity-80">{time.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-container mx-auto px-6 md:px-margin-edge mt-16">
        
        {/* Deal of the Day Banner */}
        {dealOfTheDay && (
          <div className="bg-white border-2 border-red-500 rounded-2xl p-6 md:p-10 mb-16 flex flex-col md:flex-row items-center gap-8 md:gap-16 relative overflow-hidden shadow-[0_8px_30px_rgb(239,68,68,0.15)] hover:shadow-[0_8px_40px_rgb(239,68,68,0.25)] transition-shadow">
            <div className="absolute top-0 right-0 bg-red-500 text-white font-bold px-6 py-2 rounded-bl-2xl z-10 tracking-widest text-sm uppercase">
              Deal of the Day
            </div>
            <div className="w-full md:w-1/3 aspect-square bg-gray-50 rounded-xl overflow-hidden relative">
              <img src={dealOfTheDay.image} alt={dealOfTheDay.name} className="w-full h-full object-cover mix-blend-multiply" />
            </div>
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="font-serif text-3xl md:text-4xl text-charcoal-stone mb-2">{dealOfTheDay.name}</h3>
              <p className="text-gray-500 mb-6 max-w-md">{dealOfTheDay.description}</p>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-gray-400 line-through text-xl">{dealOfTheDay.originalPrice}</span>
                <span className="text-red-600 font-bold text-4xl">{dealOfTheDay.price}</span>
                <span className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded text-sm tracking-wider">
                  {dealOfTheDay.discountPercent}% OFF
                </span>
              </div>
              <Link to={`/product/${dealOfTheDay.id}`} className="bg-red-600 text-white px-10 py-4 uppercase tracking-widest text-sm font-bold hover:bg-red-700 transition-colors rounded">
                Claim Deal Now
              </Link>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-4 mb-12 pb-4 border-b border-gray-200">
          {['All Deals', 'Men', 'Women', 'Tech & Kitchen', 'Under ₹999', 'Under ₹1999'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold tracking-wider transition-all ${
                activeTab === tab 
                  ? 'bg-charcoal-stone text-white shadow-md' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-charcoal-stone hover:text-charcoal-stone'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {filteredProducts.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f6f5f0] flex items-center justify-center mb-4 rounded-lg">
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                  <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center justify-center shadow-md">
                    -{product.discountPercent}%
                  </span>
                  {product.isLowStock && (
                    <span className="bg-orange-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-md">
                      Only 3 Left!
                    </span>
                  )}
                </div>

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
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-red-600 font-bold text-base">{typeof product.price === 'number' ? `₹${product.price.toLocaleString('en-IN')}` : product.price}</span>
                  <span className="text-gray-400 line-through text-xs">{product.originalPrice}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
