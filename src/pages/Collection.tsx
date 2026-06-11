import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Product } from '../types/product';
import { getAllProducts, searchProducts } from '../services/productService';
import { ProductCardSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';
import { useWishlist } from '../context/WishlistContext';
import { useNetworkRecovery } from '../hooks/useNetworkRecovery';
import BlinkitProductCard from '../components/blinkit/BlinkitProductCard';
import FilterBottomSheet from '../components/blinkit/FilterBottomSheet';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  children: Category[];
}

export default function Collection() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || queryParams.get('search');
  const departmentQuery = queryParams.get('department');
  const categoryQuery = queryParams.get('category');
  const mainCategoryQuery = queryParams.get('mainCategory');
  const promoQuery = queryParams.get('promo');
  const subcategoriesQuery = queryParams.get('subcategories');
  const minPriceQuery = queryParams.get('minPrice');
  const maxPriceQuery = queryParams.get('maxPrice');

  const [sortBy, setSortBy] = useState('Recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const hasFetchedOnce = useRef(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('all');

  // Categories API State
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (subcategoriesQuery) return subcategoriesQuery.split(',');
    if (categoryQuery) return [categoryQuery];
    return [];
  });

  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [sliderPrice, setSliderPrice] = useState<[number, number]>(() => {
    const min = minPriceQuery ? parseInt(minPriceQuery) : 0;
    const max = maxPriceQuery ? parseInt(maxPriceQuery) : 50000;
    return [min, max];
  });

  const [selectedSizes, setSelectedSizes] = useState<(string | number)[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    departmentQuery ? [departmentQuery] : []
  );

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Helper to recursively find category by slug
  const findCategoryBySlug = useCallback((slug: string, catList: Category[] = categories): Category | null => {
    for (const cat of catList) {
      if (cat.slug.toLowerCase() === slug.toLowerCase()) {
        return cat;
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryBySlug(slug, cat.children);
        if (found) return found;
      }
    }
    return null;
  }, [categories]);

  // Helper to recursively find category by name
  const findCategoryByName = useCallback((name: string, catList: Category[] = categories): Category | null => {
    for (const cat of catList) {
      if (cat.name.toLowerCase() === name.toLowerCase()) {
        return cat;
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryByName(name, cat.children);
        if (found) return found;
      }
    }
    return null;
  }, [categories]);

  // URL State Sync
  const updateURL = useCallback((selectedCats: string[], minP: number, maxP: number, mainCat: string = selectedMainCategory) => {
    const params = new URLSearchParams(window.location.search);

    if (mainCat && mainCat !== 'all') {
      const match = findCategoryByName(mainCat);
      if (match) {
        params.set('mainCategory', match.slug);
      } else {
        params.set('mainCategory', mainCat.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      }
    } else {
      params.delete('mainCategory');
    }

    // Convert category names to slugs
    const selectedSlugs = selectedCats.map(name => {
      const match = findCategoryByName(name);
      return match ? match.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    });

    if (selectedSlugs.length > 0) {
      params.set('subcategories', selectedSlugs.join(','));
    } else {
      params.delete('subcategories');
    }

    if (selectedSlugs.length === 1) {
      params.set('category', selectedSlugs[0]);
    } else {
      params.delete('category');
    }

    if (minP > 0) {
      params.set('minPrice', minP.toString());
    } else {
      params.delete('minPrice');
    }

    if (maxP < 50000) {
      params.set('maxPrice', maxP.toString());
    } else {
      params.delete('maxPrice');
    }

    navigate({ search: params.toString() }, { replace: true });
  }, [navigate, findCategoryByName, selectedMainCategory]);

  // Load categories tree from API
  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const res = await axiosInstance.get('/api/categories/tree');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load categories tree', err);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);



  // Load products list
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

  // Synchronize category selection from URL query params
  useEffect(() => {
    if (categories.length === 0) return;

    const mainCatQuery = queryParams.get('mainCategory');
    const catQuery = queryParams.get('category');
    const subcatsQuery = queryParams.get('subcategories');

    let resolvedMainCategory = 'all';
    let resolvedCategories: string[] = [];

    if (mainCatQuery) {
      const match = findCategoryBySlug(mainCatQuery);
      if (match) {
        resolvedMainCategory = match.name;
      }
    }

    if (catQuery) {
      const match = findCategoryBySlug(catQuery);
      if (match) {
        // Check if it's a parent category
        const isParent = categories.some(c => c.id === match.id);
        if (isParent) {
          resolvedMainCategory = match.name;
          resolvedCategories = [];
        } else {
          // It's a subcategory. Find its parent.
          let parentName = 'all';
          for (const parent of categories) {
            if (parent.children?.some(child => child.id === match.id)) {
              parentName = parent.name;
              break;
            }
          }
          resolvedMainCategory = parentName;
          resolvedCategories = [match.name];
        }
      } else {
        // Fallback to name match just in case
        const nameMatch = findCategoryByName(catQuery);
        if (nameMatch) {
          const isParent = categories.some(c => c.id === nameMatch.id);
          if (isParent) {
            resolvedMainCategory = nameMatch.name;
            resolvedCategories = [];
          } else {
            let parentName = 'all';
            for (const parent of categories) {
              if (parent.children?.some(child => child.id === nameMatch.id)) {
                parentName = parent.name;
                break;
              }
            }
            resolvedMainCategory = parentName;
            resolvedCategories = [nameMatch.name];
          }
        }
      }
    } else if (subcatsQuery) {
      const slugs = subcatsQuery.split(',');
      const names: string[] = [];
      let commonParentName = 'all';

      for (const slug of slugs) {
        const match = findCategoryBySlug(slug) || findCategoryByName(slug);
        if (match) {
          names.push(match.name);
          // Find parent
          for (const parent of categories) {
            if (parent.children?.some(child => child.id === match.id)) {
              commonParentName = parent.name;
              break;
            }
          }
        }
      }

      if (names.length > 0) {
        resolvedCategories = names;
        resolvedMainCategory = commonParentName;
      }
    }

    setSelectedMainCategory(resolvedMainCategory);
    setSelectedCategories(resolvedCategories);
  }, [location.search, categories, findCategoryBySlug, findCategoryByName]);

  useEffect(() => {
    if (departmentQuery) {
      setSelectedDepartments([departmentQuery]);
    } else {
      setSelectedDepartments([]);
    }
  }, [departmentQuery]);

  useNetworkRecovery(useCallback(() => {
    if (!hasFetchedOnce.current) return;
    setIsRecovering(true);
    fetchProducts(true);
  }, [fetchProducts]));

  const sortOptions = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'New Arrivals', 'Best Sellers'];

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(next);
    setCurrentPage(1);
    updateURL(next, sliderPrice[0], sliderPrice[1], selectedMainCategory);
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments((prev) => prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedMainCategory('all');
    setSelectedCategories([]);
    setSelectedPriceRanges([]);
    setSliderPrice([0, 50000]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedDepartments([]);
    setCurrentPage(1);
    updateURL([], 0, 50000, 'all');
  };

  // Helper to map and resolve parent & subcategory names for a product
  const resolveProductCategory = useCallback((product: Product | any) => {
    const name = product.categoryName || product.category || '';

    if (categories.length === 0) {
      return {
        mainCategory: name,
        subCategory: name,
      };
    }

    for (const parent of categories) {
      if (parent.name.toLowerCase() === name.toLowerCase()) {
        return {
          mainCategory: parent.name,
          subCategory: '',
        };
      }
      for (const child of parent.children || []) {
        if (child.name.toLowerCase() === name.toLowerCase()) {
          return {
            mainCategory: parent.name,
            subCategory: child.name,
          };
        }
      }
    }

    return {
      mainCategory: name,
      subCategory: '',
    };
  }, [categories]);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const { mainCategory, subCategory } = resolveProductCategory(p);

    if (selectedMainCategory !== 'all') {
      if (!mainCategory || mainCategory.toLowerCase() !== selectedMainCategory.toLowerCase()) return false;
    }
    if (promoQuery === 'clearance' && (!p.discount || p.discount < 25)) return false;
    if (promoQuery === 'flash-deals' && (!p.discount || p.discount === 0)) return false;
    if (promoQuery === 'last-chance' && (!p.discount || p.discount < 15)) return false;

    // Filter by departments (Men, Women, Unisex)
    if (selectedDepartments.length > 0) {
      const matchesGender = p.gender && selectedDepartments.includes(p.gender);
      const matchesMainCat = mainCategory && selectedDepartments.some(dept => mainCategory.toLowerCase() === dept.toLowerCase());
      if (!matchesGender && !matchesMainCat) return false;
    }

    // Filter by sub-categories
    if (selectedCategories.length > 0) {
      if (!subCategory || !selectedCategories.includes(subCategory)) return false;
    }

    // Filter by Price Option (checkboxes)
    let checkboxLimit = Infinity;
    if (selectedPriceRanges.length > 0) {
      const limits = selectedPriceRanges.map(range => {
        if (range.includes('299')) return 299;
        if (range.includes('499')) return 499;
        if (range.includes('999') && !range.includes('9,999')) return 999;
        if (range.includes('1,999')) return 1999;
        if (range.includes('4,999')) return 4999;
        if (range.includes('9,999')) return 9999;
        return Infinity;
      });
      checkboxLimit = Math.max(...limits);
    }
    if (p.price > checkboxLimit) return false;

    // Filter by Price Slider
    if (p.price < sliderPrice[0] || p.price > sliderPrice[1]) return false;

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
  const activeFilterCount = selectedCategories.length + selectedDepartments.length +
    selectedPriceRanges.length + (sliderPrice[0] > 0 || sliderPrice[1] < 50000 ? 1 : 0);

  // Render unified Filter Controls panel
  const renderFilterControls = () => {
    const allSubCategories = selectedMainCategory === 'all'
      ? categories.flatMap(cat => cat.children || [])
      : (categories.find(c => c.name.toLowerCase() === selectedMainCategory.toLowerCase())?.children || []);

    return (
      <div className="space-y-6">
        {/* Sub-categories Section */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Categories
          </h3>
          {isCategoriesLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          ) : allSubCategories.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No sub-categories found.</p>
          ) : (
            <div className="space-y-2.5 pr-1">
              {allSubCategories.map((sub) => {
                const isChecked = selectedCategories.includes(sub.name);
                const count = products.filter(p => {
                  const resolved = resolveProductCategory(p);
                  return resolved.subCategory === sub.name;
                }).length;

                return (
                  <label key={sub.id} className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategory(sub.name)}
                      className="w-4 h-4 rounded border-gray-300 text-[#0C831F] focus:ring-[#0C831F] accent-[#0C831F] cursor-pointer"
                    />
                    <span className="group-hover:text-gray-900 transition-colors flex-1 truncate">
                      {sub.name}
                    </span>
                    <span className="text-gray-400 font-normal">
                      ({count})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Price Range Checkboxes Section */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Price Range
          </h3>
          <div className="space-y-2.5">
            {[
              'Under ₹299',
              'Under ₹499',
              'Under ₹999',
              'Under ₹1,999',
              'Under ₹4,999',
              'Under ₹9,999'
            ].map((range) => {
              const isChecked = selectedPriceRanges.includes(range);
              return (
                <label key={range} className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const next = isChecked
                        ? selectedPriceRanges.filter((r) => r !== range)
                        : [...selectedPriceRanges, range];
                      setSelectedPriceRanges(next);
                      setCurrentPage(1);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[#0C831F] focus:ring-[#0C831F] accent-[#0C831F] cursor-pointer"
                  />
                  <span className="group-hover:text-gray-900 transition-colors">
                    {range}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Price Slider Section */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Price Slider
          </h3>
          <div className="flex justify-between items-center text-xs font-bold text-[#0C831F] mb-4 bg-[#E8F5E9] px-2.5 py-1.5 rounded-lg border border-[#C8E6C9]">
            <span>Min: ₹{sliderPrice[0].toLocaleString('en-IN')}</span>
            <span>Max: ₹{sliderPrice[1].toLocaleString('en-IN')}</span>
          </div>

          <div className="relative w-full h-2 bg-gray-200 rounded-lg mt-4 mb-6">
            {/* Highlighted track */}
            <div
              className="absolute h-2 bg-[#0C831F] rounded"
              style={{
                left: `${(sliderPrice[0] / 50000) * 100}%`,
                right: `${100 - (sliderPrice[1] / 50000) * 100}%`
              }}
            />
            <input
              type="range"
              min="0"
              max="50000"
              step="100"
              value={sliderPrice[0]}
              onChange={(e) => {
                const value = Math.min(Number(e.target.value), sliderPrice[1] - 500);
                setSliderPrice([value, sliderPrice[1]]);
                updateURL(selectedCategories, value, sliderPrice[1], selectedMainCategory);
              }}
              className="absolute pointer-events-none appearance-none w-full h-2 bg-transparent top-0 left-0 dual-slider-input outline-none"
              style={{ zIndex: sliderPrice[0] > 40000 ? 5 : 3 }}
            />
            <input
              type="range"
              min="0"
              max="50000"
              step="100"
              value={sliderPrice[1]}
              onChange={(e) => {
                const value = Math.max(Number(e.target.value), sliderPrice[0] + 500);
                setSliderPrice([sliderPrice[0], value]);
                updateURL(selectedCategories, sliderPrice[0], value, selectedMainCategory);
              }}
              className="absolute pointer-events-none appearance-none w-full h-2 bg-transparent top-0 left-0 dual-slider-input outline-none"
              style={{ zIndex: 4 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-bold">
            <span>₹0</span>
            <span>₹50,000</span>
          </div>
        </div>
      </div>
    );
  };

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
            <button
              onClick={() => { setSelectedMainCategory('all'); setSelectedCategories([]); setCurrentPage(1); updateURL([], sliderPrice[0], sliderPrice[1], 'all'); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${selectedMainCategory === 'all'
                ? 'bg-[#0C831F] text-white border-[#0C831F]'
                : 'bg-white text-gray-700 border-[#E8E8E8] hover:border-[#0C831F] hover:text-[#0C831F]'
                }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedMainCategory(cat.name);
                  setSelectedCategories([]);
                  setCurrentPage(1);
                  updateURL([], sliderPrice[0], sliderPrice[1], cat.name);
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${selectedMainCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-[#0C831F] text-white border-[#0C831F]'
                  : 'bg-white text-gray-700 border-[#E8E8E8] hover:border-[#0C831F] hover:text-[#0C831F]'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Filter & Sort buttons */}
          <div className="flex gap-1.5 flex-shrink-0">
            {/* Mobile-only Filter Button */}
            <button
              onClick={() => setIsFilterSheetOpen(true)}
              className={`md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${activeFilterCount > 0
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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-medium ${sortBy === option
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
          <div className="flex flex-wrap gap-1.5 mb-4">
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
            {selectedPriceRanges.map((r) => (
              <button key={r} onClick={() => setSelectedPriceRanges(prev => prev.filter(x => x !== r))} className="flex items-center gap-1 bg-[#E8F5E9] text-[#0C831F] text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-[#C8E6C9] transition-colors">
                {r} <X className="w-3 h-3" />
              </button>
            ))}
            {(sliderPrice[0] > 0 || sliderPrice[1] < 50000) && (
              <button onClick={() => { setSliderPrice([0, 50000]); updateURL(selectedCategories, 0, 50000, selectedMainCategory); }} className="flex items-center gap-1 bg-[#E8F5E9] text-[#0C831F] text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-[#C8E6C9] transition-colors">
                ₹{sliderPrice[0]} - ₹{sliderPrice[1]} <X className="w-3 h-3" />
              </button>
            )}
            <button onClick={clearAllFilters} className="text-xs font-semibold text-[#E53935] px-2 py-1 hover:underline">
              Clear all
            </button>
          </div>
        )}

        {/* ── Layout Grid ───────────────────────────── */}
        <div className="flex gap-6 items-start">
          {/* Left Sidebar filter layout - visible on desktop and tablet, hidden on mobile */}
          <div
            className="hidden md:block w-64 flex-shrink-0 bg-white rounded-2xl border border-gray-100 p-5 sticky overflow-y-auto custom-scrollbar shadow-sm"
            style={{ maxHeight: 'calc(100vh - 6rem)', top: '5rem' }}
          >
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <span className="text-sm font-bold text-gray-900">Filters</span>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs font-bold text-[#E53935] hover:underline">
                  Clear All
                </button>
              )}
            </div>
            {renderFilterControls()}
          </div>

          {/* Product grid / list */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : error ? (
              <div className="flex justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <ErrorState message={error} onRetry={() => window.location.reload()} />
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-sm text-gray-500 max-w-sm mb-6 px-4">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
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
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold border transition-colors ${currentPage === page
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
              <p className="text-center text-xs text-gray-400 mt-4 mb-6">
                Showing {Math.min(currentPage * PAGE_SIZE, sortedProducts.length)} of {sortedProducts.length} products
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter bottom sheet drawer for mobile ────────────────────── */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        onClearAll={clearAllFilters}
        onApply={() => setIsFilterSheetOpen(false)}
        hasActiveFilters={activeFilterCount > 0}
        totalResults={filteredProducts.length}
      >
        {renderFilterControls()}
      </FilterBottomSheet>
    </div>
  );
}
