import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SparkleHeart } from '../components/icons/SparkleHeart';
import { useWishlist } from '../context/WishlistContext';
import { getSaleSettings, getDealOfTheDay, getSaleProducts, type SaleSettingsData } from '../services/productService';
import type { Product } from '../types/product';
import BlinkitProductCard from '../components/blinkit/BlinkitProductCard';

export default function Sale() {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [settings, setSettings] = useState<SaleSettingsData | null>(null);
  const [dealProduct, setDealProduct] = useState<Product | null>(null);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Deals');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Fetch everything on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [settingsData, dealData, productsData] = await Promise.all([
          getSaleSettings().catch(() => null),
          getDealOfTheDay().catch(() => null),
          getSaleProducts().catch(() => []),
        ]);
        setSettings(settingsData);
        setDealProduct(dealData);
        setSaleProducts(productsData);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Countdown timer — driven by settings.saleEndDateTime
  useEffect(() => {
    const endDateStr = settings?.saleEndDateTime;
    const countDownDate = endDateStr
      ? new Date(endDateStr).getTime()
      : new Date().getTime() + (7 * 24 * 60 * 60 * 1000);

    const tick = () => {
      const now = new Date().getTime();
      const distance = countDownDate - now;
      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [settings?.saleEndDateTime]);

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: typeof product.price === 'number' ? product.price : 0,
        image: product.image || (product.images && product.images[0]) || '',
      });
    }
  };

  // Derived deal product to handle direct response & settings enrichment fallback
  const activeDealProduct = dealProduct || (settings?.dealOfTheDayProductId ? {
    id: settings.dealOfTheDayProductId,
    name: settings.dealProductName || '',
    brand: '',
    category: '',
    subCategory: '',
    price: settings.dealProductPrice || 0,
    originalPrice: settings.dealProductOriginalPrice || 0,
    discount: settings.dealProductDiscountPercentage || 0,
    discountPercentage: settings.dealProductDiscountPercentage || 0,
    images: settings.dealProductImage ? [settings.dealProductImage] : [],
    image: settings.dealProductImage || '',
    colors: [],
    sizes: [],
    description: settings.dealProductDescription || '',
    tags: [],
    rating: 5,
    reviewCount: 0,
    inStock: true,
    isNew: false,
    isBestseller: false,
    createdAt: ''
  } as Product : null);

  const tabs = ['All Deals', 'Men', 'Women', 'Tech & Kitchen', 'Under ₹999', 'Under ₹1999'];

  const filteredProducts = saleProducts.filter(p => {
    const catName = ((p as any).categoryName || p.category || '').toLowerCase();
    if (activeTab === 'All Deals') return true;
    if (activeTab === 'Men') return catName.includes('men') && !catName.includes('women');
    if (activeTab === 'Women') return catName.includes('women');
    if (activeTab === 'Tech & Kitchen') return catName.includes('tech') || catName.includes('kitchen') || catName.includes('electronics') || catName.includes('audio');
    const price = typeof p.price === 'number' ? p.price : 0;
    if (activeTab === 'Under ₹999') return price < 999;
    if (activeTab === 'Under ₹1999') return price < 1999;
    return true;
  });

  // Sale inactive — show placeholder
  if (!isLoading && settings && settings.isActive === false) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center pt-24 pb-24">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-6">🛍️</div>
          <h1 className="font-serif text-4xl text-charcoal-stone mb-4">No Active Sale</h1>
          <p className="text-gray-500 mb-8">Check back soon for our next big sale event!</p>
          <Link to="/collection" className="inline-block bg-charcoal-stone text-white px-8 py-3 rounded text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  const saleTitle = settings?.saleTitle || 'SALE IS LIVE 🔥';
  const saleSubtitle = settings?.saleSubtitle || 'Limited time deals — up to 70% off on selected products!';

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-24 font-body-md pt-8">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-16 px-6 md:px-12 text-center mt-4">
        <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 tracking-tight">{saleTitle}</h1>
        <p className="text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto opacity-90">
          {saleSubtitle}
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
        {activeDealProduct && (
          <div className="bg-white border-2 border-red-500 rounded-2xl p-6 md:p-10 mb-16 flex flex-col md:flex-row items-center gap-8 md:gap-16 relative overflow-hidden shadow-[0_8px_30px_rgb(239,68,68,0.15)] hover:shadow-[0_8px_40px_rgb(239,68,68,0.25)] transition-shadow">
            <div className="absolute top-0 right-0 bg-red-500 text-white font-bold px-6 py-2 rounded-bl-2xl z-10 tracking-widest text-sm uppercase">
              Deal of the Day
            </div>
            <div className="w-full md:w-1/3 aspect-square bg-gray-50 rounded-xl overflow-hidden relative">
              <img
                src={activeDealProduct.image || (activeDealProduct.images && activeDealProduct.images[0]) || ''}
                alt={activeDealProduct.name}
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="font-serif text-3xl md:text-4xl text-charcoal-stone mb-2">{activeDealProduct.name}</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                {(activeDealProduct as any).shortDescription || activeDealProduct.description}
              </p>
              <div className="flex items-center gap-4 mb-8">
                {activeDealProduct.originalPrice && (activeDealProduct.originalPrice as any) > 0 && (
                  <span className="text-gray-400 line-through text-xl">
                    ₹{typeof activeDealProduct.originalPrice === 'number'
                      ? activeDealProduct.originalPrice.toLocaleString('en-IN')
                      : (activeDealProduct as any).originalPrice}
                  </span>
                )}
                <span className="text-red-600 font-bold text-4xl">
                  ₹{typeof activeDealProduct.price === 'number'
                    ? activeDealProduct.price.toLocaleString('en-IN')
                    : activeDealProduct.price}
                </span>
                {(activeDealProduct.discountPercentage || (activeDealProduct as any).discount) > 0 && (
                  <span className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded text-sm tracking-wider">
                    {activeDealProduct.discountPercentage || (activeDealProduct as any).discount}% OFF
                  </span>
                )}
              </div>
              <Link
                to={`/product/${activeDealProduct.id}`}
                className="bg-red-600 text-white px-10 py-4 uppercase tracking-widest text-sm font-bold hover:bg-red-700 transition-colors rounded"
              >
                Claim Deal Now
              </Link>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-4 mb-12 pb-4 border-b border-gray-200">
          {tabs.map(tab => (
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

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🛍️</div>
            <p className="text-gray-500 font-medium">No sale products found in this category.</p>
            <button
              onClick={() => setActiveTab('All Deals')}
              className="mt-4 text-sm text-red-600 underline hover:no-underline"
            >
              View All Deals
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => (
              <BlinkitProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
