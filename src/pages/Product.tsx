import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingButton } from '../components/LoadingButton';
import { getProductById } from '../services/productService';
import { getProductReviews, addReview, checkCanReview } from '../services/reviewService';
import { compressMultipleToBase64 } from '../utils/imageCompress';
import type { Review } from '../services/reviewService';
import type { Product as ProductType } from '../types/product';
import { ProductCardSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';
import { useNetworkRecovery } from '../hooks/useNetworkRecovery';
import { Heart, ChevronLeft, ChevronRight, X, Star, ShieldCheck, RotateCcw, Truck, CreditCard, ChevronDown } from 'lucide-react';

export default function Product() {
  const { productId: id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'out_of_stock' | 'limited'>('in_stock');
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<{ file: File; preview: string }[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('description');

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { isLoggedIn } = useAuth();

  const handleAddToCart = () => {
    if (!product) return;
    const price = typeof (product.price as any) === 'string'
      ? parseInt((product.price as any).replace(/[^0-9]/g, ''))
      : product.price;
    addToCart({
      id: product.id,
      name: product.name,
      price,
      image: product.image || product.images?.[0] || '',
      quantity: 1,
      size: product.sizes?.[0] || 'Standard',
      color: product.colors?.[0] || 'Standard',
      freeShipping: product.freeShipping,
      shippingCharge: product.shippingCharge,
      weight: product.weight,
    });
    showToast(`${product.name} added to cart!`, 'success', { label: 'View Cart', href: '/cart' });
  };

  const handleBuyNow = () => {
    if (!product || stockStatus === 'out_of_stock') {
      showToast('This item is currently out of stock.', 'error');
      return;
    }
    handleAddToCart();
    navigate('/cart');
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    const price = typeof (product.price as any) === 'string'
      ? parseInt((product.price as any).replace(/[^0-9]/g, ''))
      : product.price;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({ id: product.id, name: product.name, price, image: product.image || product.images?.[0] || '' });
    }
  };

  const handleReviewPhotoAdd = (files: FileList | null) => {
    if (!files) return;
    const newImgs = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setReviewImages((prev) => [...prev, ...newImgs]);
  };

  const handleReviewPhotoRemove = (idx: number) => {
    URL.revokeObjectURL(reviewImages[idx].preview);
    setReviewImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    if (!product) return;
    e.preventDefault();
    if (!reviewComment.trim()) { showToast('Please enter a description.', 'error'); return; }
    setIsSubmittingReview(true);
    try {
      const base64Images = await compressMultipleToBase64(reviewImages.map((img) => img.file));
      const newReview = await addReview(product.id, reviewRating, reviewComment.trim(), base64Images);
      setReviews((prev) => [newReview, ...prev]);
      setTotalReviews((prev) => prev + 1);
      showToast('Review submitted successfully!', 'success');
      setReviewComment('');
      setReviewRating(5);
      reviewImages.forEach((img) => URL.revokeObjectURL(img.preview));
      setReviewImages([]);
      setIsWriteReviewOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleWriteReviewClick = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      showToast('Please login to write a review.', 'info');
      navigate('/login');
      return;
    }
    try {
      const eligibility = await checkCanReview(product.id);
      if (!eligibility.canReview) {
        showToast(eligibility.reason || 'Only customers who have received this product can review it.', 'error');
        return;
      }
      setIsWriteReviewOpen(true);
    } catch (err) {
      showToast('Failed to check review eligibility.', 'error');
    }
  };

  const fetchProduct = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) { setIsLoading(true); setError(''); }
    try {
      const data = await getProductById(id);
      setProduct(data);
      setStockStatus((data.stockQuantity ?? 0) > 0 ? 'in_stock' : 'out_of_stock');
      setError('');
      const reviewsData = await getProductReviews(data.id);
      setReviews(reviewsData.content);
      setTotalReviews(reviewsData.totalElements);
    } catch {
      if (!product) setError('Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  }, [id, product]);

  const hasFetchedOnce = useRef(false);

  useEffect(() => {
    if (!id) return;
    hasFetchedOnce.current = true;
    fetchProduct();
    setActiveImageIdx(0);
  }, [id]);

  useNetworkRecovery(useCallback(() => {
    if (!hasFetchedOnce.current || !id) return;
    fetchProduct(true);
  }, [id, fetchProduct]));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    return () => { reviewImages.forEach((img) => URL.revokeObjectURL(img.preview)); };
  }, [reviewImages]);

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-3 md:px-6 py-6 pb-32 md:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProductCardSkeleton />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 animate-pulse rounded-xl" style={{ width: `${[80, 40, 70, 90, 60][i]}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return <ErrorState message={error || 'Product not found'} onRetry={() => navigate('/collection')} className="mt-24 mx-4" />;
  }

  const price = typeof product.price === 'number' ? product.price : parseInt(String(product.price).replace(/[^0-9]/g, ''));
  const discountPct = product.discountPercentage || product.discount || 0;
  const originalPrice = discountPct > 0 ? Math.round(price / (1 - discountPct / 100)) : null;

  const productPhotos = (product.images && product.images.length > 0)
    ? product.images
    : [product.image || 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=600'];

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const accordionSections = [
    {
      id: 'description',
      label: 'Description',
      content: product.description,
    },
    {
      id: 'shipping',
      label: '🚚 Shipping & Returns',
      content: 'Free standard shipping across India. Delivery in 3–5 business days. Easy 7-day returns for unworn items in original packaging.',
    },
    {
      id: 'care',
      label: '🧽 Care Instructions',
      content: 'Please refer to the product label for specific care instructions. Handle with care to maintain quality and longevity.',
    },
  ];

  return (
    <div className="bg-[#F8F8F8] min-h-screen pb-32 md:pb-8">
      <div className="max-w-[1440px] mx-auto px-3 md:px-6 lg:px-10 py-4">

        {/* ── Breadcrumb ─────────────────────── */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Link to="/" className="hover:text-[#0C831F] font-medium">Home</Link>
          <span>/</span>
          <Link to="/collection" className="hover:text-[#0C831F] font-medium">Products</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold line-clamp-1">{product.name}</span>
        </div>

        {/* ── Main layout ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_480px] gap-4 lg:gap-8 items-start">

          {/* ── Left: Image gallery ─────────────── */}
          <div className="space-y-2">
            {/* Main image */}
            <div
              className="relative bg-white rounded-2xl overflow-hidden aspect-square cursor-zoom-in shadow-sm"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={productPhotos[activeImageIdx]}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
              {discountPct > 0 && (
                <span className="absolute top-3 left-3 bg-[#E53935] text-white text-xs font-bold px-2 py-1 rounded-lg">
                  {Math.round(discountPct)}% OFF
                </span>
              )}
              {stockStatus === 'out_of_stock' && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="bg-gray-800 text-white text-sm font-bold px-4 py-2 rounded-xl">Out of Stock</span>
                </div>
              )}
              {/* Wishlist */}
              <button
                onClick={(e) => { e.stopPropagation(); handleWishlistToggle(); }}
                className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-105 transition-transform z-10"
              >
                <Heart
                  className="w-5 h-5 transition-colors"
                  fill={isInWishlist(product.id) ? '#E53935' : 'none'}
                  stroke={isInWishlist(product.id) ? '#E53935' : '#666'}
                />
              </button>
              {/* Arrows (if multiple images) */}
              {productPhotos.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveImageIdx((prev) => (prev - 1 + productPhotos.length) % productPhotos.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveImageIdx((prev) => (prev + 1) % productPhotos.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </>
              )}
              {/* Dot indicators */}
              {productPhotos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {productPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setActiveImageIdx(idx); }}
                      className={`h-1.5 rounded-full transition-all ${idx === activeImageIdx ? 'w-5 bg-[#0C831F]' : 'w-1.5 bg-gray-300'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail row */}
            {productPhotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {productPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === activeImageIdx ? 'border-[#0C831F]' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-contain bg-white p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product details ──────────── */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
            {/* Brand / Category */}
            {(product.brand || product.category) && (
              <p className="text-xs font-semibold text-[#0C831F] uppercase tracking-wider mb-1">
                {product.brand || product.category}
              </p>
            )}

            {/* Name */}
            <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">{product.name}</h1>

            {/* Rating row */}
            {reviews.length > 0 && (
              <button
                onClick={() => setIsReviewsModalOpen(true)}
                className="flex items-center gap-1.5 mb-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5"
                      fill={i < Math.round(avgRating) ? '#F3C900' : 'none'}
                      stroke={i < Math.round(avgRating) ? '#F3C900' : '#ccc'}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({totalReviews} reviews)</span>
              </button>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-black text-gray-900">₹{price.toLocaleString('en-IN')}</span>
              {originalPrice && (
                <span className="text-sm text-gray-400 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
              )}
              {discountPct > 0 && (
                <span className="text-sm font-bold text-[#0C831F]">{Math.round(discountPct)}% off</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mb-4">Inclusive of all taxes</p>

            {/* Stock status */}
            <div className="flex items-center gap-2 mb-4">
              {stockStatus === 'in_stock' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0C831F]">
                  <span className="w-2 h-2 rounded-full bg-[#0C831F] animate-pulse" />
                  In Stock
                </span>
              )}
              {stockStatus === 'out_of_stock' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Out of Stock
                </span>
              )}
            </div>

            {/* Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="bg-[#F8F8F8] rounded-xl p-3 mb-4 space-y-1.5">
                {[...(product.specifications as any[])]
                  .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                  .map((spec, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">{spec.key}</span>
                      <span className="text-gray-900 font-semibold">{spec.value}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex gap-2 mb-4">
              <LoadingButton
                onClick={handleAddToCart}
                className="flex-1 bg-white border-2 border-[#0C831F] text-[#0C831F] text-sm font-bold py-3 rounded-xl hover:bg-[#E8F5E9] transition-colors"
              >
                Add to Cart
              </LoadingButton>
              <button
                onClick={handleBuyNow}
                disabled={stockStatus === 'out_of_stock'}
                className="flex-1 bg-[#0C831F] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#0A6B19] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {product.freeShipping !== false && (
                <div className="flex items-center gap-2 bg-[#F8F8F8] rounded-xl p-2.5">
                  <Truck className="w-4 h-4 text-[#0C831F] flex-shrink-0" />
                  <span className="text-[11px] text-gray-600 font-medium">Free Delivery</span>
                </div>
              )}
              {product.easyReturns !== false && (
                <div className="flex items-center gap-2 bg-[#F8F8F8] rounded-xl p-2.5">
                  <RotateCcw className="w-4 h-4 text-[#0C831F] flex-shrink-0" />
                  <span className="text-[11px] text-gray-600 font-medium">7-Day Returns</span>
                </div>
              )}
              {product.codAvailable !== false && (
                <div className="flex items-center gap-2 bg-[#F8F8F8] rounded-xl p-2.5">
                  <CreditCard className="w-4 h-4 text-[#0C831F] flex-shrink-0" />
                  <span className="text-[11px] text-gray-600 font-medium">Cash on Delivery</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-[#F8F8F8] rounded-xl p-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0C831F] flex-shrink-0" />
                <span className="text-[11px] text-gray-600 font-medium">Secure Checkout</span>
              </div>
            </div>

            {/* Accordion */}
            <div className="border-t border-[#E8E8E8] divide-y divide-[#E8E8E8]">
              {accordionSections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <span className="text-sm font-semibold text-gray-800">{section.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expandedSection === section.id && (
                    <div className="pb-3 text-sm text-gray-600 leading-relaxed">
                      {section.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Reviews section ─────────────────────── */}
        <div className="mt-6 bg-white rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Customer Reviews</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4" fill={i < Math.round(avgRating) ? '#F3C900' : 'none'} stroke={i < Math.round(avgRating) ? '#F3C900' : '#ccc'} />
                    ))}
                  </div>
                  <span className="text-sm font-bold">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">· {totalReviews} reviews</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleWriteReviewClick}
                className="text-sm font-bold text-[#0C831F] border-2 border-[#0C831F] px-4 py-2 rounded-xl hover:bg-[#E8F5E9] transition-colors"
              >
                Write a Review
              </button>
              {reviews.length > 2 && (
                <button
                  onClick={() => setIsReviewsModalOpen(true)}
                  className="hidden md:block text-sm font-bold bg-[#0C831F] text-white px-4 py-2 rounded-xl hover:bg-[#0A6B19] transition-colors"
                >
                  View All ({reviews.length})
                </button>
              )}
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-b border-[#E8E8E8] pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm font-bold text-gray-900">{review.userName || 'Anonymous'}</span>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Purchase
                        </span>
                      )}
                      {review.isApproved === false && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                          Awaiting Moderation
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5" fill={i < review.rating ? '#F3C900' : 'none'} stroke={i < review.rating ? '#F3C900' : '#ccc'} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {review.images.map((img, idx) => (
                        <img key={idx} src={img} alt="" className="w-16 h-16 object-cover rounded-xl border border-[#E8E8E8]" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {reviews.length > 3 && (
                <button onClick={() => setIsReviewsModalOpen(true)} className="text-sm font-bold text-[#0C831F] hover:underline md:hidden">
                  View all {reviews.length} reviews
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky bottom CTA bar (mobile only) ─── */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-[#E8E8E8] px-4 py-3 flex gap-3 shadow-xl">
        <button
          onClick={handleWishlistToggle}
          className="w-12 h-12 flex-shrink-0 bg-[#F8F8F8] rounded-xl flex items-center justify-center border border-[#E8E8E8]"
        >
          <Heart className="w-5 h-5" fill={isInWishlist(product.id) ? '#E53935' : 'none'} stroke={isInWishlist(product.id) ? '#E53935' : '#666'} />
        </button>
        <LoadingButton
          onClick={handleAddToCart}
          className="flex-1 bg-white border-2 border-[#0C831F] text-[#0C831F] text-sm font-bold py-3 rounded-xl hover:bg-[#E8F5E9] transition-colors"
        >
          Add to Cart
        </LoadingButton>
        <button
          onClick={handleBuyNow}
          disabled={stockStatus === 'out_of_stock'}
          className="flex-1 bg-[#0C831F] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#0A6B19] transition-colors disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>

      {/* ── Image lightbox ─────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={() => setLightboxOpen(false)}>
            <X className="w-8 h-8" />
          </button>
          <button
            className="absolute left-4 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setActiveImageIdx((p) => (p - 1 + productPhotos.length) % productPhotos.length); }}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <div className="w-full h-full p-8 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={productPhotos[activeImageIdx]} alt="" className="max-w-full max-h-full object-contain" />
          </div>
          <button
            className="absolute right-4 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setActiveImageIdx((p) => (p + 1) % productPhotos.length); }}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
          <div className="absolute bottom-6 text-white/50 text-sm">{activeImageIdx + 1} / {productPhotos.length}</div>
        </div>
      )}

      {/* ── All reviews modal ──────────────────── */}
      {isReviewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={() => setIsReviewsModalOpen(false)}>
          <div
            className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">All Reviews ({reviews.length})</h3>
              <button onClick={() => setIsReviewsModalOpen(false)} className="p-2 text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-[#E8E8E8] pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm font-bold text-gray-900">{review.userName || 'Anonymous'}</span>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Purchase
                        </span>
                      )}
                      {review.isApproved === false && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                          Awaiting Moderation
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5" fill={i < review.rating ? '#F3C900' : 'none'} stroke={i < review.rating ? '#F3C900' : '#ccc'} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Write review modal ─────────────────── */}
      {isWriteReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={() => setIsWriteReviewOpen(false)}>
          <div
            className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>
              <button onClick={() => setIsWriteReviewOpen(false)} className="p-2 text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star rating */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-semibold text-gray-700">Your Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} className="text-3xl hover:scale-110 transition-transform">
                      <Star className="w-8 h-8" fill={reviewRating >= star ? '#F3C900' : 'none'} stroke={reviewRating >= star ? '#F3C900' : '#ccc'} />
                    </button>
                  ))}
                </div>
              </div>
              {/* Photos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Add Photos (Optional)</label>
                <div
                  className="border-2 border-dashed border-[#E8E8E8] rounded-xl p-4 text-center cursor-pointer hover:border-[#0C831F] transition-colors"
                  onClick={() => document.getElementById('review-photo-input')?.click()}
                >
                  <p className="text-sm text-gray-500">Click to add photos</p>
                  <input id="review-photo-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleReviewPhotoAdd(e.target.files)} />
                </div>
                {reviewImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {reviewImages.map((img, idx) => (
                      <div key={img.preview} className="relative aspect-square rounded-xl overflow-hidden border border-[#E8E8E8]">
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleReviewPhotoRemove(idx)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Review *</label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="w-full border border-[#E8E8E8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C831F] resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsWriteReviewOpen(false)} className="flex-1 border-2 border-[#E8E8E8] text-gray-700 text-sm font-bold py-3 rounded-xl hover:border-gray-400 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingReview} className="flex-1 bg-[#0C831F] text-white text-sm font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-[#0A6B19] transition-colors">
                  {isSubmittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
