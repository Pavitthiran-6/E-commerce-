import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Set launch date to 15 days from now
    const countDownDate = new Date().getTime() + (15 * 24 * 60 * 60 * 1000);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = countDownDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black font-body-md">
      
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
          alt="Fashion Background" 
          className="w-full h-full object-cover opacity-50 scale-105 animate-[pulse_20s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90"></div>
      </div>

      {/* Main Glass Container */}
      <div className="relative z-10 w-full max-w-4xl mx-6 p-8 md:p-16 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col items-center text-center">
        
        {/* Brand Header */}
        <Link to="/" className="mb-12 group">
          <h2 className="text-white text-sm md:text-base tracking-[0.4em] font-light uppercase border-b border-white/20 pb-2 group-hover:border-white transition-colors duration-500">
            Belledonne Paris
          </h2>
        </Link>

        {/* Hero Text */}
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-6 font-medium tracking-tight drop-shadow-sm">
          Redefining Style
        </h1>
        <p className="text-gray-300 md:text-lg max-w-xl mx-auto font-light tracking-wide mb-14">
          Our new collection is currently in the making. Prepare yourself for a seamless blend of modern aesthetics and timeless elegance.
        </p>

        {/* Minimalist Countdown */}
        <div className="flex gap-6 md:gap-12 mb-16">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Mins', value: timeLeft.minutes },
            { label: 'Secs', value: timeLeft.seconds }
          ].map((time, index) => (
            <div key={time.label} className="flex flex-col items-center">
              <span className="text-4xl md:text-6xl font-light text-white mb-2 tabular-nums tracking-tighter">
                {time.value.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-semibold">
                {time.label}
              </span>
            </div>
          ))}
        </div>

        {/* Subscription Form */}
        <div className="w-full max-w-md">
          {isSubscribed ? (
            <div className="py-4 border-b border-green-500/50 text-green-400 text-sm tracking-wide font-medium animate-[fadeIn_0.5s_ease-out]">
              Thank you. You're on the exclusive access list.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="relative group">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address" 
                className="w-full bg-transparent border-b border-white/30 text-white placeholder-white/50 pb-4 px-2 focus:outline-none focus:border-white transition-colors duration-300 text-center md:text-left text-sm md:text-base tracking-wide"
              />
              <button 
                type="submit" 
                className="mt-6 md:mt-0 md:absolute md:right-0 md:top-0 md:-translate-y-1 text-xs uppercase tracking-[0.2em] font-bold text-white hover:text-gray-300 transition-colors py-2"
              >
                Notify Me
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Footer Links */}
      <div className="absolute bottom-8 w-full flex justify-center gap-8 z-10">
        {['Instagram', 'Twitter', 'Journal'].map(link => (
          <a key={link} href="#" className="text-white/50 hover:text-white text-[10px] uppercase tracking-widest transition-colors duration-300">
            {link}
          </a>
        ))}
      </div>

    </div>
  );
}
