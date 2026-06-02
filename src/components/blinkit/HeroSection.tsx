import { Zap } from 'lucide-react';
import type { Category } from '../../pages/Home';
import type { Product } from '../../types/product';
import type { SaleSettingsData } from '../../services/productService';
import HeroSlider from './HeroSlider';
import PromoGrid from './PromoGrid';

interface HeroSectionProps {
  categories: Category[];
  products: Product[];
  saleSettings: SaleSettingsData | null;
  isLoading: boolean;
}

export default function HeroSection({
  categories,
  products,
  saleSettings,
  isLoading,
}: HeroSectionProps) {
  // If sale settings are inactive, we still display the premium section because it's a permanent redesign
  const saleTitle = saleSettings?.saleTitle || 'HOUSEFULL SALE';
  const saleSubtitle = saleSettings?.saleSubtitle || '30th May - 5th June';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFE082] via-[#FFD54F] to-[#FFCA28] border border-[#FFB300]/20 shadow-md p-2.5 md:p-6 lg:p-8 select-none flex flex-col gap-3.5 md:gap-6 lg:gap-8">
      {/* ── Housefull Sale Header ────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center text-center py-1">
        {/* Animated lightning bolt glows */}
        <div className="absolute top-1/2 left-1 md:left-12 -translate-y-1/2 opacity-20 md:opacity-40 animate-pulse">
          <Zap className="w-8 h-8 md:w-16 md:h-16 text-white fill-white rotate-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
        </div>
        <div className="absolute top-1/2 right-1 md:right-12 -translate-y-1/2 opacity-20 md:opacity-40 animate-pulse delay-500">
          <Zap className="w-8 h-8 md:w-16 md:h-16 text-white fill-white -rotate-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-white/20 blur-xl" />
        <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/25 blur-xl" />

        {/* Title & Graphic Layout */}
        <div className="relative z-10 space-y-1 max-w-lg">
          <div className="flex flex-col items-center gap-1">
            {/* HOUSEFULL Title with stroke/shadow effect */}
            <h1 className="text-2xl md:text-6xl font-black tracking-tighter text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] uppercase">
              {saleTitle.replace(/🔥/g, '')}
            </h1>
            {/* SALE Pill Badge */}
            <span className="bg-[#1A1A1A] text-[#FFCA28] text-[9px] md:text-sm font-extrabold uppercase px-4 py-0.5 md:px-6 md:py-1 rounded-full shadow-md tracking-widest mt-0.5">
              SALE
            </span>
          </div>
          {/* Subtitle / Dates */}
          <p className="text-[9px] md:text-sm font-black text-gray-900 tracking-wider uppercase pt-1">
            {saleSubtitle}
          </p>
        </div>
      </div>

      {/* ── Main Layout Grid ────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 lg:gap-5 items-stretch relative z-10">
        {/* Left Side: Large Swiper Slider Card */}
        <div className="col-span-1 self-center md:self-stretch h-[200px] md:h-auto">
          <HeroSlider products={products} isLoading={isLoading} />
        </div>

        {/* Right Side: 2x2 Categories Promo Grid */}
        <div className="col-span-2">
          <PromoGrid categories={categories} products={products} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
