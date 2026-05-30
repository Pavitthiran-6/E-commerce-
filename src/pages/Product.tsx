import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import type { WishlistItem } from '../context/WishlistContext';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingButton } from '../components/LoadingButton';
import { getProductById } from '../services/productService';
import { getProductReviews, addReview } from '../services/reviewService';
import type { Review } from '../services/reviewService';
import type { Product as ProductType } from '../data/products';
import { ProductCardSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';

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

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { isLoggedIn } = useAuth();

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: typeof (product.price as any) === 'string' ? parseInt((product.price as any).replace(/[^0-9]/g, '')) : product.price,
      image: product.image || (product.images && product.images[0]) || '',
      quantity: 1,
      size: product.sizes?.[0] || 'Standard',
      color: product.colors?.[0] || 'Standard',
    });
    showToast(`${product.name} added to cart!`, 'success', { label: 'View Cart', href: '/cart' });
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (stockStatus === 'out_of_stock') {
      showToast('This item is currently out of stock.', 'error');
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: typeof (product.price as any) === 'string' ? parseInt((product.price as any).replace(/[^0-9]/g, '')) : product.price,
      image: product.image || (product.images && product.images[0]) || '',
      quantity: 1,
      size: product.sizes?.[0] || 'Standard',
      color: product.colors?.[0] || 'Standard',
    });
    navigate('/cart');
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: typeof (product.price as any) === 'string' ? parseInt((product.price as any).replace(/[^0-9]/g, '')) : product.price,
        image: product.image || (product.images && product.images[0]) || ''
      });
    }
  };

  const handleReviewPhotoAdd = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files);
    const newImgs = list
      .filter(f => f && f.type.startsWith('image/'))
      .map(f => ({
        file: f,
        preview: URL.createObjectURL(f),
      }));
    setReviewImages([...reviewImages, ...newImgs]);
  };

  const handleReviewPhotoRemove = (idx: number) => {
    URL.revokeObjectURL(reviewImages[idx].preview);
    setReviewImages(reviewImages.filter((_, i) => i !== idx));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    if (!product) return;
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast('Please enter a description.', 'error');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const newReview = await addReview(product.id, reviewRating, reviewComment.trim());
      setReviews(prev => [newReview, ...prev]);
      setTotalReviews(prev => prev + 1);
      showToast('Review submitted successfully!', 'success');
      setReviewComment('');
      setReviewRating(5);
      reviewImages.forEach(img => URL.revokeObjectURL(img.preview));
      setReviewImages([]);
      setIsWriteReviewOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleWriteReviewClick = () => {
    if (!isLoggedIn) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      showToast('Please login to write a review.', 'info');
      navigate('/auth/login');
      return;
    }
    setIsWriteReviewOpen(true);
  };

  // Fetch product
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getProductById(id);
        setProduct(data);
        setStockStatus((data.stockQuantity ?? 0) > 0 ? 'in_stock' : 'out_of_stock');
        
        // Fetch reviews
        const reviewsData = await getProductReviews(id);
        setReviews(reviewsData.content);
        setTotalReviews(reviewsData.totalElements);
      } catch (err) {
        setError('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);


  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      reviewImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [reviewImages]);


  const reviewPhotos = [
    { url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1200&auto=format&fit=crop", rating: 5 },
    { url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop", rating: 5 },
    { url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1200&auto=format&fit=crop", rating: 5 },
    { url: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=1200&auto=format&fit=crop", rating: 4 },
    { url: "https://images.unsplash.com/photo-1551107696-a4b0a5a02146?q=80&w=1200&auto=format&fit=crop", rating: 5 },
    { url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1200&auto=format&fit=crop", rating: 5 }
  ];

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const nextLightboxImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % reviewPhotos.length);
    }
  };

  const prevLightboxImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + reviewPhotos.length) % reviewPhotos.length);
    }
  };

  const isCustomImages = product && product.images && product.images.length > 0;
  const productPhotos = isCustomImages
    ? product.images
    : [
        product?.image || "https://lh3.googleusercontent.com/aida/ADBb0ugdJSLBhMOg17OKe5bEJVJiBOhqWn1_CUUSdpfLgqnS0r5rnqduDT4BHMLRSGcg-0QLdZ9mZ-xJDKkRLPv00aFS4YEjyzC2Y_9u3Ue9CIXPPs3C-VFKzrv-JUWkAZKNpej3W2G-so1vCRj_QuKcV5zNWSiRxnLpG08to022Vug_7Eq_NJ5rTgs__4F2qFl-ucJsozGDdMUZO1jXGXnEZBdn2YKT8sh9JNq-srHVfu-d86eGN6cdSo8XWhZC",
        "https://lh3.googleusercontent.com/aida/ADBb0uj7lpaKtCv6nmi__My16-1qw2GYsH8kGgWFX8sUp721M_3ZV1MXIEiixNADIqC1jf-Rn59cGUE0vfnGsv0eaYIkXaBU2mD4UoqPL47zb5xDriq6Be_KER-k6w9iGYKoi3Gq3mahFAac52krcZcpiFptpAgz1Snfd21Oxzc8EpKqU4C_MQ3CKGYxVvvvMOLqEOUJmYN0MCg1Sj0PVKDgUO-eNTaGY_EHXre61DRpKfSMUG7vbzwE-NdNVtwC",
        ...(id === 'b0-classic' ? ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=2000&auto=format&fit=crop"] : []),
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCB7FrTQPZN7y1jyl2TYYUyxVUNWnJKIb4RBaa22BhfUShaM8hHCbw6KdNF_gn5eFdoas6M1kOz_AMKzZSSWibUf9NHuPD_ZhzdfoHsDoINSMF_7oJwC7hW6X6fRTAvKi5XeHRiOaVk-9WsjyoDAZv4gxfr9Ly7OW-ISIbkHXjZBRhXwORYc_OhcP_cfe-eF81i8NK8Ri-xjKi13fMi2sWFL28l-5LSGLOh-VI3whH1ApbIHo9raaOK6d8HCYLA9BGWRxw561reu3uR"
      ];

  const defaultTextureUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCB7FrTQPZN7y1jyl2TYYUyxVUNWnJKIb4RBaa22BhfUShaM8hHCbw6KdNF_gn5eFdoas6M1kOz_AMKzZSSWibUf9NHuPD_ZhzdfoHsDoINSMF_7oJwC7hW6X6fRTAvKi5XeHRiOaVk-9WsjyoDAZv4gxfr9Ly7OW-ISIbkHXjZBRhXwORYc_OhcP_cfe-eF81i8NK8Ri-xjKi13fMi2sWFL28l-5LSGLOh-VI3whH1ApbIHo9raaOK6d8HCYLA9BGWRxw561reu3uR";
  
  let thirdImageSrc = defaultTextureUrl;
  let thirdImageClickIndex = isCustomImages ? 0 : (id === 'b0-classic' ? 3 : 2);

  if (isCustomImages) {
    if (productPhotos.length >= 3) {
      thirdImageSrc = productPhotos[2];
      thirdImageClickIndex = 2;
    } else {
      thirdImageSrc = defaultTextureUrl;
      thirdImageClickIndex = 0;
    }
  } else {
    thirdImageSrc = productPhotos[id === 'b0-classic' ? 3 : 2] || defaultTextureUrl;
  }

  const [productLightboxIndex, setProductLightboxIndex] = useState<number | null>(null);

  const nextProductImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (productLightboxIndex !== null) {
      setProductLightboxIndex((productLightboxIndex + 1) % productPhotos.length);
    }
  };

  const prevProductImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (productLightboxIndex !== null) {
      setProductLightboxIndex((productLightboxIndex - 1 + productPhotos.length) % productPhotos.length);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col md:flex-row min-h-screen pt-24 px-6 md:px-16 gap-8 pb-16">
        <div className="w-full md:w-1/2">
          <ProductCardSkeleton />
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="h-10 bg-gray-200 animate-pulse w-3/4 rounded"></div>
          <div className="h-6 bg-gray-200 animate-pulse w-1/4 rounded"></div>
          <div className="h-24 bg-gray-200 animate-pulse w-full rounded mt-4"></div>
          <div className="h-12 bg-gray-200 animate-pulse w-full rounded mt-8"></div>
          <div className="h-12 bg-gray-200 animate-pulse w-full rounded mt-2"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return <ErrorState message={error || 'Product not found'} onRetry={() => navigate('/collection')} className="mt-24 mx-4" />;
  }

  return (
    <div className="w-full flex flex-col">
      <main className="w-full flex flex-col md:flex-row min-h-screen">
      {/* Left Column: Product Imagery */}
      <div className="w-full md:w-1/2 flex flex-col gap-4">
        <div className="w-full bg-[#f6f5f0] aspect-[4/5] flex items-center justify-center overflow-hidden">
          <img alt={product.name} onClick={() => setProductLightboxIndex(0)} className="w-full h-full object-scale-down p-4 transform transition-transform duration-700 ease-in-out hover:scale-105 mix-blend-multiply cursor-pointer" src={product.image || productPhotos[0] || ''} />
        </div>
        {productPhotos.slice(1).map((photo, idx) => (
          <div key={idx} className="w-full bg-[#f6f5f0] aspect-[4/5] flex items-center justify-center overflow-hidden">
            <img alt={`${product.name} Detail ${idx + 1}`} onClick={() => setProductLightboxIndex(idx + 1)} className="w-full h-full object-scale-down p-4 transform transition-transform duration-700 ease-in-out hover:scale-105 mix-blend-multiply cursor-pointer" src={photo} />
          </div>
        ))}
      </div>
      
      {/* Right Column: Product Details (Sticky) */}
      <div className="w-full md:w-1/2 relative bg-white pt-24 pb-12 px-6 md:px-16 lg:px-24">
        <div className="sticky top-24 flex flex-col gap-6">
          {/* Title & Price */}
          <div className="border-b border-outline-variant/30 pb-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-headline-display text-4xl text-primary capitalize">{product.name}</h1>
              <button 
                type="button"
                onClick={handleWishlistToggle}
                className="p-1.5 hover:bg-[#f6f5f0] rounded-full transition-colors group focus:outline-none flex-shrink-0"
                aria-label="Add to Wishlist"
              >
                <Heart 
                  className={`w-6 h-6 transition-colors duration-300 ${
                    isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-primary group-hover:text-red-500'
                  }`}
                />
              </button>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold text-charcoal-stone">{typeof product.price === 'number' ? `₹${product.price.toLocaleString('en-IN')}` : product.price}</p>
                <div className="flex items-center gap-2">
                  {stockStatus === 'in_stock' && (
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span><span className="text-sm font-body-md text-on-surface-variant">In Stock</span></div>
                  )}
                  {stockStatus === 'out_of_stock' && (
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="text-sm font-body-md text-red-500">Out of Stock</span></div>
                  )}
                  {stockStatus === 'limited' && (
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span><span className="text-sm font-body-md text-yellow-600">Limited Stock</span></div>
                  )}
                </div>
              </div>
              <p className="text-xs text-on-surface-variant/70">(Incl. of all taxes)</p>
            </div>
          </div>
          
          {/* Narrative */}
          <div className="prose prose-p:font-body-md prose-p:text-on-surface-variant prose-p:leading-relaxed">
            <p className="text-sm">{product.description}</p>
          </div>
          
          {/* Dynamic Product Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="flex flex-col gap-3">
              {[...(product.specifications as any[])]
                .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                .map((spec, idx) => (
                  <div key={idx} className="flex items-start justify-between border-b border-outline-variant/20 pb-2 last:border-0">
                    <span className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest w-1/3 pt-0.5">
                      {spec.key}
                    </span>
                    <span className="font-body-md text-sm text-primary text-right w-2/3 font-medium">
                      {spec.value}
                    </span>
                  </div>
                ))}
            </div>
          )}

          
          {/* CTA */}
          <div className="mt-2 flex flex-col gap-3">
            <div className="flex gap-3">
              <LoadingButton 
                onClick={handleAddToCart}
                className="w-1/2 font-button text-button uppercase py-3 transition-colors duration-400 ease-in-out tracking-[0.1em] bg-primary text-white hover:bg-primary/90"
              >
                Add to Cart
              </LoadingButton>
              <button 
                onClick={handleBuyNow}
                disabled={stockStatus === 'out_of_stock'}
                className={`w-1/2 font-button text-button uppercase py-3 transition-colors duration-400 ease-in-out tracking-[0.1em] border bg-white text-primary border-primary hover:bg-warm-sand disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Buy it Now
              </button>
            </div>
            
            {/* Pincode Checker */}
            <div className="flex flex-col gap-2 mt-4">
              <label htmlFor="pincode" className="font-label-caps text-xs text-primary uppercase tracking-widest">
                {product.codAvailable !== false && product.id !== '376d0483-9223-4338-be12-0861da0688cb' ? 'Delivery & COD Options' : 'Delivery Options'}
              </label>
              <div className="flex w-full">
                <input 
                  id="pincode" 
                  type="text" 
                  placeholder="Enter Pincode" 
                  className="flex-grow border border-outline-variant px-4 py-2 text-sm focus:outline-none focus:border-primary"
                  maxLength={6}
                />
                <LoadingButton className="bg-primary text-white px-4 py-2 text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors">Check</LoadingButton>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {product.freeShipping !== false && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚚</span>
                  <span className="text-xs text-on-surface-variant">Free Shipping across India</span>
                </div>
              )}
              {product.easyReturns !== false && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔁</span>
                  <span className="text-xs text-on-surface-variant">Easy 7-Day Returns</span>
                </div>
              )}
              {product.codAvailable !== false && product.id !== '376d0483-9223-4338-be12-0861da0688cb' && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">💵</span>
                  <span className="text-xs text-on-surface-variant">Cash on Delivery Available</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <span className="text-xs text-on-surface-variant">Secure Checkout</span>
              </div>
            </div>
          </div>
          
          {/* Details Accordion */}
          <div className="mt-4 border-t border-outline-variant/30 flex flex-col divide-y divide-outline-variant/30">
            <details className="group py-3" open>
              <summary className="flex justify-between items-center font-label-caps text-label-caps text-primary uppercase tracking-widest cursor-pointer list-none">
                Craftsmanship
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition duration-300 group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="font-body-md text-on-surface-variant mt-4 leading-relaxed">
                Every pair is meticulously hand-stitched in family-owned workshops in Porto, Portugal. Our artisans bring decades of experience to ensure perfect tension in every seam, resulting in unparalleled durability.
              </div>
            </details>
            <details className="group py-4">
              <summary className="flex justify-between items-center font-label-caps text-label-caps text-primary uppercase tracking-widest cursor-pointer list-none">
                Materials
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition duration-300 group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="font-body-md text-on-surface-variant mt-4 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Premium Italian Suede upper</li>
                  <li>Supple Calf Leather lining for immediate comfort</li>
                  <li>Custom-molded natural rubber gum sole</li>
                  <li>Waxed cotton laces</li>
                </ul>
              </div>
            </details>
            <details className="group py-4">
              <summary className="flex justify-between items-center font-label-caps text-label-caps text-primary uppercase tracking-widest cursor-pointer list-none">
                Shipping & Returns
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition duration-300 group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="font-body-md text-on-surface-variant mt-4 leading-relaxed">
                We offer free standard shipping across India. Delivery takes 3-5 business days. We gladly accept returns or exchanges within 7 days of delivery for unworn items in original packaging. We also offer reverse pickup for your convenience.
              </div>
            </details>
            <details className="group py-4">
              <summary className="flex justify-between items-center font-label-caps text-label-caps text-primary uppercase tracking-widest cursor-pointer list-none">
                Product Care
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition duration-300 group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="font-body-md text-on-surface-variant mt-4 leading-relaxed">
                To keep your suede looking fresh in Indian weather, we recommend using a suede brush to remove dust. Avoid wearing in heavy rain, and use a specialized protector spray. If they get wet, let them dry naturally away from direct heat.
              </div>
            </details>
            <details className="group py-4">
              <summary className="flex justify-between items-center font-label-caps text-label-caps text-primary uppercase tracking-widest cursor-pointer list-none">
                Sustainability
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition duration-300 group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="font-body-md text-on-surface-variant mt-4 leading-relaxed">
                We source our leathers from LWG Gold-certified tanneries, ensuring minimal environmental impact. Our packaging is 100% recyclable and made from post-consumer waste.
              </div>
            </details>
          </div>
        </div>
      </div>
      </main>
      
      {/* Image & Reviews Section Below */}
      <section className="w-full flex flex-col md:flex-row border-t border-outline-variant/30">
        {/* Left Side: User Reviews */}
        <div className="w-full md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-[#fafafa]">
          <div className="mb-8">
            <h2 className="font-headline-display text-3xl text-primary mb-3">Customer Reviews</h2>
            <div className="flex gap-4 items-center">
            <div className="flex text-yellow-500 text-sm">
              {'★'.repeat(5)}
            </div>
            <a href="#reviews" className="font-body-sm text-on-surface-variant underline underline-offset-4 hover:text-primary transition-colors">
              {totalReviews} Reviews
            </a>
          </div>  {/* Customer Photos Gallery */}
            <div className="flex flex-col gap-3">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest text-xs">Customer Photos</span>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {reviewPhotos.map((photo, index) => (
                  <img 
                    key={index}
                    src={photo.url} 
                    alt={`Customer photo ${index + 1}`} 
                    onClick={() => setLightboxIndex(index)}
                    className="w-24 h-24 flex-shrink-0 object-cover border border-outline-variant/30 rounded-sm snap-start cursor-pointer hover:opacity-80 transition-opacity" 
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {reviews.slice(0, 2).map((review) => (
              <div key={review.id} className="border-b border-outline-variant/30 pb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{review.userName || 'Anonymous'}</span>
                  <span className="font-body-sm text-on-surface-variant">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex text-yellow-500 text-sm mb-3">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed mb-4">{review.comment}</p>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="font-body-md text-on-surface-variant italic">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <button 
              onClick={handleWriteReviewClick}
              className="border border-primary text-primary font-button text-button uppercase py-3 px-8 hover:bg-primary hover:text-white transition-colors duration-400 ease-in-out tracking-[0.1em]"
            >
              Write a Review
            </button>
            {totalReviews > 2 && (
              <button 
                onClick={() => setIsReviewsModalOpen(true)}
                className="bg-primary text-white font-button text-button uppercase py-3 px-8 hover:bg-primary/90 transition-colors duration-400 ease-in-out tracking-[0.1em]"
              >
                View All Reviews ({totalReviews})
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Third Image */}
        <div className="w-full md:w-1/2 bg-[#f6f5f0] flex items-center justify-center overflow-hidden group h-[50vh] md:h-auto min-h-[500px]">
          <img alt="Sneaker texture detail full width" onClick={() => setProductLightboxIndex(thirdImageClickIndex)} className="w-full h-full object-scale-down p-8 transform transition-transform duration-1000 ease-in-out group-hover:scale-105 mix-blend-multiply cursor-pointer" src={thirdImageSrc} />
        </div>
      </section>



      {/* All Reviews Modal */}
      {isReviewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsReviewsModalOpen(false)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 shadow-2xl relative rounded-sm" onClick={e => e.stopPropagation()} data-lenis-prevent="true">
            <button 
              onClick={() => setIsReviewsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary p-2 transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="font-headline-display text-2xl text-primary mb-2 text-center">All Customer Reviews</h3>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex text-yellow-500 text-lg">★★★★★</div>
              <span className="font-body-md text-on-surface-variant">{totalReviews} Reviews</span>
            </div>

            {/* Customer Photos Gallery - Hiding mock photos for now since API doesn't support images */}
            
            <div className="flex flex-col gap-8">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-outline-variant/30 pb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{review.userName || 'Anonymous'}</span>
                    <span className="font-body-sm text-on-surface-variant">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex text-yellow-500 text-sm mb-3">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <p className="font-body-md text-on-surface-variant leading-relaxed mb-4">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity" onClick={() => setLightboxIndex(null)}>
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition-colors z-50"
            aria-label="Close lightbox"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button 
            onClick={prevLightboxImage}
            className="absolute left-4 md:left-8 text-white/70 hover:text-white p-2 transition-colors z-50"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-full h-full p-4 md:p-12 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
            <img 
              src={reviewPhotos[lightboxIndex].url} 
              alt={`Review photo ${lightboxIndex + 1}`} 
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-6 left-0 right-0 text-center flex flex-col items-center gap-1">
              <div className="flex text-yellow-500 text-xl tracking-widest drop-shadow-md">
                {'★'.repeat(reviewPhotos[lightboxIndex].rating)}{'☆'.repeat(5 - reviewPhotos[lightboxIndex].rating)}
              </div>
              <div className="text-white/70 font-body-sm">
                {lightboxIndex + 1} / {reviewPhotos.length}
              </div>
            </div>
          </div>

          <button 
            onClick={nextLightboxImage}
            className="absolute right-4 md:right-8 text-white/70 hover:text-white p-2 transition-colors z-50"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}


      {/* Product Image Lightbox Modal */}
      {productLightboxIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity" onClick={() => setProductLightboxIndex(null)}>
          <button 
            onClick={() => setProductLightboxIndex(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition-colors z-50"
            aria-label="Close product lightbox"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button 
            onClick={prevProductImage}
            className="absolute left-4 md:left-8 text-white/70 hover:text-white p-2 transition-colors z-50"
            aria-label="Previous product image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-full h-full p-4 md:p-12 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
            <img 
              src={productPhotos[productLightboxIndex]} 
              alt={`Product photo ${productLightboxIndex + 1}`} 
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-6 left-0 right-0 text-center text-white/70 font-body-sm">
              {productLightboxIndex + 1} / {productPhotos.length}
            </div>
          </div>

          <button 
            onClick={nextProductImage}
            className="absolute right-4 md:right-8 text-white/70 hover:text-white p-2 transition-colors z-50"
            aria-label="Next product image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Write a Review Modal */}
      {isWriteReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsWriteReviewOpen(false)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 shadow-2xl relative rounded-sm" onClick={e => e.stopPropagation()} data-lenis-prevent="true">
            <button 
              onClick={() => setIsWriteReviewOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary p-2 transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="font-headline-display text-2xl text-primary mb-2 text-center">Write a Review</h3>
            <p className="text-xs text-on-surface-variant text-center mb-6">Share your thoughts and media with other customers</p>

            <form onSubmit={handleReviewSubmit} className="space-y-6">
              
              {/* Star Rating Section */}
              <div className="space-y-2 flex flex-col items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary tracking-widest uppercase">
                  Rating *
                </label>
                <div className="flex gap-2.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl transition-all duration-150 transform hover:scale-110 ${
                        reviewRating >= star ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 1: Photos */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary tracking-widest uppercase">
                  Add Photos (Optional)
                </label>
                <div className="border border-dashed border-outline-variant rounded-sm p-6 text-center hover:bg-warm-sand/30 transition-colors cursor-pointer relative"
                  onClick={() => document.getElementById('review-photo-input')?.click()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-on-surface-variant/60 mx-auto mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <span className="text-sm font-medium text-primary">Browse images</span>
                  <p className="text-xs text-on-surface-variant/70 mt-1">PNG, JPG, WEBP formats supported</p>
                  <input
                    id="review-photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => handleReviewPhotoAdd(e.target.files)}
                  />
                </div>

                {reviewImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {reviewImages.map((img, idx) => (
                      <div key={img.preview} className="relative group aspect-square rounded-sm overflow-hidden border border-outline-variant">
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleReviewPhotoRemove(idx)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Description */}
              <div className="space-y-2">
                <label htmlFor="review-desc" className="block text-xs font-semibold uppercase tracking-wider text-primary tracking-widest uppercase">
                  Description *
                </label>
                <textarea
                  id="review-desc"
                  required
                  rows={5}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Tell us what you like or dislike about this product. Your feedback helps others make better choices!"
                  className="w-full border border-outline-variant px-4 py-3 text-sm focus:outline-none focus:border-primary bg-transparent text-primary rounded-sm resize-none"
                />
              </div>

              {/* Submit / Cancel Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteReviewOpen(false)}
                  className="px-6 py-2.5 text-xs uppercase font-semibold text-on-surface-variant border border-outline-variant hover:bg-warm-sand transition-colors rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-8 py-2.5 text-xs uppercase font-semibold bg-primary hover:bg-primary/95 text-white disabled:opacity-50 transition-colors rounded-sm"
                >
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
