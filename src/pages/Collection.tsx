import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Product } from '../types/product';
import { getAllProducts, searchProducts } from '../services/productService';
import { ProductCardSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';
import { useWishlist } from '../context/WishlistContext';
import { useNetworkRecovery } from '../hooks/useNetworkRecovery';
import BlinkitProductCard from '../components/blinkit/BlinkitProductCard';
import FilterBottomSheet from '../components/blinkit/FilterBottomSheet';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';

export default function Collection() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q');
  const departmentQuery = queryParams.get('department');
  const categoryQuery = queryParams.get('category');
  const promoQuery = queryParams.get('promo');

  const [sortBy, setSortBy] = useState('Recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const hasFetchedOnce = useRef(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [productType, setProductType] = useState<'all' | 'footwear' | 'apparel' | 'electronics'>('all');

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryQuery ? [categoryQuery] : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedSizes, setSelectedSizes] = useState<(string | number)[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    departmentQuery ? [departmentQuery] : []
  );

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) { setIsLoading(true); setError(''); }
    try {
      const data = searchQuery ? await searchProducts(searchQuery) : await getAllProducts();
      setProducts(data);
      setError('');
    } catch {
      if (products.length === 0) setError('Failed to load products');
    } finally {
      setIsLoading(false);
      setIsRecovering(false);
    }
  }, [searchQuery, products.length]);

  useEffect(() => {
    hasFetchedOnce.current = true;
    setCurrentPage(1);
    fetchProducts();
  }, [searchQuery]);

  useEffect(() => {
    if (departmentQuery) setSelectedDepartments([departmentQuery]);
  }, [departmentQuery]);

  useEffect(() => {
    if (categoryQuery) {
      setSelectedCategories([categoryQuery]);
    } else {
      setSelectedCategories([]);
    }
  }, [categoryQuery]);

  useNetworkRecovery(useCallback(() => {
    if (!hasFetchedOnce.current) return;
    setIsRecovering(true);
    fetchProducts(true);
  }, [fetchProducts]));

  const sortOptions = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'New Arrivals', 'Best Sellers'];

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
    setCurrentPage(1);
  };
  const toggleSize = (size: string | number) => {
    setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);
    setCurrentPage(1);
  };
  const toggleDepartment = (dept: string) => {
    setSelectedDepartments((prev) => prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]);
    setCurrentPage(1);
  };
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 10000]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedDepartments([]);
    setCurrentPage(1);
  };

  // Category chips for top row (from product data)
  const allCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (productType !== 'all' && p.productType !== productType) return false;
    if (promoQuery === 'clearance' && (!p.discount || p.discount < 25)) return false;
    if (promoQuery === 'flash-deals' && (!p.discount || p.discount === 0)) return false;
    if (promoQuery === 'last-chance' && (!p.discount || p.discount < 15)) return false;
    if (selectedDepartments.length > 0 && (!p.gender || !selectedDepartments.includes(p.gender))) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    const maxPriceLimit = priceRange[1] === 10000 ? Infinity : priceRange[1];
    if (p.price < priceRange[0] || p.price > maxPriceLimit) return false;
    if (selectedSizes.length > 0 && !p.sizes?.some((s) => selectedSizes.includes(s))) return false;
    if (selectedColors.length > 0 && !p.colors?.some((c) => selectedColors.includes(c))) return false;
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'Price: Low to High') return a.price - b.price;
    if (sortBy === 'Price: High to Low') return b.price - a.price;
    return 0;
  });

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const pageTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : promoQuery === 'clearance' ? 'Clearance'
    : promoQuery === 'flash-deals' ? 'Flash Deals'
    : promoQuery === 'last-chance' ? 'Last Chance'
    : departmentQuery ? `${departmentQuery}'s Collection`
    : 'All Products';

  // Active filter count
  const activeFilterCount = selectedCategories.length + selectedDepartments.length + selectedSizes.length +
    (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0);

  // Filter sheet sections
  const filterSections = [
    {
      id: 'department',
      title: 'Department',
      options: ['Men', 'Women', 'Unisex'].map((d) => ({ label: d, value: d })),
      selectedValues: selectedDepartments,
      onToggle: toggleDepartment,
    },
    {
      id: 'category',
      title: 'Category',
      options: allCategories.slice(0, 15).map((c) => ({
        label: c,
        value: c,
        count: products.filter((p) => p.category === c).length,
      })),
      selectedValues: selectedCategories,
      onToggle: toggleCategory,
    },
  ];

  return (
    <div className="bg-[#F8F8F8] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-3 md:px-6 lg:px-10 py-4">

        {/* ── Breadcrumb ─────────────────────────────── */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Link to="/" className="hover:text-[#0C831F] transition-colors font-medium">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{pageTitle}</span>
        </div>

        {/* ── Page heading ───────────────────────────── */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          {!isLoading && (
            <p className="text-xs text-gray-500 mt-0.5">{sortedProducts.length} products</p>
          )}
        </div>

        {/* ── Filter & Sort bar ──────────────────────── */}
        <div className="flex items-center gap-2 mb-4 sticky top-[calc(4rem+2rem)] z-30 bg-[#F8F8F8] py-2 -mx-3 px-3 md:-mx-0 md:px-0 md:static md:bg-transparent md:py-0">
          {/* Category type pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {(['all', 'footwear', 'apparel', 'electronics'] as const).map((type) => (
              <button
                key={type}
                onClick={() => { setProductType(type); clearAllFilters(); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                  productType === type
                    ? 'bg-[#0C831F] text-white border-[#0C831F]'
                    : 'bg-white text-gray-700 border-[#E8E8E8] hover:border-[#0C831F] hover:text-[#0C831F]'
                }`}
              >
                {type === 'all' ? 'All' : type === 'electronics' ? 'Tech & Kitchen' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Filter & Sort buttons */}
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => setIsFilterSheetOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                activeFilterCount > 0
                  ? 'bg-[#0C831F] text-white border-[#0C831F]'
                  : 'bg-white text-gray-700 border-[#E8E8E8] hover:border-[#0C831F]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-white text-gray-700 border-[#E8E8E8] hover:border-[#0C831F] transition-colors"
              >
                Sort
                <ChevronDown className={`w-3 h-3 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-[#E8E8E8] z-20 min-w-[180px] py-1 overflow-hidden">
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-medium ${
                          sortBy === option
                            ? 'bg-[#E8F5E9] text-[#0C831F]'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Active filter chips ────────────────────── */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedDepartments.map((d) => (
              <button key={d} onClick={() => toggleDepartment(d)} className="flex items-center gap-1 bg-[#E8F5E9] text-[#0C831F] text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-[#C8E6C9] transition-colors">
                {d} <X className="w-3 h-3" />
              </button>
            ))}
            {selectedCategories.map((c) => (
              <button key={c} onClick={() => toggleCategory(c)} className="flex items-center gap-1 bg-[#E8F5E9] text-[#0C831F] text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-[#C8E6C9] transition-colors">
                {c} <X className="w-3 h-3" />
              </button>
            ))}
            <button onClick={clearAllFilters} className="text-xs font-semibold text-[#E53935] px-2 py-1 hover:underline">
              Clear all
            </button>
          </div>
        )}

        {/* ── Product grid ───────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {Array.from({ length: 20 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex justify-center py-20">
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              We couldn't find anything matching your filters. Try adjusting them.
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-[#0C831F] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#0A6B19] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {paginatedProducts.map((product) => (
              <BlinkitProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────── */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 pb-4">
            <button
              onClick={() => { setCurrentPage(Math.max(1, currentPage - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E8E8E8] bg-white text-gray-600 disabled:opacity-40 hover:border-[#0C831F] hover:text-[#0C831F] transition-colors"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = totalPages <= 5 ? i + 1 : Math.max(1, currentPage - 2) + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold border transition-colors ${
                    currentPage === page
                      ? 'bg-[#0C831F] text-white border-[#0C831F]'
                      : 'bg-white text-gray-700 border-[#E8E8E8] hover:border-[#0C831F] hover:text-[#0C831F]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => { setCurrentPage(Math.min(totalPages, currentPage + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E8E8E8] bg-white text-gray-600 disabled:opacity-40 hover:border-[#0C831F] hover:text-[#0C831F] transition-colors"
            >
              ›
            </button>
          </div>
        )}

        {/* ── Result summary ─────────────────────────── */}
        {!isLoading && sortedProducts.length > 0 && (
          <p className="text-center text-xs text-gray-400 mb-6">
            Showing {Math.min(currentPage * PAGE_SIZE, sortedProducts.length)} of {sortedProducts.length} products
          </p>
        )}
      </div>

      {/* ── Filter bottom sheet ────────────────────── */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        sections={filterSections}
        onClearAll={clearAllFilters}
        totalResults={filteredProducts.length}
      />
    </div>
  );
}
