import React from 'react';
import PolicyLayout from '../../components/PolicyLayout';

export default function ReturnRefundPolicy() {
  const sections = [
    { id: "overview", title: "1. Overview" },
    { id: "eligibility", title: "2. Eligibility for Returns" },
    { id: "non-returnable", title: "3. Non-Returnable Items" },
    { id: "how-to-initiate", title: "4. How to Initiate a Return" },
    { id: "pickup-process", title: "5. Return Pickup Process" },
    { id: "refund-methods", title: "6. Refund Methods & Timelines" },
    { id: "exchange-policy", title: "7. Exchange Policy" },
    { id: "damaged-wrong", title: "8. Damaged or Wrong Product" },
    { id: "cod-refunds", title: "9. COD Order Refunds" },
    { id: "contact-us", title: "10. Contact Us" }
  ];

  return (
    <PolicyLayout 
      title="Return & Refund Policy" 
      lastUpdated="24 May 2026"
      sections={sections}
    >
      <p className="text-xl text-gray-500 mb-12 italic">
        We want you to love every purchase. If something is not right, we will make it right.
      </p>

      <h2 id="overview" className="scroll-mt-32">1. Overview</h2>
      <p>
        At BELLEDONNE Paris, your satisfaction is our top priority. If you are not completely happy with your purchase, you may return it within 7 days of delivery under the conditions outlined below. We offer free reverse pickup for all eligible returns across India.
      </p>

      <h2 id="eligibility" className="scroll-mt-32">2. Eligibility for Returns</h2>
      <p>To be eligible for a return, your item must meet all of the following conditions:</p>
      <ul>
        <li>Return request raised within 7 days of the delivery date.</li>
        <li>Item must be unused, unworn, and unwashed.</li>
        <li>All original tags must be intact and attached.</li>
        <li>Item must be returned in its original packaging (box, dust bag, tissue paper, etc.).</li>
        <li>A valid Order ID must be provided.</li>
      </ul>
      <p>Items that do not meet these conditions will not be accepted and will be sent back to you.</p>

      <h2 id="non-returnable" className="scroll-mt-32">3. Non-Returnable Items</h2>
      <p>The following items cannot be returned under any circumstances:</p>
      <ul>
        <li>🩲 Innerwear, lingerie, and swimwear (for hygiene reasons).</li>
        <li>🧴 Personal care and grooming products once opened.</li>
        <li>🎁 Items marked as 'Final Sale' or 'Non-Returnable' on the product page.</li>
        <li>🛠️ Products that have been used, washed, altered, or damaged by the customer.</li>
        <li>📦 Items returned without original packaging or missing tags.</li>
        <li>⏰ Items for which the return request was raised after 7 days of delivery.</li>
      </ul>

      <h2 id="how-to-initiate" className="scroll-mt-32">4. How to Initiate a Return</h2>
      <p>Follow these simple steps to start your return:</p>
      <ul>
        <li><strong>Step 1:</strong> Log in to your account and go to My Profile → My Orders.</li>
        <li><strong>Step 2:</strong> Find the order you want to return and click 'Return Item'.</li>
        <li><strong>Step 3:</strong> Select the item(s) you want to return and choose a reason:
          <ul>
            <li>Wrong size / Does not fit</li>
            <li>Wrong item received</li>
            <li>Product damaged or defective</li>
            <li>Not as described</li>
            <li>Changed my mind</li>
            <li>Other</li>
          </ul>
        </li>
        <li><strong>Step 4:</strong> Choose your preferred refund method (original source or store credit).</li>
        <li><strong>Step 5:</strong> Submit the request. You will receive a confirmation email within 2 hours.</li>
      </ul>

      <h2 id="pickup-process" className="scroll-mt-32">5. Return Pickup Process</h2>
      <ul>
        <li>Once your return request is approved, we will arrange a free reverse pickup within 2 business days.</li>
        <li>Our delivery partner will come to your delivery address to collect the item.</li>
        <li>Please keep the item packed and ready at the time of pickup.</li>
        <li>You will receive an SMS notification with the pickup date and time window.</li>
        <li>If the first pickup attempt fails, we will retry once more. After 2 failed attempts, the return request may be cancelled.</li>
        <li>After pickup, quality inspection is completed within 2 business days.</li>
      </ul>

      <h2 id="refund-methods" className="scroll-mt-32">6. Refund Methods & Timelines</h2>
      <p>Once your returned item passes our quality inspection, your refund will be initiated. Here are the timelines:</p>
      <div className="overflow-x-auto my-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-4 font-bold text-sm text-charcoal-stone">Payment Method Used</th>
              <th className="p-4 font-bold text-sm text-charcoal-stone">Refund Destination</th>
              <th className="p-4 font-bold text-sm text-charcoal-stone">Timeline</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-4 text-sm text-gray-600">UPI (GPay, PhonePe, Paytm)</td>
              <td className="p-4 text-sm text-gray-600">Original UPI account</td>
              <td className="p-4 text-sm text-gray-600">3–5 Business Days</td>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50 hover:bg-gray-100">
              <td className="p-4 text-sm text-gray-600">Credit / Debit Card</td>
              <td className="p-4 text-sm text-gray-600">Original card</td>
              <td className="p-4 text-sm text-gray-600">5–7 Business Days</td>
            </tr>
            <tr className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-4 text-sm text-gray-600">Net Banking</td>
              <td className="p-4 text-sm text-gray-600">Original bank account</td>
              <td className="p-4 text-sm text-gray-600">5–7 Business Days</td>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50 hover:bg-gray-100">
              <td className="p-4 text-sm text-gray-600">Wallet (Paytm, Amazon Pay)</td>
              <td className="p-4 text-sm text-gray-600">Original wallet</td>
              <td className="p-4 text-sm text-gray-600">2–3 Business Days</td>
            </tr>
            <tr className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-4 text-sm text-gray-600">Store Credit (any method)</td>
              <td className="p-4 text-sm text-gray-600">BELLEDONNE Wallet</td>
              <td className="p-4 text-sm text-gray-600 font-bold text-green-600">Instant</td>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50 hover:bg-gray-100">
              <td className="p-4 text-sm text-gray-600">Cash on Delivery (COD)</td>
              <td className="p-4 text-sm text-gray-600">Bank account (NEFT)</td>
              <td className="p-4 text-sm text-gray-600">7–10 Business Days</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>You will receive an email confirmation when your refund is initiated.</p>
      <p>If you do not receive the refund within the above timelines, please contact your bank before reaching out to us — bank processing times may vary.</p>

      <h2 id="exchange-policy" className="scroll-mt-32">7. Exchange Policy</h2>
      <ul>
        <li>We currently offer size and color exchanges for eligible items.</li>
        <li>Exchange requests must be raised within 7 days of delivery.</li>
        <li>To request an exchange, go to My Profile → My Orders → Exchange Item.</li>
        <li>The replacement item will be shipped once we receive and inspect the returned item.</li>
        <li>Exchanges are subject to stock availability. If the requested size or color is unavailable, a full refund will be issued instead.</li>
        <li>Only one exchange per order item is allowed.</li>
      </ul>

      <h2 id="damaged-wrong" className="scroll-mt-32">8. Damaged or Wrong Product Received</h2>
      <p>We are extremely sorry if this happened! Here is what to do:</p>
      <ul>
        <li>Contact us within 48 hours of delivery at <a href="mailto:support@belledonne.in">support@belledonne.in</a> or call +91 98765 43210.</li>
        <li>Provide your Order ID and clear photos/video of the damaged or wrong item.</li>
        <li>We will verify and arrange an immediate free reverse pickup.</li>
        <li>You will receive a replacement or a full refund — whichever you prefer.</li>
        <li>No return window restrictions apply for damaged or wrong items — we take full responsibility.</li>
      </ul>

      <h2 id="cod-refunds" className="scroll-mt-32">9. COD Order Refunds</h2>
      <p>Since COD orders are paid in cash, refunds work slightly differently:</p>
      <ul>
        <li><strong>Option 1 — Store Credit (Recommended):</strong> Refund is added to your BELLEDONNE Wallet instantly after inspection. Use it on your next purchase.</li>
        <li><strong>Option 2 — Bank Transfer (NEFT):</strong> Submit your bank account details (Account Number + IFSC Code) through the return form. Refund is processed within 7–10 business days.</li>
      </ul>
      <p>We do not refund cash via courier or in person under any circumstances.</p>

      <h2 id="contact-us" className="scroll-mt-32">10. Contact Us</h2>
      <p>If you have any questions about our Return & Refund Policy, our support team is here to help:</p>
      <ul>
        <li>📧 <strong>Email:</strong> <a href="mailto:support@belledonne.in">support@belledonne.in</a> (Reply within 24 hours)</li>
        <li>📞 <strong>Phone:</strong> +91 98765 43210 (Mon–Sat, 9AM–6PM IST)</li>
        <li>💬 <strong>Live Chat:</strong> Available on our website on weekdays</li>
      </ul>
      <p>Or visit our <a href="/contact">Contact Us page</a> to send us a message directly.</p>
    </PolicyLayout>
  );
}
