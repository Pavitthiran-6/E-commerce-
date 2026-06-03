import { Link } from 'react-router-dom';
import type { Category } from '../../pages/Home';
import type { Product } from '../../types/product';

interface PromoGridProps {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
}

const PASTEL_COLORS = [
  { bg: '#FFF6F0', border: 'border-orange-100/60', badgeBg: 'bg-[#0C831F]', badgeText: 'text-white' },
  { bg: '#FFFBF0', border: 'border-amber-100/60', badgeBg: 'bg-[#0C831F]', badgeText: 'text-white' },
  { bg: '#F5F7FF', border: 'border-indigo-100/60', badgeBg: 'bg-[#0C831F]', badgeText: 'text-white' },
  { bg: '#EEFBF2', border: 'border-emerald-100/60', badgeBg: 'bg-[#0C831F]', badgeText: 'text-white' },
];

export default function PromoGrid({ categories, products, isLoading }: PromoGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3.5 h-full w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-full aspect-square md:aspect-auto bg-gray-50 rounded-3xl animate-pulse border border-gray-100 flex flex-col items-center justify-between p-4"
          >
            <div className="w-16 h-4 bg-gray-200 rounded self-start" />
            <div className="w-24 h-5 bg-gray-200 rounded my-2" />
            <div className="w-20 h-20 bg-gray-200 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // Flatten sub-categories
  const subCategories = categories.flatMap((cat) => cat.children || []);
  const displayCats = subCategories.length >= 4 ? subCategories.slice(0, 4) : categories.slice(0, 4);

  // Helper to find maximum discount in a category
  const getCategoryDiscount = (catName: string) => {
    const catProducts = products.filter(
      (p) =>
        p.category?.toLowerCase() === catName.toLowerCase() ||
        p.subCategory?.toLowerCase() === catName.toLowerCase()
    );
    const maxDiscount = catProducts.reduce((max, p) => {
      const pct = p.discountPercentage || p.discount || 0;
      return pct > max ? pct : max;
    }, 0);
    // If maximum discount is found, return it, otherwise return a default sale discount
    return maxDiscount > 0 ? Math.round(maxDiscount) : 40;
  };

  return (
    <div className="grid grid-cols-2 gap-3.5 h-full w-full">
      {displayCats.map((cat, idx) => {
        const colors = PASTEL_COLORS[idx % PASTEL_COLORS.length];
        const maxDiscount = getCategoryDiscount(cat.name);
        const linkPath = `/collection?category=${cat.slug}`;
        const imageSrc = cat.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400';

        return (
          <Link
            key={cat.id}
            to={linkPath}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl md:rounded-3xl border ${colors.border} p-2 md:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer select-none`}
            style={{ backgroundColor: colors.bg }}
          >
            {/* Top discount pill */}
            <div className="self-start">
              <span className={`inline-block ${colors.badgeBg} ${colors.badgeText} text-[7px] md:text-[10px] font-black uppercase px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg tracking-wider shadow-sm`}>
                Up to {maxDiscount}% OFF
              </span>
            </div>

            {/* Category Title */}
            <h3 className="text-[10px] md:text-base font-extrabold text-gray-900 tracking-tight leading-snug mt-1.5 line-clamp-2 min-h-[28px] md:min-h-[48px]">
              {cat.name}
            </h3>

            {/* Category Image */}
            <div className="w-full h-14 sm:h-24 md:h-40 flex items-center justify-center mt-1.5 overflow-hidden rounded-lg md:rounded-2xl bg-white/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <img
                src={imageSrc}
                alt={cat.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
