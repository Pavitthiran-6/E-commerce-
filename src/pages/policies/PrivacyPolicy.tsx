import React, { useEffect, useState } from 'react';
import { Shield, Eye, Database, Lock, Cookie, Users, Mail, Bell, Scale } from 'lucide-react';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    const sectionIds = ['introduction', 'collection', 'usage', 'sharing', 'cookies', 'rights', 'security', 'contact'];
    sectionIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);
  
  return (
    <div className="min-h-screen bg-[#fafaf8] selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-gray-200/50 to-transparent blur-3xl -z-10 rounded-full" />
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Last Updated: 24 May 2026</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-charcoal-stone mb-6 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            We believe in complete transparency. Here's a clear, jargon-free explanation of how we handle your data at BELLEDONNE Paris.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sticky Sidebar Nav */}
          <div className="hidden lg:block lg:col-span-3">
            <nav className="sticky top-32 flex flex-col gap-2 border-l-2 border-gray-100 pl-4">
              {[
                { id: 'introduction', label: '1. Introduction' },
                { id: 'collection', label: '2. Data Collection' },
                { id: 'usage', label: '3. Data Usage' },
                { id: 'sharing', label: '4. Data Sharing' },
                { id: 'cookies', label: '5. Cookies Policy' },
                { id: 'rights', label: '6. Your Rights' },
                { id: 'security', label: '7. Data Security' },
                { id: 'contact', label: '8. Contact Us' },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`text-sm py-2 transition-all duration-300 ${
                    activeSection === item.id 
                      ? 'text-primary font-bold translate-x-2' 
                      : 'text-gray-400 hover:text-charcoal-stone hover:translate-x-1'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Cards Content */}
          <div className="lg:col-span-9 flex flex-col gap-8">
            
            <div id="introduction" className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 scroll-mt-32 group">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-charcoal-stone">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-3xl text-charcoal-stone mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                We at BELLEDONNE Paris are committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights as a user. By using our website, you agree to this policy. We prioritize safeguarding your personal information while providing you with an exceptional shopping experience.
              </p>
            </div>

            <div id="collection" className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 scroll-mt-32 group">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-charcoal-stone">
                <Database className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-3xl text-charcoal-stone mb-6">2. Information We Collect</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#fafaf8] p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-charcoal-stone mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> Personal Details</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Name, email address, phone number, and delivery address collected during account creation and checkout.</p>
                </div>
                <div className="bg-[#fafaf8] p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-charcoal-stone mb-2 flex items-center gap-2"><Lock className="w-4 h-4"/> Payment Info</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">We do NOT store card numbers. All payment data is handled by our secure third-party payment gateway.</p>
                </div>
              </div>
            </div>

            <div id="usage" className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 scroll-mt-32 group">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-charcoal-stone">
                <Bell className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-3xl text-charcoal-stone mb-6">3. How We Use Your Data</h2>
              <ul className="space-y-4">
                {[
                  "To process and deliver your orders seamlessly.",
                  "To send order confirmation and shipping updates via SMS and email.",
                  "To improve our website layout and personalize your shopping experience.",
                  "To prevent fraudulent activities and ensure account security.",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <span className="text-gray-600">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div id="sharing" className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 scroll-mt-32 group">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-charcoal-stone">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-3xl text-charcoal-stone mb-4">4. Who We Share Data With</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                We <strong className="text-primary">NEVER</strong> sell your personal data to third parties. We only share necessary information with trusted partners to fulfill our services:
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-xl">🚚</div>
                  <div>
                    <h4 className="font-bold text-charcoal-stone">Delivery Partners</h4>
                    <p className="text-xs text-gray-500">For shipping your orders (e.g., BlueDart, Delhivery).</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-xl">💳</div>
                  <div>
                    <h4 className="font-bold text-charcoal-stone">Payment Gateways</h4>
                    <p className="text-xs text-gray-500">RBI-compliant partners for secure transactions.</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="cookies" className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 scroll-mt-32 group">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-charcoal-stone">
                <Cookie className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-3xl text-charcoal-stone mb-4">5. Cookies Policy</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies to elevate your browsing experience. Essential cookies keep you logged in and maintain your cart. Analytics cookies help us understand how you interact with our site so we can improve it.
              </p>
              <p className="text-sm text-gray-500 italic">
                You can manage your cookie preferences through your browser settings at any time.
              </p>
            </div>

            <div id="rights" className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 scroll-mt-32 group">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-charcoal-stone">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-3xl text-charcoal-stone mb-6">6. Your Rights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Access your personal data', 'Correct inaccurate data', 'Delete your account & data', 'Opt-out of marketing emails'].map((right, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-gray-700">{right}</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="security" className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 scroll-mt-32 group">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 text-charcoal-stone">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-3xl text-charcoal-stone mb-4">7. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                Our entire website is secured via SSL (HTTPS). Your passwords are encrypted using industry-standard hashing algorithms. We routinely review our security infrastructure to ensure your data remains protected against unauthorized access.
              </p>
            </div>

            <div id="contact" className="bg-primary rounded-3xl p-8 md:p-12 shadow-2xl scroll-mt-32 text-white relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 text-white">
                  <Mail className="w-6 h-6" />
                </div>
                <h2 className="font-serif text-3xl mb-4">8. Contact Us</h2>
                <p className="text-white/80 leading-relaxed mb-8 max-w-lg">
                  Have questions about how we handle your data? Our dedicated privacy team is here to help you.
                </p>
                <a href="mailto:privacy@belledonne.in" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors">
                  <Mail className="w-4 h-4" />
                  Email Privacy Team
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
