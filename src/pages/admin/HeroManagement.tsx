import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Edit3, Plus, Save, Eye, Monitor, Tablet, Smartphone, Upload, RefreshCw } from 'lucide-react';
import { getHeroSection, adminUpdateHero, adminDeleteHeroCard, type HeroData, type HeroCardData } from '../../services/heroService';

export default function HeroManagement() {
  const [hero, setHero] = useState<HeroData>({
    title: 'HOUSEFULL SALE',
    badge: 'SALE',
    dateRange: '30TH MAY - 5TH JUNE',
    backgroundColor: 'linear-gradient(to bottom right, #FFE082, #FFD54F, #FFCA28)',
    leftIcon: '',
    rightIcon: '',
    featuredProductName: 'Summer Deals',
    featuredProductImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400',
    featuredOriginalPrice: 1999,
    featuredSalePrice: 999,
    featuredDiscountPercentage: 50,
    featuredCardBackgroundColor: '#FFF9E6',
    promoCards: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Card form modal state
  const [editingCard, setEditingCard] = useState<HeroCardData | null>(null);
  const [cardFormIndex, setCardFormIndex] = useState<number | null>(null); // null means adding a new card
  const [cardForm, setCardForm] = useState<HeroCardData>({
    title: '',
    image: '',
    discountPercentage: 40,
    backgroundColor: '#FFF6F0',
    displayOrder: 0,
  });
  const [showCardModal, setShowCardModal] = useState(false);

  // Live preview responsive mode
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    const fetchHeroData = async () => {
      setIsLoading(true);
      try {
        const data = await getHeroSection();
        if (data) {
          setHero(data);
        }
      } catch (err) {
        console.error('Failed to fetch hero data', err);
        showMsg('error', 'Failed to load Hero settings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHeroData();
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMsg(null);
    try {
      const savedData = await adminUpdateHero(hero);
      setHero(savedData);
      showMsg('success', 'Hero Section updated successfully!');
    } catch (err) {
      console.error(err);
      showMsg('error', 'Failed to update Hero Section.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Card Management Functions ──────────────────────────────────────────────

  const openAddCard = () => {
    setEditingCard(null);
    setCardFormIndex(null);
    setCardForm({
      title: '',
      image: '',
      discountPercentage: 40,
      backgroundColor: '#FFF6F0',
      displayOrder: hero.promoCards.length,
    });
    setShowCardModal(true);
  };

  const openEditCard = (card: HeroCardData, index: number) => {
    setEditingCard(card);
    setCardFormIndex(index);
    setCardForm({ ...card });
    setShowCardModal(true);
  };

  const handleCardSave = () => {
    if (!cardForm.title.trim()) {
      alert('Card Title is required.');
      return;
    }

    const updatedCards = [...hero.promoCards];
    if (cardFormIndex !== null) {
      // Edit mode
      updatedCards[cardFormIndex] = cardForm;
    } else {
      // Add mode
      updatedCards.push(cardForm);
    }

    // Sort by displayOrder
    updatedCards.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    setHero((prev) => ({ ...prev, promoCards: updatedCards }));
    setShowCardModal(false);
  };

  const handleCardDelete = async (index: number) => {
    const card = hero.promoCards[index];
    if (window.confirm(`Are you sure you want to delete the promotion card "${card.title}"?`)) {
      if (card.id) {
        // Call DELETE API immediately if it is already persisted
        try {
          await adminDeleteHeroCard(card.id);
          showMsg('success', 'Promotion card deleted successfully.');
        } catch (err) {
          console.error(err);
          showMsg('error', 'Failed to delete card from database.');
          return;
        }
      }

      const updatedCards = hero.promoCards.filter((_, idx) => idx !== index);
      setHero((prev) => ({ ...prev, promoCards: updatedCards }));
    }
  };

  const calcDiscount = (orig: number, sale: number) => {
    if (!orig || !sale || orig <= sale) return 0;
    return Math.round(((orig - sale) / orig) * 100);
  };

  const handleOriginalPriceChange = (val: number) => {
    const discount = calcDiscount(val, hero.featuredSalePrice);
    setHero((prev) => ({
      ...prev,
      featuredOriginalPrice: val,
      featuredDiscountPercentage: discount,
    }));
  };

  const handleSalePriceChange = (val: number) => {
    const discount = calcDiscount(hero.featuredOriginalPrice, val);
    setHero((prev) => ({
      ...prev,
      featuredSalePrice: val,
      featuredDiscountPercentage: discount,
    }));
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-gray-800 animate-spin" />
        <p className="text-sm text-gray-500 font-semibold">Loading Hero Management settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500 fill-amber-100" />
            Hero Section Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Fully control the homepage Hero section title, badge, dates, icons, featured product, and promotional cards.
          </p>
        </div>

        {/* Save changes */}
        <div className="flex items-center gap-3">
          {msg && (
            <div className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border ${
              msg.type === 'success' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-700 bg-red-50 border-red-100'
            }`}>
              {msg.text}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving Changes…' : 'Save All Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left column: Editor Form */}
        <div className="space-y-6">
          {/* Section 1: Hero Banner Header settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-3">Hero Header Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Hero Title</label>
                <input
                  type="text"
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. HOUSEFULL SALE"
                />
              </div>

              <div>
                <label className={labelCls}>Hero Badge</label>
                <input
                  type="text"
                  value={hero.badge}
                  onChange={(e) => setHero({ ...hero, badge: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. SALE"
                />
              </div>

              <div>
                <label className={labelCls}>Hero Date Range</label>
                <input
                  type="text"
                  value={hero.dateRange}
                  onChange={(e) => setHero({ ...hero, dateRange: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 30th May - 5th June"
                />
              </div>

              <div>
                <label className={labelCls}>Hero Background Color (CSS Color / Gradient)</label>
                <input
                  type="text"
                  value={hero.backgroundColor}
                  onChange={(e) => setHero({ ...hero, backgroundColor: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. #FFD54F or linear-gradient(...)"
                />
              </div>

              {/* Left icon base64 */}
              <div>
                <label className={labelCls}>Left Icon (Base64 or Image File)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-between border border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 rounded-xl px-4 py-2.5 cursor-pointer transition-all">
                    <span className="text-xs text-gray-500 font-medium truncate max-w-[150px]">
                      {hero.leftIcon ? 'Image Loaded' : 'Upload Image'}
                    </span>
                    <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, (base64) => setHero({ ...hero, leftIcon: base64 }))}
                      className="hidden"
                    />
                  </label>
                  {hero.leftIcon && (
                    <button
                      onClick={() => setHero({ ...hero, leftIcon: '' })}
                      className="text-red-500 hover:text-red-700 p-2 border border-red-100 hover:bg-red-50 rounded-xl transition-colors"
                      title="Clear Icon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right icon base64 */}
              <div>
                <label className={labelCls}>Right Icon (Base64 or Image File)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-between border border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 rounded-xl px-4 py-2.5 cursor-pointer transition-all">
                    <span className="text-xs text-gray-500 font-medium truncate max-w-[150px]">
                      {hero.rightIcon ? 'Image Loaded' : 'Upload Image'}
                    </span>
                    <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, (base64) => setHero({ ...hero, rightIcon: base64 }))}
                      className="hidden"
                    />
                  </label>
                  {hero.rightIcon && (
                    <button
                      onClick={() => setHero({ ...hero, rightIcon: '' })}
                      className="text-red-500 hover:text-red-700 p-2 border border-red-100 hover:bg-red-50 rounded-xl transition-colors"
                      title="Clear Icon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Featured Product Card Settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-3">Featured Product Card (Large Left Card)</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Product Name</label>
                <input
                  type="text"
                  value={hero.featuredProductName}
                  onChange={(e) => setHero({ ...hero, featuredProductName: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Summer Deals"
                />
              </div>

              <div>
                <label className={labelCls}>Original Price (₹)</label>
                <input
                  type="number"
                  value={hero.featuredOriginalPrice || ''}
                  onChange={(e) => handleOriginalPriceChange(Number(e.target.value))}
                  className={inputCls}
                  placeholder="e.g. 1999"
                />
              </div>

              <div>
                <label className={labelCls}>Sale Price (₹)</label>
                <input
                  type="number"
                  value={hero.featuredSalePrice || ''}
                  onChange={(e) => handleSalePriceChange(Number(e.target.value))}
                  className={inputCls}
                  placeholder="e.g. 999"
                />
              </div>

              <div>
                <label className={labelCls}>Discount Percentage (%)</label>
                <input
                  type="number"
                  value={hero.featuredDiscountPercentage || ''}
                  onChange={(e) => setHero({ ...hero, featuredDiscountPercentage: Number(e.target.value) })}
                  className={`${inputCls} font-mono`}
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className={labelCls}>Card Background Color</label>
                <input
                  type="text"
                  value={hero.featuredCardBackgroundColor}
                  onChange={(e) => setHero({ ...hero, featuredCardBackgroundColor: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. #FFF9E6"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Product Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                    {hero.featuredProductImage ? (
                      <img src={hero.featuredProductImage} alt="Featured Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-xs select-none">No Image</span>
                    )}
                  </div>
                  <label className="flex-1 flex items-center justify-between border border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 rounded-xl px-4 py-3 cursor-pointer transition-all">
                    <span className="text-xs text-gray-500 font-semibold truncate">
                      {hero.featuredProductImage ? 'Change Image' : 'Select Product Image'}
                    </span>
                    <Upload className="w-4 h-4 text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, (base64) => setHero({ ...hero, featuredProductImage: base64 }))}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Small Promotion Cards */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 flex-wrap gap-2">
              <h2 className="text-sm font-bold text-gray-900">Small Promotion Cards</h2>
              <button
                type="button"
                onClick={openAddCard}
                className="inline-flex items-center gap-1 text-xs font-bold bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Card
              </button>
            </div>

            <div className="space-y-3">
              {hero.promoCards.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-gray-100 rounded-xl bg-gray-50 text-gray-400 text-sm">
                  No promotional cards added. Add cards to see them on the grid.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {hero.promoCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-100 rounded-xl p-3.5 flex items-center justify-between gap-3 bg-gray-50/50 hover:bg-gray-50 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-white overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center">
                          {card.image ? (
                            <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-300 text-[10px]">No Img</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{card.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {card.discountPercentage}% OFF · Order: {card.displayOrder}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditCard(card, idx)}
                          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-100 rounded-lg transition-all"
                          title="Edit Card"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardDelete(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                          title="Delete Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Live Interactive Preview */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                Live Live Mockup
              </h2>
              {/* Responsive Toggles */}
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('tablet')}
                  className={`p-1.5 rounded-md transition-all ${previewMode === 'tablet' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Tablet View"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Container for Preview */}
            <div className="w-full overflow-hidden flex items-center justify-center p-2 bg-gray-50 rounded-xl border border-gray-100 min-h-[350px]">
              <div
                className={`transition-all duration-300 bg-white border border-gray-200 shadow-lg rounded-2xl p-4 overflow-hidden select-none relative ${
                  previewMode === 'desktop' ? 'w-full max-w-[800px]' : previewMode === 'tablet' ? 'w-full max-w-[550px]' : 'w-full max-w-[340px]'
                }`}
              >
                {/* Embedded dynamic Hero Section replica */}
                <div
                  className="rounded-2xl p-4 flex flex-col gap-4 border"
                  style={{
                    background: hero.backgroundColor || 'linear-gradient(to bottom right, #FFE082, #FFD54F, #FFCA28)',
                    borderColor: 'rgba(255,179,0,0.2)',
                  }}
                >
                  {/* Dynamic Header */}
                  <div className="relative flex flex-col items-center justify-center text-center py-0.5">
                    {hero.leftIcon && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 opacity-70">
                        <img src={hero.leftIcon} alt="L Icon" className="w-full h-full object-contain" />
                      </div>
                    )}
                    {hero.rightIcon && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 opacity-70">
                        <img src={hero.rightIcon} alt="R Icon" className="w-full h-full object-contain" />
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col items-center gap-0.5">
                      <h1 className="text-sm sm:text-2xl font-black text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] leading-tight">
                        {hero.title || 'HOUSEFULL SALE'}
                      </h1>
                      {hero.badge && (
                        <span className="bg-gray-900 text-yellow-400 text-[8px] font-extrabold px-3 py-0.5 rounded-full mt-0.5 tracking-wider">
                          {hero.badge}
                        </span>
                      )}
                      {hero.dateRange && (
                        <p className="text-[8px] sm:text-[10px] font-black text-gray-900 tracking-wider uppercase mt-1">
                          {hero.dateRange}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Layout Grid according to active preview mode */}
                  {previewMode === 'desktop' && (
                    <div className="grid grid-cols-3 gap-3 items-stretch">
                      {/* Left: Featured Large card */}
                      <div
                        className="col-span-1 rounded-xl p-3 flex flex-col items-center justify-between border border-amber-100/60"
                        style={{ backgroundColor: hero.featuredCardBackgroundColor || '#FFF9E6' }}
                      >
                        <div className="text-center">
                          <span className="text-[8px] font-black tracking-wider text-amber-800 uppercase block">SUMMER DEALS</span>
                          {hero.featuredDiscountPercentage > 0 && (
                            <span className="inline-block bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5">
                              {hero.featuredDiscountPercentage}% OFF
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-center my-1.5">
                          <span className="bg-[#0C831F] text-white text-xs font-black px-3 py-1 rounded-lg">
                            ₹{Number(hero.featuredSalePrice || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <h3 className="text-[9px] font-extrabold text-gray-900 text-center leading-tight line-clamp-1">
                          {hero.featuredProductName || 'Featured Product'}
                        </h3>

                        <div className="w-16 h-16 bg-white/70 border border-white rounded-lg overflow-hidden flex items-center justify-center mt-2">
                          <img src={hero.featuredProductImage} alt="Featured" className="w-full h-full object-cover" />
                        </div>
                      </div>

                      {/* Right: 4 Cards Promo Grid */}
                      <div className="col-span-2 grid grid-cols-2 gap-2.5">
                        {hero.promoCards.slice(0, 4).map((card, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl p-2.5 border border-amber-100/40 flex flex-col justify-between"
                            style={{ backgroundColor: card.backgroundColor || '#FFF6F0' }}
                          >
                            <span className="self-start inline-block bg-[#0C831F] text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                              Up to {card.discountPercentage}% OFF
                            </span>
                            <h3 className="text-[10px] font-extrabold text-gray-900 tracking-tight leading-snug mt-1.5 truncate">
                              {card.title}
                            </h3>
                            <div className="w-full h-10 bg-white/50 rounded-lg overflow-hidden flex items-center justify-center mt-1">
                              {card.image && <img src={card.image} alt={card.title} className="w-full h-full object-cover" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewMode === 'tablet' && (
                    <div className="flex flex-col gap-3">
                      {/* Featured on top */}
                      <div
                        className="rounded-xl p-3 flex items-center justify-between border border-amber-100/60"
                        style={{ backgroundColor: hero.featuredCardBackgroundColor || '#FFF9E6' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/70 border border-white rounded-lg overflow-hidden flex items-center justify-center">
                            <img src={hero.featuredProductImage} alt="Featured" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-[8px] font-black tracking-wider text-amber-800 uppercase block">SUMMER DEALS</span>
                            <h3 className="text-[11px] font-extrabold text-gray-900 leading-tight">
                              {hero.featuredProductName}
                            </h3>
                            {hero.featuredDiscountPercentage > 0 && (
                              <span className="inline-block bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.2 rounded-full mt-0.5">
                                {hero.featuredDiscountPercentage}% OFF
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="bg-[#0C831F] text-white text-xs font-black px-3 py-1 rounded-lg">
                          ₹{Number(hero.featuredSalePrice || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Promo Cards below */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {hero.promoCards.slice(0, 4).map((card, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl p-2 border border-amber-100/40 flex flex-col justify-between h-20"
                            style={{ backgroundColor: card.backgroundColor || '#FFF6F0' }}
                          >
                            <span className="self-start inline-block bg-[#0C831F] text-white text-[7px] font-black px-1.5 py-0.5 rounded">
                              {card.discountPercentage}% OFF
                            </span>
                            <h3 className="text-[9px] font-extrabold text-gray-900 leading-tight mt-1 truncate">
                              {card.title}
                            </h3>
                            <div className="w-full h-7 bg-white/50 rounded-lg overflow-hidden flex items-center justify-center mt-1">
                              {card.image && <img src={card.image} alt={card.title} className="w-full h-full object-cover" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewMode === 'mobile' && (
                    <div className="space-y-1">
                      {/* Swipe slider indicator / first slide */}
                      <p className="text-[7px] text-gray-500 font-bold text-center mb-1">Swipe View (Featured Card first)</p>
                      
                      {/* Showing featured card as active slide */}
                      <div className="border border-amber-200 rounded-2xl overflow-hidden p-1 bg-white/40">
                        <div
                          className="rounded-xl p-3 flex flex-col items-center justify-between h-36"
                          style={{ backgroundColor: hero.featuredCardBackgroundColor || '#FFF9E6' }}
                        >
                          <div className="text-center">
                            <span className="text-[7px] font-black tracking-wider text-amber-800 uppercase block">SUMMER DEALS</span>
                            <span className="inline-block bg-amber-100 text-amber-800 text-[8px] font-bold px-1 py-0.2 rounded-full mt-0.5">
                              {hero.featuredDiscountPercentage}% OFF
                            </span>
                          </div>

                          <span className="bg-[#0C831F] text-white text-xs font-black px-3 py-1 rounded-lg">
                            ₹{Number(hero.featuredSalePrice || 0).toLocaleString('en-IN')}
                          </span>

                          <h3 className="text-[9px] font-extrabold text-gray-900 text-center leading-tight truncate w-full">
                            {hero.featuredProductName}
                          </h3>

                          <div className="w-10 h-10 bg-white/70 border border-white rounded-lg overflow-hidden flex items-center justify-center">
                            <img src={hero.featuredProductImage} alt="Featured" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>

                      {/* Small dot indicators */}
                      <div className="flex justify-center gap-1 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-800" />
                        {hero.promoCards.map((_, idx) => (
                          <span key={idx} className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD FORM MODAL ─────────────────────────────────────────────────── */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                {cardFormIndex !== null ? 'Edit Promotion Card' : 'Add Promotion Card'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Card Title */}
              <div>
                <label className={labelCls}>Card Title</label>
                <input
                  type="text"
                  value={cardForm.title}
                  onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                  placeholder="e.g. Footwear"
                  className={inputCls}
                />
              </div>

              {/* Discount percentage */}
              <div>
                <label className={labelCls}>Discount Percentage (%)</label>
                <input
                  type="number"
                  value={cardForm.discountPercentage || ''}
                  onChange={(e) => setCardForm({ ...cardForm, discountPercentage: Number(e.target.value) })}
                  placeholder="e.g. 40"
                  className={inputCls}
                />
              </div>

              {/* Background Color */}
              <div>
                <label className={labelCls}>Background Color</label>
                <input
                  type="text"
                  value={cardForm.backgroundColor}
                  onChange={(e) => setCardForm({ ...cardForm, backgroundColor: e.target.value })}
                  placeholder="e.g. #FFF6F0"
                  className={inputCls}
                />
              </div>

              {/* Display Order */}
              <div>
                <label className={labelCls}>Display Order</label>
                <input
                  type="number"
                  value={cardForm.displayOrder || 0}
                  onChange={(e) => setCardForm({ ...cardForm, displayOrder: Number(e.target.value) })}
                  placeholder="e.g. 0"
                  className={inputCls}
                />
              </div>

              {/* Image upload */}
              <div>
                <label className={labelCls}>Card Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
                    {cardForm.image ? (
                      <img src={cardForm.image} alt="Card Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-[10px] select-none font-semibold">No Image</span>
                    )}
                  </div>
                  <label className="flex-1 flex items-center justify-between border border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 rounded-xl px-4 py-2.5 cursor-pointer transition-all">
                    <span className="text-xs text-gray-500 font-semibold truncate">
                      {cardForm.image ? 'Change Image' : 'Select Card Image'}
                    </span>
                    <Upload className="w-4 h-4 text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, (base64) => setCardForm({ ...cardForm, image: base64 }))}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCardSave}
                className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950 rounded-xl shadow-sm transition-all"
              >
                Apply Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
