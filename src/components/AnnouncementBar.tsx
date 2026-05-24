import React, { useState, useEffect } from 'react';

const messages = [
  "🚚 Free Shipping on orders above ₹999 across India!",
  "🎉 Use code WELCOME10 for 10% off your first order!",
  "↩️ Easy 7-Day Returns & Exchanges — No Questions Asked!",
  "💰 Cash on Delivery available on all orders!"
];

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-charcoal-stone text-white text-xs py-2 overflow-hidden relative h-8 flex items-center justify-center">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`absolute w-full text-center transition-all duration-500 ease-in-out transform ${
            index === currentIndex
              ? 'opacity-100 translate-y-0'
              : index < currentIndex || (currentIndex === 0 && index === messages.length - 1)
              ? 'opacity-0 -translate-y-full'
              : 'opacity-0 translate-y-full'
          }`}
        >
          {message}
        </div>
      ))}
    </div>
  );
}
