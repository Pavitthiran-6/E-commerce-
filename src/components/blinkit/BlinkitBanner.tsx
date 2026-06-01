import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  title: string;
  subtitle: string;
  badge?: string;
  tagline?: string;
  image: string;
  link: string;
  buttonText: string;
  gradient?: string;
}

interface BlinkitBannerProps {
  slides: Slide[];
  className?: string;
}

export default function BlinkitBanner({ slides, className = '' }: BlinkitBannerProps) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length, isAutoPlaying]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  if (!slides.length) return null;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, idx) => (
          <div key={idx} className="min-w-full relative">
            <Link to={slide.link} className="block">
              <div className="relative aspect-[16/7] md:aspect-[16/6] overflow-hidden rounded-2xl bg-gray-100">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-center px-5 md:px-10">
                  {slide.badge && (
                    <span className="inline-block bg-[#F3C900] text-black text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 w-fit">
                      {slide.badge}
                    </span>
                  )}
                  <p className="text-white/80 text-xs font-medium mb-1 uppercase tracking-wider">
                    {slide.subtitle}
                  </p>
                  <h2 className="text-white text-xl md:text-3xl font-bold leading-tight mb-2 max-w-xs">
                    {slide.title}
                  </h2>
                  {slide.tagline && (
                    <p className="text-white/70 text-xs mb-3 max-w-xs hidden md:block">
                      {slide.tagline}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl w-fit hover:bg-[#F3C900] transition-colors duration-200">
                    {slide.buttonText}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation arrows (desktop only) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-md z-10 transition-all hover:scale-105"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-md z-10 transition-all hover:scale-105"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
