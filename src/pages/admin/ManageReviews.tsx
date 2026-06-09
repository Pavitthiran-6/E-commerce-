import React, { useEffect, useState } from 'react';
import { Check, X, Trash2, ShieldCheck, Star, Search, Filter, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { getReviewsAdmin, approveReview, rejectReview, deleteReviewAdmin, type AdminReview } from '../../services/reviewService';

export default function ManageReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [productIdFilter, setProductIdFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(15);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, ratingFilter, productIdFilter, page]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let approved: boolean | undefined;
      if (statusFilter === 'APPROVED') approved = true;
      if (statusFilter === 'REJECTED') approved = false;
      // Note: PENDING has isApproved=false as well, but let's assume ALL/PENDING/APPROVED/REJECTED is handled
      // Actually, in our ReviewService, getPendingReviews uses isApproved=false, getReviewsAdmin takes Boolean approved (which is true/false/null).
      // Let's pass:
      // statusFilter === 'APPROVED' => approved = true
      // statusFilter === 'REJECTED' or 'PENDING' => approved = false (since default unapproved is pending or rejected)
      // Wait, is there a rejected state distinct from pending?
      // In the database review has "isApproved". If it's false, it's either unapproved/pending or explicitly rejected. They are currently the same field state (isApproved=false).
      // So let's treat APPROVED as approved=true, and PENDING/REJECTED as approved=false. Or let's pass undefined for ALL.
      const isApprovedParam = statusFilter === 'ALL' ? undefined : (statusFilter === 'APPROVED');
      
      const res = await getReviewsAdmin(
        isApprovedParam,
        productIdFilter.trim() || undefined,
        ratingFilter === 'ALL' ? undefined : ratingFilter,
        page,
        pageSize
      );

      // If statusFilter is PENDING, we can filter locally or let it show since isApproved=false.
      let list = res.content;
      if (statusFilter === 'PENDING') {
        // Pending reviews are unapproved (isApproved === false) but we can check if they have no rejection flag
        // Since isApproved is the only boolean, let's just show unapproved ones
        list = list.filter(r => !r.isApproved);
      }

      setReviews(list);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError('Failed to fetch reviews. Please check your admin privileges.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoadingId(id);
    try {
      await approveReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
    } catch (err) {
      alert('Failed to approve review.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoadingId(id);
    try {
      await rejectReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: false } : r));
    } catch (err) {
      alert('Failed to reject review.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    setActionLoadingId(id);
    try {
      await deleteReviewAdmin(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Failed to delete review.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? 'fill-amber-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
      {/* Title */}
      <div className="border-b border-gray-100 pb-5 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-xs text-gray-500 mt-1">Approve, reject, or delete customer product reviews</p>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
          <div className="flex gap-1.5">
            {(['ALL', 'PENDING', 'APPROVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setStatusFilter(tab); setPage(0); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === tab
                    ? 'bg-charcoal-stone text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'PENDING' ? 'Pending' : 'Approved'}
              </button>
            ))}
          </div>
        </div>

        {/* Rating Filter */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</label>
          <select
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)); setPage(0); }}
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none border-0"
          >
            <option value="ALL">All Ratings</option>
            {[5, 4, 3, 2, 1].map(r => (
              <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        {/* Product ID Filter */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Product Search (UUID)</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by product UUID..."
              value={productIdFilter}
              onChange={(e) => { setProductIdFilter(e.target.value); setPage(0); }}
              className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none border-0"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-[#0C831F] animate-spin" />
          <p className="text-sm text-gray-500 font-semibold">Loading reviews...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500 flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-100 rounded-2xl flex flex-col items-center gap-2.5">
          <MessageSquare className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-bold text-gray-700">No reviews found</p>
          <p className="text-xs text-gray-400">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Title & Comment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    <span className="block truncate max-w-[150px]">{rev.productId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="block font-bold text-gray-800">{rev.userName}</span>
                    <span className="block text-[10px] text-gray-400 truncate max-w-[150px]">{rev.userEmail}</span>
                  </td>
                  <td className="px-6 py-4">
                    {renderStars(rev.rating)}
                    {rev.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full mt-1.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-sm">
                    <p className="font-bold text-gray-900 mb-0.5 leading-normal">{rev.title}</p>
                    <p className="text-gray-500 leading-relaxed line-clamp-2">{rev.comment}</p>
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {rev.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="review attachments"
                            className="w-8 h-8 rounded-lg object-cover border border-gray-100"
                          />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {rev.isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!rev.isApproved ? (
                        <button
                          disabled={actionLoadingId !== null}
                          onClick={() => handleApprove(rev.id)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:border-green-500 text-gray-400 hover:text-green-600 bg-white hover:bg-green-50/20 transition-all"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          disabled={actionLoadingId !== null}
                          onClick={() => handleReject(rev.id)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:border-yellow-500 text-gray-400 hover:text-yellow-600 bg-white hover:bg-yellow-50/20 transition-all"
                          title="Reject / Unapprove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        disabled={actionLoadingId !== null}
                        onClick={() => handleDelete(rev.id)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:border-red-500 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50/20 transition-all"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-6">
          <button
            disabled={page === 0}
            onClick={() => setPage(prev => Math.max(0, prev - 1))}
            className="px-4 py-2 rounded-xl border-2 border-gray-100 text-xs font-bold text-gray-600 disabled:opacity-50 transition-all"
          >
            Previous
          </button>
          <span className="text-xs font-semibold text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
            className="px-4 py-2 rounded-xl border-2 border-gray-100 text-xs font-bold text-gray-600 disabled:opacity-50 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
