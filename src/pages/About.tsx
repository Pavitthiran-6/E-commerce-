import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Telescope, Shield, CheckCircle, Truck, Recycle, MessageCircle, Heart, Star, ArrowRight } from 'lucide-react';

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedNumber({ end, suffix = '', duration = 2000 }: { end: number, suffix?: string, duration?: number }) {
  const { ref, isVisible } = useScrollAnimation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      setCount(Math.floor(end * ease));

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className="font-serif text-6xl md:text-8xl text-charcoal-stone font-light tracking-tighter">
      {count.toLocaleString('en-IN')}{suffix}
    </span>
  );
}

export default function About() {
  const anim1 = useScrollAnimation();
  const anim2 = useScrollAnimation();
  const anim3 = useScrollAnimation();
  const anim4 = useScrollAnimation();
  const anim5 = useScrollAnimation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="w-full bg-[#f6f5f0] overflow-hidden">
      {/* SECTION 1: Editorial Hero */}
      <section className="relative w-full min-h-[90vh] flex flex-col justify-end pb-20 px-6 md:px-12 pt-32">
        <div className="absolute top-0 right-0 w-full md:w-[60%] h-[90vh] bg-charcoal-stone overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1558769132-cb1fac0840c2?q=80&w=2000" 
            alt="Indian fashion lifestyle" 
            className="w-full h-full object-cover opacity-80 scale-105 animate-slow-pan"
          />
        </div>
        <div className="relative max-w-7xl mx-auto w-full flex flex-col justify-end min-h-[50vh]">
          <h1 className="font-headline-display text-[16vw] md:text-[14vw] leading-[0.8] mix-blend-difference text-white tracking-tighter uppercase ml-[-1vw] animate-fade-in-up">
            Who<br/>We Are
          </h1>
          <div className="mt-8 md:mt-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
            <p className="font-serif text-xl md:text-3xl text-charcoal-stone max-w-lg leading-tight animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              From India, crafted for India — quality you can trust without the premium markup.
            </p>
            <div className="w-24 h-[1px] bg-charcoal-stone animate-fade-in-up" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      </section>

      {/* SECTION 2: The Manifesto (Brand Story) */}
      <section 
        ref={anim1.ref} 
        className={`w-full px-6 md:px-12 py-32 md:py-48 transition-all duration-1000 transform ${anim1.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24">
          <div className="md:col-span-5 md:mt-24">
            <h2 className="font-serif text-5xl md:text-7xl text-charcoal-stone leading-none mb-8 italic font-light">
              Built with<br/>Passion.
            </h2>
            <div className="w-full aspect-[3/4] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1542838382-7d2d312abdc9?q=80&w=1000" 
                alt="Craftsmanship" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
          <div className="md:col-span-7 flex flex-col justify-center">
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400 mb-8 block">01 — The Genesis</span>
            <div className="font-body-md text-charcoal-stone text-lg md:text-2xl leading-relaxed space-y-8 font-light">
              <p>
                It started with a simple observation: Indian consumers were forced to choose between cheap, unreliable products or heavily marked-up international brands. There had to be a better way.
              </p>
              <p>
                We source the finest materials and partner directly with ethical manufacturers, cutting out middlemen. Whether you're in a bustling metro or a quiet tier-2 city, we ensure you receive premium goods without the premium price tag.
              </p>
              <p className="font-serif italic text-2xl md:text-4xl text-gray-400 mt-12">
                "To continuously elevate your lifestyle through products that are thoughtfully designed and proudly accessible."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Massive Numbers */}
      <section className="w-full border-y border-charcoal-stone/10 bg-white py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-32">
            <div className="flex flex-col border-b md:border-b-0 md:border-r border-charcoal-stone/10 pb-12 md:pb-0 md:pr-12">
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400 mb-4 block">Happy Customers</span>
              <AnimatedNumber end={10} suffix="K+" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400 mb-4 block">Orders Delivered</span>
              <AnimatedNumber end={50} suffix="K+" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Mission & Vision (Editorial Cards) */}
      <section 
        ref={anim2.ref}
        className={`w-full px-6 md:px-12 py-32 transition-all duration-1000 transform ${anim2.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-charcoal-stone text-[#f6f5f0] p-12 md:p-20 flex flex-col justify-between min-h-[500px]">
            <Target className="w-12 h-12 opacity-50" strokeWidth={1} />
            <div>
              <h3 className="font-headline-display text-5xl md:text-7xl mb-6 tracking-tighter">Mission</h3>
              <p className="font-body-md text-lg md:text-xl font-light opacity-80 leading-relaxed max-w-md">
                To make premium quality products accessible to every Indian household at honest prices, by eliminating unnecessary markups.
              </p>
            </div>
          </div>
          <div className="bg-white border border-charcoal-stone/10 p-12 md:p-20 flex flex-col justify-between min-h-[500px]">
            <Telescope className="w-12 h-12 text-gray-300" strokeWidth={1} />
            <div>
              <h3 className="font-headline-display text-5xl md:text-7xl text-charcoal-stone mb-6 tracking-tighter">Vision</h3>
              <p className="font-body-md text-lg md:text-xl text-gray-500 font-light leading-relaxed max-w-md">
                To become India's most trusted home-grown e-commerce brand by 2030, known for positively impacting the lives of our customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: The Team (Avant-garde layout) */}
      <section 
        ref={anim3.ref}
        className={`w-full px-6 md:px-12 py-32 transition-all duration-1000 transform ${anim3.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <h2 className="font-serif text-5xl md:text-7xl text-charcoal-stone leading-none font-light italic">
              The Minds<br/>Behind it All
            </h2>
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400">02 — The Team</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-16">
            {[
              { name: 'Arjun M.', role: 'Founder & CEO' },
              { name: 'Priya S.', role: 'Operations' },
              { name: 'Rahul K.', role: 'Lead Design' },
              { name: 'Neha V.', role: 'Experience' },
            ].map((member, i) => (
              <div key={i} className={`flex flex-col group ${i % 2 !== 0 ? 'md:mt-16' : ''}`}>
                <div className="w-full aspect-[3/4] bg-gray-200 mb-6 flex items-center justify-center overflow-hidden relative">
                  <span className="font-serif text-8xl text-white mix-blend-difference absolute z-10">{member.name.charAt(0)}</span>
                  <div className="absolute inset-0 bg-charcoal-stone translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
                </div>
                <h4 className="font-serif text-2xl text-charcoal-stone mb-1">{member.name}</h4>
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: Core Values (Minimal Grid) */}
      <section 
        ref={anim4.ref}
        className={`w-full bg-charcoal-stone text-[#f6f5f0] px-6 md:px-12 py-32 transition-all duration-1000 transform ${anim4.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline-display text-5xl md:text-7xl mb-24 tracking-tighter uppercase">Our<br/>Standards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-20 border-t border-white/10 pt-12">
            {[
              { title: 'Trust', desc: 'Honest pricing. Zero hidden charges. Complete transparency.' },
              { title: 'Quality', desc: 'Obsessive attention to detail. Checked thoroughly before it ships.' },
              { title: 'Speed', desc: 'Lightning fast delivery across the expanse of India.' },
              { title: 'Sustainability', desc: 'Conscious packaging. Doing our part for the planet.' },
              { title: 'Support', desc: 'Real human beings available 7 days a week to help you.' },
              { title: 'India First', desc: 'Designed, sourced, and built specifically for the Indian consumer.' },
            ].map((val, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-xs font-bold tracking-[0.3em] uppercase text-white/30 mb-4 block">0{i + 1}</span>
                <h4 className="font-serif text-3xl mb-4 font-light italic">{val.title}</h4>
                <p className="font-body-md text-white/60 font-light">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: Monolithic Testimonial */}
      <section 
        ref={anim5.ref}
        className={`w-full px-6 md:px-12 py-32 md:py-48 transition-all duration-1000 transform ${anim5.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center gap-2 mb-12 text-charcoal-stone">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-current" />)}
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-charcoal-stone leading-tight mb-12 font-light">
            "Finally an Indian brand that gets aesthetics and comfort right! The quality is unmatched for the price. Been recommending it to all my friends."
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-serif text-xl text-charcoal-stone">A</div>
            <div className="text-left">
              <span className="block font-bold text-charcoal-stone">Aditi S.</span>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Bangalore, India</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: Editorial CTA */}
      <section className="relative w-full h-[70vh] flex items-center justify-center overflow-hidden bg-charcoal-stone">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=2000" 
          alt="Texture" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="relative z-20 text-center px-4 flex flex-col items-center w-full max-w-4xl">
          <h2 className="font-headline-display text-[10vw] md:text-[8vw] leading-[0.8] text-white tracking-tighter uppercase mb-12">
            Experience<br/>The Difference
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md mx-auto">
            <Link 
              to="/collection" 
              className="flex-1 group relative inline-flex items-center justify-center gap-4 bg-white text-charcoal-stone font-bold uppercase tracking-[0.2em] px-8 py-5 text-xs overflow-hidden"
            >
              <span className="relative z-10">Shop Now</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gray-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
            </Link>
            <Link 
              to="/contact" 
              className="flex-1 group relative inline-flex items-center justify-center gap-4 border border-white text-white font-bold uppercase tracking-[0.2em] px-8 py-5 text-xs overflow-hidden hover:bg-white hover:text-charcoal-stone transition-colors duration-500"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
