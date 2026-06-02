import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useWishlist } from '../context/WishlistContext';
import { getAllProducts, getFeaturedProducts, getBestsellers, getApparelHighlights, getTechHome } from '../services/productService';
import { getFeaturedCoupons, type Coupon } from '../services/couponService';
import type { Product } from '../types/product';
import { ProductCardSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';
import { useNetworkRecovery } from '../hooks/useNetworkRecovery';
import BlinkitSearchBar from '../components/blinkit/BlinkitSearchBar';
import BlinkitBanner from '../components/blinkit/BlinkitBanner';
import BlinkitProductCard from '../components/blinkit/BlinkitProductCard';
import BlinkitCouponRow from '../components/blinkit/BlinkitCouponRow';
import SectionHeader from '../components/blinkit/SectionHeader';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  children: Category[];
}

function CategoryCard({ subCat }: { subCat: Category }) {
  const [imgError, setImgError] = useState(false);
  return (
    <Link
      to={`/collection?category=${encodeURIComponent(subCat.name)}`}
      className="group flex flex-col justify-between p-2 bg-white border border-gray-100/80 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer hover:border-gray-200 h-full w-full"
    >
      {/* Image container */}
      <div className="w-full aspect-square bg-[#F8F9FA] rounded-xl flex items-center justify-center p-2 overflow-hidden border border-gray-50/50">
        {subCat.imageUrl && !imgError ? (
          <img
            src={subCat.imageUrl}
            alt={subCat.name}
            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-xl sm:text-2xl text-gray-300 select-none">📦</div>
        )}
      </div>
      {/* Label */}
      <span className="text-[10px] sm:text-xs font-semibold text-gray-800 text-center leading-tight mt-1.5 px-0.5 line-clamp-2 min-h-[32px] w-full flex items-center justify-center">
        {subCat.name}
      </span>
    </Link>
  );
}

