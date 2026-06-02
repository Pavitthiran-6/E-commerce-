import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

interface Coupon {
  id: number;
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FLAT' | 'FREE_SHIPPING';
  value: number;
  minCartValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  showOnHome?: boolean;
}

export default function ManageCoupons() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minCartValue, setMinCartValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showOnHome, setShowOnHome] = useState(false);

  // Custom dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Delete modal states
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load coupons on mount
  const loadCoupons = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api/admin/coupons');
      setCoupons(res.data?.data || []);
    } catch (err) {
      setError('Failed to fetch coupons.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // Handle click outside custom dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper: check if a coupon is expired
  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  // Helper: generate random coupon code
  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let random = 'BEL'; // premium brand prefix
    for (let i = 0; i < 5; i++) {
      random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(random);
  };

  // Create coupon submit handler
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('Coupon code is required.', 'error');
      return;
    }
    if (!value || parseFloat(value) <= 0) {
      showToast('Discount value must be greater than 0.', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        type: type,
        value: parseFloat(value),
        minCartValue: minCartValue ? parseFloat(minCartValue) : 0,
        maxDiscount: type === 'PERCENTAGE' && maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        showOnHome: showOnHome,
        validFrom: new Date().toISOString().split('.')[0], // current local time
        validUntil: expiryDate ? `${expiryDate}T23:59:59` : null, // end of that expiry day
      };

      const res = await axiosInstance.post('/api/admin/coupons', payload);
      const createdCoupon = res.data?.data;
      if (!isActive && createdCoupon?.id) {
        await axiosInstance.put(`/api/admin/coupons/${createdCoupon.id}/toggle`);
      }

      showToast(`Coupon ${payload.code} created successfully!`, 'success');

      // Reset form
      setCode('');
      setDescription('');
      setValue('');
      setMinCartValue('');
      setMaxDiscount('');
      setUsageLimit('');
      setExpiryDate('');
      setIsActive(true);
      setShowOnHome(false);

      loadCoupons(); // refresh table
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create coupon. Duplicate code?';
      showToast(msg, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle show on home status directly from table row
  const handleToggleHomeStatus = async (coupon: Coupon) => {
    try {
      await axiosInstance.put(`/api/admin/coupons/${coupon.id}/toggle-home`);
      setCoupons(prev =>
        prev.map(c => (c.id === coupon.id ? { ...c, showOnHome: !c.showOnHome } : c))
      );
      showToast(`Coupon ${coupon.code} home status updated!`, 'success');
    } catch (err) {
      showToast('Failed to update show on home status.', 'error');
    }
  };

  // Toggle active status directly from table row
  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await axiosInstance.put(`/api/admin/coupons/${coupon.id}/toggle`);
      setCoupons(prev =>
        prev.map(c => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
      );
      showToast(`Coupon ${coupon.code} status updated!`, 'success');
    } catch (err) {
      showToast('Failed to toggle coupon status.', 'error');
    }
  };

  // Delete coupon handler
  const handleDeleteCoupon = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/api/admin/coupons/${deleteId}`);
      showToast('Coupon deleted successfully.', 'success');
      setDeleteId(null);
      loadCoupons(); // refresh table
    } catch (err) {
      showToast('Failed to delete coupon.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Shared input class
  const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

  // Toggle switch component
  const Toggle = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-gray-900' : 'bg-gray-200'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Page Title ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Coupons</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create and manage coupon discount campaigns</p>
      </div>

      {/* ── Create Form ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-amber-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l6.499 6.499c.404.404.935.626 1.488.626.553 0 1.084-.222 1.488-.626l4.243-4.243c.404-.404.626-.935.626-1.488 0-.553-.222-1.084-.626-1.488L11.159 3.659A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.007v.007H6V7.5Z" strokeWidth={2} />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-gray-900">Create New Coupon</h2>
        </div>

        <form onSubmit={handleCreateCoupon} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Coupon Code & Generate Button */}
          <div>
            <label className={labelCls}>Coupon Code *</label>
            <div className="flex gap-2">
              <input
                required
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                className="flex-grow border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white uppercase font-bold tracking-wide transition-all"
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                className="px-3.5 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
          </div>

          {/* Discount Type */}
          <div className="relative" ref={dropdownRef}>
            <label className={labelCls}>Discount Type *</label>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <span className="text-gray-900 font-semibold">{type === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed Amount (₹)'}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {[
                  { val: 'PERCENTAGE' as const, label: 'Percentage (%)' },
                  { val: 'FLAT' as const, label: 'Fixed Amount (₹)' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => { setType(opt.val); setMaxDiscount(''); setDropdownOpen(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors flex items-center justify-between first:rounded-t-none last:rounded-b-none border-b last:border-0 border-gray-50 ${type === opt.val ? 'bg-gray-50 font-bold text-gray-900' : 'text-gray-700'}`}
                  >
                    <span>{opt.label}</span>
                    {type === opt.val && (
                      <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Discount Value */}
          <div>
            <label className={labelCls}>
              Discount Value {type === 'PERCENTAGE' ? '(%)' : '(₹)'} *
            </label>
            <input
              required
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={type === 'PERCENTAGE' ? '20' : '500'}
              className={inputCls}
            />
          </div>

          {/* Minimum Order Value */}
          <div>
            <label className={labelCls}>Min. Order Value (₹)</label>
            <input type="number" value={minCartValue} onChange={e => setMinCartValue(e.target.value)} placeholder="e.g. 999" className={inputCls} />
          </div>

          {/* Maximum Discount */}
          <div className={type === 'PERCENTAGE' ? 'block' : 'opacity-40 pointer-events-none'}>
            <label className={labelCls}>Max Discount (₹)</label>
            <input
              disabled={type !== 'PERCENTAGE'}
              type="number"
              value={maxDiscount}
              onChange={e => setMaxDiscount(e.target.value)}
              placeholder="e.g. 300"
              className={inputCls}
            />
          </div>

          {/* Usage Limit */}
          <div>
            <label className={labelCls}>Usage Limit</label>
            <input type="number" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="e.g. 100" className={inputCls} />
          </div>

          {/* Expiry Date */}
          <div>
            <label className={labelCls}>Expiry Date</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className={inputCls} />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className={labelCls}>Description / Campaign Name</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Festive discount on sneaker collection"
              className={inputCls}
            />
          </div>

          {/* Form Actions */}
          <div className="md:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-5">
              {/* Active Toggle */}
              <div className="flex items-center gap-2.5">
                <Toggle checked={isActive} onClick={() => setIsActive(!isActive)} />
                <span className="text-sm font-medium text-gray-700">Set active immediately</span>
              </div>
              {/* Show on Home Toggle */}
              <div className="flex items-center gap-2.5">
                <Toggle checked={showOnHome} onClick={() => setShowOnHome(!showOnHome)} />
                <span className="text-sm font-medium text-gray-700">Show on Home Page</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50 shadow-sm self-start sm:self-auto"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create Coupon
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Coupons Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-gray-900">Existing Campaigns</h2>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
            {coupons.length} Campaigns
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-6 admin-skeleton rounded w-24" />
                <div className="h-4 admin-skeleton rounded w-16" />
                <div className="h-4 admin-skeleton rounded flex-1" />
                <div className="h-5 admin-skeleton rounded-full w-20" />
                <div className="h-5 admin-skeleton rounded-lg w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error}</div>
        ) : coupons.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l6.499 6.499c.404.404.935.626 1.488.626.553 0 1.084-.222 1.488-.626l4.243-4.243c.404-.404.626-.935.626-1.488 0-.553-.222-1.084-.626-1.488L11.159 3.659A2.25 2.25 0 0 0 9.568 3Z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">No coupons yet</p>
            <p className="text-xs text-gray-400 mt-1">Create one above to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto admin-sticky-head">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 whitespace-nowrap">Coupon Code</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Discount</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Min. Order</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Usage</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Expiry</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">On Home</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Active</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map(coupon => {
                  const expired = isExpired(coupon.validUntil);
                  return (
                    <tr
                      key={coupon.id}
                      className={`transition-colors hover:bg-gray-50/70 ${expired ? 'bg-red-50/30' : ''}`}
                    >
                      {/* Code Badge */}
                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 font-mono font-bold text-xs uppercase tracking-widest text-gray-900">
                          {coupon.code}
                        </span>
                        {coupon.description && (
                          <p className="text-[11px] text-gray-400 mt-1 max-w-[180px] truncate" title={coupon.description}>
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-gray-900 text-[13px]">
                          {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₹${coupon.value?.toLocaleString('en-IN')} OFF`}
                        </span>
                        {coupon.type === 'PERCENTAGE' && coupon.maxDiscount && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            (max ₹{coupon.maxDiscount})
                          </span>
                        )}
                      </td>

                      {/* Min Order Value */}
                      <td className="px-5 py-4 text-gray-600 font-medium text-[13px]">
                        {coupon.minCartValue > 0 ? `₹${coupon.minCartValue.toLocaleString('en-IN')}` : '₹0'}
                      </td>

                      {/* Usage */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-700 font-semibold">
                            {coupon.usedCount} <span className="text-gray-400 font-normal">/ {coupon.usageLimit || '∞'}</span>
                          </span>
                          {coupon.usageLimit && (
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-900 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-5 py-4">
                        {coupon.validUntil ? (
                          <span className={`text-xs font-semibold ${expired ? 'text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg' : 'text-gray-600'}`}>
                            {new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {expired && ' (Expired)'}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Show on Home Toggle */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleHomeStatus(coupon)}
                          disabled={expired}
                          title={expired ? 'Cannot toggle expired coupon' : 'Toggle show on home'}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${coupon.showOnHome && !expired ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${coupon.showOnHome && !expired ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          disabled={expired}
                          title={expired ? 'Cannot toggle expired coupon' : 'Toggle active status'}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${coupon.isActive && !expired ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${coupon.isActive && !expired ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* Row actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setDeleteId(coupon.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors border border-red-100 hover:border-red-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm admin-modal-enter">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">Delete Coupon?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This action cannot be undone. The coupon code will be permanently deactivated.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-2.5">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCoupon}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
