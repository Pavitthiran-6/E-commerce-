import React from 'react';
import PolicyLayout from '../../components/PolicyLayout';

export default function Terms() {
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
    <PolicyLayout 
      title="Terms & Conditions" 
      lastUpdated="24 May 2026"
      sections={sections}
    >
      <h2 id="acceptance" className="scroll-mt-32">1. Acceptance of Terms</h2>
      <p>
        By accessing or using our website, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website.
      </p>

      <h2 id="eligibility" className="scroll-mt-32">2. Eligibility</h2>
      <p>
        You must be at least 18 years old to create an account and make purchases. By using our site, you confirm you meet this requirement.
      </p>

      <h2 id="product-info" className="scroll-mt-32">3. Product Information</h2>
      <p>
        We make every effort to display product colors, sizes, and descriptions accurately. However, actual colors may slightly vary due to screen settings. We reserve the right to limit quantities or discontinue products at any time.
      </p>

      <h2 id="pricing" className="scroll-mt-32">4. Pricing & Payment</h2>
      <p>
        All prices are listed in Indian Rupees (₹) and include GST unless stated otherwise. We reserve the right to change prices at any time. Payment must be completed at time of purchase for prepaid orders.
      </p>

      <h2 id="order-acceptance" className="scroll-mt-32">5. Order Acceptance</h2>
      <p>
        Placing an order does not guarantee acceptance. We reserve the right to cancel orders due to stock unavailability, pricing errors, or suspected fraud. You will be fully refunded if we cancel your order.
      </p>

      <h2 id="intellectual-property" className="scroll-mt-32">6. Intellectual Property</h2>
      <p>
        All content on this website — including logos, images, text, and design — is owned by BELLEDONNE Paris and protected by Indian copyright law. You may not reproduce or use our content without written permission.
      </p>

      <h2 id="user-accounts" className="scroll-mt-32">7. User Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account password. You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use.
      </p>

      <h2 id="prohibited" className="scroll-mt-32">8. Prohibited Activities</h2>
      <p>
        You agree not to: use bots to scrape data, submit false or fraudulent orders, hack or disrupt our website, or resell products purchased from us without permission.
      </p>

      <h2 id="liability" className="scroll-mt-32">9. Limitation of Liability</h2>
      <p>
        BELLEDONNE Paris is not liable for indirect or consequential damages arising from the use of our website or products. Our maximum liability is limited to the amount paid for the specific order.
      </p>

      <h2 id="governing-law" className="scroll-mt-32">10. Governing Law</h2>
      <p>
        These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Gurgaon, Haryana, India.
      </p>

      <h2 id="contact" className="scroll-mt-32">11. Contact</h2>
      <p>
        For terms-related questions: <br/>
        <a href="mailto:legal@belledonne.in">legal@belledonne.in</a>
      </p>
    </PolicyLayout>
  );
}
