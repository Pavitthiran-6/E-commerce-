import React from 'react';
import PolicyLayout from '../../components/PolicyLayout';

export default function ShippingPolicy() {
  const sections = [
    { id: "processing", title: "1. Order Processing Time" },
    { id: "charges", title: "2. Shipping Charges" },
    { id: "timelines", title: "3. Estimated Delivery Timelines" },
    { id: "partners", title: "4. Shipping Partners" },
    { id: "tracking", title: "5. Order Tracking" },
    { id: "undeliverable", title: "6. Undeliverable Packages" },
    { id: "damaged", title: "7. Damaged in Transit" },
    { id: "international", title: "8. International Shipping" }
  ];

  return (
    <PolicyLayout 
      title="Shipping Policy" 
      lastUpdated="24 May 2026"
      sections={sections}
    >
      <h2 id="processing" className="scroll-mt-32">1. Order Processing Time</h2>
      <p>
        All orders are processed within 24 hours on business days (Monday–Saturday). Orders placed on Sunday or public holidays are processed the next business day. You will receive an email and SMS confirmation once your order is shipped.
      </p>

      <h2 id="charges" className="scroll-mt-32">2. Shipping Charges</h2>
      <div className="overflow-x-auto my-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-charcoal-stone text-white">
              <th className="p-4 border border-charcoal-stone font-serif">Order Value</th>
              <th className="p-4 border border-charcoal-stone font-serif">Shipping Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="p-4 border border-gray-200">Above ₹999</td>
              <td className="p-4 border border-gray-200 font-bold text-green-600">FREE</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-4 border border-gray-200">Below ₹999</td>
              <td className="p-4 border border-gray-200">₹79 flat fee</td>
            </tr>
            <tr className="bg-white">
              <td className="p-4 border border-gray-200">COD Orders</td>
              <td className="p-4 border border-gray-200">₹49 extra COD fee</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="timelines" className="scroll-mt-32">3. Estimated Delivery Timelines</h2>
      <div className="overflow-x-auto my-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-charcoal-stone text-white">
              <th className="p-4 border border-charcoal-stone font-serif w-2/3">Location</th>
              <th className="p-4 border border-charcoal-stone font-serif w-1/3">Estimated Time</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="p-4 border border-gray-200">Metro Cities (Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata)</td>
              <td className="p-4 border border-gray-200">2–3 Business Days</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-4 border border-gray-200">Tier 2 Cities (Pune, Jaipur, Ahmedabad, Surat, Lucknow, etc.)</td>
              <td className="p-4 border border-gray-200">3–5 Business Days</td>
            </tr>
            <tr className="bg-white">
              <td className="p-4 border border-gray-200">Tier 3 Cities & Towns</td>
              <td className="p-4 border border-gray-200">4–6 Business Days</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-4 border border-gray-200">Remote Areas & North-East India</td>
              <td className="p-4 border border-gray-200">5–7 Business Days</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-500 italic mt-2">
        Note: These are estimates. Actual delivery may vary during peak seasons, festivals, or due to natural events.
      </p>

      <h2 id="partners" className="scroll-mt-32">4. Shipping Partners</h2>
      <p>
        We ship through trusted courier partners including Delhivery, Bluedart, Ekart, and DTDC based on your pin code and availability.
      </p>

      <h2 id="tracking" className="scroll-mt-32">5. Order Tracking</h2>
      <p>
        Once shipped, you will receive a tracking number via SMS and email. You can also track your order at any time from My Profile → My Orders → Track Order.
      </p>

      <h2 id="undeliverable" className="scroll-mt-32">6. Undeliverable Packages</h2>
      <p>
        If a package is returned to us due to incorrect address, failed delivery attempts, or refusal to accept — we will contact you within 48 hours to reship. Reshipping charges may apply.
      </p>

      <h2 id="damaged" className="scroll-mt-32">7. Damaged in Transit</h2>
      <p>
        If your product arrives damaged due to shipping, please contact us within 48 hours at <a href="mailto:support@belledonne.in">support@belledonne.in</a> with a photo. We will replace it or issue a full refund.
      </p>

      <h2 id="international" className="scroll-mt-32">8. Currently, We Ship Only Within India</h2>
      <p>
        International shipping is not available at this time. Stay tuned for updates!
      </p>
    </PolicyLayout>
  );
}
