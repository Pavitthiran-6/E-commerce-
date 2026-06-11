import React from 'react';
import { Link } from 'react-router-dom';
import type { HeroData, HeroCardData } from '../../services/heroService';

interface HeroSectionProps {
  heroData: HeroData | null;
  isLoading: boolean;
}

export default function HeroSection({ heroData, isLoading }: HeroSectionProps) {
  if (isLoading || !heroData) {
    return (
      <div className="w-full rounded-3xl bg-gradient-to-br from-amber-100/50 via-amber-100/30 to-amber-50 border border-amber-200/30 p-6 md:p-8 animate-pulse flex flex-col gap-6">
        {/* Header Skeleton */}
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <div className="w-48 h-8 bg-amber-200/50 rounded-lg" />
          <div className="w-20 h-5 bg-amber-200/60 rounded-full" />
          <div className="w-32 h-4 bg-amber-200/40 rounded mt-1" />
        </div>
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 h-[260px] bg-amber-200/30 rounded-2xl" />
          <div className="col-span-2 grid grid-cols-2 gap-4 h-[260px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-amber-200/20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    title,
    badge,
    dateRange,
    backgroundColor,
    leftIcon,
    rightIcon,
    featuredProductName,
    featuredProductImage,
    featuredOriginalPrice,
    featuredSalePrice,
    featuredDiscountPercentage,
    featuredCardBackgroundColor,
    promoCards,
  } = heroData;

  const sortedCards = [...(promoCards || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Helper to render Featured Card
  const renderFeaturedCard = (layout: 'vertical' | 'horizontal') => {
    const isVertical = layout === 'vertical';
    const cardContent = (
      <>
        <div className={isVertical ? 'w-full' : 'flex-1 pr-4'}>
          <span className="text-[9px] md:text-xs font-black tracking-widest text-amber-800 uppercase block mb-1">
            SUMMER DEALS
          </span>
          {featuredDiscountPercentage > 0 && (
            <span className="inline-block bg-amber-100 text-amber-800 text-[9px] md:text-[11px] font-bold px-2 py-0.5 rounded-full mb-1">
              {featuredDiscountPercentage}% OFF
            </span>
          )}
          <h3 className={`font-extrabold text-gray-900 leading-tight mt-1 line-clamp-2 ${isVertical ? 'text-xs md:text-base mb-3' : 'text-sm md:text-lg mb-1'}`}>
            {featuredProductName}
          </h3>
        </div>

        <div className={`flex flex-col items-center gap-1 ${isVertical ? 'my-2' : 'flex-shrink-0'}`}>
          {featuredOriginalPrice > featuredSalePrice && (
            <span className="text-[9px] md:text-xs text-gray-400 line-through font-semibold leading-none">
              ₹{Number(featuredOriginalPrice).toLocaleString('en-IN')}
            </span>
          )}
          <span className="bg-[#0C831F] text-white text-[10px] sm:text-xs md:text-lg font-black px-1.5 py-0.5 sm:px-2.5 sm:py-1 md:px-4 md:py-1.5 rounded-md sm:rounded-lg md:rounded-xl shadow-sm leading-none flex items-center">
            ₹{Number(featuredSalePrice).toLocaleString('en-IN')}
          </span>
        </div>

        {featuredProductImage && (
          <div
            className={`aspect-square overflow-hidden bg-white/60 rounded-xl md:rounded-2xl border border-white/80 shadow-inner hover:scale-105 transition-transform duration-300 ${
              isVertical ? 'w-14 sm:w-20 md:w-40 mt-1 md:mt-3' : 'w-16 md:w-28'
            }`}
          >
            <img src={featuredProductImage} alt={featuredProductName} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
      </>
    );

    const className = `w-full h-full rounded-2xl border border-amber-100/60 shadow-sm p-2 sm:p-4 md:p-6 flex transition-colors duration-300 hover:bg-[#FFF6DB] select-none ${
      heroData?.productSlug ? 'cursor-pointer' : ''
    } ${
      isVertical ? 'flex-col justify-between items-center text-center' : 'flex-row justify-between items-center'
    }`;
    const style = { backgroundColor: featuredCardBackgroundColor || '#FFF9E6' };

    if (heroData?.productSlug) {
      return (
        <Link to={`/product/${heroData.productSlug}`} className={className} style={style}>
          {cardContent}
        </Link>
      );
    }

    return (
      <div className={className} style={style}>
        {cardContent}
      </div>
    );
  };

  // Helper to render Promo Card
  const renderPromoCard = (card: HeroCardData) => {
    const cardContent = (
      <>
        <div className="self-start">
          <span className="inline-block bg-[#0C831F] text-white text-[8px] md:text-[10px] font-black uppercase px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg tracking-wider shadow-sm">
            Up to {card.discountPercentage}% OFF
          </span>
        </div>

        <h3 className="text-[10px] md:text-base font-extrabold text-gray-900 tracking-tight leading-snug mt-1.5 line-clamp-2 min-h-[28px] md:min-h-[48px]">
          {card.title}
        </h3>

        {card.image && (
          <div className="w-full h-14 sm:h-20 md:h-32 flex items-center justify-center mt-1.5 overflow-hidden rounded-lg md:rounded-xl bg-white/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <img src={card.image} alt={card.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
      </>
    );

    const className = "group relative flex flex-col justify-between overflow-hidden rounded-xl md:rounded-2xl border border-orange-100/50 p-2.5 md:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer select-none h-full";
    const style = { backgroundColor: card.backgroundColor || '#FFF6F0' };

    if (card.productSlug) {
      return (
        <Link to={`/product/${card.productSlug}`} className={className} style={style}>
          {cardContent}
        </Link>
      );
    }

    return (
      <div className={className} style={style}>
        {cardContent}
      </div>
    );
  };

  // Parse background color styles (hex or gradient)
  const safeBgColor = backgroundColor || 'linear-gradient(to bottom right, #FFE082, #FFD54F, #FFCA28)';
  const heroStyle = safeBgColor.includes('gradient')
    ? { backgroundImage: safeBgColor }
    : { backgroundColor: safeBgColor };

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-amber-500/10 shadow-md p-3 md:p-6 lg:p-8 flex flex-col gap-2 md:gap-6 lg:gap-8"
      style={heroStyle}
    >
      {/* ── Header Title & Graphic Layout ────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center text-center py-1">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute top-1/2 left-1 md:left-8 lg:left-12 -translate-y-1/2 opacity-30 md:opacity-50 animate-pulse w-8 h-8 md:w-16 md:h-16">
            <img src={leftIcon} alt="Left graphic icon" className="w-full h-full object-contain" />
          </div>
        )}
        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute top-1/2 right-1 md:right-8 lg:right-12 -translate-y-1/2 opacity-30 md:opacity-50 animate-pulse w-8 h-8 md:w-16 md:h-16">
            <img src={rightIcon} alt="Right graphic icon" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Title badge & date */}
        <div className="relative z-10 space-y-0 max-w-lg">
          <div className="flex flex-col items-center gap-1">
            <h1
              className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-none select-none"
              style={{
                color: '#FFFFFF',
                WebkitTextStroke: '3px #1A1A1A',
                textShadow: '4px 4px 0px #1A1A1A, -1px -1px 0px #1A1A1A',
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>
            {badge && (
              <span
                className="inline-block bg-[#1A1A1A] text-[#FFCA28] font-black uppercase tracking-wider rounded-full shadow-lg mt-1"
                style={{
                  fontSize: 'clamp(14px, 3vw, 28px)',
                  padding: 'clamp(4px, 1vw, 10px) clamp(20px, 5vw, 48px)',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  letterSpacing: '0.08em',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {dateRange && (
            <p className="text-[9px] md:text-xs font-black text-gray-900 tracking-wider uppercase pt-2">
              {dateRange}
            </p>
          )}
        </div>

      </div>

      {/* ── GRID LAYOUT FOR ALL SCREEN SIZES (Large Left Card, 4 promo cards right) ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5 items-stretch relative z-10 w-full">
        <div className="col-span-1 self-stretch">
          {renderFeaturedCard('vertical')}
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-2 sm:gap-4">
          {sortedCards.slice(0, 4).map((card, idx) => (
            <div key={card.id || idx}>{renderPromoCard(card)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
