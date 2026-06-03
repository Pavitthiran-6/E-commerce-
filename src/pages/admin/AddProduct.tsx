import React, { useCallback, useEffect, useRef, useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { compressImageToBase64 } from '../../utils/imageCompress';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  children: CategoryNode[];
}

interface ImageFile {
  file: File;
  preview: string;
  isCover: boolean;
}

// ─── Specification row type ───────────────────────────────────────────────────
interface SpecRow {
  key: string;
  value: string;
  displayOrder: number;
}

// ─── Category templates ───────────────────────────────────────────────────────
const SPEC_TEMPLATES: Record<string, string[]> = {
  'Fashion & Clothing': ['Color', 'Available Sizes', 'Material', 'Fit Type', 'Wash Care'],
  'Kids Toys': ['Age Range', 'Battery Required', 'Safety Certification', 'Assembly Required', 'Brand'],
  'Kitchen & Cookware': ['Capacity', 'Material', 'Power (Watts)', 'Dimensions', 'Dishwasher Safe'],
  'Home Appliances': ['Power (Watts)', 'Voltage', 'Warranty', 'Dimensions', 'Weight'],
  'Electronics': ['Brand', 'Model', 'Warranty', 'Connectivity', 'Power Source'],
};

// ─── Shared: Multi-image upload area ─────────────────────────────────────────
interface ImageUploadProps {
  images: ImageFile[];
  onChange: (imgs: ImageFile[]) => void;
  single?: boolean;
}

