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
        checked ? 'bg-emerald-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ── Section Card Header ────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Inline feedback message ────────────────────────────────────────────────────
function InlineMsg({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-xl ${
      msg.type === 'success'
        ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
        : 'text-red-600 bg-red-50 border border-red-100'
    }`}>
      {msg.type === 'success' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500">
          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
        </svg>
      )}
      {msg.text}
    </div>
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

  // Shared input class
  const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Sales</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Control the sale banner, deal of the day, and product discounts shown on the frontend Sale page.
        </p>
      </div>

      {/* ── SECTION 1: BANNER SETTINGS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader
          title="Sale Banner Settings"
          subtitle="Controls the hero banner shown on the /sale page"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 1 8.835-2.535m0 0A23.74 23.74 0 0 1 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m-1.394 0A51.964 51.964 0 0 1 12 6.5c-2.533 0-4.98.316-7.31.921" />
            </svg>
          }
        />

        <div className="p-6">
          {bannerLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-11 admin-skeleton rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Sale Title */}
              <div className="md:col-span-2">
                <label className={labelCls}>Sale Title</label>
                <input
                  type="text"
                  value={banner.saleTitle}
                  onChange={e => setBanner(prev => ({ ...prev, saleTitle: e.target.value }))}
                  placeholder="e.g. SALE IS LIVE 🔥"
                  className={inputCls}
                />
              </div>

              {/* Sale Subtitle */}
              <div className="md:col-span-2">
                <label className={labelCls}>Sale Subtitle</label>
                <input
                  type="text"
                  value={banner.saleSubtitle}
                  onChange={e => setBanner(prev => ({ ...prev, saleSubtitle: e.target.value }))}
                  placeholder="e.g. Limited time deals — up to 70% off!"
                  className={inputCls}
                />
              </div>

              {/* Max Discount Text */}
              <div>
                <label className={labelCls}>Max Discount Text</label>
                <input
                  type="text"
                  value={banner.maxDiscountText}
                  onChange={e => setBanner(prev => ({ ...prev, maxDiscountText: e.target.value }))}
                  placeholder="e.g. up to 70% off"
                  className={inputCls}
                />
              </div>

              {/* Sale End Date */}
              <div>
                <label className={labelCls}>Sale End Date & Time (Countdown Timer)</label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(banner.saleEndDateTime)}
                  onChange={e =>
                    setBanner(prev => ({
                      ...prev,
                      saleEndDateTime: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
                  className={inputCls}
                />
              </div>

              {/* Active Toggle */}
              <div className="md:col-span-2 flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Sale Active</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {banner.isActive
                      ? 'Sale banner is VISIBLE on the frontend'
                      : 'Sale banner is HIDDEN from frontend'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${banner.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
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
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {bannerSaving && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {bannerSaving ? 'Saving…' : 'Save Banner Settings'}
                </button>
                <InlineMsg msg={bannerMsg} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 2: DEAL OF THE DAY ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader
          title="Deal of the Day"
          subtitle="Featured product shown at the top of the Sale page"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          }
        />

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Searchable Dropdown */}
            <div>
              <label className={labelCls}>Select Product</label>
              <div ref={dealRef} className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  value={dealSearchQuery}
                  onChange={e => {
                    setDealSearchQuery(e.target.value);
                    setDealDropdownOpen(true);
                  }}
                  onFocus={() => setDealDropdownOpen(true)}
                  placeholder="Search products…"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                />
                {dealDropdownOpen && filteredDealProducts.length > 0 && (
                  <div className="absolute z-30 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto admin-sidebar-scroll">
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
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                            dealSelectedId === p.id ? 'bg-gray-50' : ''
                          }`}
                        >
                          {img && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                              <img src={img} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
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
                            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
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
                  className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {dealSaving && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {dealSaving ? 'Saving…' : 'Save Deal of the Day'}
                </button>
                <InlineMsg msg={dealMsg} />
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <p className={labelCls}>Live Preview</p>
              {dealSelectedProduct ? (
                <div className="border-2 border-red-300 rounded-2xl p-5 bg-red-50/20 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl shadow-sm">
                    Deal of the Day
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                      <img
                        src={dealSelectedProduct.image || (dealSelectedProduct.images && dealSelectedProduct.images[0]) || ''}
                        alt={dealSelectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{dealSelectedProduct.name}</h3>
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
                            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {dealSelectedProduct.discountPercentage}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center bg-gray-50">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Select a product to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: SALE PRODUCTS TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Sale Products</h2>
              <p className="text-xs text-gray-400 mt-0.5">Set discounts and mark which products appear on the Sale page</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <InlineMsg msg={tableMsg} />
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                placeholder="Search products…"
                className="border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 w-52 transition-all bg-white"
              />
            </div>
            <button
              onClick={handleSaveAllDiscounts}
              disabled={tableSaving || !saleRows.some(r => r.isDirty)}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

        <div className="overflow-x-auto admin-sticky-head">
          {productsLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 admin-skeleton rounded-xl" />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">No products found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 w-12" />
                  <th className="px-5 py-3.5 whitespace-nowrap">Product</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Original Price</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-center">Sale Discount (%)</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Sale Price</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-center">In Sale</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRows.map(row => {
                  const salePrice = calcSalePrice(row.originalPrice, row.discountPercentage);
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        row.isDirty
                          ? 'bg-amber-50/30 ring-1 ring-inset ring-amber-100'
                          : 'hover:bg-gray-50/70'
                      }`}
                    >
                      {/* Thumbnail */}
                      <td className="px-5 py-4">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                          {row.image && (
                            <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 text-[13px] truncate max-w-[200px]">{row.name}</p>
                        {row.isDirty && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-semibold mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            Unsaved changes
                          </span>
                        )}
                      </td>

                      {/* Original Price */}
                      <td className="px-5 py-4 text-right text-gray-600 font-mono text-[13px]">
                        ₹{row.originalPrice.toLocaleString('en-IN')}
                      </td>

                      {/* Discount Input */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
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
                            className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                          />
                          <span className="text-gray-400 text-xs font-medium">%</span>
                        </div>
                      </td>

                      {/* Sale Price (auto-calculated) */}
                      <td className="px-5 py-4 text-right">
                        <span className={`font-mono font-bold text-[13px] ${row.discountPercentage > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          ₹{salePrice.toLocaleString('en-IN')}
                        </span>
                        {row.discountPercentage > 0 && (
                          <span className="block text-xs text-gray-400 line-through font-mono">
                            ₹{row.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* In Sale Toggle */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            checked={row.isOnSale}
                            onChange={v => updateRow(row.id, 'isOnSale', v)}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleRemoveFromSale(row.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors border border-red-100 hover:border-red-200 whitespace-nowrap"
                        >
                          Remove
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
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center gap-4">
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-gray-600">{filteredRows.length}</span> product{filteredRows.length !== 1 ? 's' : ''} shown
            </p>
            {saleRows.filter(r => r.isOnSale).length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {saleRows.filter(r => r.isOnSale).length} in sale
              </span>
            )}
            {saleRows.filter(r => r.isDirty).length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {saleRows.filter(r => r.isDirty).length} unsaved
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
