import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white pt-20 pb-6 border-t border-charcoal-stone/20">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-6">
            <Link to="/" className="flex flex-col text-white hover:text-gray-300 transition-colors w-fit">
              <span className="text-[20px] font-bold tracking-[0.25em] leading-none">
                BELLEDONNE
              </span>
              <span className="text-[10px] tracking-widest mt-1 font-light ml-1">Paris</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-[280px]">
              Premium everyday essentials crafted for the modern individual. Designed in Paris, made for India.
            </p>
            <div className="flex gap-4 mt-2">
              <a href="#" className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-white hover:bg-white hover:text-black transition-all text-xs font-bold tracking-widest">
                IG
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-white hover:bg-white hover:text-black transition-all text-xs font-bold tracking-widest">
                FB
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-white hover:bg-white hover:text-black transition-all text-xs font-bold tracking-widest">
                X
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-white hover:bg-white hover:text-black transition-all text-xs font-bold tracking-widest">
                YT
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className="flex flex-col gap-5">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2">Shop</h4>
            <Link to="/collection?category=men" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">Men</Link>
            <Link to="/collection?category=women" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">Women</Link>
            <Link to="/collection?category=tech-kitchen" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">Tech & Kitchen</Link>
            <Link to="/collection?sort=newest" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">New Arrivals</Link>
            <Link to="/sale" className="text-red-500 hover:text-red-400 hover:translate-x-1 transition-all text-sm font-bold w-fit">Sale</Link>
          </div>

          {/* Column 3: Help & Policies */}
          <div className="flex flex-col gap-5">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2">Help & Policies</h4>
            <Link to="/policies/faq" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">FAQ</Link>
            <Link to="/policies/privacy-policy" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">Privacy Policy</Link>
            <Link to="/policies/terms-and-conditions" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">Terms & Conditions</Link>
            <Link to="/policies/shipping-policy" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">Shipping Policy</Link>
            <Link to="/policies/return-refund-policy" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">Return &amp; Refund Policy</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">Contact Us</Link>
            <Link to="/about" className="text-gray-400 hover:text-white hover:translate-x-1 transition-all text-sm w-fit">About Us</Link>
          </div>

          {/* Column 4: Contact Info */}
          <div className="flex flex-col gap-5">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2">Contact</h4>
            <a href="mailto:support@belledonne.in" className="text-gray-400 hover:text-white transition-colors text-sm w-fit">support@belledonne.in</a>
            <a href="tel:+919876543210" className="text-gray-400 hover:text-white transition-colors text-sm w-fit">+91 98765 43210</a>
            <p className="text-gray-400 text-sm">Mon – Sat: 9:00 AM – 6:00 PM IST</p>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              123 Horizon Tower, Cyber City<br/>
              Gurgaon, Haryana – 122002<br/>
              India
            </p>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 BELLEDONNE Paris. All Rights Reserved.</p>
          <p>Made with ❤️ in India.</p>
        </div>
      </div>
    </footer>
  );
}
