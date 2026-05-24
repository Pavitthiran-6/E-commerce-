import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import type { WishlistItem } from '../context/WishlistContext';
import { Heart } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { LoadingButton } from '../components/LoadingButton';

export default function Product() {
  const { id } = useParams();
  const [selectedSize, setSelectedSize] = useState('8');
  const [selectedColor, setSelectedColor] = useState('Walnut');
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'out_of_stock' | 'limited'>('in_stock');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const handleAddToCart = () => {
    if (stockStatus === 'out_of_stock') {
      showToast('This item is currently out of stock.', 'error');
      return;
    }
    addToCart({
      id: id || 'b0-walnut',
      name: id?.replace('-', ' ') || 'B0 Walnut',
      price: 16500,
      image: productPhotos[0],
      quantity: 1,
      size: selectedSize,
      color: selectedColor
    });
    showToast(`${id?.replace('-', ' ') || 'Product'} added to cart!`, 'success', { label: 'View Cart', href: '/cart' });
  };

  const handleWishlistToggle = () => {
    const productId = id || 'b0-walnut';
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist({
        id: productId,
        name: productId.replace('-', ' '),
        price: 16500,
        image: productPhotos[0]
      });
    }
  };

  // Mock stock status based on size
  useEffect(() => {
    if (selectedSize === '12') {
      setStockStatus('out_of_stock');
    } else if (selectedSize === '11') {
      setStockStatus('limited');
    } else {
      setStockStatus('in_stock');
    }
  }, [selectedSize]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const sizes = ['6', '7', '8', '9', '10', '11', '12'];

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

  const productPhotos = [
    "https://lh3.googleusercontent.com/aida/ADBb0ugdJSLBhMOg17OKe5bEJVJiBOhqWn1_CUUSdpfLgqnS0r5rnqduDT4BHMLRSGcg-0QLdZ9mZ-xJDKkRLPv00aFS4YEjyzC2Y_9u3Ue9CIXPPs3C-VFKzrv-JUWkAZKNpej3W2G-so1vCRj_QuKcV5zNWSiRxnLpG08to022Vug_7Eq_NJ5rTgs__4F2qFl-ucJsozGDdMUZO1jXGXnEZBdn2YKT8sh9JNq-srHVfu-d86eGN6cdSo8XWhZC",
    "https://lh3.googleusercontent.com/aida/ADBb0uj7lpaKtCv6nmi__My16-1qw2GYsH8kGgWFX8sUp721M_3ZV1MXIEiixNADIqC1jf-Rn59cGUE0vfnGsv0eaYIkXaBU2mD4UoqPL47zb5xDriq6Be_KER-k6w9iGYKoi3Gq3mahFAac52krcZcpiFptpAgz1Snfd21Oxzc8EpKqU4C_MQ3CKGYxVvvvMOLqEOUJmYN0MCg1Sj0PVKDgUO-eNTaGY_EHXre61DRpKfSMUG7vbzwE-NdNVtwC",
    ...(id === 'b0-classic' ? ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=2000&auto=format&fit=crop"] : []),
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCB7FrTQPZN7y1jyl2TYYUyxVUNWnJKIb4RBaa22BhfUShaM8hHCbw6KdNF_gn5eFdoas6M1kOz_AMKzZSSWibUf9NHuPD_ZhzdfoHsDoINSMF_7oJwC7hW6X6fRTAvKi5XeHRiOaVk-9WsjyoDAZv4gxfr9Ly7OW-ISIbkHXjZBRhXwORYc_OhcP_cfe-eF81i8NK8Ri-xjKi13fMi2sWFL28l-5LSGLOh-VI3whH1ApbIHo9raaOK6d8HCYLA9BGWRxw561reu3uR"
  ];
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

  return (
    <div className="w-full flex flex-col">
      <main className="w-full flex flex-col md:flex-row min-h-screen">
      {/* Left Column: Product Imagery */}
      <div className="w-full md:w-1/2 flex flex-col gap-4">
        <div className="w-full bg-[#f6f5f0] aspect-[4/5] flex items-center justify-center overflow-hidden">
          <img alt="Belledonne B0 Sneaker" onClick={() => setProductLightboxIndex(0)} className="w-full h-full object-scale-down p-4 transform transition-transform duration-700 ease-in-out hover:scale-105 mix-blend-multiply cursor-pointer" src="https://lh3.googleusercontent.com/aida/ADBb0ugdJSLBhMOg17OKe5bEJVJiBOhqWn1_CUUSdpfLgqnS0r5rnqduDT4BHMLRSGcg-0QLdZ9mZ-xJDKkRLPv00aFS4YEjyzC2Y_9u3Ue9CIXPPs3C-VFKzrv-JUWkAZKNpej3W2G-so1vCRj_QuKcV5zNWSiRxnLpG08to022Vug_7Eq_NJ5rTgs__4F2qFl-ucJsozGDdMUZO1jXGXnEZBdn2YKT8sh9JNq-srHVfu-d86eGN6cdSo8XWhZC" />
        </div>
        <div className="w-full bg-[#f6f5f0] aspect-[4/5] flex items-center justify-center overflow-hidden">
          <img alt="Belledonne B0 Sneaker Detail" onClick={() => setProductLightboxIndex(1)} className="w-full h-full object-scale-down p-4 transform transition-transform duration-700 ease-in-out hover:scale-105 mix-blend-multiply cursor-pointer" src="https://lh3.googleusercontent.com/aida/ADBb0uj7lpaKtCv6nmi__My16-1qw2GYsH8kGgWFX8sUp721M_3ZV1MXIEiixNADIqC1jf-Rn59cGUE0vfnGsv0eaYIkXaBU2mD4UoqPL47zb5xDriq6Be_KER-k6w9iGYKoi3Gq3mahFAac52krcZcpiFptpAgz1Snfd21Oxzc8EpKqU4C_MQ3CKGYxVvvvMOLqEOUJmYN0MCg1Sj0PVKDgUO-eNTaGY_EHXre61DRpKfSMUG7vbzwE-NdNVtwC" />
        </div>
        {id === 'b0-classic' && (
          <div className="w-full bg-[#f6f5f0] aspect-[4/5] flex items-center justify-center overflow-hidden">
            <img alt="Belledonne B0 Classic Angle" onClick={() => setProductLightboxIndex(2)} className="w-full h-full object-scale-down p-4 transform transition-transform duration-700 ease-in-out hover:scale-105 mix-blend-multiply cursor-pointer" src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=2000&auto=format&fit=crop" />
          </div>
        )}
      </div>
      
      {/* Right Column: Product Details (Sticky) */}
      <div className="w-full md:w-1/2 relative bg-white pt-24 pb-12 px-6 md:px-16 lg:px-24">
        <div className="sticky top-24 flex flex-col gap-6">
          {/* Title & Price */}
          <div className="border-b border-outline-variant/30 pb-4">
            <h1 className="font-headline-display text-4xl text-primary mb-1 capitalize">{id?.replace('-', ' ') || 'B0 Walnut'}</h1>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center justify-between">
                <p className="font-body-lg text-body-lg text-on-surface-variant">₹16,500</p>
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
              <p className="text-xs text-on-surface-variant/70">(Incl. of all taxes)</p>
            </div>
          </div>
          
          {/* Narrative */}
          <div className="prose prose-p:font-body-md prose-p:text-on-surface-variant prose-p:leading-relaxed">
            <p className="text-sm">Inspired by the warm tones of natural wood, the {id?.replace('-', ' ') || 'B0 Walnut'} combines premium Italian suede with a classic gum sole. Hand-stitched in Portugal, it features a refined silhouette that bridges the gap between casual comfort and artisanal luxury.</p>
          </div>
          
          {/* Color Selection */}
          <div className="flex flex-col gap-2">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Color: {selectedColor}</span>
            <div className="flex gap-4 mt-2">
              <button onClick={() => setSelectedColor('Walnut')} aria-label="Select Walnut" className={`w-8 h-8 rounded-full border bg-[#6B4E31] focus:outline-none ring-2 ring-offset-2 ring-transparent transition-all ${selectedColor === 'Walnut' ? 'border-primary ring-primary' : 'border-outline-variant hover:border-primary'}`}></button>
              <button onClick={() => setSelectedColor('Black')} aria-label="Select Black" className={`w-8 h-8 rounded-full border bg-[#1A1A1A] focus:outline-none ring-2 ring-offset-2 ring-transparent transition-all ${selectedColor === 'Black' ? 'border-primary ring-primary' : 'border-outline-variant hover:border-primary'}`}></button>
              <button onClick={() => setSelectedColor('White')} aria-label="Select White" className={`w-8 h-8 rounded-full border bg-[#FAFAFA] focus:outline-none ring-2 ring-offset-2 ring-transparent transition-all ${selectedColor === 'White' ? 'border-primary ring-primary' : 'border-outline-variant hover:border-primary'}`}></button>
            </div>
          </div>
          
          {/* Size Selection */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-end">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Size (UK/IND)</span>
              <button onClick={() => setIsSizeGuideOpen(true)} className="font-label-caps text-label-caps text-on-surface-variant underline hover:text-primary transition-colors">Size Guide</button>
            </div>
            <div className="grid grid-cols-7 gap-2 mt-1">
              {sizes.map(size => (
                <button 
                  key={size}
                  onClick={() => size !== '12' && setSelectedSize(size)}
                  disabled={size === '12'}
                  className={`py-2 font-body-md text-sm transition-all duration-300 ${
                    size === '12' 
                      ? 'border border-outline-variant opacity-50 cursor-not-allowed text-primary' 
                      : selectedSize === size 
                        ? 'border border-primary bg-primary text-white' 
                        : 'border border-outline-variant hover:border-primary hover:bg-warm-sand text-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          
          {/* CTA */}
          <div className="mt-2 flex flex-col gap-3">
            <div className="flex gap-3">
              <LoadingButton 
                onClick={handleAddToCart}
                disabled={stockStatus === 'out_of_stock'}
                className={`w-1/2 font-button text-button uppercase py-3 transition-colors duration-400 ease-in-out tracking-[0.1em] ${stockStatus === 'out_of_stock' ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}`}
              >
                {stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
              </LoadingButton>
              <button 
                onClick={handleWishlistToggle}
                className={`w-1/2 flex items-center justify-center gap-2 font-button text-button uppercase py-3 transition-colors duration-400 ease-in-out tracking-[0.1em] border bg-white text-primary border-primary hover:bg-warm-sand`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist(id || 'b0-walnut') ? 'fill-primary' : ''}`} />
                {isInWishlist(id || 'b0-walnut') ? 'Saved' : 'Wishlist'}
              </button>
            </div>
            
            {/* Pincode Checker */}
            <div className="flex flex-col gap-2 mt-4">
              <label htmlFor="pincode" className="font-label-caps text-xs text-primary uppercase tracking-widest">Delivery & COD Options</label>
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
              <div className="flex items-center gap-3">
                <span className="text-xl">🚚</span>
                <span className="text-xs text-on-surface-variant">Free Shipping across India</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🔁</span>
                <span className="text-xs text-on-surface-variant">Easy 7-Day Returns</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">💵</span>
                <span className="text-xs text-on-surface-variant">Cash on Delivery Available</span>
              </div>
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
            <div className="flex items-center gap-3 mb-6">
              <div className="flex text-yellow-500 text-lg">
                ★★★★★
              </div>
              <span className="font-body-md text-on-surface-variant">4.9 / 5 (128 Reviews)</span>
            </div>
            
            {/* Customer Photos Gallery */}
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
            <div className="border-b border-outline-variant/30 pb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Alex M.</span>
                <span className="font-body-sm text-on-surface-variant">Oct 12, 2023</span>
              </div>
              <div className="flex text-yellow-500 text-sm mb-3">★★★★★</div>
              <p className="font-body-md text-on-surface-variant leading-relaxed mb-4">"These are the most comfortable sneakers I've ever owned. The suede quality is exceptional and they look great with both jeans and chinos. Highly recommend."</p>
              <div className="flex gap-3">
                <img src={reviewPhotos[0].url} alt="Customer photo 1" onClick={() => setLightboxIndex(0)} className="w-16 h-16 object-cover border border-outline-variant/30 hover:opacity-80 transition-opacity cursor-pointer rounded-sm" />
                <img src={reviewPhotos[1].url} alt="Customer photo 2" onClick={() => setLightboxIndex(1)} className="w-16 h-16 object-cover border border-outline-variant/30 hover:opacity-80 transition-opacity cursor-pointer rounded-sm" />
              </div>
            </div>
            
            <div className="border-b border-outline-variant/30 pb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Sarah T.</span>
                <span className="font-body-sm text-on-surface-variant">Sep 28, 2023</span>
              </div>
              <div className="flex text-yellow-500 text-sm mb-3">★★★★★</div>
              <p className="font-body-md text-on-surface-variant leading-relaxed">"Beautiful craftsmanship. You can really tell these are handmade. Sizing was perfect following the guide. Will definitely be buying another pair in black."</p>
            </div>
            
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <button className="border border-primary text-primary font-button text-button uppercase py-3 px-8 hover:bg-primary hover:text-white transition-colors duration-400 ease-in-out tracking-[0.1em]">
              Write a Review
            </button>
            {id === 'b0-classic' && (
              <button 
                onClick={() => setIsReviewsModalOpen(true)}
                className="bg-primary text-white font-button text-button uppercase py-3 px-8 hover:bg-primary/90 transition-colors duration-400 ease-in-out tracking-[0.1em]"
              >
                View All Reviews (4)
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Third Image */}
        <div className="w-full md:w-1/2 bg-[#f6f5f0] flex items-center justify-center overflow-hidden group h-[50vh] md:h-auto min-h-[500px]">
          <img alt="Sneaker texture detail full width" onClick={() => setProductLightboxIndex(id === 'b0-classic' ? 3 : 2)} className="w-full h-full object-scale-down p-8 transform transition-transform duration-1000 ease-in-out group-hover:scale-105 mix-blend-multiply cursor-pointer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB7FrTQPZN7y1jyl2TYYUyxVUNWnJKIb4RBaa22BhfUShaM8hHCbw6KdNF_gn5eFdoas6M1kOz_AMKzZSSWibUf9NHuPD_ZhzdfoHsDoINSMF_7oJwC7hW6X6fRTAvKi5XeHRiOaVk-9WsjyoDAZv4gxfr9Ly7OW-ISIbkHXjZBRhXwORYc_OhcP_cfe-eF81i8NK8Ri-xjKi13fMi2sWFL28l-5LSGLOh-VI3whH1ApbIHo9raaOK6d8HCYLA9BGWRxw561reu3uR" />
        </div>
      </section>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSizeGuideOpen(false)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 shadow-2xl relative rounded-sm" onClick={e => e.stopPropagation()} data-lenis-prevent="true">
            <button 
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary p-2 transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="font-headline-display text-2xl text-primary mb-6 text-center">Men's Footwear Size Chart</h3>
            
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-outline-variant/50">
                    <th className="py-3 px-4 font-label-caps text-label-caps text-primary tracking-widest uppercase">India / UK</th>
                    <th className="py-3 px-4 font-label-caps text-label-caps text-primary tracking-widest uppercase">EU Size</th>
                    <th className="py-3 px-4 font-label-caps text-label-caps text-primary tracking-widest uppercase">US (Men)</th>
                    <th className="py-3 px-4 font-label-caps text-label-caps text-primary tracking-widest uppercase text-right">Foot Length (cm)</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-surface-variant">
                  <tr className="border-b border-outline-variant/30 hover:bg-warm-sand/50 transition-colors">
                    <td className="py-3 px-4 font-bold">6</td><td className="py-3 px-4">40</td><td className="py-3 px-4">7</td><td className="py-3 px-4 text-right">24.6</td>
                  </tr>
                  <tr className="border-b border-outline-variant/30 hover:bg-warm-sand/50 transition-colors">
                    <td className="py-3 px-4 font-bold">7</td><td className="py-3 px-4">41</td><td className="py-3 px-4">8</td><td className="py-3 px-4 text-right">25.4</td>
                  </tr>
                  <tr className="border-b border-outline-variant/30 hover:bg-warm-sand/50 transition-colors">
                    <td className="py-3 px-4 font-bold">8</td><td className="py-3 px-4">42</td><td className="py-3 px-4">9</td><td className="py-3 px-4 text-right">26.2</td>
                  </tr>
                  <tr className="border-b border-outline-variant/30 hover:bg-warm-sand/50 transition-colors">
                    <td className="py-3 px-4 font-bold">9</td><td className="py-3 px-4">43</td><td className="py-3 px-4">10</td><td className="py-3 px-4 text-right">27.1</td>
                  </tr>
                  <tr className="border-b border-outline-variant/30 hover:bg-warm-sand/50 transition-colors">
                    <td className="py-3 px-4 font-bold">10</td><td className="py-3 px-4">44</td><td className="py-3 px-4">11</td><td className="py-3 px-4 text-right">27.9</td>
                  </tr>
                  <tr className="border-b border-outline-variant/30 hover:bg-warm-sand/50 transition-colors">
                    <td className="py-3 px-4 font-bold">11</td><td className="py-3 px-4">45</td><td className="py-3 px-4">12</td><td className="py-3 px-4 text-right">28.8</td>
                  </tr>
                  <tr className="border-b border-outline-variant/30 hover:bg-warm-sand/50 transition-colors">
                    <td className="py-3 px-4 font-bold">12</td><td className="py-3 px-4">46</td><td className="py-3 px-4">13</td><td className="py-3 px-4 text-right">29.6</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#fafafa] p-6 border border-outline-variant/30">
              <h4 className="font-label-caps text-label-caps text-primary tracking-widest uppercase mb-4">How to measure your foot:</h4>
              <ol className="list-decimal pl-5 space-y-2 font-body-md text-on-surface-variant text-sm mb-4">
                <li>Place a piece of paper on the floor against a wall.</li>
                <li>Stand on the paper with your heel firmly against the wall.</li>
                <li>Mark the longest part of your foot (usually the big toe) on the paper.</li>
                <li>Measure the distance from the edge of the paper to the mark in centimeters.</li>
              </ol>
              <p className="font-body-md text-primary text-sm italic border-l-2 border-primary pl-3 py-1">
                If you are between sizes, we recommend sizing up for a more comfortable fit.
              </p>
            </div>
          </div>
        </div>
      )}

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
              <span className="font-body-md text-on-surface-variant">4.9 / 5 (128 Reviews)</span>
            </div>

            {/* Customer Photos Gallery */}
            <div className="flex flex-col gap-3 mb-8">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest text-xs text-center">Customer Photos</span>
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
            
            <div className="flex flex-col gap-8">
              <div className="border-b border-outline-variant/30 pb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Alex M.</span>
                  <span className="font-body-sm text-on-surface-variant">Oct 12, 2023</span>
                </div>
                <div className="flex text-yellow-500 text-sm mb-3">★★★★★</div>
                <p className="font-body-md text-on-surface-variant leading-relaxed mb-4">"These are the most comfortable sneakers I've ever owned. The suede quality is exceptional and they look great with both jeans and chinos. Highly recommend."</p>
                <div className="flex gap-3">
                  <img src={reviewPhotos[0].url} alt="Customer photo 1" onClick={() => setLightboxIndex(0)} className="w-16 h-16 object-cover border border-outline-variant/30 hover:opacity-80 transition-opacity cursor-pointer rounded-sm" />
                  <img src={reviewPhotos[1].url} alt="Customer photo 2" onClick={() => setLightboxIndex(1)} className="w-16 h-16 object-cover border border-outline-variant/30 hover:opacity-80 transition-opacity cursor-pointer rounded-sm" />
                </div>
              </div>
              
              <div className="border-b border-outline-variant/30 pb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Sarah T.</span>
                  <span className="font-body-sm text-on-surface-variant">Sep 28, 2023</span>
                </div>
                <div className="flex text-yellow-500 text-sm mb-3">★★★★★</div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">"Beautiful craftsmanship. You can really tell these are handmade. Sizing was perfect following the guide. Will definitely be buying another pair in black."</p>
              </div>

              <div className="border-b border-outline-variant/30 pb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Rohan K.</span>
                  <span className="font-body-sm text-on-surface-variant">Aug 15, 2023</span>
                </div>
                <div className="flex text-yellow-500 text-sm mb-3">★★★★★</div>
                <p className="font-body-md text-on-surface-variant leading-relaxed mb-4">"The classic design goes with absolutely everything. I've worn them to the office and on weekends. Truly a versatile piece!"</p>
                <div className="flex gap-3">
                  <img src={reviewPhotos[2].url} alt="Customer photo 3" onClick={() => setLightboxIndex(2)} className="w-16 h-16 object-cover border border-outline-variant/30 hover:opacity-80 transition-opacity cursor-pointer rounded-sm" />
                </div>
              </div>
              
              <div className="pb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Amit S.</span>
                  <span className="font-body-sm text-on-surface-variant">Jul 04, 2023</span>
                </div>
                <div className="flex text-yellow-500 text-sm mb-3">★★★★☆</div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">"Great shoes and premium feel. Delivery was quick and the packaging was excellent. Taking one star off because they took a couple of days to break in."</p>
              </div>
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
    </div>
  );
}
