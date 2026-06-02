import React, { useEffect, useRef, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { compressImageToBase64 } from '../../utils/imageCompress';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  children: Category[];
}

interface CategoryFormData {
  name: string;
  description: string;
  parentId: string; // '' means it's a root (main) category
  imageUrl: string; // Stored Cloudinary URL
}

const EMPTY_FORM: CategoryFormData = { name: '', description: '', parentId: '', imageUrl: '' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none" viewBox="0 0 24 24"
    strokeWidth={2.5} stroke="currentColor"
    className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const SkeletonRow = () => (
  <tr>
    <td className="px-5 py-4"><div className="h-4 admin-skeleton rounded w-32" /></td>
    <td className="px-5 py-4"><div className="h-4 admin-skeleton rounded w-24" /></td>
    <td className="px-5 py-4"><div className="h-4 admin-skeleton rounded w-16" /></td>
    <td className="px-5 py-4"><div className="h-4 admin-skeleton rounded w-40" /></td>
    <td className="px-5 py-4"><div className="flex justify-end gap-2"><div className="h-7 admin-skeleton rounded-lg w-12" /><div className="h-7 admin-skeleton rounded-lg w-14" /><div className="h-7 admin-skeleton rounded-lg w-16" /></div></td>
  </tr>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Expanded rows for sub-categories
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api/categories/tree');
      const data = res.data?.data || [];
      setCategories(data);
      // Auto-expand all parent categories by default
      setExpanded(new Set(data.map((cat: Category) => cat.id)));
    } catch {
      setError('Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (modalOpen) nameRef.current?.focus(); }, [modalOpen]);

  // ── Toggle expand ──────────────────────────────────────────────────────────
  const toggleExpand = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  // ── Open modal helpers ─────────────────────────────────────────────────────
  const openAdd = (parentId?: number) => {
    setEditId(null);
    setFormData({ ...EMPTY_FORM, parentId: parentId ? String(parentId) : '' });
    setFormError('');
    setUploadError('');
    setModalOpen(true);
  };

  const openEdit = (cat: Category, parentId?: number) => {
    setEditId(cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      parentId: parentId ? String(parentId) : '',
      imageUrl: cat.imageUrl || '',
    });
    setFormError('');
    setUploadError('');
    setModalOpen(true);
  };

  // ── Auto Compress to base64 (mirrors Product image workflow) ─────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    try {
      const base64 = await compressImageToBase64(file);
      setFormData(prev => ({ ...prev, imageUrl: base64 }));
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.name.trim()) { setFormError('Category name is required.'); return; }
    setIsSaving(true);
    setFormError('');
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        // Only sub-categories carry an image; clear it for main categories
        imageUrl: formData.parentId ? (formData.imageUrl.trim() || null) : null,
      };
      if (formData.parentId) payload.parentId = Number(formData.parentId);

      if (editId) {
        await axiosInstance.put(`/api/admin/categories/${editId}`, payload);
      } else {
        await axiosInstance.post('/api/admin/categories', payload);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };



  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/api/admin/categories/${deleteId}`);
      setDeleteId(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalSubs = categories.reduce((s, c) => s + c.children.length, 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="inline-flex items-center bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full mr-1">{categories.length}</span>
            main categories ·
            <span className="inline-flex items-center bg-indigo-50 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full mx-1">{totalSubs}</span>
            sub-categories
          </p>
        </div>
        <button
          onClick={() => openAdd()}
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors shadow-sm self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Category
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-gray-700">Failed to load categories</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <button onClick={load} className="mt-3 text-xs font-semibold text-gray-900 underline">Try again</button>
          </div>
        ) : categories.length === 0 && !isLoading ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No categories yet</p>
            <p className="text-xs text-gray-400 mb-4">Create your first category to organize your products.</p>
            <button onClick={() => openAdd()} className="text-sm font-semibold text-gray-900 underline">
              Add your first category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto admin-sticky-head">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 whitespace-nowrap">Name</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Slug</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Sub-categories</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Description</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                  categories.map(cat => (
                    <React.Fragment key={cat.id}>
                      {/* Parent row */}
                      <tr className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            {cat.children.length > 0 ? (
                              <button
                                onClick={() => toggleExpand(cat.id)}
                                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-all flex-shrink-0"
                              >
                                <ChevronIcon open={expanded.has(cat.id)} />
                              </button>
                            ) : (
                              <span className="w-5 flex-shrink-0" />
                            )}
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt="" className="w-7 h-7 object-cover rounded-lg bg-gray-50 flex-shrink-0 border border-gray-100" />
                            ) : (
                              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100 text-gray-300 text-xs">
                                📁
                              </div>
                            )}
                            <span className="font-semibold text-gray-900 text-[13px]">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-mono border border-gray-100">{cat.slug}</span>
                        </td>
                        <td className="px-5 py-4">
                          {cat.children.length > 0 ? (
                            <span className="inline-flex items-center text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                              {cat.children.length} sub-{cat.children.length === 1 ? 'category' : 'categories'}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs max-w-[220px] truncate">
                          {cat.description || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openAdd(cat.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-100 hover:border-indigo-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              Sub
                            </button>
                            <button
                              onClick={() => openEdit(cat)}
                              className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:border-gray-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { setDeleteId(cat.id); setDeleteTarget(cat.name); }}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-100 hover:border-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Sub-category rows (collapsible) */}
                      {expanded.has(cat.id) && cat.children.map(sub => (
                        <tr key={sub.id} className="bg-gray-50/40 hover:bg-gray-50/80 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2 pl-7">
                              {/* Connecting line indicator */}
                              <div className="w-4 h-4 border-l-2 border-b-2 border-gray-200 rounded-bl-md flex-shrink-0 mb-1" />
                              {sub.imageUrl ? (
                                <img src={sub.imageUrl} alt="" className="w-7 h-7 object-cover rounded-lg bg-gray-50 flex-shrink-0 border border-gray-100" />
                              ) : (
                                <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100 text-gray-300 text-xs">
                                  📄
                                </div>
                              )}
                              <span className="text-gray-700 text-[13px] font-medium">{sub.name}</span>
                              <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">SUB</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-md font-mono border border-gray-100">{sub.slug}</span>
                          </td>
                          <td className="px-5 py-3 text-gray-300 text-xs">—</td>
                          <td className="px-5 py-3 text-gray-400 text-xs max-w-[220px] truncate">
                            {sub.description || <span className="text-gray-200">—</span>}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(sub, cat.id)}
                                className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:border-gray-300"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => { setDeleteId(sub.id); setDeleteTarget(sub.name); }}
                                className="text-xs font-semibold text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-100 hover:border-red-200"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md admin-modal-enter">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${formData.parentId ? 'bg-indigo-50' : 'bg-gray-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${formData.parentId ? 'text-indigo-600' : 'text-gray-600'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900 flex-1">
                {editId
                  ? 'Edit Category'
                  : formData.parentId
                    ? 'Add Sub-category'
                    : 'Add Category'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {formError}
                </div>
              )}

              {/* Parent selector — only shown when adding (not editing) and no preset parentId */}
              {!editId && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Type</label>
                  <select
                    value={formData.parentId}
                    onChange={e => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
                  >
                    <option value="">Main Category (e.g. Men, Women)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={String(cat.id)}>
                        Sub-category under: {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  {formData.parentId ? 'Sub-category Name *' : 'Category Name *'}
                </label>
                <input
                  ref={nameRef}
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder={formData.parentId ? 'e.g. Shirts, Jeans…' : 'e.g. Men, Women…'}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Description <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  placeholder="Short description…"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 resize-none transition-all"
                />
              </div>

              {/* Image upload — sub-categories only */}
              {formData.parentId && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Sub-category Image <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                
                {uploadError && (
                  <div className="mb-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-red-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    {uploadError}
                  </div>
                )}

                {formData.imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50 group flex items-center justify-center p-2">
                    <img
                      src={formData.imageUrl}
                      alt="Category preview"
                      className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow"
                      >
                        Clear Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-gray-50/55 group">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-xs text-gray-500 font-semibold animate-pulse">Processing image…</p>
                      </div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-300 group-hover:text-gray-400 transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <p className="text-xs text-gray-500 text-center">
                          <span className="font-semibold text-gray-700">Click to upload image</span>
                        </p>
                        <p className="text-[10px] text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50"
              >
                {isSaving && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isSaving ? 'Saving…' : editId ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm admin-modal-enter">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">Delete "{deleteTarget}"?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This cannot be undone. Categories with linked products cannot be deleted.
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
                onClick={handleDelete}
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
