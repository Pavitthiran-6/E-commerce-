import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, X, Menu } from 'lucide-react';

interface Section {
  id: string;
  title: string;
}

interface PolicyLayoutProps {
  title: string;
  lastUpdated: string;
  sections: Section[];
  children: React.ReactNode;
}

export default function PolicyLayout({ title, lastUpdated, sections, children }: PolicyLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  // Handle scroll for active section and back to top button
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Back to top button
      setShowScrollTop(window.scrollY > 300);

      // Active section spy
      const sectionElements = sections.map(s => document.getElementById(s.id));
      let currentActive = '';
      
      for (const el of sectionElements) {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) { // Offset for sticky header
            currentActive = el.id;
          }
        }
      }
      if (currentActive) {
        setActiveSection(currentActive);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120; // Offset for navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileTocOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#fafaf8] min-h-screen pb-24 pt-32">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16 text-center md:text-left">
        <h1 className="font-serif text-4xl md:text-5xl text-charcoal-stone mb-4">{title}</h1>
        <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Last Updated: {lastUpdated}</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 lg:gap-24 relative">
        
        {/* Mobile TOC Button */}
        <div className="lg:hidden sticky top-[70px] z-30 bg-[#fafaf8] py-4 border-b border-gray-200">
          <button 
            onClick={() => setIsMobileTocOpen(true)}
            className="w-full bg-white border border-gray-200 shadow-sm p-4 rounded-lg flex items-center justify-between font-bold text-charcoal-stone"
          >
            <span className="flex items-center gap-2"><Menu className="w-5 h-5"/> Jump to Section</span>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Sidebar TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-[120px]">
            <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400 mb-6 border-b border-gray-200 pb-4">Table of Contents</h3>
            <ul className="space-y-4">
              {sections.map(section => (
                <li key={section.id}>
                  <button 
                    onClick={() => scrollToSection(section.id)}
                    className={`text-sm text-left w-full transition-all ${
                      activeSection === section.id 
                        ? 'font-bold text-charcoal-stone translate-x-2' 
                        : 'text-gray-500 hover:text-charcoal-stone hover:translate-x-1'
                    } duration-300`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="prose prose-lg max-w-none text-charcoal-stone prose-headings:font-serif prose-headings:font-normal prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-p:leading-[1.8] prose-p:text-gray-600 prose-a:text-charcoal-stone prose-a:font-bold prose-li:text-gray-600 prose-li:leading-[1.8] scroll-smooth">
          {children}
        </main>
      </div>

      {/* Mobile TOC Drawer */}
      <div className={`fixed inset-0 z-[200] lg:hidden ${isMobileTocOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isMobileTocOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileTocOpen(false)}
        />
        <div className={`absolute bottom-0 left-0 w-full bg-white rounded-t-2xl p-6 transition-transform duration-500 ease-[cubic-bezier(0.2,1,0.2,1)] ${isMobileTocOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400">Jump to Section</h3>
            <button onClick={() => setIsMobileTocOpen(false)} className="p-2 -mr-2 bg-gray-100 rounded-full text-charcoal-stone"><X className="w-4 h-4"/></button>
          </div>
          <ul className="space-y-4 max-h-[60vh] overflow-y-auto pb-6">
            {sections.map(section => (
              <li key={section.id}>
                <button 
                  onClick={() => scrollToSection(section.id)}
                  className={`text-base text-left w-full py-2 border-b border-gray-50 transition-colors ${
                    activeSection === section.id 
                      ? 'font-bold text-charcoal-stone' 
                      : 'text-gray-500'
                  }`}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 w-12 h-12 bg-charcoal-stone text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center transition-all duration-500 z-40 hover:bg-black hover:-translate-y-1 ${
          showScrollTop ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-12 invisible pointer-events-none'
        }`}
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
  );
}
