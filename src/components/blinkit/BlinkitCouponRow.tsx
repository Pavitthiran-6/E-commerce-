import { useRef } from 'react';
import type { Coupon } from '../../services/couponService';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BlinkitCouponRowProps {
  coupons: Coupon[];
  onCopy?: (code: string) => void;
  copiedCode?: string | null;
  className?: string;
}

export default function BlinkitCouponRow({ coupons, onCopy, copiedCode, className = '' }: BlinkitCouponRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  if (!coupons.length) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Scroll buttons (desktop) */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar pb-1"
      >
        {coupons.map((coupon) => {
          const isCopied = copiedCode === coupon.code;
          const label =
            coupon.discountType === 'PERCENTAGE'
              ? `${coupon.discountValue}% OFF`
              : `₹${coupon.discountValue?.toLocaleString('en-IN')} OFF`;

          return (
            <div
              key={coupon.code}
              className="flex-shrink-0 w-52 bg-white border border-dashed border-[#0C831F]/40 rounded-xl p-3 flex flex-col gap-2 shadow-sm"
            >
              {/* Discount label */}
              <div className="flex items-center justify-between">
                <span className="text-[#0C831F] text-base font-black leading-none">{label}</span>
                <span className="text-[10px] text-gray-400 font-medium">
                  Min ₹{(coupon.minOrderValue || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{coupon.description || 'Exclusive offer'}</p>

              {/* Code + Copy */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed border-gray-200">
                <span className="font-mono text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-md tracking-wider">
                  {coupon.code}
                </span>
                <button
                  onClick={() => onCopy?.(coupon.code)}
                  className={`text-[11px] font-bold uppercase tracking-wide transition-all px-2 py-1 rounded-md ${
                    isCopied
                      ? 'bg-[#0C831F] text-white'
                      : 'text-[#0C831F] hover:bg-[#E8F5E9]'
                  }`}
                >
                  {isCopied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
