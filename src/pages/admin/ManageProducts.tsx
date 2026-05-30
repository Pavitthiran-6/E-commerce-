import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../../services/productService';
import axiosInstance from '../../api/axiosInstance';
import type { Product } from '../../data/products';

export default function ManageProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your product catalogue ({products.length} items)</p>
        </div>
        <button
          onClick={() => navigate('/admin/products/add')}
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Product
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, brand, category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
        />
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading products...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Badges</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No products found.</td></tr>
                ) : filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image || product.images?.[0] || 'https://via.placeholder.com/40'}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                        />
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium capitalize">{product.category}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">₹{product.price?.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5">
                      {product.discount > 0 ? (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{product.discount}% OFF</span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${product.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {product.isNew && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">NEW</span>}
                        {product.isBestseller && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-semibold">BEST</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/admin/products/edit/' + product.id)}
                          className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-100"
                        >
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
      </div>

      {/* ── Delete Confirmation dialog ───────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This action cannot be undone. The product will be permanently removed.</p>
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
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
