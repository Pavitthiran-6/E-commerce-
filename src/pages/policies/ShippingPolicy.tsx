import React, { useEffect } from 'react';
import { Truck, Clock, MapPin, PackageX, AlertTriangle, Globe } from 'lucide-react';

export default function ShippingPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <div className="relative bg-[#0f172a] text-white py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-blue-900 to-[#0f172a]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Truck className="w-16 h-16 mx-auto mb-8 text-blue-400" strokeWidth={1} />
          <h1 className="font-serif text-5xl md:text-7xl mb-6">Shipping Policy</h1>
          <p className="text-xl text-blue-100/80 font-light max-w-2xl mx-auto">
            Fast, reliable, and transparent delivery across India. Know exactly when your package will arrive.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20 -mt-10 relative z-20">
        
        {/* Processing Time Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center gap-8 border border-gray-100">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
            <Clock className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-serif text-charcoal-stone mb-3">1. Order Processing Time</h2>
            <p className="text-gray-600 leading-relaxed">
              All orders are processed within <strong className="text-charcoal-stone">24 hours</strong> on business days (Monday–Saturday). Orders placed on Sunday or public holidays are processed the next business day. You will receive an email and SMS confirmation once your order is shipped.
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-serif text-center text-charcoal-stone mb-10">2. Shipping Charges</h2>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="bg-white rounded-2xl p-8 border-t-4 border-green-500 shadow-sm hover:shadow-md transition-shadow text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Orders Above ₹999</p>
            <p className="text-4xl font-black text-green-500 mb-4">FREE</p>
            <p className="text-sm text-gray-500">Standard Delivery included at no extra cost.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border-t-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Orders Below ₹999</p>
            <p className="text-4xl font-black text-charcoal-stone mb-4">₹79</p>
            <p className="text-sm text-gray-500">Flat shipping fee applied at checkout.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border-t-4 border-orange-400 shadow-sm hover:shadow-md transition-shadow text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">COD Orders</p>
            <p className="text-4xl font-black text-charcoal-stone mb-4">+ ₹49</p>
            <p className="text-sm text-gray-500">Additional Cash on Delivery convenience fee.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <MapPin className="text-blue-600 w-8 h-8" />
          <h2 className="text-3xl font-serif text-charcoal-stone">3. Estimated Delivery Timelines</h2>
        </div>

        {/* Timeline List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="divide-y divide-gray-100">
            {[
              { loc: 'Metro Cities', desc: 'Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata', time: '2–3 Business Days' },
              { loc: 'Tier 2 Cities', desc: 'Pune, Jaipur, Ahmedabad, Surat, Lucknow, etc.', time: '3–5 Business Days' },
              { loc: 'Tier 3 Cities & Towns', desc: 'Other urban and semi-urban areas', time: '4–6 Business Days' },
              { loc: 'Remote Areas', desc: 'North-East India, J&K, and difficult terrain', time: '5–7 Business Days' },
            ].map((item, i) => (
              <div key={i} className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-bold text-lg text-charcoal-stone">{item.loc}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap">
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-500 italic mb-20 text-center">
          Note: These are estimates. Actual delivery may vary during peak seasons, festivals, or due to natural events.
        </p>

        {/* Grid of smaller policies */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100">
            <Truck className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="font-serif text-xl mb-2 text-charcoal-stone">4. Shipping Partners & Tracking</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              We ship through trusted courier partners including Delhivery, Bluedart, Ekart, and DTDC.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Once shipped, you will receive a tracking number via SMS and email. You can also track your order at any time from <strong className="text-charcoal-stone">My Profile → My Orders → Track Order</strong>.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100">
            <PackageX className="w-8 h-8 text-orange-500 mb-4" />
            <h3 className="font-serif text-xl mb-2 text-charcoal-stone">5. Undeliverable Packages</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              If a package is returned to us due to incorrect address, failed delivery attempts, or refusal to accept, we will contact you within 48 hours to reship. Reshipping charges may apply.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100">
            <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
            <h3 className="font-serif text-xl mb-2 text-charcoal-stone">6. Damaged in Transit</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              If your product arrives damaged due to shipping, please contact us within 48 hours at <a href="mailto:support@belledonne.in" className="text-blue-600 hover:underline">support@belledonne.in</a> with a photo. We will replace it or issue a full refund immediately.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100">
            <Globe className="w-8 h-8 text-gray-400 mb-4" />
            <h3 className="font-serif text-xl mb-2 text-charcoal-stone">7. International Shipping</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Currently, we ship only within India. International shipping is not available at this time, but we are working on it. Stay tuned for updates!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
