import React, { useEffect, useRef, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

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
}

const EMPTY_FORM: CategoryFormData = { name: '', description: '', parentId: '' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none" viewBox="0 0 24 24"
    strokeWidth={2} stroke="currentColor"
    className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Open modal helpers ─────────────────────────────────────────────────────
  const openAdd = (parentId?: number) => {
    setEditId(null);
    setFormData({ ...EMPTY_FORM, parentId: parentId ? String(parentId) : '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (cat: Category, parentId?: number) => {
    setEditId(cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      parentId: parentId ? String(parentId) : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.name.trim()) { setFormError('Category name is required.'); return; }
    setIsSaving(true);
    setFormError('');
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {categories.length} main categories · {totalSubs} sub-categories
          </p>
        </div>
        <button
          onClick={() => openAdd()}
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading categories…</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500 text-sm">{error}</div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-300 mx-auto mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
            <p className="text-sm text-gray-500 mb-4">No categories yet.</p>
            <button onClick={() => openAdd()} className="text-sm font-semibold text-gray-900 underline">
              Add your first category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Sub-categories</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map(cat => (
                  <React.Fragment key={cat.id}>
                    {/* Parent row */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {cat.children.length > 0 && (
                            <button
                              onClick={() => toggleExpand(cat.id)}
                              className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                            >
                              <ChevronIcon open={expanded.has(cat.id)} />
                            </button>
                          )}
                          {cat.children.length === 0 && <span className="w-4" />}
                          <span className="font-semibold text-gray-900">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">{cat.slug}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-gray-600">
                          {cat.children.length > 0 ? `${cat.children.length} sub-categor${cat.children.length === 1 ? 'y' : 'ies'}` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[200px] truncate">
                        {cat.description || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openAdd(cat.id)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-100"
                          >
                            + Sub
                          </button>
                          <button
                            onClick={() => openEdit(cat)}
                            className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setDeleteId(cat.id); setDeleteTarget(cat.name); }}
                            className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Sub-category rows (collapsible) */}
                    {expanded.has(cat.id) && cat.children.map(sub => (
                      <tr key={sub.id} className="bg-gray-50/60 hover:bg-gray-100/60 transition-colors">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2 pl-8">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-gray-300 flex-shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m15 11.25-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <span className="text-gray-700 text-sm">{sub.name}</span>
                            <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">SUB</span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="text-xs bg-gray-200 text-gray-400 px-2 py-0.5 rounded font-mono">{sub.slug}</span>
                        </td>
                        <td className="px-5 py-2.5 text-gray-400 text-xs">—</td>
                        <td className="px-5 py-2.5 text-gray-400 text-xs max-w-[200px] truncate">
                          {sub.description || '—'}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(sub, cat.id)}
                              className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { setDeleteId(sub.id); setDeleteTarget(sub.name); }}
                              className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                {editId
                  ? 'Edit Category'
                  : formData.parentId
                    ? 'Add Sub-category'
                    : 'Add Category'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>
              )}

              {/* Parent selector — only shown when adding (not editing) and no preset parentId */}
              {!editId && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select
                    value={formData.parentId}
                    onChange={e => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white"
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
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {formData.parentId ? 'Sub-category Name *' : 'Category Name *'}
                </label>
                <input
                  ref={nameRef}
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder={formData.parentId ? 'e.g. Shirts, Jeans…' : 'e.g. Men, Women…'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description <span className="text-gray-400">(optional)</span></label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  placeholder="Short description…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : editId ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-2">Delete "{deleteTarget}"?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This cannot be undone. Categories with linked products cannot be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
