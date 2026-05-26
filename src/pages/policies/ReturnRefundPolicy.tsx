import React, { useEffect, useState } from 'react';
import { RefreshCcw, HandHeart, HelpCircle, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';

export default function ReturnRefundPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeTab, setActiveTab] = useState('process');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tabs = [
    { id: 'process', label: 'How to Return' },
    { id: 'eligibility', label: 'Eligibility & Rules' },
    { id: 'refunds', label: 'Refund Timelines' },
    { id: 'cod', label: 'COD Orders' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-charcoal-stone selection:bg-rose-500 selection:text-white">
      {/* Hero Section */}
      <div className="bg-rose-50/50 py-20 px-6 border-b border-rose-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 text-rose-500 rounded-full mb-6">
            <HandHeart className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl mb-4 text-charcoal-stone">Returns made easy.</h1>
          <p className="text-xl text-gray-500 font-light max-w-2xl mx-auto italic">
            "We want you to love every purchase. If something is not right, we will make it right."
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 md:gap-4 justify-center mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-charcoal-stone text-white shadow-lg' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-charcoal-stone hover:text-charcoal-stone'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 min-h-[400px]">
          
          {/* Tab: Process */}
          {activeTab === 'process' && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-serif mb-8 text-center">4 Simple Steps to Return</h2>
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  { title: '1. Initiate', desc: 'Log in to My Profile → My Orders and click "Return Item".' },
                  { title: '2. Pack', desc: 'Keep the item in its original packaging with all tags attached.' },
                  { title: '3. Pickup', desc: 'Our courier partner will pick it up from your address within 2 days.' },
                  { title: '4. Refund', desc: 'Once inspected, we process your refund instantly or within 5 days.' },
                ].map((step, i) => (
                  <div key={i} className="text-center">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold font-serif">
                      {i + 1}
                    </div>
                    <h3 className="font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-16 bg-orange-50 border border-orange-100 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
                <RefreshCcw className="w-12 h-12 text-orange-500 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-1">Want to Exchange Instead?</h3>
                  <p className="text-gray-600 text-sm">
                    We offer size and color exchanges. Just choose "Exchange" instead of "Return" in your order dashboard. The replacement will be shipped once we receive your returned item.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Eligibility */}
          {activeTab === 'eligibility' && (
            <div className="animate-fade-in grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-serif mb-6 flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" /> Returnable Conditions
                </h2>
                <ul className="space-y-4">
                  {[
                    'Request raised within 7 days of delivery.',
                    'Item is unused, unworn, and unwashed.',
                    'All original tags are intact and attached.',
                    'Returned in original packaging (box, dust bag).',
                    'A valid Order ID is provided.'
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-gray-600">
                      <span className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 text-sm">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-serif mb-6 flex items-center gap-2">
                  <XCircle className="text-red-500" /> Non-Returnable Items
                </h2>
                <ul className="space-y-4">
                  {[
                    'Innerwear, lingerie, and swimwear (hygiene).',
                    'Personal care and grooming products once opened.',
                    'Items marked as "Final Sale".',
                    'Products used, washed, or altered by the customer.',
                    'Requests raised after the 7-day window.'
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-gray-600">
                      <span className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 text-sm">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab: Refunds */}
          {activeTab === 'refunds' && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-serif mb-2 text-center">Refund Timelines</h2>
              <p className="text-center text-gray-500 mb-10">Timelines begin after the returned item passes quality inspection at our warehouse.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="pb-4 font-bold text-gray-400 uppercase tracking-widest text-xs">Payment Method</th>
                      <th className="pb-4 font-bold text-gray-400 uppercase tracking-widest text-xs">Destination</th>
                      <th className="pb-4 font-bold text-gray-400 uppercase tracking-widest text-xs text-right">Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { method: 'Store Credit (Recommended)', dest: 'BELLEDONNE Wallet', time: 'Instant', highlight: true },
                      { method: 'UPI (GPay, PhonePe)', dest: 'Original UPI account', time: '3–5 Business Days' },
                      { method: 'Credit / Debit Card', dest: 'Original card', time: '5–7 Business Days' },
                      { method: 'Net Banking', dest: 'Original bank account', time: '5–7 Business Days' },
                      { method: 'Wallet (Paytm, Amazon)', dest: 'Original wallet', time: '2–3 Business Days' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-5 font-medium">{row.method}</td>
                        <td className="py-5 text-gray-500 text-sm">{row.dest}</td>
                        <td className={`py-5 text-right font-bold text-sm ${row.highlight ? 'text-green-500' : 'text-gray-600'}`}>{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: COD */}
          {activeTab === 'cod' && (
            <div className="animate-fade-in max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-serif mb-6">Cash on Delivery Refunds</h2>
              <p className="text-gray-600 mb-10">
                Since COD orders are paid in cash to the delivery executive, we cannot refund cash in person. You have two options for your refund:
              </p>
              
              <div className="grid gap-6 text-left">
                <div className="p-6 border-2 border-green-500 bg-green-50 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 uppercase tracking-widest rounded-bl-lg">Recommended</div>
                  <h3 className="font-bold text-lg text-green-800 mb-2">Option 1: Store Credit</h3>
                  <p className="text-green-700/80 text-sm">
                    The fastest way to get your money. We add the refund amount to your BELLEDONNE Wallet instantly after quality check. You can use it anytime on your next purchase.
                  </p>
                </div>
                
                <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50">
                  <h3 className="font-bold text-lg text-charcoal-stone mb-2">Option 2: Bank Transfer (NEFT)</h3>
                  <p className="text-gray-500 text-sm">
                    You will need to provide your Bank Account Number and IFSC code when raising the return request. The refund will be credited to your account within 7–10 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FAQs */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="font-serif text-2xl text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="text-gray-400" /> Common Questions
          </h3>
          <div className="space-y-4">
            {[
              { q: "What if I received a damaged or wrong product?", a: "We take full responsibility. Contact us within 48 hours with a photo, and we will arrange an immediate free pickup and give you a full refund or replacement. No 7-day rule applies here." },
              { q: "Do I have to pay for return shipping?", a: "No! We offer 100% free reverse pickups across India for all eligible returns." },
              { q: "What if the pickup fails?", a: "We will attempt the pickup twice. If both attempts fail due to unavailability, the return request will be cancelled." }
            ].map((faq, i) => (
               <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
                >
                  <span className="font-bold">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
               </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
