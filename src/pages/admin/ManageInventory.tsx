import React, { useEffect, useState } from 'react';
import { 
  getInventoryList, 
  adjustStock, 
  getInventoryReports, 
  getInventoryHistory, 
  type InventoryItem, 
  type InventoryHistoryLog, 
  type InventoryReports 
} from '../../services/inventoryService';
import { 
  Package, 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertTriangle, 
  Activity, 
  BarChart3, 
  Layers, 
  Settings, 
  History, 
  CheckCircle,
  FileText
} from 'lucide-react';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32" /></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
    <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-24" /></td>
    <td className="px-6 py-4 text-right"><div className="h-8 bg-gray-100 rounded-lg w-16 ml-auto" /></td>
  </tr>
);

export default function ManageInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [reports, setReports] = useState<InventoryReports | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [listError, setListError] = useState('');
  const [reportsError, setReportsError] = useState('');
  
  // Search & filter states
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [outOfStockFilter, setOutOfStockFilter] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Adjustment Modal/Drawer State
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // History Log Drawer State
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<InventoryItem | null>(null);
  const [historyLogs, setHistoryLogs] = useState<InventoryHistoryLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const loadReports = async () => {
    setIsLoadingReports(true);
    setReportsError('');
    try {
      const data = await getInventoryReports();
      setReports(data);
    } catch {
      setReportsError('Failed to load inventory summary metrics.');
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadList = async (p = 0) => {
    setIsLoadingList(true);
    setListError('');
    try {
      const data = await getInventoryList(search, lowStockFilter, outOfStockFilter, p, 10);
      setItems(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch {
      setListError('Failed to retrieve inventory items.');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    loadList(page);
  }, [page, lowStockFilter, outOfStockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadList(0);
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItemForAdjust(item);
    setNewQuantity(item.stockQuantity);
    setAdjustNotes('');
    setAdjustError('');
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;
    if (newQuantity < 0) {
      setAdjustError('Stock quantity cannot be negative.');
      return;
    }
    setIsAdjusting(true);
    setAdjustError('');
    try {
      const updated = await adjustStock(
        selectedItemForAdjust.productId,
        selectedItemForAdjust.variantId || null,
        newQuantity,
        adjustNotes
      );
      
      // Update in local lists
      setItems(prev => prev.map(item => 
        (item.productId === selectedItemForAdjust.productId && item.variantId === selectedItemForAdjust.variantId) 
          ? { ...item, stockQuantity: newQuantity, isLowStock: newQuantity <= item.lowStockThreshold && newQuantity > 0, isOutOfStock: newQuantity === 0 }
          : item
      ));

      setSelectedItemForAdjust(null);
      alert('Stock successfully adjusted.');
      loadReports(); // Refresh statistics
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Failed to adjust stock level.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const openHistoryDrawer = async (item: InventoryItem) => {
    setSelectedItemForHistory(item);
    setHistoryLogs([]);
    setHistoryPage(0);
    loadHistory(item.productId, 0);
  };

  const loadHistory = async (productId: string, p = 0) => {
    setIsLoadingHistory(true);
    setHistoryError('');
    try {
      const data = await getInventoryHistory(productId, p, 10);
      setHistoryLogs(data.content || []);
      setHistoryTotalPages(data.totalPages || 1);
    } catch {
      setHistoryError('Failed to retrieve movement log history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleHistoryPageChange = (nextPage: number) => {
    if (!selectedItemForHistory) return;
    setHistoryPage(nextPage);
    loadHistory(selectedItemForHistory.productId, nextPage);
  };

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track real stock, configure thresholds, and adjust inventory ledgers</p>
      </div>

      {/* ── Reports Panel ────────────────────────────────────────────────── */}
      {reportsError ? (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-medium">
          {reportsError}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Card 1: Current stock */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total Stock</p>
              {isLoadingReports ? (
                <div className="h-6 w-12 bg-gray-100 animate-pulse rounded mt-1.5" />
              ) : (
                <p className="text-xl font-bold text-gray-900 mt-1">{reports?.currentStock?.toLocaleString() || 0}</p>
              )}
            </div>
          </div>

          {/* Card 2: Reserved Stock */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Reserved</p>
              {isLoadingReports ? (
                <div className="h-6 w-12 bg-gray-100 animate-pulse rounded mt-1.5" />
              ) : (
                <p className="text-xl font-bold text-gray-900 mt-1">{reports?.reservedStock?.toLocaleString() || 0}</p>
              )}
            </div>
          </div>

          {/* Card 3: Sold Stock */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total Sold</p>
              {isLoadingReports ? (
                <div className="h-6 w-12 bg-gray-100 animate-pulse rounded mt-1.5" />
              ) : (
                <p className="text-xl font-bold text-gray-900 mt-1">{reports?.soldStock?.toLocaleString() || 0}</p>
              )}
            </div>
          </div>

          {/* Card 4: Low Stock Alert Count */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Low Stock Alerts</p>
              {isLoadingReports ? (
                <div className="h-6 w-12 bg-gray-100 animate-pulse rounded mt-1.5" />
              ) : (
                <p className="text-xl font-bold text-red-600 mt-1">{reports?.lowStockCount || 0}</p>
              )}
            </div>
          </div>

          {/* Card 5: Out of Stock Count */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-gray-900 rounded-xl text-white">
              <X className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Out of Stock</p>
              {isLoadingReports ? (
                <div className="h-6 w-12 bg-gray-100 animate-pulse rounded mt-1.5" />
              ) : (
                <p className="text-xl font-bold text-gray-900 mt-1">{reports?.outOfStockCount || 0}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Search and Filter Controls ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product name or slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
          />
        </form>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => { setLowStockFilter(prev => !prev); setPage(0); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              lowStockFilter
                ? 'bg-red-50 text-red-700 border-red-200 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock Alerts Only
          </button>

          <button
            onClick={() => { setOutOfStockFilter(prev => !prev); setPage(0); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              outOfStockFilter
                ? 'bg-gray-950 text-white border-gray-950 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Out of Stock Only
          </button>
        </div>
      </div>

      {/* ── Main Data Table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {listError ? (
          <div className="p-10 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Failed to load inventory list</p>
            <p className="text-xs text-gray-400 mt-1">{listError}</p>
            <button onClick={() => loadList(page)} className="mt-4 text-xs font-semibold text-gray-900 underline">
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Variant Attributes</th>
                  <th className="px-6 py-4">Low Stock Limit</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4">Inventory Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoadingList ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-xs">
                      No products or variants found in catalog matching filters.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        {/* Product Title */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 bg-gray-50 rounded overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center">
                              {item.productImage ? (
                                <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover mix-blend-multiply" />
                              ) : (
                                <Package className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 line-clamp-1">{item.productName}</p>
                              <p className="text-[10px] font-mono text-gray-400 mt-0.5">{item.productId.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>

                        {/* Variant Attributes */}
                        <td className="px-6 py-4">
                          {item.variantId ? (
                            <span className="inline-flex flex-wrap gap-1">
                              {item.size && <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Size: {item.size}</span>}
                              {item.color && <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Col: {item.color}</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-450 italic">Base Product</span>
                          )}
                        </td>

                        {/* Low Stock Threshold */}
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {item.lowStockThreshold}
                        </td>

                        {/* Stock Quantity */}
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {item.stockQuantity}
                        </td>

                        {/* Inventory Status badge */}
                        <td className="px-6 py-4">
                          {item.isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              Out of Stock
                            </span>
                          ) : item.isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Low Stock Alert
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              In Stock
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openHistoryDrawer(item)}
                              title="View Stock Ledger History"
                              className="p-1.5 border border-gray-200 hover:border-gray-900 rounded-lg text-gray-500 hover:text-gray-900 transition-colors bg-white shadow-xs"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openAdjustModal(item)}
                              className="bg-gray-900 text-white hover:bg-black px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              Adjust
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!isLoadingList && totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Adjustment Modal (Popup modal) ───────────────────────────────── */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-950"></div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-800" />
              Adjust Stock Quantity
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Update physical catalog stock for <span className="font-semibold text-gray-800">{selectedItemForAdjust.productName}</span>.
              {selectedItemForAdjust.variantId && ` (Size: ${selectedItemForAdjust.size || 'N/A'}, Color: ${selectedItemForAdjust.color || 'N/A'})`}
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {/* Current Quantity Display */}
              <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex justify-between items-center text-xs">
                <span className="text-gray-500">Current In-Stock:</span>
                <span className="font-bold text-gray-800 text-sm">{selectedItemForAdjust.stockQuantity}</span>
              </div>

              {/* New Quantity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  New Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={e => setNewQuantity(parseInt(e.target.value, 10) || 0)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-450 transition-colors font-bold"
                />
              </div>

              {/* Adjust Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Adjustment Reason / Notes
                </label>
                <textarea
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Stock count mismatch audit, damaged goods writeoff, restock shipment..."
                  rows={3}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-450 transition-colors resize-none"
                />
              </div>

              {adjustError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{adjustError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForAdjust(null)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="flex-1 bg-gray-950 text-white rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                >
                  {isAdjusting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isAdjusting ? 'Saving...' : 'Adjust Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Inventory History Log Drawer (Slide out) ─────────────────────────── */}
      {selectedItemForHistory && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedItemForHistory(null)}
          />
          
          {/* Drawer container */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-50 flex flex-col animate-slideLeft">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-gray-700" />
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Inventory Ledger History</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedItemForHistory.productName}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItemForHistory(null)}
                className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-gray-700 rounded-lg transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Product Info Block */}
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-gray-400 font-bold uppercase tracking-wider">Current Quantity: </span>
                  <span className="font-bold text-gray-800 text-sm ml-1">{selectedItemForHistory.stockQuantity}</span>
                </div>
                {selectedItemForHistory.variantId && (
                  <span className="bg-white border px-2 py-0.5 rounded font-semibold text-gray-600">
                    Variant #{selectedItemForHistory.variantId}
                  </span>
                )}
              </div>

              {/* Movement Logs List */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Movement Log Ledger</h4>
                
                {isLoadingHistory ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : historyError ? (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-800 text-xs font-semibold rounded-xl text-center">
                    {historyError}
                  </div>
                ) : historyLogs.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-xs italic">
                    No ledger movement records exist for this product.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historyLogs.map((log) => {
                      const isQtyPositive = log.quantityChanged > 0;
                      return (
                        <div key={log.id} className="bg-white rounded-xl border border-gray-150 p-3.5 shadow-sm text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-800 uppercase tracking-wide bg-gray-50 px-2 py-0.5 rounded border text-[10px]">
                              {log.actionType}
                            </span>
                            <span className="text-gray-400 text-[10px] font-medium">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between text-xs pt-1">
                            <span className="text-gray-500">Change Quantity:</span>
                            <span className={`font-bold ${isQtyPositive ? 'text-green-600' : log.quantityChanged === 0 ? 'text-gray-500' : 'text-red-600'}`}>
                              {isQtyPositive ? `+${log.quantityChanged}` : log.quantityChanged}
                            </span>
                          </div>

                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Resulting Stock:</span>
                            <span className="font-bold text-gray-900">{log.resultingStock}</span>
                          </div>

                          {log.notes && (
                            <div className="text-[11px] text-gray-500 bg-gray-50/50 p-2 rounded border border-gray-100 mt-1">
                              <span className="font-semibold text-gray-700">Notes:</span> {log.notes}
                            </div>
                          )}

                          {log.changedBy && (
                            <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1 mt-1">
                              <span>By:</span> <span className="font-semibold">{log.changedBy}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* History pagination logs controls */}
              {!isLoadingHistory && historyTotalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Page {historyPage + 1} of {historyTotalPages}</span>
                  <div className="flex gap-1.5">
                    <button
                      disabled={historyPage === 0}
                      onClick={() => handleHistoryPageChange(historyPage - 1)}
                      className="p-1 border rounded hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={historyPage >= historyTotalPages - 1}
                      onClick={() => handleHistoryPageChange(historyPage + 1)}
                      className="p-1 border rounded hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
