import React from 'react';
import PolicyLayout from '../../components/PolicyLayout';

export default function PrivacyPolicy() {
  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "information-collected", title: "2. Information We Collect" },
    { id: "how-we-use", title: "3. How We Use Your Information" },
    { id: "data-sharing", title: "4. Who We Share Your Data With" },
    { id: "cookies", title: "5. Cookies Policy" },
    { id: "rights", title: "6. Your Rights" },
    { id: "security", title: "7. Data Security" },
    { id: "changes", title: "8. Changes to This Policy" },
    { id: "contact", title: "9. Contact Us" }
  ];

  return (
    <PolicyLayout 
      title="Privacy Policy" 
      lastUpdated="24 May 2026"
      sections={sections}
    >
      <h2 id="introduction" className="scroll-mt-32">1. Introduction</h2>
      <p>
        We at BELLEDONNE Paris are committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights as a user. By using our website, you agree to this policy.
      </p>

      <h2 id="information-collected" className="scroll-mt-32">2. Information We Collect</h2>
      <ul>
        <li><strong>Personal Information:</strong> Name, email address, phone number, delivery address collected during account creation and checkout.</li>
        <li><strong>Payment Information:</strong> We do NOT store card numbers or UPI IDs. All payment data is handled by our secure third-party payment gateway.</li>
        <li><strong>Usage Data:</strong> Pages visited, products viewed, time spent on site, device type, and IP address (for analytics only).</li>
        <li><strong>Cookies:</strong> We use cookies to remember your cart, login session, and preferences.</li>
      </ul>

      <h2 id="how-we-use" className="scroll-mt-32">3. How We Use Your Information</h2>
      <ul>
        <li>To process and deliver your orders.</li>
        <li>To send order confirmation, shipping updates via SMS and email.</li>
        <li>To improve our website and personalize your experience.</li>
        <li>To send promotional offers and newsletters (only if you opted in — you can unsubscribe anytime).</li>
        <li>To prevent fraud and ensure account security.</li>
      </ul>

      <h2 id="data-sharing" className="scroll-mt-32">4. Who We Share Your Data With</h2>
      <ul>
        <li><strong>Delivery Partners:</strong> We share your name, phone, and address with our logistics partners (e.g., Delhivery, BlueDart) to fulfill delivery.</li>
        <li><strong>Payment Gateways:</strong> Payment data is handled by our RBI-compliant payment partner.</li>
      </ul>
      <p>We NEVER sell your personal data to third parties for marketing.</p>

      <h2 id="cookies" className="scroll-mt-32">5. Cookies Policy</h2>
      <p>
        We use essential cookies (for cart and login), analytics cookies (Google Analytics), and preference cookies. You can disable cookies in your browser settings, but some features may not work correctly.
      </p>

      <h2 id="rights" className="scroll-mt-32">6. Your Rights</h2>
      <ul>
        <li>Right to access your personal data.</li>
        <li>Right to correct inaccurate data.</li>
        <li>Right to delete your account and data.</li>
        <li>Right to opt out of marketing emails.</li>
      </ul>
      <p>
        To exercise these rights, email us at <a href="mailto:privacy@belledonne.in">privacy@belledonne.in</a>.
      </p>

      <h2 id="security" className="scroll-mt-32">7. Data Security</h2>
      <p>
        Our website is SSL-secured (HTTPS). We store passwords in encrypted form. We regularly review our security practices to protect your data.
      </p>

      <h2 id="changes" className="scroll-mt-32">8. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. The latest version will always be available on this page with the updated date shown at the top.
      </p>

      <h2 id="contact" className="scroll-mt-32">9. Contact Us</h2>
      <p>
        For privacy-related questions, contact: <br/>
        <a href="mailto:privacy@belledonne.in">privacy@belledonne.in</a>
      </p>
    </PolicyLayout>
  );
}
