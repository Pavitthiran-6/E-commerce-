import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SparkleHeart } from '../components/icons/SparkleHeart';
import { useWishlist } from '../context/WishlistContext';
import { getAllProducts, getFeaturedProducts, getApparelHighlights, getTechHome } from '../services/productService';
import { getFeaturedCoupons, type Coupon } from '../services/couponService';
import type { Product } from '../types/product';
import { ProductCardSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';
import { useNetworkRecovery } from '../hooks/useNetworkRecovery';

export default function Home() {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [apparelHighlights, setApparelHighlights] = useState<Product[]>([]);
  const [techHome, setTechHome] = useState<Product[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [featuredCoupons, setFeaturedCoupons] = useState<Coupon[]>([]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // true while auto-recovering after a network interruption
  const [isRecovering, setIsRecovering] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const hasFetchedOnce = useRef(false);

  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError('');
    }
    try {
      const data = await getAllProducts();
      setProducts(data);
      // Successfully loaded — clear any previous error
      setError('');
    } catch (err) {
      // Only show the error screen if we have no data to fall back to
      if (products.length === 0) {
        setError('Failed to load products');
      }
    } finally {
      setIsLoading(false);
      setIsRecovering(false);
    }
  }, [products.length]);

  const fetchFeatured = useCallback(async () => {
    try {
      const data = await getFeaturedProducts();
      setFeaturedProducts(data);
    } catch (err) {
      console.error('Failed to load featured products', err);
    }
  }, []);

  const fetchHighlightsAndTech = useCallback(async () => {
    try {
      const [apparelData, techData] = await Promise.all([
        getApparelHighlights(),
        getTechHome()
      ]);
      setApparelHighlights(apparelData);
      setTechHome(techData);
    } catch (err) {
      console.error('Failed to load highlight products', err);
    }
  }, []);

  const fetchFeaturedCoupons = useCallback(async () => {
    try {
      const data = await getFeaturedCoupons();
      setFeaturedCoupons(data || []);
    } catch (err) {
      console.error('Failed to load featured coupons', err);
    }
  }, []);

  useEffect(() => {
    hasFetchedOnce.current = true;
    fetchProducts();
    fetchFeatured();
    fetchHighlightsAndTech();
    fetchFeaturedCoupons();
  }, []);

  // ── Network / sleep-wake recovery ───────────────────────────────────────────
  // When the browser comes back online or the user returns from sleep, silently
  // refetch stale data instead of leaving a permanent error state.
  useNetworkRecovery(useCallback(() => {
    if (!hasFetchedOnce.current) return;
    setIsRecovering(true);
    // Silent fetch — keeps existing stale data visible while refetching
    fetchProducts(true);
    fetchFeatured();
    fetchHighlightsAndTech();
    fetchFeaturedCoupons();
  }, [fetchProducts, fetchFeatured, fetchHighlightsAndTech, fetchFeaturedCoupons]));

  const defaultSlides = [
    {
      title: "Up To 80% Off",
      subtitle: "Vacay Mode",
      badge: "+ Payday",
      tagline: "Your Passport to Style",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200",
      link: "/collection",
      buttonText: "Save Now",
      isDefault: true
    }
  ];

  const slides = [
    ...defaultSlides,
    ...featuredProducts.map(p => ({
      title: p.name,
      subtitle: p.brand || "BELLEDONNE",
      badge: p.discountPercentage && p.discountPercentage > 0 ? `${p.discountPercentage}% OFF` : "HOT DEAL",
      tagline: p.shortDescription || p.description || "Exclusive Collection",
      image: p.image || (p.images && p.images[0]) || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200",
      link: `/product/${p.id}`,
      buttonText: "Shop Now",
      isDefault: false
    }))
  ];

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleWishlistToggle = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: typeof product.price === 'string' ? parseInt(product.price.replace(/[^0-9]/g, '')) : product.price,
        image: product.image
      });
    }
  };

  // Show the blocking error screen ONLY when we have absolutely no data.
  // If we have stale products cached, keep showing them with a small banner.
  if (error && products.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchProducts()} className="mt-24 mx-4" />;
  }

  return (
    <div className="bg-parchment text-charcoal-stone font-body-lg antialiased selection:bg-muted-gold selection:text-white">
      {/* Reconnecting / recovering banner — non-blocking */}
      {isRecovering && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium py-1.5 px-4">
          <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Reconnecting…
        </div>
      )}
      {/* Hero Section */}
      <section className="max-w-[1400px] mx-auto px-6 pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch lg:h-[550px]">
          
          {/* Left Column: 3 small promo banners */}
          <div className="grid grid-rows-3 gap-4 lg:col-span-1 h-full">
            {/* Banner 1: 3-Day Delivery */}
            <Link to="/cart" className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm block">
              <img alt="3-Day Delivery" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600" loading="eager" decoding="async" />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-300" />
              <div className="absolute inset-y-0 left-0 w-full flex items-center z-10">
                <div className="w-[85%] bg-gradient-to-r from-black/90 via-black/70 to-transparent py-3 pl-5 pr-8 transition-transform duration-300 group-hover:translate-x-1">
                  <span className="text-white font-sans font-extrabold text-[15px] sm:text-base lg:text-[13px] xl:text-[15px] tracking-wide select-none drop-shadow-sm">
                    3-Day Delivery
                  </span>
                </div>
              </div>
            </Link>

            {/* Banner 2: Weekly Sale */}
            <Link to="/sale" className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm block">
              <img alt="Weekly Sale" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-300" />
              <div className="absolute inset-y-0 left-0 w-full flex items-center z-10">
                <div className="w-[85%] bg-gradient-to-r from-black/90 via-black/70 to-transparent py-3 pl-5 pr-8 transition-transform duration-300 group-hover:translate-x-1">
                  <span className="text-white font-sans font-extrabold text-[15px] sm:text-base lg:text-[13px] xl:text-[15px] tracking-wide select-none drop-shadow-sm">
                    Weekly Sale
                  </span>
                </div>
              </div>
            </Link>

            {/* Banner 3: Belledonne Club */}
            <Link to="/collection" className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm block">
              <img alt="Belledonne Club" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=600" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-300" />
              <div className="absolute inset-y-0 left-0 w-full flex items-center z-10">
                <div className="w-[85%] bg-gradient-to-r from-black/90 via-black/70 to-transparent py-3 pl-5 pr-8 transition-transform duration-300 group-hover:translate-x-1">
                  <span className="text-white font-sans font-extrabold text-[15px] sm:text-base lg:text-[13px] xl:text-[15px] tracking-wide select-none drop-shadow-sm uppercase">
                    Belledonne Club
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center Column: Swiper Promotional Banner */}
          <div className="relative lg:col-span-3 rounded-2xl overflow-hidden h-[380px] lg:h-[460px] self-center group shadow-md bg-neutral-900">
            {slides.map((slide, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
              >
                {/* Background Image and Overlay Link */}
                <Link to="/sale" className="absolute inset-0 z-0 block">
                  <img 
                    alt={slide.title} 
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-10000 ease-out group-hover:scale-102" 
                    src={slide.image}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/55" />
                </Link>
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6 py-12 pointer-events-none">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-semibold tracking-[0.2em] uppercase text-white drop-shadow-sm">{slide.subtitle}</span>
                    <span className="inline-block border-[2.5px] border-yellow-300 rounded-[60%_40%_50%_45%] -rotate-3 px-3 py-0.5 text-yellow-300 font-extrabold text-xs tracking-wider uppercase shadow-sm">
                      {slide.badge}
                    </span>
                  </div>
                  
                  {slide.isDefault ? (
                    <>
                      <h2 className="text-sm uppercase tracking-[0.4em] font-medium text-white/95 mb-2 drop-shadow-sm">Up To</h2>
                      <div className="flex items-baseline justify-center mb-4">
                        <span className="text-7xl lg:text-8xl font-black tracking-tighter text-green-200 drop-shadow-lg select-none">80%</span>
                        <span className="text-xl font-bold uppercase tracking-widest text-green-200 ml-2 drop-shadow-md">Off</span>
                      </div>
                    </>
                  ) : (
                    <h2 className="text-3xl lg:text-5xl font-serif italic mb-4 tracking-wide max-w-xl drop-shadow-md leading-tight">
                      {slide.title}
                    </h2>
                  )}
                  
                  <p className="text-xs lg:text-sm tracking-[0.2em] font-light text-white/90 mb-8 max-w-md uppercase drop-shadow-sm">
                    {slide.tagline}
                  </p>
                  
                  <Link to={slide.link} className="inline-block bg-white text-charcoal-stone font-semibold text-xs tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-neutral-100 transition-colors duration-300 shadow-lg rounded-sm pointer-events-auto">
                    {slide.buttonText}
                  </Link>
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/25 rounded-full text-white backdrop-blur-sm transition-all border border-white/10 hover:scale-105"
                  aria-label="Previous slide"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button 
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/25 rounded-full text-white backdrop-blur-sm transition-all border border-white/10 hover:scale-105"
                  aria-label="Next slide"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                {/* Pagination Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/40'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Column: 3 small cool-toned/darker banners */}
          <div className="grid grid-rows-3 gap-4 lg:col-span-1 h-full">
            <Link to="/collection?promo=clearance" className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm block">
              <img alt="Clearance" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/30 transition-colors duration-300" />
              <div className="absolute inset-y-0 right-0 w-full flex items-center justify-end z-10">
                <div className="w-[85%] bg-gradient-to-l from-black/90 via-black/70 to-transparent py-3 pr-5 pl-8 transition-transform duration-300 group-hover:-translate-x-1 text-right">
                  <span className="text-white font-sans font-extrabold text-[15px] sm:text-base lg:text-[13px] xl:text-[15px] tracking-wide select-none drop-shadow-sm uppercase">
                    Clearance
                  </span>
                </div>
              </div>
            </Link>
            <Link to="/collection?promo=flash-deals" className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm block">
              <img alt="Flash Deals" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/30 transition-colors duration-300" />
              <div className="absolute inset-y-0 right-0 w-full flex items-center justify-end z-10">
                <div className="w-[85%] bg-gradient-to-l from-black/90 via-black/70 to-transparent py-3 pr-5 pl-8 transition-transform duration-300 group-hover:-translate-x-1 text-right">
                  <span className="text-white font-sans font-extrabold text-[15px] sm:text-base lg:text-[13px] xl:text-[15px] tracking-wide select-none drop-shadow-sm uppercase">
                    Flash Deals
                  </span>
                </div>
              </div>
            </Link>
            <Link to="/collection?promo=last-chance" className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm block">
              <img alt="Last Chance" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/30 transition-colors duration-300" />
              <div className="absolute inset-y-0 right-0 w-full flex items-center justify-end z-10">
                <div className="w-[85%] bg-gradient-to-l from-black/90 via-black/70 to-transparent py-3 pr-5 pl-8 transition-transform duration-300 group-hover:-translate-x-1 text-right">
                  <span className="text-white font-sans font-extrabold text-[15px] sm:text-base lg:text-[13px] xl:text-[15px] tracking-wide select-none drop-shadow-sm uppercase">
                    Last Chance
                  </span>
                </div>
              </div>
            </Link>
          </div>

        </div>
      </section>

      {/* Best-sellers Carousel */}
      <section className="max-w-container mx-auto px-margin-edge py-section-gap overflow-hidden">
        <div className="flex flex-col items-center justify-center text-center mb-stack-lg">
          <h2 className="text-lg font-bold text-charcoal-stone mb-1.5">Our best-sellers</h2>
          <Link className="text-xs font-medium border-b border-charcoal-stone pb-0.5 hover:opacity-60 transition-opacity" to="/collection">View all</Link>
        </div>
        
        {/* Carousel Container */}
        <div className="relative">
          <div 
            id="bestsellers-scroll"
            className="flex gap-gutter overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onScroll={(e) => {
              const el = e.currentTarget;
              const scrollLeft = el.scrollLeft;
              const maxScrollLeft = el.scrollWidth - el.clientWidth;
              
              // Map the scroll position proportionally from 0 to 9 (for 10 items)
              let index = 0;
              if (maxScrollLeft > 0) {
                const scrollPercentage = scrollLeft / maxScrollLeft;
                index = Math.round(scrollPercentage * 9);
              }
              
              const pagination = document.getElementById('bestseller-pagination');
              if (pagination) {
                pagination.innerText = `${index + 1}/10`;
              }
            }}
          >
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[85vw] sm:min-w-[45vw] md:min-w-[22%] snap-start">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : (
              products.slice(0, 10).map((item) => (
                <Link to={`/product/${item.id}`} key={item.id} className="group block cursor-pointer min-w-[85vw] sm:min-w-[45vw] md:min-w-[22%] snap-start relative">
                  <div className="aspect-[3/4] bg-warm-sand mb-3 overflow-hidden relative">
                    <img alt={item.name} className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105" src={item.image} loading="lazy" decoding="async" />
                    <button 
                      onClick={(e) => handleWishlistToggle(e, item)}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-charcoal-stone hover:scale-110 transition-transform z-10"
                      title={isInWishlist(item.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <SparkleHeart 
                        filled={isInWishlist(item.id)}
                        className={`w-6 h-6 ${isInWishlist(item.id) ? 'text-red-500' : 'text-black'}`} 
                      />
                    </button>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <h3 className="font-body-md text-xs text-charcoal-stone relative inline-block pb-0.5 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:bottom-0 after:right-0 after:bg-current after:origin-right after:transition-transform after:duration-300 group-hover:after:scale-x-100">{item.name}</h3>
                    <span className="font-body-md text-lg font-bold text-charcoal-stone">{typeof item.price === 'number' ? `₹${item.price.toLocaleString('en-IN')}` : item.price}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Swiper Controls */}
          <div className="flex justify-center items-center gap-6 mt-8 select-none">
            <button 
              onClick={() => {
                const el = document.getElementById('bestsellers-scroll');
                if (el) {
                  const itemWidth = el.children[0].clientWidth;
                  el.scrollBy({ left: -(itemWidth + 24), behavior: 'smooth' });
                }
              }}
              className="text-outline hover:text-charcoal-stone transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            
            <span id="bestseller-pagination" className="text-sm font-medium text-charcoal-stone tracking-widest">
              1/10
            </span>

            <button 
              onClick={() => {
                const el = document.getElementById('bestsellers-scroll');
                if (el) {
                  const itemWidth = el.children[0].clientWidth;
                  el.scrollBy({ left: itemWidth + 24, behavior: 'smooth' });
                }
              }}
              className="text-outline hover:text-charcoal-stone transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Exclusive Offers & Coupons Section */}
      <section className="max-w-container mx-auto px-margin-edge py-section-gap">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <span className="font-label-caps text-[10px] tracking-[0.2em] text-muted-gold uppercase block mb-2">Special Promotions</span>
          <h2 className="font-serif text-3xl md:text-4xl text-charcoal-stone mb-3">Exclusive Offers For You</h2>
          <p className="font-body-md text-sm text-gray-500 max-w-md">Copy and apply these code vouchers at checkout to redeem maximum discounts on your cart items.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(featuredCoupons.length > 0 ? featuredCoupons : [
            { code: 'WELCOME10', discountValue: 10, discountType: 'PERCENTAGE', description: 'On your first order', minOrderValue: 999 },
            { code: 'SUMMER20', discountValue: 20, discountType: 'PERCENTAGE', description: 'Summer special discount', minOrderValue: 1499 },
            { code: 'SAVE500', discountValue: 500, discountType: 'FIXED', description: 'Flat savings on big carts', minOrderValue: 5000 }
          ] as Coupon[]).map((offer) => {
            const isCopied = copiedCode === offer.code;
            const discountLabel = offer.discountType === 'PERCENTAGE' 
              ? `${offer.discountValue}% OFF` 
              : `₹${offer.discountValue?.toLocaleString('en-IN')} OFF`;
            const minCartLabel = offer.minOrderValue > 0 
              ? offer.minOrderValue.toLocaleString('en-IN') 
              : '0';

            return (
              <div key={offer.code} className="border border-dashed border-outline-variant/60 rounded-xl p-6 bg-white flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-muted-gold/10 text-muted-gold text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full">
                      VOUCHER
                    </span>
                    <span className="text-gray-400 text-xs font-medium">Min Spend: ₹{minCartLabel}</span>
                  </div>
                  <h3 className="font-serif text-3xl font-extrabold text-charcoal-stone mb-1">{discountLabel}</h3>
                  <p className="font-body-md text-xs text-gray-500 mb-6">{offer.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="bg-warm-sand px-4 py-2 border border-outline-variant/40 rounded font-mono text-sm font-semibold tracking-wider text-charcoal-stone select-all">
                    {offer.code}
                  </div>
                  <button 
                    onClick={() => handleCopyCode(offer.code)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 rounded ${isCopied ? 'bg-green-600 text-white' : 'bg-charcoal-stone text-white hover:bg-muted-gold cursor-pointer'}`}
                  >
                    {isCopied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>


      {/* Shop by Department & Category */}
      <section className="max-w-container mx-auto px-margin-edge py-section-gap">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <span className="font-label-caps text-[10px] tracking-[0.2em] text-muted-gold uppercase block mb-2">Curated Collections</span>
          <h2 className="font-serif text-3xl md:text-4xl text-charcoal-stone mb-3">Shop by Category</h2>
          <p className="font-body-md text-sm text-gray-500 max-w-md">Explore our premium catalog organized by specific departments and product categories.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Men's Wear",
              subtitle: "Refined Casuals & Essentials",
              image: "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=600",
              link: "/collection?department=Men"
            },
            {
              title: "Women's Wear",
              subtitle: "Elegant Dresses & Silks",
              image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600",
              link: "/collection?department=Women"
            },
            {
              title: "Premium Footwear",
              subtitle: "Leather Sneakers & Boots",
              image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600",
              link: "/collection?category=footwear"
            },
            {
              title: "Smart Tech & Living",
              subtitle: "Wearables & Appliances",
              image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=600",
              link: "/collection?category=electronics"
            }
          ].map((cat, idx) => (
            <Link to={cat.link} key={idx} className="relative aspect-[4/5] rounded-2xl overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-500 block bg-neutral-950">
              <img alt={cat.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-75" src={cat.image} loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 transition-opacity duration-300" />
              <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end text-white">
                <h3 className="font-serif text-xl font-bold tracking-wide mb-1">{cat.title}</h3>
                <span className="font-body-md text-xs text-gray-300 font-light uppercase tracking-wider">{cat.subtitle}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Apparel Highlights Carousel */}
      <section className="max-w-container mx-auto px-margin-edge py-section-gap overflow-hidden">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <h2 className="text-lg font-bold text-charcoal-stone mb-4 uppercase">Apparel Highlights</h2>
          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <p>Premium fabrics and timeless silhouettes.</p>
            <p>Explore our latest collection for men and women.</p>
          </div>
          <Link className="text-xs font-medium border-b border-charcoal-stone pb-0.5 hover:opacity-60 transition-opacity" to="/collection">View all</Link>
        </div>
        
        {/* Carousel Container */}
        <div className="relative">
          <div 
            id="socks-scroll"
            className="flex gap-gutter overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onScroll={(e) => {
              const el = e.currentTarget;
              const scrollLeft = el.scrollLeft;
              const maxScrollLeft = el.scrollWidth - el.clientWidth;
              
              let index = 0;
              const totalItems = apparelHighlights.length;
              if (maxScrollLeft > 0 && totalItems > 0) {
                const scrollPercentage = scrollLeft / maxScrollLeft;
                index = Math.round(scrollPercentage * (totalItems - 1));
              }
              
              const pagination = document.getElementById('socks-pagination');
              if (pagination) {
                pagination.innerText = `${index + 1}/${totalItems || 1}`;
              }
            }}
          >
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[85vw] sm:min-w-[45vw] md:min-w-[22%] snap-start">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : (
              apparelHighlights.map((item) => (
                <Link to={`/product/${item.id}`} key={item.id} className="group block cursor-pointer min-w-[85vw] sm:min-w-[45vw] md:min-w-[22%] snap-start relative">
                  <div className="aspect-[3/4] bg-[#f6f5f0] mb-3 overflow-hidden relative">
                    <img alt={item.name} className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105" src={item.image} loading="lazy" decoding="async" />
                    <button 
                      onClick={(e) => handleWishlistToggle(e, item)}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-charcoal-stone hover:scale-110 transition-transform z-10"
                      title={isInWishlist(item.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <SparkleHeart 
                        filled={isInWishlist(item.id)}
                        className={`w-6 h-6 ${isInWishlist(item.id) ? 'text-red-500' : 'text-black'}`} 
                      />
                    </button>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <h3 className="font-body-md text-xs text-gray-500 relative inline-block pb-0.5 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:bottom-0 after:right-0 after:bg-current after:origin-right after:transition-transform after:duration-300 group-hover:after:scale-x-100">{item.name}</h3>
                    <span className="font-body-md text-lg font-bold text-gray-500">{typeof item.price === 'number' ? `₹${item.price.toLocaleString('en-IN')}` : item.price}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Swiper Controls */}
          <div className="flex justify-center items-center gap-6 mt-8 select-none">
            <button 
              onClick={() => {
                const el = document.getElementById('socks-scroll');
                if (el) {
                  const itemWidth = el.children[0].clientWidth;
                  el.scrollBy({ left: -(itemWidth * 2), behavior: 'smooth' });
                }
              }}
              className="text-outline hover:text-charcoal-stone transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            
            <span id="socks-pagination" className="text-xs font-medium text-gray-500 tracking-widest">
              1/{apparelHighlights.length || 1}
            </span>

            <button 
              onClick={() => {
                const el = document.getElementById('socks-scroll');
                if (el) {
                  const itemWidth = el.children[0].clientWidth;
                  el.scrollBy({ left: itemWidth * 2, behavior: 'smooth' });
                }
              }}
              className="text-outline hover:text-charcoal-stone transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Tech & Home Section */}
      <section className="max-w-[1400px] mx-auto px-margin-edge py-section-gap">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <h2 className="text-sm font-bold text-charcoal-stone mb-1.5 uppercase tracking-widest">TECH & HOME</h2>
          <Link className="text-xs font-medium border-b border-charcoal-stone pb-0.5 hover:opacity-60 transition-opacity" to="/collection">View all</Link>
        </div>
        
        {/* 5 columns grid, with group/models for hover effect */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 group/models">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <ProductCardSkeleton />
              </div>
            ))
          ) : (
            techHome.slice(0, 5).map((item) => (
              <Link to={`/product/${item.id}`} key={item.id} className="group/card block cursor-pointer relative">
                <div className="aspect-[4/5] bg-[#f6f5f0] mb-3 overflow-hidden relative">
                  <img 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-opacity duration-300 opacity-100 group-hover/models:opacity-0 group-hover/card:!opacity-100" 
                    src={item.image}
                    loading="lazy"
                    decoding="async"
                  />
                  <button 
                    onClick={(e) => handleWishlistToggle(e, item)}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-charcoal-stone hover:scale-110 transition-transform z-10"
                    title={isInWishlist(item.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <SparkleHeart 
                      filled={isInWishlist(item.id)}
                      className={`w-5 h-5 ${isInWishlist(item.id) ? 'text-red-500' : 'text-black'}`} 
                    />
                  </button>
                </div>
                <div className="pt-1">
                  <h3 className="font-body-md text-xs text-charcoal-stone">{item.name}</h3>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>



    </div>
  );
}
