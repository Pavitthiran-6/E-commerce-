import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8]">
      {/* Minimal Header */}
      <header className="p-6 text-center">
        <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ShoppingBag className="w-8 h-8 text-charcoal-stone" />
          <span className="font-serif text-2xl tracking-wide text-charcoal-stone">BELLEDONNE</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
          <Outlet />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="p-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} BELLEDONNE Paris. All rights reserved.
      </footer>
    </div>
  );
}
