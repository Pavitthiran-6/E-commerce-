import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Product } from '../data/products';
import { getAllProducts, searchProducts } from '../services/productService';
import { ProductCardSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';
import { SparkleHeart } from '../components/icons/SparkleHeart';
import { useWishlist } from '../context/WishlistContext';
import { useNetworkRecovery } from '../hooks/useNetworkRecovery';

export default function Collection() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q');
  const departmentQuery = queryParams.get('department');
  const promoQuery = queryParams.get('promo');
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

  const [sortBy, setSortBy] = useState('Recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const hasFetchedOnce = useRef(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [productType, setProductType] = useState<'all' | 'footwear' | 'apparel' | 'electronics'>('all');


  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError('');
    }
    try {
      const data = searchQuery ? await searchProducts(searchQuery) : await getAllProducts();
      setProducts(data);
      setError('');
    } catch (err) {
      if (products.length === 0) setError('Failed to load products');
    } finally {
      setIsLoading(false);
      setIsRecovering(false);
    }
  }, [searchQuery, products.length]);

  useEffect(() => {
    hasFetchedOnce.current = true;
    fetchProducts();
  }, [searchQuery]);

  useNetworkRecovery(useCallback(() => {
    if (!hasFetchedOnce.current) return;
    setIsRecovering(true);
    fetchProducts(true);
  }, [fetchProducts]));

  // Filter Configurations based on Product Type
  const filterConfigs = {
    all: {
      title: "All Products",
      categories: [
        { name: 'Sneakers', count: products.filter(p => p.category === 'Sneakers').length.toString() },
        { name: 'Boots', count: products.filter(p => p.category === 'Boots').length.toString() },
        { name: 'Heels', count: products.filter(p => p.category === 'Heels').length.toString() },
        { name: 'Accessories', count: products.filter(p => p.category === 'Accessories').length.toString() },
        { name: 'Shirts', count: products.filter(p => p.category === 'Shirts').length.toString() },
        { name: 'Trousers', count: products.filter(p => p.category === 'Trousers').length.toString() },
        { name: 'Innerwear', count: products.filter(p => p.category === 'Innerwear').length.toString() },
        { name: 'Audio', count: products.filter(p => p.category === 'Audio').length.toString() },
        { name: 'Mobiles', count: products.filter(p => p.category === 'Mobiles').length.toString() },
        { name: 'Kitchen Items', count: products.filter(p => p.category === 'Kitchen Items').length.toString() }
      ],
      sizes: [],
      hasColor: true,
      extraFilter: null
    },
    footwear: {
      title: "Men's Footwear",
      categories: [
        { name: 'Sneakers', count: products.filter(p => p.category === 'Sneakers').length.toString() },
        { name: 'Boots', count: products.filter(p => p.category === 'Boots').length.toString() },
        { name: 'Heels', count: products.filter(p => p.category === 'Heels').length.toString() },
        { name: 'Accessories', count: products.filter(p => p.category === 'Accessories').length.toString() }
      ],
      sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
      hasColor: true,
      extraFilter: null
    },
    apparel: {
      title: "Apparel Collection",
      categories: [
        { name: 'Shirts', count: products.filter(p => p.category === 'Shirts').length.toString() },
        { name: 'Trousers', count: products.filter(p => p.category === 'Trousers').length.toString() },
        { name: 'Innerwear', count: products.filter(p => p.category === 'Innerwear').length.toString() }
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      hasColor: true,
      extraFilter: null
    },
    electronics: {
      title: "Electronics & Appliances",
      categories: [
        { name: 'Audio', count: products.filter(p => p.category === 'Audio').length.toString() },
        { name: 'Mobiles', count: products.filter(p => p.category === 'Mobiles').length.toString() },
        { name: 'Kitchen Items', count: products.filter(p => p.category === 'Kitchen Items').length.toString() }
      ],
      sizes: [],
      hasColor: true,
      extraFilter: {
        title: 'Brand',
        options: ['Apple', 'Sony', 'Philips']
      }
    }
  };

  const currentConfig = filterConfigs[productType];

  const pageTitle = promoQuery === 'clearance' ? 'Clearance' 
                  : promoQuery === 'flash-deals' ? 'Flash Deals' 
                  : promoQuery === 'last-chance' ? 'Last Chance' 
                  : currentConfig.title;

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedSizes, setSelectedSizes] = useState<(string | number)[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedExtra, setSelectedExtra] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    departmentQuery ? [departmentQuery] : []
  );

  useEffect(() => {
    if (departmentQuery) {
      setSelectedDepartments([departmentQuery]);
    }
  }, [departmentQuery]);

  const sortOptions = [
    'Recommended',
    'Price: Low to High',
    'Price: High to Low',
    'New Arrivals',
    'Best Sellers',
    'Customer Rating'
  ];

  // Helper functions for filters
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const handlePriceChange = (index: 0 | 1, value: number) => {
    setPriceRange(prev => {
      const newRange = [...prev] as [number, number];
      newRange[index] = value;
      if (index === 0 && newRange[0] > newRange[1]) newRange[0] = newRange[1];
      if (index === 1 && newRange[1] < newRange[0]) newRange[1] = newRange[0];
      return newRange;
    });
  };

  const toggleSize = (size: string | number) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const toggleExtra = (option: string) => {
    setSelectedExtra(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]);
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 10000]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedExtra([]);
    setSelectedDepartments([]);
  };

  // Helper for rendering stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center text-[#ffc107] text-[10px]">
        <span>★</span><span>★</span><span>★</span><span>★</span><span className="text-gray-300">★</span>
        <span className="text-gray-500 text-[9px] ml-1">({rating})</span>
      </div>
    );
  };

  // When changing product type, clear filters to avoid invalid state (like size '42' on electronics)
  const handleProductTypeChange = (type: 'all' | 'footwear' | 'apparel' | 'electronics') => {
    setProductType(type);
    clearAllFilters();
    setIsCategoriesExpanded(false);
  };

  // Compute filtered products
  const baseProducts = products;

  const filteredProducts = baseProducts.filter(p => {
    // Only show products matching the active demo switcher tab
    if (productType !== 'all' && p.productType !== productType) return false;

    // Check Promo
    if (promoQuery === 'clearance' && (!p.discount || p.discount < 25)) return false;
    if (promoQuery === 'flash-deals' && (!p.discount || p.discount === 0)) return false;
    if (promoQuery === 'last-chance' && (!p.discount || p.discount < 15)) return false;

    // Check Department
    if (selectedDepartments.length > 0 && (!p.gender || !selectedDepartments.includes(p.gender))) return false;

    // Check Category
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;

    // Check Price Range
    const maxPriceLimit = priceRange[1] === 10000 ? Infinity : priceRange[1];
    if (p.price < priceRange[0] || p.price > maxPriceLimit) return false;

    // Check Size
    if (selectedSizes.length > 0 && !p.sizes.some(s => selectedSizes.includes(s))) return false;

    // Check Color
    if (selectedColors.length > 0 && !p.colors.some(c => selectedColors.includes(c))) return false;

    return true;
  });

  // Apply Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'Price: Low to High') return a.price - b.price;
    if (sortBy === 'Price: High to Low') return b.price - a.price;
    return 0; // Default/Recommended
  });

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <main className="max-w-container mx-auto px-6 md:px-margin-edge pb-section-gap pt-8 md:pt-12">

      {/* Breadcrumbs */}
      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/collection" className="hover:text-primary transition-colors">Categories</Link>
        <span className="mx-2">/</span>
        <span className="text-primary">{pageTitle}</span>
      </div>

      {/* Editorial Heading */}
      <section className="pb-8 border-b border-outline-variant/30 mb-8">
        <h1 className="font-headline-display text-4xl md:text-5xl text-primary mb-4">{pageTitle}</h1>
        <p className="font-body-lg text-on-surface-variant max-w-3xl">
          Explore our full range of meticulously curated products, designed for your lifestyle.
        </p>
      </section>

      {/* Top Bar: Result Count & Sort */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-30">
        <div className="text-xs text-gray-500 font-medium uppercase tracking-widest">
          Showing {sortedProducts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, sortedProducts.length)} of {sortedProducts.length} products
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Category Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium uppercase tracking-widest hidden sm:inline">View:</span>
            <button onClick={() => handleProductTypeChange('all')} className={`px-3 py-1.5 border transition-colors ${productType === 'all' ? 'bg-charcoal-stone text-white border-charcoal-stone' : 'bg-white border-outline-variant text-charcoal-stone hover:border-charcoal-stone'}`}>All</button>
            <button onClick={() => handleProductTypeChange('footwear')} className={`px-3 py-1.5 border transition-colors ${productType === 'footwear' ? 'bg-charcoal-stone text-white border-charcoal-stone' : 'bg-white border-outline-variant text-charcoal-stone hover:border-charcoal-stone'}`}>Footwear</button>
            <button onClick={() => handleProductTypeChange('apparel')} className={`px-3 py-1.5 border transition-colors ${productType === 'apparel' ? 'bg-charcoal-stone text-white border-charcoal-stone' : 'bg-white border-outline-variant text-charcoal-stone hover:border-charcoal-stone'}`}>Apparel</button>
            <button onClick={() => handleProductTypeChange('electronics')} className={`px-3 py-1.5 border transition-colors ${productType === 'electronics' ? 'bg-charcoal-stone text-white border-charcoal-stone' : 'bg-white border-outline-variant text-charcoal-stone hover:border-charcoal-stone'}`}>Tech & Kitchen</button>
          </div>

          <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-widest hidden sm:inline">Sort by:</span>

            {/* Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-between w-48 bg-white border border-outline-variant/50 text-sm font-medium px-4 py-2 hover:border-primary transition-colors focus:outline-none focus:border-primary"
              >
                <span className="truncate">{sortBy}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isSortOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsSortOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-outline-variant/50 shadow-xl z-20 py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === option ? 'bg-primary/5 text-primary font-medium' : 'text-on-surface-variant hover:bg-gray-50 hover:text-primary'}`}
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
      </section>


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Left Sidebar (Filters) */}
        <aside 
          className="hidden lg:flex flex-col gap-10 pr-4 lg:sticky lg:top-32 h-fit max-h-[calc(100vh-12rem)] overflow-y-auto overscroll-y-contain custom-scrollbar pb-24"
          data-lenis-prevent
        >

          {/* Active Filters (Moved inside sidebar) */}
          {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000 || selectedSizes.length > 0 || selectedColors.length > 0 || selectedExtra.length > 0 || selectedDepartments.length > 0) && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-widest mr-2">Active Filters:</span>

                {selectedCategories.map(cat => (
                  <button key={cat} onClick={() => toggleCategory(cat)} className="flex items-center gap-1 text-xs border border-outline-variant/50 px-3 py-1.5 rounded-full hover:border-primary transition-colors bg-white">
                    {cat} <span className="ml-1 text-gray-400">×</span>
                  </button>
                ))}

                {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                  <button onClick={() => setPriceRange([0, 10000])} className="flex items-center gap-1 text-xs border border-outline-variant/50 px-3 py-1.5 rounded-full hover:border-primary transition-colors bg-white">
                    ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()} <span className="ml-1 text-gray-400">×</span>
                  </button>
                )}

                {selectedSizes.map(size => (
                  <button key={size} onClick={() => toggleSize(size)} className="flex items-center gap-1 text-xs border border-outline-variant/50 px-3 py-1.5 rounded-full hover:border-primary transition-colors bg-white">
                    {currentConfig.title === "Men's Footwear" ? `Size ${size}` : size} <span className="ml-1 text-gray-400">×</span>
                  </button>
                ))}

                {selectedColors.map(color => (
                  <button key={color} onClick={() => toggleColor(color)} className="flex items-center gap-1 text-xs border border-outline-variant/50 px-3 py-1.5 rounded-full hover:border-primary transition-colors bg-white">
                    Color <div className="w-2.5 h-2.5 rounded-full border border-gray-300 ml-1" style={{ backgroundColor: color }}></div> <span className="ml-1 text-gray-400">×</span>
                  </button>
                ))}

                {selectedExtra.map(extra => (
                  <button key={extra} onClick={() => toggleExtra(extra)} className="flex items-center gap-1 text-xs border border-outline-variant/50 px-3 py-1.5 rounded-full hover:border-primary transition-colors bg-white">
                    {extra} <span className="ml-1 text-gray-400">×</span>
                  </button>
                ))}

                {selectedDepartments.map(dept => (
                  <button key={dept} onClick={() => toggleDepartment(dept)} className="flex items-center gap-1 text-xs border border-outline-variant/50 px-3 py-1.5 rounded-full hover:border-primary transition-colors bg-white">
                    {dept} <span className="ml-1 text-gray-400">×</span>
                  </button>
                ))}

                <button onClick={clearAllFilters} className="text-xs text-primary underline underline-offset-2 ml-1 hover:text-primary/70 transition-colors">
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="flex flex-col gap-4">
            <h3 className="font-label-caps text-xs text-primary uppercase tracking-widest border-b border-outline-variant/30 pb-2">Category</h3>
            <div className="flex flex-col gap-3 text-sm">
              {(isCategoriesExpanded ? currentConfig.categories : currentConfig.categories.slice(0, 4)).map(cat => (
                <label key={cat.name} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleCategory(cat.name)}>
                  <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedCategories.includes(cat.name) ? 'border-primary' : 'border-outline-variant group-hover:border-primary'}`}>
                    {selectedCategories.includes(cat.name) && <div className="w-2 h-2 bg-primary"></div>}
                  </div>
                  <span className={`${selectedCategories.includes(cat.name) ? 'text-primary font-medium' : 'text-on-surface-variant group-hover:text-primary transition-colors'}`}>
                    {cat.name} <span className="text-gray-400 font-normal">({cat.count})</span>
                  </span>
                </label>
              ))}
              {currentConfig.categories.length > 4 && (
                <button 
                  onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  className="text-left text-primary hover:text-primary/80 transition-colors text-xs font-medium uppercase tracking-widest mt-1"
                >
                  {isCategoriesExpanded ? '- Show Less' : '+ Show More'}
                </button>
              )}
            </div>
          </div>


          {/* Price Range */}
          <div className="flex flex-col gap-4">
            <h3 className="font-label-caps text-xs text-primary uppercase tracking-widest border-b border-outline-variant/30 pb-2">Price Range</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>₹{priceRange[0].toLocaleString()}</span>
                <span>₹{priceRange[1].toLocaleString()}</span>
              </div>
              <div className="relative h-1 bg-gray-200 rounded mt-2">
                <div 
                  className="absolute h-full bg-primary rounded" 
                  style={{ 
                    left: `${(priceRange[0] / 10000) * 100}%`, 
                    right: `${100 - (priceRange[1] / 10000) * 100}%` 
                  }}
                ></div>
                <input 
                  type="range" 
                  min="0" 
                  max="10000" 
                  step="100"
                  value={priceRange[0]} 
                  onChange={(e) => handlePriceChange(0, parseInt(e.target.value))}
                  className="absolute w-full -top-1.5 h-4 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:rounded-full"
                />
                <input 
                  type="range" 
                  min="0" 
                  max="10000" 
                  step="100"
                  value={priceRange[1]} 
                  onChange={(e) => handlePriceChange(1, parseInt(e.target.value))}
                  className="absolute w-full -top-1.5 h-4 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Quick Select</span>
                <div className="grid grid-cols-2 gap-2">
                  {[299, 499, 999, 2999].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setPriceRange([0, amount])}
                      className={`border py-2 text-xs transition-colors cursor-pointer text-center font-medium ${priceRange[0] === 0 && priceRange[1] === amount ? 'border-primary bg-primary text-white' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary bg-white'}`}
                    >
                      Under ₹{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Filter 1: Size (Only if applicable) */}
          {currentConfig.sizes.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-label-caps text-xs text-primary uppercase tracking-widest border-b border-outline-variant/30 pb-2">Size</h3>
              <div className="grid grid-cols-4 gap-2">
                {currentConfig.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`border py-2 text-xs transition-colors ${selectedSizes.includes(size) ? 'border-primary bg-primary text-white' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary bg-white'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Filter 2: Extra Filters (e.g. Brands for Electronics) */}
          {currentConfig.extraFilter && (
            <div className="flex flex-col gap-4">
              <h3 className="font-label-caps text-xs text-primary uppercase tracking-widest border-b border-outline-variant/30 pb-2">{currentConfig.extraFilter.title}</h3>
              <div className="flex flex-col gap-3 text-sm">
                {currentConfig.extraFilter.options.map(option => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleExtra(option)}>
                    <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedExtra.includes(option) ? 'border-primary' : 'border-outline-variant group-hover:border-primary'}`}>
                      {selectedExtra.includes(option) && <div className="w-2 h-2 bg-primary"></div>}
                    </div>
                    <span className={`${selectedExtra.includes(option) ? 'text-primary font-medium' : 'text-on-surface-variant group-hover:text-primary transition-colors'}`}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Color (If applicable) */}
          {currentConfig.hasColor && (
            <div className="flex flex-col gap-4">
              <h3 className="font-label-caps text-xs text-primary uppercase tracking-widest border-b border-outline-variant/30 pb-2">Color</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { hex: '#fff', title: 'White' },
                  { hex: '#000', title: 'Black' },
                  { hex: '#c2b280', title: 'Sand' },
                  { hex: '#228b22', title: 'Green' },
                  { hex: '#8b4513', title: 'Brown' },
                  { hex: '#000080', title: 'Navy' }
                ].map(color => (
                  <button
                    key={color.hex}
                    onClick={() => toggleColor(color.hex)}
                    className={`w-6 h-6 rounded-full border transition-all ${selectedColors.includes(color.hex) ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-gray-300 hover:border-primary'}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.title}
                  ></button>
                ))}
              </div>
            </div>
          )}

        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {isLoading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="product-card group cursor-pointer flex flex-col">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : error ? (
              <div className="col-span-full">
                <ErrorState message={error} onRetry={() => window.location.reload()} />
              </div>
            ) : sortedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).length === 0 ? (
              <div className="col-span-full py-32 text-center flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-gray-300 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="font-serif text-xl text-charcoal-stone mb-2">No products found</h3>
                <p className="text-gray-500 text-sm max-w-sm">We couldn't find any products matching your selected filters. Try adjusting or clearing your filters.</p>
                <button onClick={clearAllFilters} className="mt-6 border border-primary text-primary px-6 py-2 text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-colors">
                  Clear All Filters
                </button>
              </div>
            ) : (
              paginatedProducts.map((product, index) => (
                <Link to={`/product/${product.id}`} key={product.id} className="product-card group cursor-pointer flex flex-col">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#f6f5f0] flex items-center justify-center mb-4">
                    <img
                      alt={product.name}
                      className="product-img object-cover object-center w-full h-full transition-transform ease-out duration-500 group-hover:scale-105 group-hover:opacity-90 mix-blend-multiply"
                      src={product.image}
                    />
                    <div className="absolute inset-0 bg-surface-tint/0 group-hover:bg-surface-tint/5 transition-colors duration-400"></div>
                    <button 
                      onClick={(e) => handleWishlistToggle(e, product)}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-charcoal-stone hover:scale-110 transition-transform z-10"
                      title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <SparkleHeart 
                        filled={isInWishlist(product.id)}
                        className={`w-6 h-6 ${isInWishlist(product.id) ? 'text-red-500' : 'text-black'}`} 
                      />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-serif text-[17px] text-charcoal-stone">{product.name}</h3>
                    <span className="text-xl font-bold tracking-wider text-charcoal-stone">{typeof product.price === 'number' ? `₹${product.price.toLocaleString('en-IN')}` : product.price}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
              You've viewed {Math.min(currentPage * PAGE_SIZE, sortedProducts.length)} of {sortedProducts.length} products
            </div>
            <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(currentPage / totalPages) * 100}%` }}></div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`w-10 h-10 flex items-center justify-center border transition-colors ${currentPage === 1 ? 'border-outline-variant/30 text-gray-400 cursor-not-allowed bg-white' : 'border-outline-variant/50 text-primary hover:border-primary bg-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="15.75 19.5 8.25 12l7.5-7.5" /></svg>
              </button>

              {getPageNumbers().map((page, idx) => (
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`w-10 h-10 flex items-center justify-center border transition-colors font-medium text-sm ${currentPage === page ? 'border-primary bg-primary text-white' : 'border-outline-variant/30 text-primary hover:border-primary bg-white'}`}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 flex items-center justify-center border transition-colors ${currentPage === totalPages ? 'border-outline-variant/30 text-gray-400 cursor-not-allowed bg-white' : 'border-outline-variant/50 text-primary hover:border-primary bg-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
