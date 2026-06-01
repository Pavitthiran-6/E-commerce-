import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface CategoryChip {
  name: string;
  emoji: string;
  link: string;
  color: string;
}

interface CategoryChipsProps {
  categories?: CategoryChip[];
  className?: string;
}

// Default category chips that map to collection filters
const DEFAULT_CATEGORIES: CategoryChip[] = [
  { name: 'All', emoji: '🛍️', link: '/collection', color: '#F3F3F3' },
  { name: 'Sale', emoji: '🔥', link: '/sale', color: '#FFF0F0' },
  { name: 'New Arrivals', emoji: '✨', link: '/new-arrivals', color: '#FFF8E6' },
  { name: 'Men', emoji: '👔', link: '/collection?department=Men', color: '#EEF4FF' },
  { name: 'Women', emoji: '👗', link: '/collection?department=Women', color: '#FFF0F5' },
  { name: 'Footwear', emoji: '👟', link: '/collection?category=footwear', color: '#F0FFF4' },
  { name: 'Electronics', emoji: '📱', link: '/collection?category=electronics', color: '#EEF0FF' },
  { name: 'Kitchen', emoji: '🍳', link: '/collection?category=Kitchen Items', color: '#FFF3E0' },
  { name: 'Accessories', emoji: '💎', link: '/collection?category=Accessories', color: '#F3E8FF' },
];

export default function CategoryChips({ categories = DEFAULT_CATEGORIES, className = '' }: CategoryChipsProps) {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const isActive = (chip: CategoryChip) => {
    const url = chip.link;
    const currentFull = location.pathname + location.search;
    if (url === '/collection' && !location.search) return location.pathname === '/collection';
    return currentFull.startsWith(url) && url !== '/collection';
  };

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 8);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Left fade */}
      {showLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#F8F8F8] to-transparent z-10 pointer-events-none" />
      )}
      {/* Right fade */}
      {showRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F8F8F8] to-transparent z-10 pointer-events-none" />
      )}

      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto no-scrollbar pb-0.5"
      >
        {categories.map((chip) => {
          const active = isActive(chip);
          return (
            <Link
              key={chip.name}
              to={chip.link}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 group transition-transform duration-150 hover:scale-105 active:scale-95`}
            >
              {/* Icon circle */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all duration-200 ${
                  active
                    ? 'ring-2 ring-[#0C831F] shadow-md scale-105'
                    : 'hover:shadow-md'
                }`}
                style={{ backgroundColor: chip.color }}
              >
                {chip.emoji}
              </div>
              {/* Label */}
              <span
                className={`text-[10px] font-semibold text-center leading-tight max-w-[56px] truncate ${
                  active ? 'text-[#0C831F]' : 'text-gray-600 group-hover:text-gray-900'
                }`}
              >
                {chip.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
