import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import type { Product } from '../../types/product';

// Import Swiper styles
import 'swiper/css';

interface HeroSliderProps {
  products: Product[];
  isLoading: boolean;
}

export default function HeroSlider({ products, isLoading }: HeroSliderProps) {
  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#FFF9E6] rounded-3xl animate-pulse flex flex-col items-center justify-center p-6 border border-amber-100">
        <div className="w-24 h-4 bg-amber-200/60 rounded mb-4" />
        <div className="w-16 h-8 bg-amber-200/60 rounded-full mb-2" />
        <div className="w-32 h-6 bg-amber-200/60 rounded mb-6" />
        <div className="w-40 aspect-square bg-amber-200/40 rounded-xl" />
      </div>
    );
  }

  // Filter products that are actually on sale or have a discount, fallback to featured products
  const saleProducts = products.filter(p => p.discountPercentage && p.discountPercentage > 0).slice(0, 8);
  const displayProducts = saleProducts.length > 0 ? saleProducts : products.slice(0, 8);

  if (!displayProducts.length) {
    return (
      <div className="w-full h-full bg-[#FFF9E6] rounded-3xl flex flex-col items-center justify-center p-6 text-center border border-amber-100">
        <span className="text-3xl mb-2">🛍️</span>
        <h3 className="font-bold text-gray-800">Summer Deals</h3>
        <p className="text-xs text-gray-500 mt-1">Explore our exclusive catalog</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden border border-amber-100 shadow-sm hero-swiper-container">
      <Swiper
        modules={[Autoplay]}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={displayProducts.length > 1}
        className="w-full h-full"
      >
        {displayProducts.map((product) => {
          const discountPct = product.discountPercentage || product.discount || 0;
          const origPrice = product.originalPrice || Math.round(product.price / (1 - discountPct / 100)) || product.price;
          const currentPrice = product.price;
          const imageSrc = product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400';

          return (
            <SwiperSlide key={product.id}>
              <Link
                to={`/product/${product.id}`}
                className="block w-full h-full bg-[#FFF9E6] hover:bg-[#FFF6DB] transition-colors duration-300 p-2 md:p-6 flex flex-col items-center justify-between relative group select-none cursor-pointer"
              >
                {/* Sale Badge / Title */}
                <div className="text-center">
                  <span className="text-[8px] md:text-xs font-black tracking-widest text-amber-800 uppercase block mb-0.5">
                    SUMMER DEALS
                  </span>
                  {discountPct > 0 && (
                    <span className="inline-block bg-amber-100 text-amber-800 text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-0.5">
                      {Math.round(discountPct)}% OFF
                    </span>
                  )}
                </div>

                {/* Price pill */}
                <div className="flex flex-col items-center gap-0.5 my-1.5 md:my-3">
                  {origPrice > currentPrice && (
                    <span className="text-[8px] md:text-xs text-gray-400 line-through font-semibold leading-none">
                      ₹{origPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="bg-[#0C831F] text-white text-[10px] md:text-lg font-black px-2 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl shadow-sm leading-none flex items-center">
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Product Name */}
                <h3 className="text-[9px] md:text-base font-extrabold text-gray-900 text-center leading-tight line-clamp-2 md:line-clamp-1 min-h-[22px] md:min-h-0 max-w-[95%] mb-1.5 md:mb-4">
                  {product.name}
                </h3>

                {/* Product Image */}
                <div className="w-full max-w-[80px] sm:max-w-[120px] md:max-w-[260px] aspect-square flex items-center justify-center overflow-hidden bg-white/60 rounded-xl md:rounded-2xl border border-white/80 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
