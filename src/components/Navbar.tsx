import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Heart, ShoppingBag, X, User } from 'lucide-react';
import { useCart, useWishlist, useAuth } from '../context';
import MiniCartDrawer from './MiniCartDrawer';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { isLoggedIn, userInitial, logout, user } = useAuth();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const announcements = [
    '🚚 Free Shipping on orders above ₹999 across India!',
    '🎉 Use code WELCOME10 for 10% off your first order!',
    '↩️ Easy 7-Day Returns — No Questions Asked!',
    '💰 Cash on Delivery available on all orders!'
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { name: 'New Arrivals', path: '/new-arrivals' },
    { name: 'Men', path: '/collection?category=men' },
    { name: 'Women', path: '/collection?category=women' },
    { name: 'Tech & Kitchen', path: '/collection?category=tech-kitchen' },
    { name: 'Sale', path: '/sale', className: 'text-red-600 font-semibold' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get('search')?.toString();
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-charcoal-stone text-white text-xs py-2 px-4 text-center overflow-hidden h-8">
        <p className="animate-fade-in">{announcements[announcementIndex]}</p>
      </div>

      <header className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${isScrolled ? 'shadow-sm border-b border-gray-100' : ''}`}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 h-20 flex items-center justify-between">
          
          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6 text-charcoal-stone" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <ShoppingBag className="w-7 h-7 text-charcoal-stone hidden md:block" />
              <span className="font-serif text-xl md:text-2xl tracking-wide text-charcoal-stone">BELLEDONNE</span>
            </Link>
          </div>

          {/* Center: Desktop Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink 
                key={link.name} 
                to={link.path}
                className={({ isActive }) => `text-sm font-medium hover:text-primary transition-colors pb-1 border-b-2 ${
                  isActive || location.search.includes(link.path.split('?')[1] || 'xxx') 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-charcoal-stone'
                } ${link.className || ''}`}
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-5">
            <button onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="w-5 h-5 md:w-6 md:h-6 text-charcoal-stone hover:text-primary transition-colors" />
            </button>

            {/* User Avatar / Login */}
            <div className="relative hidden md:block">
              {isLoggedIn ? (
                user?.role === 'ROLE_ADMIN' ? (
                  <div className="flex items-center gap-3">
                    <Link 
                      to="/admin" 
                      className="bg-charcoal-stone text-white px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors rounded-sm text-[10px]"
                    >
                      Admin Dashboard
                    </Link>
                    <button 
                      onClick={logout} 
                      className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-widest transition-colors text-[10px]"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <div 
                      className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    >
                      {userInitial}
                    </div>

                    {/* Profile Dropdown */}
                    {profileDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)}></div>
                        <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                          <Link to="/profile/details" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100" onClick={() => setProfileDropdownOpen(false)}>👤 My Profile</Link>
                          <Link to="/profile/orders" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100" onClick={() => setProfileDropdownOpen(false)}>📦 My Orders</Link>
                          <Link to="/profile/addresses" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100" onClick={() => setProfileDropdownOpen(false)}>📍 Saved Addresses</Link>
                          <Link to="/wishlist" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100" onClick={() => setProfileDropdownOpen(false)}>❤️ Wishlist</Link>
                          <button onClick={() => { logout(); setProfileDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-medium">🚪 Logout</button>
                        </div>
                      </>
                    )}
                  </>
                )
              ) : (
                <Link to="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
                  Log In
                </Link>
              )}
            </div>

            <Link to="/wishlist" className="relative hidden md:block">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-charcoal-stone hover:text-primary transition-colors" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative">
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-charcoal-stone hover:text-primary transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Slide Down */}
        <div className={`absolute top-20 left-0 w-full bg-white border-b border-gray-100 transition-all duration-300 ease-in-out ${searchOpen ? 'opacity-100 visible h-auto py-6' : 'opacity-0 invisible h-0 py-0 overflow-hidden'}`}>
          <div className="max-w-2xl mx-auto px-6 relative">
            <form onSubmit={handleSearchSubmit}>
              <input 
                type="text" 
                name="search"
                placeholder="Search for products, categories, or brands..." 
                className="w-full border-b-2 border-gray-300 text-lg md:text-xl py-3 pl-2 pr-10 focus:outline-none focus:border-primary transition-colors bg-transparent"
                autoFocus={searchOpen}
              />
              <button type="submit" className="absolute right-6 top-1/2 -translate-y-1/2 p-2">
                <Search className="w-5 h-5 text-gray-500 hover:text-primary transition-colors" />
              </button>
            </form>
          </div>
          {searchOpen && (
            <div className="fixed inset-0 top-36 z-[-1]" onClick={() => setSearchOpen(false)}></div>
          )}
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-[85%] max-w-sm h-full bg-white animate-slide-in-left flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#fafaf8]">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                    {userInitial}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Welcome back,</p>
                    <p className="font-semibold text-charcoal-stone">{useAuth().userName}</p>
                  </div>
                </div>
              ) : (
                <Link to="/auth/login" className="font-serif text-xl tracking-wide text-charcoal-stone flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <ShoppingBag className="w-6 h-6" /> BELLEDONNE
                </Link>
              )}
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-6 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path}
                  className={`text-lg font-medium ${link.className || 'text-charcoal-stone'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="w-full h-px bg-gray-100 my-2"></div>
              
              {isLoggedIn ? (
                user?.role === 'ROLE_ADMIN' ? (
                  <>
                    <Link to="/admin" className="text-lg font-medium text-gray-600 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>🛠️ Admin Dashboard</Link>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-lg font-medium text-red-600 text-left mt-2">🚪 Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/profile/details" className="text-lg font-medium text-gray-600 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>👤 My Profile</Link>
                    <Link to="/profile/orders" className="text-lg font-medium text-gray-600 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>📦 My Orders</Link>
                    <Link to="/wishlist" className="text-lg font-medium text-gray-600 flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>❤️ Wishlist ({wishlistCount})</Link>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-lg font-medium text-red-600 text-left">🚪 Logout</button>
                  </>
                )
              ) : (
                <div className="flex flex-col gap-4 mt-4">
                  <Link to="/auth/login" className="bg-primary text-white text-center py-3 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                  <Link to="/auth/signup" className="border border-charcoal-stone text-charcoal-stone text-center py-3 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 text-center text-sm text-gray-500">
              © 2026 BELLEDONNE Paris.
            </div>
          </div>
        </div>
      )}
      {/* Mini Cart Drawer */}
      <MiniCartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
}
