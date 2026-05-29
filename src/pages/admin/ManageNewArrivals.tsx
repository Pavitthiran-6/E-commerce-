import React, { useEffect, useState, useRef } from 'react';
import { getAllProducts } from '../../services/productService';
import axiosInstance from '../../api/axiosInstance';
import type { Product } from '../../data/products';
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
        className="flex items-center justify-between gap-2 border border-gray-200 rounded-lg bg-white px-3 py-1.5 cursor-pointer text-gray-700 font-semibold text-xs min-w-[170px] hover:border-gray-400 hover:bg-gray-50 transition-all select-none focus:outline-none"
      >
        <span>{value}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-full min-w-[170px] bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 text-xs font-semibold text-gray-700 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 hover:text-gray-900 transition-colors block ${
                value === option ? 'bg-gray-50 text-gray-900 font-bold' : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

  const tabs: ('This Week' | 'Last Week' | 'Earlier This Month')[] = [
    'This Week',
    'Last Week',
    'Earlier This Month'
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage New Arrivals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Select which products appear in the New Arrivals section and assign them a time group.
          </p>
        </div>
        <button
          onClick={handleSaveChanges}
          disabled={isSaving || Object.keys(updatedTags).length === 0}
          className="inline-flex items-center justify-center bg-gray-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md min-w-[150px] self-start sm:self-auto"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* ── Tabs Section ────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 gap-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
              activeTab === tab
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Products Table Section ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500">Loading products...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 font-medium">{error}</div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 w-12">
                    {/* Empty header for checkbox */}
                  </th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Current Tag</th>
                  <th className="px-5 py-3">Assign Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const currentTag = getProductTag(product);
                    const isChecked = currentTag !== null;

                    // Compute tag badge color
                    let badgeColor = 'bg-gray-100 text-gray-600';
                    if (currentTag === 'This Week') {
                      badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                    } else if (currentTag === 'Last Week') {
                      badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';
                    } else if (currentTag === 'Earlier This Month') {
                      badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
                    }

                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        {/* Checkbox */}
                        <td className="px-5 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => handleCheckboxChange(product, e.target.checked)}
                            className="w-4 h-4 rounded text-gray-900 border-gray-300 focus:ring-gray-900 cursor-pointer"
                          />
                        </td>
                        
                        {/* Product Info */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image || product.images?.[0] || 'https://via.placeholder.com/40'}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                            />
                            <div>
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-400">{product.brand}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium capitalize">
                            {product.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-3.5 font-semibold text-gray-900">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </td>

                        {/* Current Tag Badge */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                            {currentTag || 'Not Tagged'}
                          </span>
                        </td>

                        {/* Custom Assign Tag Dropdown */}
                        <td className="px-5 py-3.5">
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
