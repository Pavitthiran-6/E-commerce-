import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../../services/productService';
import axiosInstance from '../../api/axiosInstance';
import type { Product } from '../../types/product';

// ── Skeleton row ────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 admin-skeleton rounded-xl flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3.5 admin-skeleton rounded w-36" />
          <div className="h-3 admin-skeleton rounded w-20" />
        </div>
      </div>
    </td>
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-20" /></td>
    <td className="px-5 py-4"><div className="h-4 admin-skeleton rounded w-16" /></td>
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-16" /></td>
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-20" /></td>
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded w-12" /></td>
    <td className="px-5 py-4">
      <div className="flex justify-end gap-2">
        <div className="h-7 admin-skeleton rounded-lg w-14" />
        <div className="h-7 admin-skeleton rounded-lg w-16" />
      </div>
    </td>
  </tr>
);

export default function ManageProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteProductName, setDeleteProductName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch Products ──────────────────────────────────────────────────────────
  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch {
      setError('Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ── Delete Handler ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/api/admin/products/${deleteId}`);
      setDeleteId(null);
      setDeleteProductName('');
      load(); // refresh product list
    } catch {
      alert('Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your product catalogue
            {!isLoading && (
              <span className="ml-1.5 inline-flex items-center bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                {products.length} items
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/products/add')}
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 active:bg-gray-950 transition-colors shadow-sm self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </button>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, brand, category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">Failed to load products</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <button onClick={load} className="mt-3 text-xs font-semibold text-gray-900 underline">Try again</button>
          </div>
        ) : (
          <div className="overflow-x-auto admin-sticky-head">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 whitespace-nowrap">Product</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Category</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Price</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Discount</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Stock</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Badges</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">
                        {search ? 'No matching products' : 'No products yet'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {search ? `No results for "${search}"` : 'Add your first product to get started.'}
                      </p>
                      {!search && (
                        <button
                          onClick={() => navigate('/admin/products/add')}
                          className="mt-3 text-xs font-semibold text-gray-900 underline"
                        >
                          Add a product
                        </button>
                      )}
                    </td>
                  </tr>
                ) : filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50/70 transition-colors group">
                    {/* Product */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                          <img
                            src={product.image || product.images?.[0] || 'https://via.placeholder.com/44'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-[13px] truncate max-w-[200px] leading-none">{product.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{product.brand || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium capitalize">
                        {product.category || '—'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 font-bold text-gray-900 text-[13px]">
                      ₹{product.price?.toLocaleString('en-IN')}
                    </td>

                    {/* Discount */}
                    <td className="px-5 py-4">
                      {product.discount > 0 ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                          {product.discount}% OFF
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                        product.inStock
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${product.inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>

                    {/* Badges */}
                    <td className="px-5 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {product.isNew && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-md font-bold">NEW</span>
                        )}
                        {product.isBestseller && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded-md font-bold">BEST</span>
                        )}
                        {!product.isNew && !product.isBestseller && (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/admin/products/edit/' + product.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:border-gray-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => { setDeleteId(product.id); setDeleteProductName(product.name); }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-100 hover:border-red-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{products.length}</span> products
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors">
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm admin-modal-enter">
            {/* Icon */}
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Delete Product?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-800">"{deleteProductName}"</span> will be permanently removed. This action cannot be undone.
              </p>
            </div>
            {/* Actions */}
            <div className="px-6 pb-6 flex gap-2.5">
              <button
                onClick={() => { setDeleteId(null); setDeleteProductName(''); }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deleting…
                  </span>
                ) : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
