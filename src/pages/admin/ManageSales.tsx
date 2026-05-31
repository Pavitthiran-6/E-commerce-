import React, { useState, useEffect, useRef } from 'react';
import {
  adminGetSaleSettings,
  adminUpdateSaleSettings,
  adminUpdateDealOfTheDay,
  adminUpdateProductDiscount,
  getAllProductsPaged,
  type SaleSettingsData,
} from '../../services/productService';
import type { Product } from '../../types/product';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SaleRow {
  id: string;
  name: string;
  image: string;
  originalPrice: number;
  currentPrice: number;
  discountPercentage: number;
  isOnSale: boolean;
  isDirty: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcSalePrice(originalPrice: number, discount: number) {
  if (discount <= 0) return originalPrice;
  return Math.round(originalPrice * (1 - discount / 100));
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ManageSales() {
  // ── Section 1: Banner Settings ──
  const [banner, setBanner] = useState<SaleSettingsData>({
    saleTitle: 'SALE IS LIVE 🔥',
    saleSubtitle: 'Limited time deals — up to 70% off on selected products!',
    maxDiscountText: 'up to 70% off',
    saleEndDateTime: null,
    isActive: true,
  });
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Section 2: Deal of the Day ──
  const [dealSelectedId, setDealSelectedId] = useState<string>('');
  const [dealSearchQuery, setDealSearchQuery] = useState('');
  const [dealDropdownOpen, setDealDropdownOpen] = useState(false);
  const [dealSaving, setDealSaving] = useState(false);
  const [dealMsg, setDealMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const dealRef = useRef<HTMLDivElement>(null);

  // ── Section 3: Sale Products Table ──
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [saleRows, setSaleRows] = useState<SaleRow[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [tableSaving, setTableSaving] = useState(false);
  const [tableMsg, setTableMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);

  // ── Load initial data ──
  useEffect(() => {
    const load = async () => {
      setBannerLoading(true);
      setProductsLoading(true);
      try {
        const [settingsData, productsData] = await Promise.all([
          adminGetSaleSettings().catch(() => null),
          getAllProductsPaged(0, 200).catch(() => ({ content: [], totalElements: 0 })),
        ]);

        if (settingsData) {
          setBanner(settingsData);
          if (settingsData.dealOfTheDayProductId) {
            setDealSelectedId(settingsData.dealOfTheDayProductId);
          }
        }

        const products = productsData.content || [];
        setAllProducts(products);

        // Build sale rows from all products
        const rows: SaleRow[] = products.map((p: Product) => ({
          id: p.id,
          name: p.name,
          image: p.image || (p.images && p.images[0]) || '',
          originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : (p.price as number) || 0,
          currentPrice: typeof p.price === 'number' ? p.price : 0,
          discountPercentage: p.discountPercentage || (p as any).discount || 0,
          isOnSale: p.isOnSale || false,
          isDirty: false,
        }));
        setSaleRows(rows);
      } finally {
        setBannerLoading(false);
        setProductsLoading(false);
      }
    };
    load();
  }, []);

  // Close deal dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dealRef.current && !dealRef.current.contains(e.target as Node)) {
        setDealDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Section 1: Handlers ──
  const handleBannerSave = async () => {
    setBannerSaving(true);
    setBannerMsg(null);
    try {
      await adminUpdateSaleSettings(banner);
      setBannerMsg({ type: 'success', text: 'Banner settings saved successfully!' });
    } catch {
      setBannerMsg({ type: 'error', text: 'Failed to save banner settings.' });
    } finally {
      setBannerSaving(false);
      setTimeout(() => setBannerMsg(null), 3000);
    }
  };

  // ── Section 2: Handlers ──
  const dealSelectedProduct = allProducts.find(p => p.id === dealSelectedId);
  const filteredDealProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(dealSearchQuery.toLowerCase())
  );

  const handleDealSave = async () => {
    if (!dealSelectedId) {
      setDealMsg({ type: 'error', text: 'Please select a product first.' });
      setTimeout(() => setDealMsg(null), 3000);
      return;
    }
    setDealSaving(true);
    setDealMsg(null);
    try {
      await adminUpdateDealOfTheDay(dealSelectedId);
      setDealMsg({ type: 'success', text: 'Deal of the Day updated!' });
    } catch {
      setDealMsg({ type: 'error', text: 'Failed to update Deal of the Day.' });
    } finally {
      setDealSaving(false);
      setTimeout(() => setDealMsg(null), 3000);
    }
  };

  // ── Section 3: Handlers ──
  const updateRow = (id: string, field: keyof SaleRow, value: number | boolean) => {
    setSaleRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value, isDirty: true };
        if (field === 'discountPercentage') {
          updated.currentPrice = calcSalePrice(row.originalPrice, value as number);
        }
        return updated;
      })
    );
  };

  const handleRemoveFromSale = async (id: string) => {
    try {
      await adminUpdateProductDiscount(id, 0, false);
      setSaleRows(prev =>
        prev.map(row =>
          row.id === id
            ? { ...row, isOnSale: false, discountPercentage: 0, currentPrice: row.originalPrice, isDirty: false }
            : row
        )
      );
    } catch {
      setTableMsg({ type: 'error', text: 'Failed to remove product from sale.' });
      setTimeout(() => setTableMsg(null), 3000);
    }
  };

  const handleSaveAllDiscounts = async () => {
    const dirtyRows = saleRows.filter(r => r.isDirty);
    if (dirtyRows.length === 0) {
      setTableMsg({ type: 'error', text: 'No changes to save.' });
      setTimeout(() => setTableMsg(null), 3000);
      return;
    }
    setTableSaving(true);
    setTableMsg(null);
    let errorCount = 0;
    for (const row of dirtyRows) {
      try {
        await adminUpdateProductDiscount(row.id, row.discountPercentage, row.isOnSale);
      } catch {
        errorCount++;
      }
    }
    setSaleRows(prev => prev.map(r => (r.isDirty ? { ...r, isDirty: false } : r)));
    setTableSaving(false);
    if (errorCount > 0) {
      setTableMsg({ type: 'error', text: `Saved with ${errorCount} error(s).` });
    } else {
      setTableMsg({ type: 'success', text: `Saved ${dirtyRows.length} product(s) successfully!` });
    }
    setTimeout(() => setTableMsg(null), 4000);
  };

  const filteredRows = saleRows.filter(r =>
    r.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  // ── DateTime format helper ──
  const toDatetimeLocal = (iso: string | null | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔥 Manage Sales</h1>
        <p className="text-sm text-gray-500 mt-1">
          Control the sale banner, deal of the day, and product discounts shown on the frontend Sale page.
        </p>
      </div>

      {/* ── SECTION 1: BANNER SETTINGS ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <span className="text-red-600 text-lg">📢</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Sale Banner Settings</h2>
            <p className="text-xs text-gray-400">Controls the hero banner on the /sale page</p>
          </div>
        </div>

        <div className="p-6">
          {bannerLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sale Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Sale Title
                </label>
                <input
                  type="text"
                  value={banner.saleTitle}
                  onChange={e => setBanner(prev => ({ ...prev, saleTitle: e.target.value }))}
                  placeholder="e.g. SALE IS LIVE 🔥"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>

              {/* Sale Subtitle */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Sale Subtitle
                </label>
                <input
                  type="text"
                  value={banner.saleSubtitle}
                  onChange={e => setBanner(prev => ({ ...prev, saleSubtitle: e.target.value }))}
                  placeholder="e.g. Limited time deals — up to 70% off!"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>

              {/* Max Discount Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Max Discount Text
                </label>
                <input
                  type="text"
                  value={banner.maxDiscountText}
                  onChange={e => setBanner(prev => ({ ...prev, maxDiscountText: e.target.value }))}
                  placeholder="e.g. up to 70% off"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>

              {/* Sale End Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Sale End Date & Time (Countdown Timer)
                </label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(banner.saleEndDateTime)}
                  onChange={e =>
                    setBanner(prev => ({
                      ...prev,
                      saleEndDateTime: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>

              {/* Active Toggle */}
              <div className="md:col-span-2 flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Sale Active</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {banner.isActive
                      ? 'Sale banner is VISIBLE on the frontend'
                      : 'Sale banner is HIDDEN from frontend'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${banner.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    {banner.isActive ? 'ON' : 'OFF'}
                  </span>
                  <Toggle
                    checked={banner.isActive}
                    onChange={v => setBanner(prev => ({ ...prev, isActive: v }))}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="md:col-span-2 flex items-center gap-4">
                <button
                  onClick={handleBannerSave}
                  disabled={bannerSaving}
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {bannerSaving && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {bannerSaving ? 'Saving…' : 'Save Banner Settings'}
                </button>
                {bannerMsg && (
                  <span className={`text-sm font-medium ${bannerMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {bannerMsg.type === 'success' ? '✅' : '❌'} {bannerMsg.text}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 2: DEAL OF THE DAY ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
            <span className="text-yellow-600 text-lg">⭐</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Deal of the Day</h2>
            <p className="text-xs text-gray-400">Featured product shown at the top of the Sale page</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Searchable Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Select Product
              </label>
              <div ref={dealRef} className="relative">
                <input
                  type="text"
                  value={dealSearchQuery}
                  onChange={e => {
                    setDealSearchQuery(e.target.value);
                    setDealDropdownOpen(true);
                  }}
                  onFocus={() => setDealDropdownOpen(true)}
                  placeholder="Search products…"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
                {dealDropdownOpen && filteredDealProducts.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredDealProducts.slice(0, 20).map(p => {
                      const img = p.image || (p.images && p.images[0]) || '';
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setDealSelectedId(p.id);
                            setDealSearchQuery(p.name);
                            setDealDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                            dealSelectedId === p.id ? 'bg-gray-50' : ''
                          }`}
                        >
                          {img && (
                            <img
                              src={img}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-400">
                              ₹{typeof p.price === 'number' ? p.price.toLocaleString('en-IN') : p.price}
                              {(p.discountPercentage || 0) > 0 && (
                                <span className="ml-1 text-red-500 font-semibold">
                                  · {p.discountPercentage}% off
                                </span>
                              )}
                            </p>
                          </div>
                          {dealSelectedId === p.id && (
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={handleDealSave}
                  disabled={dealSaving || !dealSelectedId}
                  className="bg-yellow-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {dealSaving && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {dealSaving ? 'Saving…' : 'Save Deal of the Day'}
                </button>
                {dealMsg && (
                  <span className={`text-sm font-medium ${dealMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {dealMsg.type === 'success' ? '✅' : '❌'} {dealMsg.text}
                  </span>
                )}
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Live Preview</p>
              {dealSelectedProduct ? (
                <div className="border-2 border-red-400 rounded-2xl p-5 bg-red-50/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                    Deal of the Day
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <img
                        src={dealSelectedProduct.image || (dealSelectedProduct.images && dealSelectedProduct.images[0]) || ''}
                        alt={dealSelectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{dealSelectedProduct.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {(dealSelectedProduct as any).shortDescription || dealSelectedProduct.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-red-600 font-bold">
                          ₹{typeof dealSelectedProduct.price === 'number'
                            ? dealSelectedProduct.price.toLocaleString('en-IN')
                            : dealSelectedProduct.price}
                        </span>
                        {(dealSelectedProduct.discountPercentage || 0) > 0 && (
                          <>
                            <span className="text-gray-400 line-through text-xs">
                              ₹{typeof dealSelectedProduct.originalPrice === 'number'
                                ? dealSelectedProduct.originalPrice.toLocaleString('en-IN')
                                : dealSelectedProduct.originalPrice}
                            </span>
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">
                              {dealSelectedProduct.discountPercentage}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-sm text-gray-400">Select a product to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: SALE PRODUCTS TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-lg">🏷️</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Sale Products</h2>
              <p className="text-xs text-gray-400">Set discounts and mark which products appear on the Sale page</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {tableMsg && (
              <span className={`text-sm font-medium ${tableMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {tableMsg.type === 'success' ? '✅' : '❌'} {tableMsg.text}
              </span>
            )}
            <input
              type="text"
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              placeholder="Search products…"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-52 transition"
            />
            <button
              onClick={handleSaveAllDiscounts}
              disabled={tableSaving || !saleRows.some(r => r.isDirty)}
              className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {tableSaving && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {tableSaving ? 'Saving…' : 'Save All Discounts'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {productsLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-500 font-medium">No products found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Original Price</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale Discount (%)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale Price</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">In Sale</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRows.map(row => {
                  const salePrice = calcSalePrice(row.originalPrice, row.discountPercentage);
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 transition-colors ${row.isDirty ? 'bg-yellow-50/40' : ''}`}
                    >
                      {/* Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {row.image && (
                            <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{row.name}</p>
                        {row.isDirty && (
                          <span className="text-[10px] text-yellow-600 font-semibold">● Unsaved changes</span>
                        )}
                      </td>

                      {/* Original Price */}
                      <td className="px-4 py-3 text-right text-gray-600 font-mono">
                        ₹{row.originalPrice.toLocaleString('en-IN')}
                      </td>

                      {/* Discount Input */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="0"
                            value={row.discountPercentage === 0 ? '' : row.discountPercentage}
                            onChange={e => {
                              const val = e.target.value;
                              const parsed = val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val) || 0));
                              updateRow(row.id, 'discountPercentage', parsed);
                            }}
                            className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono transition"
                          />
                          <span className="text-gray-400 text-xs">%</span>
                        </div>
                      </td>

                      {/* Sale Price (auto-calculated) */}
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono font-semibold ${row.discountPercentage > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          ₹{salePrice.toLocaleString('en-IN')}
                        </span>
                        {row.discountPercentage > 0 && (
                          <span className="block text-xs text-gray-400 line-through font-mono">
                            ₹{row.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* In Sale Toggle */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            checked={row.isOnSale}
                            onChange={v => updateRow(row.id, 'isOnSale', v)}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveFromSale(row.id)}
                          className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium border border-red-200 hover:border-red-300 whitespace-nowrap"
                        >
                          Remove from Sale
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer */}
        {!productsLoading && filteredRows.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filteredRows.length} product{filteredRows.length !== 1 ? 's' : ''} shown
              {saleRows.filter(r => r.isOnSale).length > 0 && (
                <span className="ml-2 text-green-600 font-medium">
                  · {saleRows.filter(r => r.isOnSale).length} in sale
                </span>
              )}
              {saleRows.filter(r => r.isDirty).length > 0 && (
                <span className="ml-2 text-yellow-600 font-medium">
                  · {saleRows.filter(r => r.isDirty).length} unsaved
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