function ImageUploadArea({ images, onChange, single }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const list = single ? [files[0]] : Array.from(files);
    const newImgs: ImageFile[] = list
      .filter(f => f && f.type.startsWith('image/'))
      .map((f, i) => ({
        file: f,
        preview: URL.createObjectURL(f),
        isCover: images.length === 0 && i === 0,
      }));
    const combined = single ? newImgs : [...images, ...newImgs];
    if (combined.length > 0 && !combined.some(img => img.isCover)) combined[0].isCover = true;
    onChange(combined);
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    if (images[idx].isCover && next.length > 0) next[0].isCover = true;
    URL.revokeObjectURL(images[idx].preview);
    onChange(next);
  };

  const setCover = (idx: number) =>
    onChange(images.map((img, i) => ({ ...img, isCover: i === idx })));

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [images]);

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
          ${dragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
          className={`w-7 h-7 ${dragging ? 'text-gray-600' : 'text-gray-300'} transition-colors`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
        <p className="text-sm text-gray-500 text-center">
          <span className="font-semibold text-gray-700">Click to browse</span> or drag & drop
        </p>
        <p className="text-xs text-gray-400">PNG, JPG, WEBP{!single && ' — multiple files allowed'}</p>
        <input ref={inputRef} type="file" accept="image/*" multiple={!single} className="hidden"
          onChange={e => addFiles(e.target.files)} />
      </div>

      {images.length > 0 && (
        <div className={`grid gap-2 ${single ? 'grid-cols-1' : 'grid-cols-4'}`}>
          {images.map((img, idx) => (
            <div key={img.preview}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all
                ${img.isCover ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}
            >
              <img src={img.preview} alt="" className="w-full aspect-square object-cover" />
              {img.isCover && (
                <span className="absolute top-1 left-1 text-[9px] font-black bg-gray-900 text-white px-1.5 py-0.5 rounded uppercase tracking-wide">Cover</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                {!img.isCover && !single && (
                  <button type="button" onClick={e => { e.stopPropagation(); setCover(idx); }}
                    className="text-[10px] font-bold bg-white text-gray-900 rounded px-2 py-0.5 w-full text-center hover:bg-gray-100">
                    Set Cover
                  </button>
                )}
                <button type="button" onClick={e => { e.stopPropagation(); removeImage(idx); }}
                  className="text-[10px] font-bold bg-red-500 text-white rounded px-2 py-0.5 w-full text-center hover:bg-red-600">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live product card preview (mirrors Collection page card design) ───────────
interface CardPreviewProps {
  name: string;
  price: string;
  coverPreview: string;
}

function ProductCardPreview({ name, price, coverPreview }: CardPreviewProps) {
  const displayPrice = price ? `₹${parseFloat(price).toLocaleString('en-IN')}` : '₹0';
  return (
    <div className="w-full max-w-[240px] bg-white p-4 border border-gray-100 rounded-xl shadow-sm">
      {/* image block — mirrors Collection: aspect-[4/5] bg-[#f6f5f0] */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f6f5f0] flex items-center justify-center mb-3 rounded-lg">
        {coverPreview ? (
          <img src={coverPreview} alt={name || 'Preview'}
            className="object-cover object-center w-full h-full" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"
            className="w-12 h-12 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        )}
        <span className="absolute top-2 left-2 text-[9px] font-black bg-gray-900 text-white px-1.5 py-0.5 uppercase tracking-wide rounded">NEW</span>
      </div>
      {/* text — mirrors: font-serif text-[17px] text-charcoal-stone + bold price */}
      <div className="flex flex-col gap-0.5">
        <h3 className="font-serif text-[15px] text-gray-900 leading-tight line-clamp-2">
          {name || 'Product Title'}
        </h3>
        <span className="text-[14px] font-bold tracking-wide text-gray-900">{displayPrice}</span>
      </div>
    </div>
  );
}

// ─── Custom Dropdown Select ──────────────────────────────────────────────────
interface SelectOption { value: string; label: string; isChild?: boolean; disabled?: boolean; }

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

function CustomSelect({ value, onChange, options, placeholder = 'Select…', disabled, label, hint }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const selected = options.find(o => o.value === value);

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative" id={uid}>
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}
          {hint && <span className="text-gray-400 font-normal ml-1">{hint}</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-2.5 text-sm transition-all
          ${open ? 'border-gray-400 ring-2 ring-gray-100' : 'border-gray-200 hover:border-gray-300'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-400' : 'bg-white cursor-pointer text-gray-900'}`}
      >
        <span className={`truncate ${!selected ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {selected && !disabled && (
            <span
              role="button"
              onClick={handleClear}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
              </svg>
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          style={{ maxHeight: 220, overflowY: 'auto' }}>
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">No options available</div>
          ) : (
            <ul className="py-1">
              {options.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                        ${opt.isChild ? 'pl-7' : ''}
                        ${isSelected
                          ? 'bg-gray-900 text-white font-semibold'
                          : opt.disabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      {opt.isChild && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                          className={`w-3 h-3 flex-shrink-0 ${isSelected ? 'text-white/70' : 'text-gray-300'}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      )}
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-auto flex-shrink-0 text-white">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function AddProduct() {
  const navigate = useNavigate();
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isNew, setIsNew] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isApparelHighlights, setIsApparelHighlights] = useState(false);
  const [isTechHome, setIsTechHome] = useState(false);

  // Specifications state
  const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const [materialsTitle, setMaterialsTitle] = useState('MATERIALS');
  const [materialsContent, setMaterialsContent] = useState('');

  const [shippingTitle, setShippingTitle] = useState('SHIPPING & RETURNS');
  const [shippingContent, setShippingContent] = useState('');

  const [careTitle, setCareTitle] = useState('PRODUCT CARE');
  const [careContent, setCareContent] = useState('');

  const [sustainabilityTitle, setSustainabilityTitle] = useState('SUSTAINABILITY');
  const [sustainabilityContent, setSustainabilityContent] = useState('');

  const [craftsmanshipTitle, setCraftsmanshipTitle] = useState('CRAFTSMANSHIP');
  const [craftsmanshipContent, setCraftsmanshipContent] = useState('');

  const [freeShipping, setFreeShipping] = useState(true);
  const [codAvailable, setCodAvailable] = useState(true);
  const [easyReturns, setEasyReturns] = useState(true);

  // Image states
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [additionalImages, setAdditionalImages] = useState<ImageFile[]>([]);

  // Load categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axiosInstance.get('/api/categories/tree');
        setCategoryTree(res.data?.data || []);
      } catch (e) {
        console.warn('Failed to load categories', e);
      }
    };
    fetchCats();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      additionalImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [coverPreview, additionalImages]);

  // Handle cover image selection
  const handleCoverChange = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const selectedParent = categoryTree.find(c => String(c.id) === categoryId);
  const subCats = selectedParent?.children ?? [];

  // Drag & drop for cover image
  const s1DropRef = useRef<HTMLDivElement>(null);
  const s1InputRef = useRef<HTMLInputElement>(null);
  const [s1Dragging, setS1Dragging] = useState(false);

  const handleS1Drop = (e: React.DragEvent) => {
    e.preventDefault();
    setS1Dragging(false);
    handleCoverChange(e.dataTransfer.files);
  };

  const addSpecRow = () => {
    setSpecs(prev => [...prev, { key: '', value: '', displayOrder: prev.length }]);
  };

  const removeSpecRow = (idx: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, displayOrder: i })));
  };

  const updateSpecRow = (idx: number, field: 'key' | 'value', val: string) => {
    setSpecs(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  const moveSpecRow = (idx: number, dir: 'up' | 'down') => {
    setSpecs(prev => {
      const next = [...prev];
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((s, i) => ({ ...s, displayOrder: i }));
    });
  };

  const applyTemplate = (templateName: string) => {
    if (!templateName || !SPEC_TEMPLATES[templateName]) return;
    const newSpecs: SpecRow[] = SPEC_TEMPLATES[templateName].map((key, i) => ({ key, value: '', displayOrder: i }));
    setSpecs(newSpecs);
    setSelectedTemplate('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Product title is required.'); return; }
    if (!price || parseFloat(price) <= 0) { setError('A valid price is required.'); return; }

    setIsSaving(true);
    setError('');

    try {
      // 1. Compress images to base64 (stored directly in PostgreSQL database)
      let base64ImagesList: string[] = [];

      const hasImages = coverFile || additionalImages.length > 0;
      if (hasImages) {
        setIsUploading(true);
        try {
          // Compress and convert cover image first (goes at index 0)
          if (coverFile) {
            const coverBase64 = await compressImageToBase64(coverFile);
            base64ImagesList.push(coverBase64);
          }

          // Compress and convert additional gallery images
          if (additionalImages.length > 0) {
            const sorted = [...additionalImages].sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0));
            const newBase64s = await Promise.all(
              sorted.map(img => compressImageToBase64(img.file))
            );
            base64ImagesList = [...base64ImagesList, ...newBase64s];
          }
        } catch (uploadErr: any) {
          setError(`Image compression failed: ${uploadErr.message}`);
          setIsSaving(false);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      // 2. Send single POST request to create the product with all details and images
      const finalCategoryId = subCategoryId
        ? Number(subCategoryId)
        : categoryId ? Number(categoryId) : undefined;

      const payload = {
        name: name.trim(),
        keywords: keywords.trim(),
        brand: brand,
        categoryId: finalCategoryId,
        price: parseFloat(price),
        originalPrice: parseFloat(originalPrice) || parseFloat(price),
        discountPercentage: parseInt(discount) || 0,
        stockQuantity: parseInt(stockQuantity) || 0,
        description: description,
        inStock: inStock,
        isNew: isNew,
        isBestseller: isBestseller,
        isApparelHighlights: isApparelHighlights,
        isTechHome: isTechHome,
        images: base64ImagesList,
        specifications: specs.filter(s => s.key.trim()).map((s, i) => ({ key: s.key.trim(), value: s.value.trim(), displayOrder: i })),
        materialsTitle: materialsTitle.trim(),
        materialsContent: materialsContent.trim(),
        shippingTitle: shippingTitle.trim(),
        shippingContent: shippingContent.trim(),
        careTitle: careTitle.trim(),
        careContent: careContent.trim(),
        sustainabilityTitle: sustainabilityTitle.trim(),
        sustainabilityContent: sustainabilityContent.trim(),
        craftsmanshipTitle: craftsmanshipTitle.trim(),
        craftsmanshipContent: craftsmanshipContent.trim(),
        freeShipping: freeShipping,
        codAvailable: codAvailable,
        easyReturns: easyReturns,
      };

      await axiosInstance.post('/api/admin/products', payload);

      navigate('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back to list header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Products
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Product</h1>
          <p className="text-xs text-gray-500">Create a new entry in your global product catalog</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 text-red-500">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
          </svg>
          {error}
        </div>
      )}

      {/* Main Grid: Form on left, live card preview sticky on right */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

            {/* Cover image upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Cover Image</label>
              {coverPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] max-w-md">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all group flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(coverPreview);
                        setCoverFile(null);
                        setCoverPreview('');
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-gray-50"
                    >
                      Change Cover Image
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  ref={s1DropRef}
                  onDragOver={e => { e.preventDefault(); setS1Dragging(true); }}
                  onDragLeave={() => setS1Dragging(false)}
                  onDrop={handleS1Drop}
                  onClick={() => s1InputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all max-w-md
                    ${s1Dragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${s1Dragging ? 'bg-gray-200' : 'bg-gray-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-700 font-semibold">Drop cover image here</p>
                    <p className="text-xs text-gray-400 mt-0.5">or click to browse · PNG, JPG, WEBP</p>
                  </div>
                  <input ref={s1InputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => handleCoverChange(e.target.files)} />
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Product Title *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Bo Velcro Sneaker"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
                />
              </div>

              {/* Keywords */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="e.g. headphones, headset, bluetooth, gaming, wireless"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Optional. Enter comma-separated search keywords for this product.</span>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. BELLEDONNE"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
                />
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Stock Quantity</label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={e => setStockQuantity(e.target.value)}
                  placeholder="100"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
                />
              </div>

              {/* Main Category */}
              <div>
                <CustomSelect
                  label="Main Category"
                  value={categoryId}
                  onChange={val => { setCategoryId(val); setSubCategoryId(''); }}
                  placeholder="Select category…"
                  options={categoryTree.map(cat => ({ value: String(cat.id), label: cat.name }))}
                />
              </div>

              {/* Sub-category */}
              <div>
                <CustomSelect
                  label="Sub-category"
                  hint={subCats.length === 0 && categoryId ? '(none available)' : undefined}
                  value={subCategoryId}
                  onChange={val => setSubCategoryId(val)}
                  placeholder="Select sub-category…"
                  disabled={subCats.length === 0}
                  options={subCats.map(s => ({ value: String(s.id), label: s.name, isChild: true }))}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Price (₹) *</label>
                <input
                  required
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="16500"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
                />
               </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Enter rich details about the product..."
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white resize-none transition-all"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Multiple Image uploads */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Additional Images</label>
              <ImageUploadArea images={additionalImages} onChange={setAdditionalImages} />
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { checked: inStock, onChange: setInStock, label: 'In Stock', dot: 'bg-emerald-500' },
                { checked: isBestseller, onChange: setIsBestseller, label: 'Bestseller', dot: 'bg-amber-500' },
                { checked: isApparelHighlights, onChange: setIsApparelHighlights, label: 'Apparel', dot: 'bg-violet-500' },
                { checked: isTechHome, onChange: setIsTechHome, label: 'Tech & Home', dot: 'bg-blue-500' },
              ].map(({ checked, onChange, label, dot }) => (
                <label key={label} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  checked ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => onChange(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-gray-900 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                    <span className={`text-sm font-semibold transition-colors ${checked ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
                  </div>
                </label>
              ))}
            </div>

          </div>

          {/* New Section: Product Details & Content */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3 flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-black">2</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight">Product Details & Content</h2>
                <p className="text-xs text-gray-500 mt-0.5">Variants, accordion info, and delivery configurations</p>
              </div>
            </div>

            {/* Section 1 — Specifications */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Section 1 — Product Specifications</h3>

              {/* Template Loader */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-gray-500">Quick Template:</span>
                {Object.keys(SPEC_TEMPLATES).map(tpl => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 rounded-lg border border-gray-200 hover:border-gray-900 transition-all"
                  >
                    {tpl}
                  </button>
                ))}
              </div>

              {/* Spec rows */}
              <div className="space-y-2">
                {specs.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => moveSpecRow(idx, 'up')} disabled={idx === 0}
                        className="w-5 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
                      </button>
                      <button type="button" onClick={() => moveSpecRow(idx, 'down')} disabled={idx === specs.length - 1}
                        className="w-5 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Key (e.g. Color)"
                      value={spec.key}
                      onChange={e => updateSpecRow(idx, 'key', e.target.value)}
                      className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Walnut)"
                      value={spec.value}
                      onChange={e => updateSpecRow(idx, 'value', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                    />
                    <button type="button" onClick={() => removeSpecRow(idx)}
                      className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSpecRow}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 border border-dashed border-gray-300 hover:border-gray-500 hover:text-gray-900 rounded-lg px-4 py-2 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add Specification
              </button>

              {specs.length === 0 && (
                <p className="text-xs text-gray-400 italic">No specifications added yet. Click a template above or add manually.</p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Section 2 — Accordion Content */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Section 2 — Accordion Content</h3>
              <div className="space-y-4">
                {/* MATERIALS */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={materialsTitle}
                      onChange={e => setMaterialsTitle(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white font-medium text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      Content (Admin types bullet points line by line)
                    </label>
                    <textarea
                      value={materialsContent}
                      onChange={e => setMaterialsContent(e.target.value)}
                      rows={3}
                      placeholder="Premium Italian Suede upper&#10;Supple Calf Leather lining&#10;Custom-molded natural rubber gum sole"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
                    />
                  </div>
                </div>

                {/* SHIPPING & RETURNS */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={shippingTitle}
                      onChange={e => setShippingTitle(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white font-medium text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Content (Paragraph)</label>
                    <textarea
                      value={shippingContent}
                      onChange={e => setShippingContent(e.target.value)}
                      rows={3}
                      placeholder="We offer free standard shipping across India..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
                    />
                  </div>
                </div>

                {/* PRODUCT CARE */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={careTitle}
                      onChange={e => setCareTitle(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white font-medium text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Content</label>
                    <textarea
                      value={careContent}
                      onChange={e => setCareContent(e.target.value)}
                      rows={3}
                      placeholder="Enter product care instructions..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
                    />
                  </div>
                </div>

                {/* SUSTAINABILITY */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={sustainabilityTitle}
                      onChange={e => setSustainabilityTitle(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white font-medium text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Content</label>
                    <textarea
                      value={sustainabilityContent}
                      onChange={e => setSustainabilityContent(e.target.value)}
                      rows={3}
                      placeholder="Enter sustainability specifications..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
                    />
                  </div>
                </div>

                {/* CRAFTSMANSHIP */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={craftsmanshipTitle}
                      onChange={e => setCraftsmanshipTitle(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white font-medium text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Content</label>
                    <textarea
                      value={craftsmanshipContent}
                      onChange={e => setCraftsmanshipContent(e.target.value)}
                      rows={3}
                      placeholder="Enter craftsmanship details..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Section 3 — Delivery & COD Options */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Section 3 — Delivery & COD Options</h3>
              <div className="space-y-2.5">
                {[
                  {
                    checked: freeShipping, onChange: setFreeShipping,
                    label: 'Free Shipping across India',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-emerald-500"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                  },
                  {
                    checked: codAvailable, onChange: setCodAvailable,
                    label: 'Cash on Delivery Available',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-amber-500"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>
                  },
                  {
                    checked: easyReturns, onChange: setEasyReturns,
                    label: 'Easy 7-Day Returns',
                    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                  },
                ].map(({ checked, onChange, label, icon }) => (
                  <label key={label} className={`flex items-center justify-between cursor-pointer p-4 rounded-xl border transition-all ${
                    checked ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        {icon}
                      </div>
                      <span className={`text-sm font-semibold transition-colors ${checked ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
                    </div>
                    <div className="relative">
                      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {isUploading ? '⏳ Compressing images…' : 'Review your product before publishing.'}
            </p>
            <div className="flex items-center gap-2.5">
              <Link
                to="/admin/products"
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSaving || isUploading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isUploading ? 'Compressing…' : 'Publishing…'}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Publish Product
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Live preview sticky sidebar */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Live Preview</h2>
            <ProductCardPreview
              name={name}
              price={price}
              coverPreview={coverPreview}
            />
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              This card is a live representation of how the product displays in the store’s collection view.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
