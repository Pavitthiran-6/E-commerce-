import React, { useState } from 'react';
import PolicyLayout from '../../components/PolicyLayout';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqCategories = [
  {
    id: "orders-tracking",
    title: "Orders & Tracking",
    faqs: [
      {
        q: "How do I place an order?",
        a: "Browse products, select your size and color, click 'Add to Cart', then go to Cart and click 'Proceed to Checkout'. Follow the 3 steps: Address → Payment → Confirmation."
      },
      {
        q: "How do I track my order?",
        a: "After shipment, you will receive an SMS and email with tracking details. You can also track via My Profile → My Orders → Track Order."
      },
      {
        q: "Can I change or cancel my order?",
        a: "Orders can be modified or cancelled within 1 hour of placing. After that, the order enters processing. You may return the item after delivery using our 7-day return policy."
      },
      {
        q: "What if I received a wrong or damaged product?",
        a: (
          <>
            Contact us within 48 hours with a photo and your Order ID at <a href="mailto:support@yourstore.in" className="font-bold underline">support@yourstore.in</a>. We will arrange free reverse pickup and replacement or full refund immediately.
          </>
        )
      }
    ]
  },
  {
    id: "payments",
    title: "Payments",
    faqs: [
      {
        q: "What payment methods do you accept?",
        a: "We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, all major Wallets, and Cash on Delivery (COD)."
      },
      {
        q: "Is it safe to pay on your website?",
        a: "Yes. Our website uses SSL encryption (HTTPS) and all payments are processed through RBI-compliant payment gateways. We never store your card details."
      },
      {
        q: "How do I get a refund?",
        a: "Refunds for online payments are processed within 5-7 business days to the original source. COD refunds are issued as store credit instantly or to bank account within 7-10 business days."
      }
    ]
  },
  {
    id: "shipping-delivery",
    title: "Shipping & Delivery",
    faqs: [
      {
        q: "Do you offer free shipping?",
        a: "Yes! We offer free standard shipping on all orders above ₹999 across India. Orders below ₹999 have a flat shipping fee of ₹79."
      },
      {
        q: "How long does delivery take?",
        a: "Metro cities: 2-3 days. Tier 2 cities: 3-5 days. Remote areas: 5-7 business days."
      },
      {
        q: "Do you ship outside India?",
        a: "Currently we only ship within India. International shipping is coming soon!"
      }
    ]
  },
  {
    id: "returns-refunds",
    title: "Returns & Refunds",
    faqs: [
      {
        q: "What is your return policy?",
        a: "We offer 7-day hassle-free returns from delivery date. Items must be unused, unwashed, with original tags and packaging."
      },
      {
        q: "How do I start a return?",
        a: "Go to My Profile → My Orders → Select Order → Click 'Return Item'. Fill in the reason and submit. We will arrange free reverse pickup within 2 business days."
      }
    ]
  },
  {
    id: "account-profile",
    title: "Account & Profile",
    faqs: [
      {
        q: "How do I create an account?",
        a: "Click 'Log In' in the navbar → Click 'Create Account' → Enter your name, email, and password → Verify your email → Done!"
      },
      {
        q: "I forgot my password. What do I do?",
        a: "Click 'Log In' → Click 'Forgot Password?' → Enter your registered email → You will receive a password reset link within 5 minutes."
      }
    ]
  }
];

export default function FAQ() {
  const sections = faqCategories.map(cat => ({ id: cat.id, title: cat.title }));
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  return (
    <PolicyLayout 
      title="Frequently Asked Questions" 
      lastUpdated="24 May 2026"
      sections={sections}
    >
      <div className="space-y-16">
        {faqCategories.map((category) => (
          <div key={category.id} id={category.id} className="scroll-mt-32">
            <h2 className="text-2xl md:text-3xl font-serif text-charcoal-stone mb-8">{category.title}</h2>
            <div className="space-y-4">
              {category.faqs.map((faq, i) => {
                const uniqueId = `${category.id}-q${i}`;
                const isActive = activeFaq === uniqueId;

                return (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    <button
                      onClick={() => setActiveFaq(isActive ? null : uniqueId)}
                      className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                    >
                      <span className="font-bold text-charcoal-stone pr-8">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isActive ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isActive ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-16 p-8 bg-gray-100 rounded-2xl text-center">
        <h3 className="font-serif text-2xl text-charcoal-stone mb-2">Still have questions?</h3>
        <p className="text-gray-600 mb-6">Our support team is here to help you.</p>
        <Link to="/contact" className="inline-block bg-charcoal-stone text-white font-bold uppercase tracking-widest text-xs px-8 py-4 rounded hover:bg-black transition-colors">
          Contact Us
        </Link>
      </div>
    </PolicyLayout>
  );
}
