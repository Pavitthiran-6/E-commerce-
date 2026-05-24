import React, { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageCircle, MapPin, Paperclip, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { LoadingButton } from '../components/LoadingButton';

// Utility for smooth scroll animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

const faqs = [
  {
    question: 'How do I track my order?',
    answer: 'Once your order is shipped, you will receive an SMS and email with your tracking number and courier partner details. You can also track your order anytime by going to My Profile → My Orders → Track Order. Tracking usually gets activated within 24 hours of shipment.'
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a hassle-free 7-day return policy from the date of delivery. Items must be unused, unwashed, and returned in their original packaging with all tags intact. To start a return, go to My Profile → My Orders → Return Item. Once we receive and inspect the item, your refund will be processed within 5-7 business days.'
  },
  {
    question: 'How long does delivery take?',
    answer: (
      <>
        We deliver across India! Here are the estimated delivery timelines:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Metro Cities (Mumbai, Delhi, Bangalore, Chennai): 2-3 business days*</li>
          <li>Tier 2 Cities (Pune, Jaipur, Surat, etc.): 3-5 business days*</li>
          <li>Remote Areas & North-East India: 5-7 business days*</li>
        </ul>
        <p className="mt-2">Orders are processed within 24 hours of placement. You will receive a confirmation SMS once your order is shipped.</p>
      </>
    )
  },
  {
    question: 'Can I change my order after placing it?',
    answer: 'You can modify or cancel your order within 1 hour of placing it. After that, the order enters processing and cannot be changed. To cancel within the window, go to My Profile → My Orders → Cancel Order. If you missed the window, you can return the item after delivery using our 7-day return policy.'
  },
  {
    question: 'Is Cash on Delivery available?',
    answer: 'Yes! We offer Cash on Delivery (COD) across most pin codes in India. A nominal COD handling fee of ₹49 is added at checkout. To check if COD is available at your location, enter your pincode on the product page or at checkout. COD is not available for orders above ₹50,000.'
  },
  {
    question: 'How do I get a refund?',
    answer: (
      <>
        Once your returned item is received and quality-checked by our team, your refund is initiated within 2 business days. Here is where the money goes:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Online Payments (UPI, Card, Net Banking, Wallet): Refund to original payment source in 5-7 business days.*</li>
          <li>Cash on Delivery Orders: Refund as Store Credit (wallet) instantly, or to your bank account within 7-10 business days (you will need to submit your bank details).*</li>
        </ul>
      </>
    )
  },
  {
    question: 'What if I received a wrong or damaged product?',
    answer: (
      <>
        We are extremely sorry if this happened! Please contact us within 48 hours of delivery with:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>A photo of the wrong/damaged item.*</li>
          <li>Your Order ID.*</li>
        </ul>
        <p className="mt-2">You can reach us at <a href="mailto:support@yourstore.in" className="underline font-bold">support@yourstore.in</a> or call +91 98765 43210. We will arrange an immediate free reverse pickup and send you the correct item or issue a full refund — whichever you prefer. No questions asked!</p>
      </>
    )
  }
];

export default function Contact() {
  const anim1 = useScrollAnimation();
  const anim2 = useScrollAnimation();
  const anim3 = useScrollAnimation();
  const anim4 = useScrollAnimation();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    orderId: '',
    message: '',
    file: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // FAQ State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const subjectsList = [
    "Order Issue",
    "Return & Refund Request",
    "Payment Problem",
    "Product Query",
    "Delivery Issue",
    "Feedback & Suggestions",
    "Other"
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Enforce strictly 10 digits for phone
    if (name === 'phone') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numbersOnly }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required.';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid email is required.';
    if (formData.phone && formData.phone.length !== 10) newErrors.phone = 'Phone number must be exactly 10 digits.';
    if (!formData.subject) newErrors.subject = 'Please select a subject.';
    if (!formData.message.trim() || formData.message.length < 20) newErrors.message = 'Message must be at least 20 characters.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 1500);
    }
  };

  return (
    <main className="w-full bg-[#f6f5f0] pt-32 pb-20 font-body-md overflow-hidden">
      
      {/* SECTION 1: Page Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 text-center mb-20 animate-fade-in-up">
        <h1 className="font-headline-display text-5xl md:text-7xl text-charcoal-stone tracking-tighter mb-6 uppercase">
          Get In Touch
        </h1>
        <p className="font-serif text-lg md:text-2xl text-gray-600 max-w-2xl mx-auto italic font-light">
          We are here to help! Reach out to us and we will get back to you within 24 hours.
        </p>
      </section>

      {/* SECTION 2: Quick Contact Info Cards */}
      <section 
        ref={anim1.ref}
        className={`max-w-7xl mx-auto px-6 md:px-12 mb-24 transition-all duration-1000 transform ${anim1.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="mailto:support@yourstore.in" className="group bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-charcoal-stone/5 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-charcoal-stone mb-6 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl text-charcoal-stone mb-2">Email Us</h3>
            <span className="font-bold text-charcoal-stone mb-1">support@yourstore.in</span>
            <span className="text-sm text-gray-500">We reply within 24 hours</span>
          </a>

          <a href="tel:+919876543210" className="group bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-charcoal-stone/5 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-charcoal-stone mb-6 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl text-charcoal-stone mb-2">Call Us</h3>
            <span className="font-bold text-charcoal-stone mb-1">+91 98765 43210</span>
            <span className="text-sm text-gray-500">Mon – Sat, 9AM to 6PM IST</span>
          </a>

          <div className="group bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-charcoal-stone/5 flex flex-col items-center text-center cursor-pointer">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-charcoal-stone mb-6 relative group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <h3 className="font-serif text-xl text-charcoal-stone mb-2">Live Chat</h3>
            <span className="font-bold text-charcoal-stone mb-1">Chat with us</span>
            <span className="text-sm text-gray-500">Available on weekdays 9AM – 6PM</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: Main Layout */}
      <section 
        ref={anim2.ref}
        className={`max-w-7xl mx-auto px-6 md:px-12 mb-32 transition-all duration-1000 transform ${anim2.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* LEFT: Contact Form */}
          <div className="lg:col-span-8 bg-white p-8 md:p-12 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-charcoal-stone/5">
            <h2 className="font-serif text-3xl md:text-4xl text-charcoal-stone mb-8">Send Us a Message</h2>
            
            {isSuccess ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg flex items-start gap-4 animate-fade-in">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-lg mb-1">Thank you!</h4>
                  <p>Your message has been sent. We will get back to you within 24 hours.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-xs font-bold tracking-[0.1em] uppercase text-gray-500">Full Name *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your Full Name"
                      className={`border-b ${errors.name ? 'border-red-500' : 'border-gray-300'} pb-3 bg-transparent focus:outline-none focus:border-charcoal-stone transition-colors placeholder:text-gray-300`} 
                    />
                    {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name}</span>}
                  </div>
                  
                  {/* Email */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-xs font-bold tracking-[0.1em] uppercase text-gray-500">Email Address *</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="yourname@email.com"
                      className={`border-b ${errors.email ? 'border-red-500' : 'border-gray-300'} pb-3 bg-transparent focus:outline-none focus:border-charcoal-stone transition-colors placeholder:text-gray-300`} 
                    />
                    {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className="text-xs font-bold tracking-[0.1em] uppercase text-gray-500">Phone Number</label>
                    <div className="flex relative">
                      <span className="absolute left-0 bottom-3 text-gray-400">+91</span>
                      <input 
                        type="tel" 
                        id="phone" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="XXXXX XXXXX"
                        className={`w-full border-b ${errors.phone ? 'border-red-500' : 'border-gray-300'} pb-3 pl-10 bg-transparent focus:outline-none focus:border-charcoal-stone transition-colors placeholder:text-gray-300`} 
                      />
                    </div>
                    {errors.phone && <span className="text-xs text-red-500 mt-1">{errors.phone}</span>}
                  </div>
                  
                  {/* Subject */}
                  <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
                    <label className="text-xs font-bold tracking-[0.1em] uppercase text-gray-500">Subject *</label>
                    <div 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`border-b ${errors.subject ? 'border-red-500' : 'border-gray-300'} pb-3 bg-transparent cursor-pointer flex justify-between items-center transition-colors group`}
                    >
                      <span className={formData.subject ? 'text-charcoal-stone' : 'text-gray-300'}>
                        {formData.subject || 'Select a topic'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {/* Dropdown Options */}
                    {isDropdownOpen && (
                      <div className="absolute top-[100%] left-0 w-full bg-white border border-gray-100 shadow-[0_10px_40px_rgb(0,0,0,0.08)] rounded-md mt-1 z-50 overflow-hidden animate-fade-in-up origin-top">
                        {subjectsList.map((sub, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, subject: sub }));
                              setErrors(prev => ({ ...prev, subject: '' }));
                              setIsDropdownOpen(false);
                            }}
                            className={`px-5 py-3 cursor-pointer text-sm transition-colors border-b border-gray-50 last:border-b-0 ${formData.subject === sub ? 'bg-charcoal-stone text-white' : 'text-charcoal-stone hover:bg-gray-50'}`}
                          >
                            {sub}
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.subject && <span className="text-xs text-red-500 mt-1">{errors.subject}</span>}
                  </div>
                </div>

                {/* Order ID */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="orderId" className="text-xs font-bold tracking-[0.1em] uppercase text-gray-500">Order ID</label>
                  <input 
                    type="text" 
                    id="orderId" 
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleInputChange}
                    placeholder="e.g. ORD-20240524-001 (if applicable)"
                    className="border-b border-gray-300 pb-3 bg-transparent focus:outline-none focus:border-charcoal-stone transition-colors placeholder:text-gray-300" 
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-xs font-bold tracking-[0.1em] uppercase text-gray-500">Message *</label>
                  <textarea 
                    id="message" 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Describe your issue or question in detail..."
                    className={`border-b ${errors.message ? 'border-red-500' : 'border-gray-300'} pb-3 bg-transparent focus:outline-none focus:border-charcoal-stone transition-colors min-h-[150px] resize-y placeholder:text-gray-300`} 
                  />
                  {errors.message && <span className="text-xs text-red-500 mt-1">{errors.message}</span>}
                </div>

                {/* File Attachment */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="file" className="cursor-pointer inline-flex items-center gap-2 text-sm text-gray-500 hover:text-charcoal-stone transition-colors border border-dashed border-gray-300 p-4 rounded w-fit">
                    <Paperclip className="w-4 h-4" />
                    <span>{formData.file ? formData.file.name : 'Attach a screenshot (optional)'}</span>
                    <input 
                      type="file" 
                      id="file" 
                      accept=".jpg,.jpeg,.png,.pdf" 
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <LoadingButton 
                  type="submit" 
                  loading={isSubmitting}
                  className="w-full bg-charcoal-stone text-white font-bold uppercase tracking-[0.2em] py-5 mt-4 hover:bg-black transition-colors"
                >
                  Send Message
                </LoadingButton>
              </form>
            )}
          </div>

          {/* RIGHT: Additional Info */}
          <div className="lg:col-span-4 flex flex-col gap-12">
            {/* Business Hours */}
            <div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-4 block">Business Hours</span>
              <ul className="space-y-4 text-charcoal-stone">
                <li className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span>Mon – Fri</span>
                  <span className="font-bold flex items-center gap-2">9:00 AM – 6:00 PM IST <CheckCircle2 className="w-4 h-4 text-green-500" /></span>
                </li>
                <li className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span>Saturday</span>
                  <span className="font-bold flex items-center gap-2">10:00 AM – 4:00 PM IST <CheckCircle2 className="w-4 h-4 text-green-500" /></span>
                </li>
                <li className="flex justify-between items-center pb-3 text-gray-400">
                  <span>Sunday</span>
                  <span className="font-bold">Closed ❌</span>
                </li>
              </ul>
            </div>

            {/* Office Address */}
            <div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-4 block">Our Office</span>
              <div className="flex gap-3 text-charcoal-stone items-start">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold">The Premium Store India</p>
                  <p className="text-gray-600 mt-1">123 Horizon Tower, Cyber City<br/>Gurgaon, Haryana – 122002<br/>India</p>
                  <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold border-b border-charcoal-stone mt-4 hover:text-gray-500 hover:border-gray-500 transition-colors">
                    View on Google Maps <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Follow Us */}
            <div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 mb-4 block">Follow Us</span>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-charcoal-stone hover:border-charcoal-stone hover:bg-charcoal-stone hover:text-white transition-all text-xs font-bold tracking-widest">
                  IG
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-charcoal-stone hover:border-charcoal-stone hover:bg-charcoal-stone hover:text-white transition-all text-xs font-bold tracking-widest">
                  FB
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-charcoal-stone hover:border-charcoal-stone hover:bg-charcoal-stone hover:text-white transition-all text-xs font-bold tracking-widest">
                  X
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-charcoal-stone hover:border-charcoal-stone hover:bg-charcoal-stone hover:text-white transition-all text-xs font-bold tracking-widest">
                  YT
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQ Quick Links */}
      <section 
        ref={anim3.ref}
        className={`w-full bg-gray-100 py-24 px-6 mb-24 transition-all duration-1000 transform ${anim3.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-charcoal-stone mb-4">Looking for Quick Answers?</h2>
          <p className="text-gray-600 mb-10">Check our FAQ for instant answers to common questions.</p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {faqs.map((faq, i) => {
              if (!showAllFaqs && i >= 4) return null;
              const isActive = activeFaq === i;
              
              return (
                <button
                  key={i}
                  onClick={() => setActiveFaq(isActive ? null : i)}
                  className={`border px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md ${
                    isActive 
                      ? 'bg-charcoal-stone text-white border-charcoal-stone shadow-md' 
                      : 'bg-white text-charcoal-stone border-gray-200 hover:border-charcoal-stone'
                  }`}
                >
                  {faq.question}
                </button>
              );
            })}
          </div>

          {/* Answer Box Accordion */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeFaq !== null ? 'max-h-[500px] opacity-100 mb-10' : 'max-h-0 opacity-0'}`}>
            {activeFaq !== null && (
              <div className="bg-white text-left p-6 md:p-8 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-l-[6px] border-l-charcoal-stone mx-auto max-w-3xl transform transition-transform animate-fade-in">
                <h4 className="font-bold text-lg text-charcoal-stone mb-3">{faqs[activeFaq].question}</h4>
                <div className="text-gray-600 text-sm md:text-base leading-relaxed">
                  {faqs[activeFaq].answer}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setShowAllFaqs(!showAllFaqs);
              if (showAllFaqs && activeFaq !== null && activeFaq >= 4) {
                setActiveFaq(null);
              }
            }}
            className="inline-flex items-center gap-2 font-bold text-xs tracking-[0.2em] uppercase border-b border-charcoal-stone pb-1 hover:text-gray-500 hover:border-gray-500 transition-all mb-8"
          >
            {showAllFaqs ? 'Show Less ‹' : 'View All FAQs ›'}
          </button>
          
          <div className="pt-8 border-t border-gray-200">
             <Link to="/faq" className="text-gray-500 hover:text-charcoal-stone text-sm transition-colors border-b border-transparent hover:border-charcoal-stone pb-0.5">
               Still need help? View our full FAQ page
             </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5: Google Maps Embed */}
      <section 
        ref={anim4.ref}
        className={`max-w-7xl mx-auto px-6 md:px-12 transition-all duration-1000 transform ${anim4.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="w-full h-[250px] md:h-[350px] rounded-2xl overflow-hidden border border-charcoal-stone/5 shadow-sm bg-gray-200">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d112173.08018783471!2d76.953179!3d28.5272803!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d19d582e38859%3A0x2cf5fe8e5c64b1e!2sGurugram%2C%20Haryana!5e0!3m2!1sen!2sin!4v1716560000000!5m2!1sen!2sin" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Office Location Map"
          ></iframe>
        </div>
      </section>

    </main>
  );
}
