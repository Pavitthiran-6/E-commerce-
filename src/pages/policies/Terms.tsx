import React, { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';

export default function Terms() {
  const [activeSection, setActiveSection] = useState('acceptance');

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

    const sectionIds = [
      'acceptance', 'eligibility', 'product-info', 'pricing', 
      'order-acceptance', 'intellectual-property', 'user-accounts', 
      'prohibited', 'liability', 'governing-law', 'contact'
    ];
    sectionIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "eligibility", title: "2. Eligibility" },
    { id: "product-info", title: "3. Product Information" },
    { id: "pricing", title: "4. Pricing & Payment" },
    { id: "order-acceptance", title: "5. Order Acceptance" },
    { id: "intellectual-property", title: "6. Intellectual Property" },
    { id: "user-accounts", title: "7. User Accounts" },
    { id: "prohibited", title: "8. Prohibited Activities" },
    { id: "liability", title: "9. Limitation of Liability" },
    { id: "governing-law", title: "10. Governing Law" },
    { id: "contact", title: "11. Contact" }
  ];

  return (
    <div className="min-h-screen bg-white text-charcoal-stone selection:bg-charcoal-stone selection:text-white">
      {/* Hero Header */}
      <div className="w-full bg-charcoal-stone text-white py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Scale className="w-96 h-96 -mt-24 -mr-24" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Legal Documentation</p>
          <h1 className="font-serif text-5xl md:text-7xl mb-6">Terms & Conditions</h1>
          <p className="text-gray-400 max-w-xl text-lg">
            Please read these terms carefully before using our website. By accessing or using our services, you agree to be bound by these terms.
          </p>
          <p className="mt-8 text-xs font-mono text-gray-500">LAST UPDATED: 24 MAY 2026</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Sidebar */}
          <div className="hidden lg:block lg:w-1/4">
            <div className="sticky top-32">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Table of Contents</h3>
              <nav className="flex flex-col gap-1 border-l border-gray-200">
                {sections.map(section => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setActiveSection(section.id)}
                    className={`pl-4 py-2 text-sm transition-all duration-200 border-l-[3px] ${
                      activeSection === section.id 
                        ? 'border-charcoal-stone text-charcoal-stone font-bold' 
                        : 'border-transparent text-gray-500 hover:text-charcoal-stone hover:border-gray-300'
                    }`}
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4 flex flex-col gap-16 prose prose-lg prose-slate max-w-none">
            
            <section id="acceptance" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using our website, you agree to be bound by these Terms and Conditions. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services.
              </p>
            </section>

            <section id="eligibility" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">2. Eligibility</h2>
              <p className="text-gray-700 leading-relaxed">
                You must be at least 18 years old to create an account and make purchases. By using our site, you represent and warrant that you meet this age requirement and have the legal capacity to enter into a binding contract.
              </p>
            </section>

            <section id="product-info" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">3. Product Information</h2>
              <p className="text-gray-700 leading-relaxed">
                We make every effort to display product colors, sizes, and descriptions as accurately as possible. However, actual colors may slightly vary due to your device's screen settings. We reserve the right to limit quantities of any products or services that we offer and to discontinue any product at any time.
              </p>
            </section>

            <section id="pricing" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">4. Pricing & Payment</h2>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 my-6">
                <p className="text-charcoal-stone font-medium m-0">
                  All prices are listed in Indian Rupees (₹) and include applicable GST unless stated otherwise. 
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to change prices for our products at any time without notice. Payment must be completed at the time of purchase for all prepaid orders through our secure payment gateway.
              </p>
            </section>

            <section id="order-acceptance" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">5. Order Acceptance</h2>
              <p className="text-gray-700 leading-relaxed">
                Placing an order does not guarantee acceptance. We reserve the right to refuse or cancel any order for any reason, including but not limited to: stock unavailability, errors in product or pricing information, or problems identified by our fraud avoidance department. If your order is canceled after your credit card has been charged, we will issue a full refund.
              </p>
            </section>

            <section id="intellectual-property" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">6. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All content included on this website, such as text, graphics, logos, images, audio clips, digital downloads, and data compilations, is the property of BELLEDONNE Paris and protected by Indian and international copyright laws. You may not reproduce, duplicate, copy, sell, resell, or exploit any portion of the website without express written permission from us.
              </p>
            </section>

            <section id="user-accounts" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">7. User Accounts</h2>
              <p className="text-gray-700 leading-relaxed">
                If you create an account on our website, you are responsible for maintaining the confidentiality of your account password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section id="prohibited" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">8. Prohibited Activities</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You agree not to engage in any of the following activities:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Using bots, spiders, or other automated means to scrape data from our site.</li>
                <li>Submitting false or fraudulent orders.</li>
                <li>Hacking, interfering with, or disrupting the security or functionality of our website.</li>
                <li>Reselling products purchased from us without explicit written permission.</li>
              </ul>
            </section>

            <section id="liability" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">9. Limitation of Liability</h2>
              <div className="bg-charcoal-stone text-white p-6 rounded-lg my-6">
                <p className="m-0 leading-relaxed font-medium">
                  In no case shall BELLEDONNE Paris, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Our maximum liability, under any circumstances, is strictly limited to the total amount paid by you for the specific order in question.
              </p>
            </section>

            <section id="governing-law" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">10. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms and Conditions and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts located in Gurgaon, Haryana, India.
              </p>
            </section>

            <section id="contact" className="scroll-mt-32">
              <h2 className="text-3xl font-serif mb-6 pb-4 border-b border-gray-200">11. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                Questions about the Terms & Conditions should be sent to us at:
              </p>
              <a href="mailto:legal@belledonne.in" className="inline-block mt-4 px-6 py-3 border-2 border-charcoal-stone text-charcoal-stone font-bold uppercase tracking-widest text-sm hover:bg-charcoal-stone hover:text-white transition-colors">
                legal@belledonne.in
              </a>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
