import React, { useEffect, useState, useId, useRef } from 'react';
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── Page Title ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Coupons</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create and manage coupon discount campaigns</p>
      </div>

      {/* ── Top Section: Creation Form ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-gray-900 rounded-full" />
          Create New Coupon
        </h2>
        
        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Coupon Code & Generate Button */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Coupon Code *</label>
            <div className="flex gap-2">
              <input
                required
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                className="flex-grow border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white uppercase font-semibold tracking-wide"
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                className="px-3.5 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 hover:border-gray-300"
              >
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Discount Type */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Discount Type *</label>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white text-left flex items-center justify-between shadow-sm hover:bg-gray-50/50 transition-colors"
            >
              <span className="text-gray-900 font-medium">{type === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed Amount (₹)'}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setType('PERCENTAGE');
                    setMaxDiscount('');
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    type === 'PERCENTAGE' ? 'bg-gray-50/70 font-semibold text-gray-900' : 'text-gray-700'
                  }`}
                >
                  <span>Percentage (%)</span>
                  {type === 'PERCENTAGE' && (
                    <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('FLAT');
                    setMaxDiscount('');
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-t border-gray-50 ${
                    type === 'FLAT' ? 'bg-gray-50/70 font-semibold text-gray-900' : 'text-gray-700'
                  }`}
                >
                  <span>Fixed Amount (₹)</span>
                  {type === 'FLAT' && (
                    <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Discount Value {type === 'PERCENTAGE' ? '(%)' : '(₹)'} *
            </label>
            <input
              required
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={type === 'PERCENTAGE' ? '20' : '500'}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>

          {/* Minimum Order Value */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Min. Order Value (₹)</label>
            <input
              type="number"
              value={minCartValue}
              onChange={e => setMinCartValue(e.target.value)}
              placeholder="e.g. 999"
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>

          {/* Maximum Discount (Only percentage) */}
          <div className={type === 'PERCENTAGE' ? 'block' : 'opacity-40 pointer-events-none'}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Max Discount (₹)</label>
            <input
              disabled={type !== 'PERCENTAGE'}
              type="number"
              value={maxDiscount}
              onChange={e => setMaxDiscount(e.target.value)}
              placeholder="e.g. 300"
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>

          {/* Usage Limit */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Usage Limit</label>
            <input
              type="number"
              value={usageLimit}
              onChange={e => setUsageLimit(e.target.value)}
              placeholder="e.g. 100"
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>

          {/* Coupon Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Description / Campaign Name</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Festive discount on sneaker collection"
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>

          {/* Form Actions (Submit / Align end) */}
          <div className="md:col-span-3 flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-6">
              {/* Active Toggle Switch */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                    ${isActive ? 'bg-gray-900' : 'bg-gray-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">Set active immediately</span>
              </div>

              {/* Show on Home Toggle Switch */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOnHome(!showOnHome)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                    ${showOnHome ? 'bg-gray-900' : 'bg-gray-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${showOnHome ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">Show on Home Page</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Bottom Section: Coupons Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-gray-900 rounded-full" />
            Existing Campaigns
          </h2>
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 border px-2 py-0.5 rounded-full uppercase tracking-wider">
            {coupons.length} Campaigns
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading coupons...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No coupons found. Create one above to get started!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3.5">Coupon Code</th>
                  <th className="px-6 py-3.5">Discount</th>
                  <th className="px-6 py-3.5">Min. Order Value</th>
                  <th className="px-6 py-3.5">Usage</th>
                  <th className="px-6 py-3.5">Expiry Date</th>
                  <th className="px-6 py-3.5">Show on Home</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map(coupon => {
                  const expired = isExpired(coupon.validUntil);
                  return (
                    <tr
                      key={coupon.id}
                      className={`transition-colors hover:bg-gray-50/50 
                        ${expired ? 'bg-red-50/40 hover:bg-red-100/30' : ''}`}
                    >
                      {/* Code Badge */}
                      <td className="px-6 py-4 font-medium">
                        <span className="inline-block px-2.5 py-1 rounded bg-gray-100 text-gray-900 border font-mono font-bold text-xs uppercase tracking-wide">
                          {coupon.code}
                        </span>
                        {coupon.description && (
                          <p className="text-[11px] text-gray-400 font-normal mt-0.5 max-w-[200px] truncate" title={coupon.description}>
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {coupon.type === 'PERCENTAGE' ? (
                          <span>{coupon.value}% OFF</span>
                        ) : (
                          <span>₹{coupon.value?.toLocaleString('en-IN')} OFF</span>
                        )}
                        {coupon.type === 'PERCENTAGE' && coupon.maxDiscount && (
                          <span className="text-[10px] text-gray-400 font-normal block">
                            (max ₹{coupon.maxDiscount})
                          </span>
                        )}
                      </td>

                      {/* Min Order Value */}
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {coupon.minCartValue > 0 ? `₹${coupon.minCartValue.toLocaleString('en-IN')}` : '₹0'}
                      </td>

                      {/* Usage */}
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-700">
                            {coupon.usedCount} <span className="text-gray-400">/ {coupon.usageLimit || '∞'}</span>
                          </span>
                          {coupon.usageLimit && (
                            <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                  className="h-full bg-gray-900 transition-all duration-300"
                                  style={{ width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-6 py-4">
                        {coupon.validUntil ? (
                          <span className={`text-xs font-semibold ${expired ? 'text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded' : 'text-gray-600'}`}>
                            {new Date(coupon.validUntil).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {expired && ' (Expired)'}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Show on Home Toggle directly in row */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleHomeStatus(coupon)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                            ${coupon.showOnHome && !expired ? 'bg-emerald-500' : 'bg-gray-200'}`}
                          disabled={expired}
                          title={expired ? 'Cannot toggle expired coupon' : 'Toggle show on home'}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${coupon.showOnHome && !expired ? 'translate-x-4' : 'translate-x-0'}`}
                          />
                        </button>
                      </td>

                      {/* Status Toggle directly in row */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                            ${coupon.isActive && !expired ? 'bg-emerald-500' : 'bg-gray-200'}`}
                          disabled={expired}
                          title={expired ? 'Cannot toggle expired coupon' : 'Toggle active status'}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${coupon.isActive && !expired ? 'translate-x-4' : 'translate-x-0'}`}
                          />
                        </button>
                      </td>

                      {/* Row actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteId(coupon.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors border border-red-100/50"
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
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-2">Delete Coupon?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This action cannot be undone. The coupon code will be permanently deactivated.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCoupon}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
