import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SparkleHeart } from '../components/icons/SparkleHeart';
import { useWishlist } from '../context/WishlistContext';
import { getAllProducts, getFeaturedProducts } from '../services/productService';
import type { Product } from '../data/products';
import { ProductCardSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';

export default function Home() {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const data = await getFeaturedProducts();
      setFeaturedProducts(data);
    } catch (err) {
      console.error('Failed to load featured products', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchFeatured();
  }, []);

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

  if (error) {
    return <ErrorState message={error} onRetry={fetchProducts} className="mt-24 mx-4" />;
  }

  return (
    <div className="bg-parchment text-charcoal-stone font-body-lg antialiased selection:bg-muted-gold selection:text-white">
      {/* Hero Section */}
      <section className="max-w-[1400px] mx-auto px-6 pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch lg:h-[550px]">
          
          {/* Left Column: 3 small promo banners */}
          <div className="grid grid-rows-3 gap-4 lg:col-span-1 h-full">
            {/* Banner 1: 3-Day Delivery */}
            <Link to="/collection" className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm block">
              <img alt="3-Day Delivery" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600" />
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
              <img alt="Weekly Sale" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600" />
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
            <Link to="/login" className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm block">
              <img alt="Belledonne Club" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=600" />
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
          <div className="relative lg:col-span-3 rounded-2xl overflow-hidden min-h-[400px] lg:h-full group shadow-md bg-neutral-900">
            {slides.map((slide, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
              >
                {/* Background Image */}
                <img 
                  alt={slide.title} 
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-10000 ease-out group-hover:scale-102" 
                  src={slide.image} 
                />
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/55" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6 py-12">
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
                  
                  <Link to={slide.link} className="inline-block bg-white text-charcoal-stone font-semibold text-xs tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-neutral-100 transition-colors duration-300 shadow-lg rounded-sm">
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
            <div className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm">
              <img alt="Evening look" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600" />
              <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/30 transition-colors duration-300" />
            </div>
            <div className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm">
              <img alt="Sunset dress" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600" />
              <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/30 transition-colors duration-300" />
            </div>
            <div className="relative rounded-2xl overflow-hidden group min-h-[140px] shadow-sm">
              <img alt="Resort wear" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600" />
              <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/30 transition-colors duration-300" />
            </div>
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
                    <img alt={item.name} className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105" src={item.image} />
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
                    <span className="font-body-md text-xs text-charcoal-stone">{item.price}</span>
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

      {/* Philosophy Editorial */}
      <section className="max-w-container mx-auto px-margin-edge py-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          <div className="md:col-span-7 mb-stack-lg md:mb-0 aspect-[3/2] bg-warm-sand overflow-hidden group">
            <img alt="" className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105" src="https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?q=80&w=1200" />
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <span className="font-label-caps text-label-caps text-outline block mb-stack-md">Our Philosophy</span>
            <h2 className="font-headline-md text-headline-md text-charcoal-stone mb-stack-lg italic">"Elevating the everyday through meticulous craftsmanship and uncompromising materials."</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">Designed in Paris. Assembled in Portugal. We source only the finest full-grain Italian leathers and premium suedes to construct footwear that matures beautifully over time. Every stitch is considered.</p>
            <a className="font-button text-button text-charcoal-stone uppercase tracking-widest relative inline-block pb-1 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:bottom-0 after:left-0 after:bg-current after:origin-bottom-right after:transition-transform after:duration-[400ms] after:ease-out hover:after:scale-x-100 hover:after:origin-bottom-left" href="#">Discover Craftsmanship</a>
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="max-w-container mx-auto px-margin-edge py-section-gap text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-headline-md text-2xl text-charcoal-stone mb-6 uppercase tracking-wider font-semibold leading-relaxed">
            Raise your expectations,<br />raise our standards.
          </h2>
          <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed">
            Inspired by sports classics and crafted from exceptional materials, our sneakers combine minimalism, elegance and high quality standards.
          </p>
        </div>
      </section>

      {/* Dual Category Banners - Sticky Layout */}
      <section className="w-full bg-white">
        {/* Men's Section */}
        <div className="flex flex-col md:flex-row w-full relative">
          {/* Left: Tall Image */}
          <div className="w-full md:w-1/2 h-[100vh] md:h-[150vh]">
            <img alt="Men's Collection" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=800" />
          </div>
          {/* Right: Sticky Text */}
          <div className="w-full md:w-1/2 relative bg-white py-20 md:py-0">
            <div className="md:sticky md:top-1/2 md:-translate-y-1/2 pl-6 md:pl-10 flex flex-col justify-center h-full md:h-auto">
              <h2 className="text-xl font-bold mb-2 uppercase tracking-[0.2em] text-charcoal-stone">Men's Collection</h2>
              <div>
                <Link className="text-sm font-medium border-b border-charcoal-stone pb-0.5 hover:opacity-60 transition-opacity" to="/collection?department=Men">Discover all our models</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Women's Section */}
        <div className="flex flex-col md:flex-row-reverse w-full relative">
          {/* Right: Tall Image */}
          <div className="w-full md:w-1/2 h-[100vh] md:h-[150vh]">
            <img alt="Women's Collection" className="w-full h-full object-cover object-top" src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800" />
          </div>
          {/* Left: Sticky Text */}
          <div className="w-full md:w-1/2 relative bg-white py-20 md:py-0">
            <div className="md:sticky md:top-1/2 md:-translate-y-1/2 pr-6 md:pr-10 flex flex-col justify-center items-end text-right h-full md:h-auto">
              <h2 className="text-xl font-bold mb-2 uppercase tracking-[0.2em] text-charcoal-stone">Women's Collection</h2>
              <div>
                <Link className="text-sm font-medium border-b border-charcoal-stone pb-0.5 hover:opacity-60 transition-opacity" to="/collection?department=Women">Discover all our models</Link>
              </div>
            </div>
          </div>
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
              if (maxScrollLeft > 0) {
                const scrollPercentage = scrollLeft / maxScrollLeft;
                index = Math.round(scrollPercentage * 1); // 2 pages -> index 0 to 1
              }
              
              const pagination = document.getElementById('socks-pagination');
              if (pagination) {
                pagination.innerText = `${index + 1}/2`;
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
              products.filter(p => p.productType === 'apparel').map((item) => (
                <Link to={`/product/${item.id}`} key={item.id} className="group block cursor-pointer min-w-[85vw] sm:min-w-[45vw] md:min-w-[22%] snap-start relative">
                  <div className="aspect-[3/4] bg-[#f6f5f0] mb-3 overflow-hidden relative">
                    <img alt={item.name} className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105" src={item.image} />
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
                    <span className="font-body-md text-xs text-gray-500">{item.price}</span>
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
              1/2
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
            products.filter(p => p.productType === 'electronics').slice(0, 5).map((item) => (
              <Link to={`/product/${item.id}`} key={item.id} className="group/card block cursor-pointer relative">
                <div className="aspect-[4/5] bg-[#f6f5f0] mb-3 overflow-hidden relative">
                  <img 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-opacity duration-300 opacity-100 group-hover/models:opacity-0 group-hover/card:!opacity-100" 
                    src={item.image} 
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
