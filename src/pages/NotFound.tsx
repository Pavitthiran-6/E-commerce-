import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#fafaf8] flex flex-col items-center justify-center text-center px-4">
      {/* Background massive text */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden mix-blend-multiply opacity-5">
        <span className="font-headline-display text-[40vw] leading-none text-charcoal-stone whitespace-nowrap tracking-tighter">
          404
        </span>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl animate-fade-in-up">
        {/* Modern glitchy/split 404 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="font-serif text-7xl md:text-9xl text-charcoal-stone font-light italic">4</span>
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-[1px] border-charcoal-stone flex items-center justify-center p-2 relative overflow-hidden group">
            <div className="w-full h-full bg-charcoal-stone rounded-full absolute top-full group-hover:top-0 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]" />
            <span className="font-sans text-xs md:text-sm uppercase tracking-widest text-charcoal-stone group-hover:text-white relative z-10 transition-colors duration-700 delay-100">Zero</span>
          </div>
          <span className="font-serif text-7xl md:text-9xl text-charcoal-stone font-light italic">4</span>
        </div>

        <h1 className="font-serif text-2xl md:text-4xl text-charcoal-stone mb-4 font-light tracking-wide">
          Lost in the void
        </h1>
        
        <p className="font-body-md text-gray-500 max-w-md mx-auto mb-10 text-sm md:text-base leading-relaxed">
          The page you're searching for has vanished into thin air. Let's guide you back to our latest collections.
        </p>

        <Link 
          to="/" 
          className="group relative inline-flex items-center justify-center gap-4 bg-charcoal-stone text-white font-button uppercase tracking-[0.15em] px-8 py-5 text-xs md:text-sm overflow-hidden hover:bg-black transition-colors"
        >
          <span className="relative z-10">Back to reality</span>
          <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
        </Link>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 md:top-20 md:left-20">
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-400 rotate-90 origin-left inline-block">Error</span>
      </div>
      <div className="absolute bottom-10 right-10 md:bottom-20 md:right-20">
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-400">Code : 404</span>
      </div>
    </main>
  );
}
