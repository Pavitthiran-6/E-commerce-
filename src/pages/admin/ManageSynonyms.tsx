import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  adminGetSynonyms,
  createSynonym,
  updateSynonym,
  deleteSynonym
} from '../../services/searchService';
import type { SearchSynonym } from '../../services/searchService';

export default function ManageSynonyms() {
  const { showToast } = useToast();
  const [synonyms, setSynonyms] = useState<SearchSynonym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states (creates or edit)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [mappedTerm, setMappedTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal states
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load synonyms on mount
  const loadSynonyms = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminGetSynonyms();
      setSynonyms(data);
    } catch (err) {
      setError('Failed to fetch synonyms.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSynonyms();
  }, []);

  // Create or Update synonym submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      showToast('Keyword is required.', 'error');
      return;
    }
    if (!mappedTerm.trim()) {
      showToast('Mapped term is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Edit existing mapping
        await updateSynonym(editingId, keyword.trim(), mappedTerm.trim());
        showToast(`Synonym mapping updated successfully!`, 'success');
      } else {
        // Create new mapping
        await createSynonym(keyword.trim(), mappedTerm.trim());
        showToast(`Synonym mapping created successfully!`, 'success');
      }

      // Reset form
      setKeyword('');
      setMappedTerm('');
      setEditingId(null);
      loadSynonyms(); // refresh table
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save synonym. Duplicate?';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete synonym handler
  const handleDeleteSynonym = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteSynonym(deleteId);
      showToast('Synonym mapping deleted successfully.', 'success');
      setDeleteId(null);
      loadSynonyms(); // refresh table
    } catch (err) {
      showToast('Failed to delete synonym.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Start editing a synonym mapping
  const startEdit = (syn: SearchSynonym) => {
    setEditingId(syn.id);
    setKeyword(syn.keyword);
    setMappedTerm(syn.mappedTerm);
    // Smooth scroll to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingId(null);
    setKeyword('');
    setMappedTerm('');
  };

  // Shared input class
  const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Page Title ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Search Synonyms</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage keyword search expansions and equivalents</p>
      </div>

      {/* ── Create / Edit Form ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-emerald-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-gray-900">
            {editingId ? 'Edit Synonym Mapping' : 'Create New Synonym Mapping'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Keyword Field */}
            <div>
              <label className={labelCls}>Keyword (User Types) *</label>
              <input
                required
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="e.g. headset"
                className={inputCls}
              />
              <span className="text-[10px] text-gray-400 mt-1 block">When users search this term, the system expands the query.</span>
            </div>

            {/* Mapped Term Field */}
            <div>
              <label className={labelCls}>Mapped Term (Expands To) *</label>
              <input
                required
                type="text"
                value={mappedTerm}
                onChange={e => setMappedTerm(e.target.value)}
                placeholder="e.g. headphones"
                className={inputCls}
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Synonym term matching products in name, tags, description, etc.</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-5 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {editingId ? 'Update Synonym' : 'Create Synonym'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Synonyms Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-gray-900">Synonyms List</h2>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
            {synonyms.length} Mappings
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 admin-skeleton rounded w-24" />
                <div className="h-4 admin-skeleton rounded w-32" />
                <div className="h-4 admin-skeleton rounded flex-1" />
                <div className="h-5 admin-skeleton rounded-lg w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error}</div>
        ) : synonyms.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">No synonyms registered yet</p>
            <p className="text-xs text-gray-400 mt-1">Register mapping rules above to enhance query matching!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3.5 whitespace-nowrap">Keyword (User Searches)</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Mapped Term (Expands To)</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Created At</th>
                  <th className="px-6 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {synonyms.map(syn => (
                  <tr key={syn.id} className="transition-colors hover:bg-gray-50/70">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-gray-900 uppercase tracking-wider">
                      {syn.keyword}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                        {syn.mappedTerm}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(syn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2.5">
                      <button
                        onClick={() => startEdit(syn)}
                        className="text-xs font-bold text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-xl hover:bg-gray-100 border border-gray-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(syn.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors border border-red-100 hover:border-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">Delete Synonym mapping?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                This action cannot be undone. Searching for the keyword will no longer automatically expand to the mapped term.
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
                onClick={handleDeleteSynonym}
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
