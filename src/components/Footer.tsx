import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="hidden md:block bg-[#3D3D3D] text-white pt-16 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Column 1 - Brand */}
          <div className="flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-warm-sand" />
              <span className="font-serif text-2xl tracking-wide text-white">BELLEDONNE</span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              Premium quality, modern aesthetics, and unparalleled comfort. We bring the best of global fashion to India.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E1306C] hover:text-white transition-all text-xl">
                📷
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all text-xl">
                📘
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-black hover:text-white transition-all text-xl">
                🐦
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-all text-xl">
                ▶️
              </a>
            </div>
          </div>

          {/* Column 2 - Shop */}
          <div className="flex flex-col gap-5">
            <h3 className="font-serif text-lg tracking-wide mb-2">Shop</h3>
            <Link to="/collection?category=men" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">Men's Collection</Link>
            <Link to="/collection?category=women" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">Women's Collection</Link>
            <Link to="/collection?category=tech-kitchen" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">Tech & Kitchen</Link>
            <Link to="/new-arrivals" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">New Arrivals</Link>
            <Link to="/sale" className="text-red-400 text-sm hover:text-red-300 font-medium transition-colors w-fit">Sale</Link>
          </div>

          {/* Column 3 - Help & Policies */}
          <div className="flex flex-col gap-5">
            <h3 className="font-serif text-lg tracking-wide mb-2">Help & Policies</h3>
            <Link to="/policies/faq" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">FAQ</Link>
            <Link to="/policies/privacy-policy" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">Privacy Policy</Link>
            <Link to="/policies/terms" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">Terms & Conditions</Link>
            <Link to="/policies/shipping" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">Shipping Policy</Link>
            <Link to="/policies/return-refund" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">Return & Refund Policy</Link>
            <Link to="/about" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">About Us</Link>
            <Link to="/contact" className="text-gray-300 text-sm hover:text-warm-sand transition-colors w-fit">Contact Us</Link>
          </div>

          {/* Column 4 - Contact Info */}
          <div className="flex flex-col gap-5">
            <h3 className="font-serif text-lg tracking-wide mb-2">Contact Us</h3>
            <div className="flex items-start gap-3">
              <span className="text-warm-sand">📧</span>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Email Support</span>
                <a href="mailto:support@belledonne.in" className="text-gray-300 text-sm hover:text-white transition-colors">support@belledonne.in</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-warm-sand">📞</span>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Phone Support</span>
                <a href="tel:+919876543210" className="text-gray-300 text-sm hover:text-white transition-colors">+91 98765 43210</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-warm-sand">🕐</span>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Working Hours</span>
                <span className="text-gray-300 text-sm">Mon–Sat, 9AM–6PM IST</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-gray-400 text-center md:text-left">
            &copy; {new Date().getFullYear()} BELLEDONNE Paris. All Rights Reserved. Made with ❤️ in India.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <div className="bg-white/10 px-3 py-1.5 rounded flex items-center justify-center">
              <span className="text-xs font-bold tracking-widest">UPI</span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded flex items-center justify-center">
              <span className="text-xs font-bold tracking-widest">VISA</span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded flex items-center justify-center">
              <span className="text-xs font-bold tracking-widest">MASTERCARD</span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded flex items-center justify-center">
              <span className="text-xs font-bold tracking-widest">RUPAY</span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded flex items-center justify-center">
              <span className="text-xs font-bold tracking-widest">COD</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
