import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut, MapPin, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import AnnouncementBar from './AnnouncementBar';
import MobileNavDrawer from './MobileNavDrawer';

export default function Navbar() {
  const [show, setShow] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastScrollY, setLastScrollY] = useState(0);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');

  let avatarLetter = 'U';
  if (userEmail) {
    const rawName = userEmail.split('@')[0];
    const cleanName = rawName.replace(/[^a-zA-Z]/g, '');
    avatarLetter = cleanName ? cleanName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase();
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUserEmail('');
    setIsProfileDropdownOpen(false);
    navigate('/');
  };

  // Close profile dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);

      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setShow(false);
      } else {
        setShow(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Center Navigation Links
  const navLinks = [
    { label: 'Men', path: '/collection?category=men' },
    { label: 'Women', path: '/collection?category=women' },
    { label: 'Tech & Kitchen', path: '/collection?category=tech-kitchen' },
    { label: 'New Arrivals', path: '/new-arrivals' },
    { label: 'Sale', path: '/sale', isRed: true },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <AnnouncementBar />

      <header 
        className={`sticky top-0 w-full z-50 transition-all duration-300 transform bg-[#fdfdfc] text-charcoal-stone ${
          show ? 'translate-y-0' : '-translate-y-full'
        } ${isScrolled ? 'shadow-[0_4px_20px_rgb(0,0,0,0.05)] py-3' : 'py-5'}`}
      >
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 grid grid-cols-[1fr_auto_1fr] items-center">
          
          {/* Left Side: Hamburger (Mobile) + Logo */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden hover:opacity-70 transition-opacity"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <Link to="/" className="flex flex-col">
              <span className="text-[18px] md:text-[22px] font-bold tracking-[0.25em] leading-none">
                BELLEDONNE
              </span>
              <span className="text-[9px] tracking-widest mt-1 font-light ml-1">Paris</span>
            </Link>
          </div>

          {/* Center Side: Navigation Links (Hidden on mobile) */}
          <nav className="hidden md:flex gap-8 lg:gap-12 items-center justify-center text-xs font-bold tracking-widest uppercase">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path.split('?')[0]; // simple active check
              
              return (
                <Link 
                  key={link.label}
                  to={link.path} 
                  className={`group relative py-2 ${link.isRed ? 'text-red-600' : 'text-charcoal-stone'}`}
                >
                  {link.label}
                  {/* Animated Underline */}
                  <span 
                    className={`absolute bottom-0 left-0 h-[2px] bg-current transition-all duration-300 ease-out ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Icons */}
          <div className="flex justify-end gap-6 items-center">
            
            {/* Search */}
            <button onClick={() => setIsSearchOpen(true)} className="hover:opacity-70 transition-opacity">
              <Search className="w-5 h-5" />
            </button>

            {/* Profile Link */}
            <div className="hidden md:block relative">
              {isLoggedIn ? (
                <Link 
                  to="/profile"
                  className="w-8 h-8 rounded-full bg-charcoal-stone text-white flex items-center justify-center font-bold text-sm hover:bg-black transition-colors"
                >
                  {avatarLetter}
                </Link>
              ) : (
                <Link to="/login" className="text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                  Log In
                </Link>
              )}
            </div>

            {/* Wishlist */}
            <Link to="/wishlist" className="hover:opacity-70 transition-opacity relative">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="hover:opacity-70 transition-opacity relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-charcoal-stone text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Slide-Down Full Width Search Overlay */}
      <div 
        className={`fixed top-0 left-0 w-full bg-white z-[100] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.2,1,0.2,1)] ${
          isSearchOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
          <form 
            className="relative flex items-center border-b-2 border-charcoal-stone pb-2"
            onSubmit={(e) => { 
              e.preventDefault(); 
              setIsSearchOpen(false); 
              navigate(searchQuery.trim() ? `/collection?q=${searchQuery}` : '/collection');
            }}
          >
            <Search className="w-6 h-6 text-gray-400 mr-4" />
            <input 
              type="text" 
              placeholder="Search for products, brands and more..."
              autoFocus={isSearchOpen}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow text-xl md:text-2xl font-serif text-charcoal-stone focus:outline-none placeholder:text-gray-300 bg-transparent"
            />
            <button 
              type="button" 
              onClick={() => setIsSearchOpen(false)} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-4 text-charcoal-stone"
            >
              <X className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
      
      {/* Search Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-500 ${
          isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={() => setIsSearchOpen(false)}
      />

      {/* Drawers */}
      <MobileNavDrawer 
        isOpen={isMobileDrawerOpen} 
        onClose={() => setIsMobileDrawerOpen(false)} 
        isLoggedIn={isLoggedIn}
        avatarLetter={avatarLetter}
        onLogout={handleLogout}
      />
    </>
  );
}