export default function Home() {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [apparelHighlights, setApparelHighlights] = useState<Product[]>([]);
  const [techHome, setTechHome] = useState<Product[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [featuredCoupons, setFeaturedCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const hasFetchedOnce = useRef(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError('');
    }
    try {
      const data = await getAllProducts();
      setProducts(data);
      setError('');
    } catch (err) {
      if (products.length === 0) setError('Failed to load products');
    } finally {
      setIsLoading(false);
      setIsRecovering(false);
    }
  }, [products.length]);

  const fetchFeatured = useCallback(async () => {
    try { const data = await getFeaturedProducts(); setFeaturedProducts(data); } catch {}
  }, []);

  const fetchBestsellers = useCallback(async () => {
    try { const data = await getBestsellers(); setBestsellers(data); } catch {}
  }, []);

  const fetchHighlightsAndTech = useCallback(async () => {
    try {
      const [apparelData, techData] = await Promise.all([getApparelHighlights(), getTechHome()]);
      setApparelHighlights(apparelData);
      setTechHome(techData);
    } catch {}
  }, []);

  const fetchFeaturedCoupons = useCallback(async () => {
    try { const data = await getFeaturedCoupons(); setFeaturedCoupons(data || []); } catch {}
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const res = await axiosInstance.get('/api/categories/tree');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    hasFetchedOnce.current = true;
    fetchProducts();
    fetchFeatured();
    fetchBestsellers();
    fetchHighlightsAndTech();
    fetchFeaturedCoupons();
    fetchCategories();
  }, []);

  useNetworkRecovery(useCallback(() => {
    if (!hasFetchedOnce.current) return;
    setIsRecovering(true);
    fetchProducts(true);
    fetchFeatured();
    fetchBestsellers();
    fetchHighlightsAndTech();
    fetchFeaturedCoupons();
    fetchCategories();
  }, [fetchProducts, fetchFeatured, fetchBestsellers, fetchHighlightsAndTech, fetchFeaturedCoupons, fetchCategories]));

  // Build banner slides from featured products + a default
  const defaultSlide = {
    title: 'Up to 80% Off',
    subtitle: 'BELLEDONNE',
    badge: 'PAYDAY SALE',
    tagline: 'Your passport to premium style',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200',
    link: '/sale',
    buttonText: 'Shop Sale',
  };

  const slides = [
    defaultSlide,
    ...featuredProducts.slice(0, 3).map((p) => ({
      title: p.name,
      subtitle: p.brand || 'BELLEDONNE',
      badge: p.discountPercentage && p.discountPercentage > 0 ? `${Math.round(p.discountPercentage)}% OFF` : 'HOT DEAL',
      tagline: p.shortDescription || p.description || 'Exclusive Collection',
      image: p.image || (p.images?.[0]) || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200',
      link: `/product/${p.id}`,
      buttonText: 'Shop Now',
    })),
  ];



  if (error && products.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchProducts()} className="mt-24 mx-4" />;
  }

  return (
    <div className="bg-[#F8F8F8] min-h-screen">
      {/* ── Reconnecting banner ─────────────────────── */}
      {isRecovering && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium py-1.5 px-4">
          <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Reconnecting…
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-3 md:px-6 lg:px-10 py-3 md:py-5 space-y-5 md:space-y-8">

        {/* ── Search bar (mobile only — desktop has it in navbar) ── */}
        <div className="md:hidden">
          <BlinkitSearchBar placeholder="Search for products, brands..." />
        </div>



        {/* ── Banner carousel ──────────────────────────── */}
        <BlinkitBanner slides={slides} />

        {/* ── Bestsellers section ──────────────────────── */}
        <section>
          <SectionHeader title="🏆 Bestsellers" subtitle="Most loved by our customers" seeAllLink="/collection" />
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : bestsellers.length > 0 ? (
            <>
              {/* Mobile: horizontal scroll */}
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar md:hidden pb-1">
                {bestsellers.slice(0, 10).map((product) => (
                  <div key={product.id} className="min-w-[150px] max-w-[160px]">
                    <BlinkitProductCard product={product} />
                  </div>
                ))}
              </div>
              {/* Desktop: grid */}
              <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-2.5">
                {bestsellers.slice(0, 10).map((product) => (
                  <BlinkitProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {products.slice(0, 10).map((product) => (
                <BlinkitProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* ── Coupon row ───────────────────────────────── */}
        {featuredCoupons.length > 0 && (
          <section>
            <SectionHeader title="🎟️ Exclusive Offers" subtitle="Copy & apply at checkout" />
            <BlinkitCouponRow coupons={featuredCoupons} onCopy={handleCopyCode} copiedCode={copiedCode} />
          </section>
        )}

        {/* ── Dynamic Blinkit-style Category Sections ── */}
        {isCategoriesLoading ? (
          <section className="space-y-4">
            <SectionHeader title="🛍️ Shop by Category" />
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white rounded-2xl border border-gray-100 p-2 flex flex-col items-center justify-between shadow-sm animate-pulse">
                  <div className="w-full aspect-square bg-gray-50 rounded-xl" />
                  <div className="h-3 w-12 bg-gray-100 rounded-md mt-2" />
                </div>
              ))}
            </div>
          </section>
        ) : (
          categories.map((parentCat) => {
            if (!parentCat.children || parentCat.children.length === 0) return null;
            return (
              <section key={parentCat.id} className="space-y-4">
                <SectionHeader title={`🛍️ ${parentCat.name}`} subtitle={parentCat.description} seeAllLink={`/collection?category=${encodeURIComponent(parentCat.name)}`} />
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5 md:gap-4">
                  {parentCat.children.map((subCat) => (
                    <CategoryCard key={subCat.id} subCat={subCat} />
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* ── Apparel Highlights ───────────────────────── */}
        {(isLoading || apparelHighlights.length > 0) && (
          <section>
            <SectionHeader title="👗 Apparel Highlights" subtitle="Premium fabrics & timeless styles" seeAllLink="/collection?productType=apparel" />
            {isLoading ? (
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="min-w-[150px]"><ProductCardSkeleton /></div>)}
              </div>
            ) : (
              <>
                {/* Mobile: horizontal scroll */}
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar md:hidden pb-1">
                  {apparelHighlights.map((product) => (
                    <div key={product.id} className="min-w-[150px] max-w-[160px]">
                      <BlinkitProductCard product={product} />
                    </div>
                  ))}
                </div>
                {/* Desktop: grid */}
                <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {apparelHighlights.map((product) => (
                    <BlinkitProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Tech & Home promo banners ────────────────── */}
        <section>
          <SectionHeader title="⚡ Deals of the Day" seeAllLink="/sale" seeAllLabel="View all deals" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { label: '3-Day Delivery', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600', link: '/cart', color: '#E8F5E9' },
              { label: 'Weekly Sale', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600', link: '/sale', color: '#FFF8E1' },
              { label: 'Flash Deals', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600', link: '/collection?promo=flash-deals', color: '#FFF3E0' },
            ].map((promo) => (
              <Link key={promo.label} to={promo.link} className="relative rounded-2xl overflow-hidden group h-28 shadow-sm hover:shadow-md transition-shadow">
                <img src={promo.image} alt={promo.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center px-4">
                  <span className="text-white text-sm font-bold drop-shadow-sm">{promo.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Tech & Home Products ─────────────────────── */}
        {(isLoading || techHome.length > 0) && (
          <section className="pb-4">
            <SectionHeader title="📱 Tech & Home" seeAllLink="/collection?productType=electronics" />
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : (
              <>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar md:hidden pb-1">
                  {techHome.slice(0, 5).map((product) => (
                    <div key={product.id} className="min-w-[150px] max-w-[160px]">
                      <BlinkitProductCard product={product} />
                    </div>
                  ))}
                </div>
                <div className="hidden md:grid grid-cols-5 gap-2.5">
                  {techHome.slice(0, 5).map((product) => (
                    <BlinkitProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
