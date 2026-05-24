import React from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';
import { SparkleHeart } from '../components/icons/SparkleHeart';
import { useWishlist } from '../context/WishlistContext';

export default function Home() {
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
        price: typeof product.price === 'string' ? parseInt(product.price.replace(/[^0-9]/g, '')) : product.price,
        image: product.image
      });
    }
  };

  return (
    <div className="bg-parchment text-charcoal-stone font-body-lg antialiased selection:bg-muted-gold selection:text-white">
      {/* Hero Section */}
      <section className="relative w-full h-[90vh] min-h-[600px] flex items-end pb-24 justify-center bg-warm-sand pt-20">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img alt="" className="w-full h-full object-cover object-center" src="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2000" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-stone/40 to-transparent z-10"></div>
        <div className="relative z-20 text-center text-white px-margin-edge">
          <h1 className="font-headline-display text-headline-display mb-stack-lg drop-shadow-sm">Modern Heritage.</h1>
          <a className="inline-block bg-white text-charcoal-stone font-button text-button px-8 py-4 uppercase tracking-widest hover:bg-warm-sand transition-colors duration-[400ms] ease-in-out" href="#">Shop Collection</a>
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
            {products.slice(0, 10).map((item) => (
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
            ))}
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
            {products.filter(p => p.productType === 'apparel').map((item) => (
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
            ))}
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
          {products.filter(p => p.productType === 'electronics').slice(0, 5).map((item) => (
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
          ))}
        </div>
      </section>



    </div>
  );
}
