import React, { useEffect, useState, useRef } from 'react';
import { getAllProducts } from '../../services/productService';
import axiosInstance from '../../api/axiosInstance';
import type { Product } from '../../types/product';
import { useToast } from '../../context/ToastContext';

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

function CustomDropdown({ value, onChange, options }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 border border-gray-200 rounded-xl bg-white px-3 py-2 cursor-pointer text-gray-700 font-semibold text-xs min-w-[180px] hover:border-gray-300 hover:bg-gray-50 transition-all select-none focus:outline-none"
      >
        <span className="truncate">{value}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-full min-w-[180px] bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 text-xs font-semibold text-gray-700">
          {options.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-between ${
                value === option ? 'bg-gray-50 text-gray-900 font-bold' : ''
              }`}
            >
              {option}
              {value === option && (
                <svg className="w-3.5 h-3.5 text-gray-900 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TAG_BADGES: Record<string, string> = {
  'This Week':           'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Last Week':           'bg-blue-50 text-blue-700 border border-blue-200',
  'Earlier This Month':  'bg-amber-50 text-amber-700 border border-amber-200',
};

const TABS: ('This Week' | 'Last Week' | 'Earlier This Month')[] = [
  'This Week',
  'Last Week',
  'Earlier This Month',
];

const SkeletonRow = () => (
  <tr>
    <td className="px-5 py-4"><div className="w-4 h-4 admin-skeleton rounded" /></td>
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 admin-skeleton rounded-xl flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3.5 admin-skeleton rounded w-36" />
          <div className="h-3 admin-skeleton rounded w-20" />
        </div>
      </div>
    </td>
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-20" /></td>
    <td className="px-5 py-4"><div className="h-4 admin-skeleton rounded w-16" /></td>
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-24" /></td>
    <td className="px-5 py-4"><div className="h-7 admin-skeleton rounded-xl w-44" /></td>
  </tr>
);

export default function ManageNewArrivals() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'This Week' | 'Last Week' | 'Earlier This Month'>('This Week');
  const [isSaving, setIsSaving] = useState(false);

  // Track local updates before saving
  const [updatedTags, setUpdatedTags] = useState<Record<string, string | null>>({});

  // ── Fetch Products ──────────────────────────────────────────────────────────
  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAllProducts();
      setProducts(data);
      // Reset local changes
      setUpdatedTags({});
    } catch {
      setError('Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Get current tag for a product, taking unsaved local updates into account
  const getProductTag = (product: Product): string | null => {
    if (product.id in updatedTags) {
      return updatedTags[product.id];
    }
    return product.arrivalTag || null;
  };

  // Handle checkbox toggle
  const handleCheckboxChange = (product: Product, isChecked: boolean) => {
    setUpdatedTags(prev => ({
      ...prev,
      [product.id]: isChecked ? activeTab : null
    }));
  };

  // Handle dropdown tag assignment
  const handleDropdownChange = (product: Product, selectedValue: string) => {
    const newTag = selectedValue === 'Remove from New Arrivals' ? null : selectedValue;
    setUpdatedTags(prev => ({
      ...prev,
      [product.id]: newTag
    }));
  };

  // Save Changes
  const handleSaveChanges = async () => {
    const dirtyIds = Object.keys(updatedTags);
    if (dirtyIds.length === 0) {
      showToast('No changes to save.', 'info');
      return;
    }

    setIsSaving(true);
    try {
      // Perform all PUT requests in parallel
      await Promise.all(
        dirtyIds.map(id =>
          axiosInstance.put(`/api/admin/products/${id}/arrival-tag`, {
            arrivalTag: updatedTags[id]
          })
        )
      );
      showToast('New Arrivals tags saved successfully!', 'success');
      // Reload products to get synchronized database state
      await load();
    } catch (err: any) {
      showToast('Failed to save changes. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtering: show products tagged with the active tab OR not tagged at all
  const filteredProducts = products.filter(product => {
    const tag = getProductTag(product);
    return tag === activeTab || tag === null;
  });

  const dirtyCount = Object.keys(updatedTags).length;

  return (
    <div className="space-y-5">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Arrivals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Assign products to time groups shown in the New Arrivals section.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {dirtyCount > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-full">
              {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={handleSaveChanges}
            disabled={isSaving || dirtyCount === 0}
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 gap-1">
        {TABS.map(tab => {
          const taggedCount = products.filter(p => getProductTag(p) === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 -mb-px ${
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab}
              {taggedCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  activeTab === tab ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {taggedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Products Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto admin-sticky-head">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 w-12" />
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Current Tag</th>
                  <th className="px-5 py-3.5">Assign Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-gray-700">Failed to load products</p>
            <button onClick={load} className="mt-3 text-xs font-semibold text-gray-900 underline">Try again</button>
          </div>
        ) : (
          <div className="overflow-x-auto admin-sticky-head min-h-[400px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 w-12" />
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Current Tag</th>
                  <th className="px-5 py-3.5">Assign Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <p className="text-sm font-semibold text-gray-700">No products in this group</p>
                      <p className="text-xs text-gray-400 mt-1">Products tagged as "{activeTab}" will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const currentTag = getProductTag(product);
                    const isChecked = currentTag !== null;
                    const badgeColor = TAG_BADGES[currentTag || ''] || 'bg-gray-100 text-gray-500 border border-gray-200';

                    return (
                      <tr key={product.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* Checkbox */}
                        <td className="px-5 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => handleCheckboxChange(product, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 accent-gray-900 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Product Info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                              <img
                                src={product.image || product.images?.[0] || 'https://via.placeholder.com/44'}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-[13px] truncate max-w-[200px] leading-none">{product.name}</p>
                              <p className="text-xs text-gray-400 mt-1">{product.brand}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium capitalize border border-gray-200">
                            {product.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4 font-bold text-gray-900 text-[13px]">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </td>

                        {/* Current Tag Badge */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${badgeColor}`}>
                            {currentTag || 'Not Tagged'}
                          </span>
                        </td>

                        {/* Assign Tag Dropdown */}
                        <td className="px-5 py-4">
                          <CustomDropdown
                            value={currentTag || 'Remove from New Arrivals'}
                            onChange={val => handleDropdownChange(product, val)}
                            options={['This Week', 'Last Week', 'Earlier This Month', 'Remove from New Arrivals']}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
