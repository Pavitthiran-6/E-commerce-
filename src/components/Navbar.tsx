import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, X, Search, Menu, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import MiniCartDrawer from './MiniCartDrawer';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { isLoggedIn, userInitial, logout, user, userName } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const announcements = [
    '🚚 Free Shipping on orders above ₹999 across India!',
    '🎉 Use code WELCOME10 for 10% off your first order!',
    '↩️ Easy 7-Day Returns — No Questions Asked!',
    '💰 Cash on Delivery available on all orders!',
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
    { name: 'Sale', path: '/sale', className: 'text-[#E53935] font-semibold' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/collection?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* ── Announcement bar ─────────────────────────────── */}
      <div className="bg-[#3D3D3D] text-white text-[11px] font-medium py-2 px-4 text-center overflow-hidden h-8">
        <p className="animate-fade-in" key={announcementIndex}>
          {announcements[announcementIndex]}
        </p>
      </div>

      {/* ── Main header ──────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 bg-white transition-all duration-300 ${
          isScrolled ? 'shadow-md' : 'border-b border-[#E8E8E8]'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-3 md:px-6 lg:px-10 h-16 flex items-center gap-3">

          {/* Mobile: Hamburger */}
          <button
            className="md:hidden flex-shrink-0 p-1.5 -ml-1 text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 mr-2 md:mr-6">
            <div className="w-8 h-8 bg-[#F3C900] rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-4.5 h-4.5 text-[#3D3D3D]" />
            </div>
            <span className="font-black text-lg text-[#3D3D3D] tracking-tight hidden sm:block">
              BELLEDONNE
            </span>
          </Link>

          {/* Mobile: Location tagline */}
          <div className="md:hidden flex items-center gap-1 text-gray-600 flex-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#0C831F]" />
            <span className="text-[11px] font-semibold truncate">Ships in 3–5 days</span>
          </div>

          {/* Desktop: Search bar inline */}
          <div className="hidden md:flex flex-1 items-center">
            <form onSubmit={handleSearchSubmit} className="w-full max-w-xl relative">
              <div className="flex items-center gap-2 bg-[#F2F2F2] rounded-xl px-3 py-2 hover:bg-white hover:ring-2 hover:ring-[#0C831F] transition-all group">
                <Search className="w-4 h-4 text-gray-400 group-hover:text-[#0C831F] flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, categories..."
                  className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                />
                {searchQuery && (
                  <button type="submit" className="text-xs font-bold text-[#0C831F] px-2 py-1 rounded-lg hover:bg-[#E8F5E9] transition-colors">
                    Go
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Desktop: Nav links */}
          <nav className="hidden lg:flex items-center gap-6 mx-4 flex-shrink-0">
            {navLinks.slice(0, 5).map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `text-[13px] font-semibold hover:text-[#0C831F] transition-colors whitespace-nowrap ${
                    isActive ? 'text-[#0C831F]' : link.className || 'text-gray-700'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 ml-auto md:ml-0">
            {/* Mobile: Search icon */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User */}
            <div className="relative hidden md:block">
              {isLoggedIn ? (
                user?.role === 'ROLE_ADMIN' ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/admin"
                      className="bg-[#3D3D3D] text-white px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-black transition-colors"
                    >
                      Admin
                    </Link>
                    <button onClick={logout} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                      Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="w-8 h-8 rounded-full bg-[#0C831F] text-white flex items-center justify-center font-bold text-sm hover:bg-[#0A6B19] transition-colors"
                    >
                      {userInitial}
                    </button>
                    {profileDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
                          <Link to="/profile/details" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setProfileDropdownOpen(false)}>
                            👤 My Profile
                          </Link>
                          <Link to="/profile/orders" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setProfileDropdownOpen(false)}>
                            📦 My Orders
                          </Link>
                          <Link to="/profile/addresses" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setProfileDropdownOpen(false)}>
                            📍 Saved Addresses
                          </Link>
                          <Link to="/wishlist" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setProfileDropdownOpen(false)}>
                            ❤️ Wishlist ({wishlistCount})
                          </Link>
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button onClick={() => { logout(); setProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium">
                              🚪 Logout
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )
              ) : (
                <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-[#0C831F] transition-colors">
                  Login
                </Link>
              )}
            </div>

            {/* Wishlist (desktop) */}
            <Link to="/wishlist" className="relative hidden md:flex p-2 text-gray-600 hover:text-[#E53935] transition-colors" aria-label="Wishlist">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-[#E53935] text-white text-[9px] font-bold rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative flex p-2 text-gray-700 hover:text-[#0C831F] transition-colors" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-[#0C831F] text-white text-[9px] font-bold rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ── Mobile full-screen search overlay ────────── */}
        {searchOpen && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden animate-fade-in">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 bg-[#F2F2F2] rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                  autoFocus
                />
              </form>
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="text-sm font-semibold text-[#0C831F]"
              >
                Cancel
              </button>
            </div>
            <div className="p-4 text-sm text-gray-500">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Popular Categories</p>
              <div className="flex flex-wrap gap-2">
                {['Men', 'Women', 'Footwear', 'Electronics', 'Sale'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      navigate(`/collection?q=${cat}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="px-3 py-1.5 bg-[#F2F2F2] rounded-xl text-sm font-medium text-gray-700 hover:bg-[#E8F5E9] hover:text-[#0C831F] transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Mobile side drawer ────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-[82%] max-w-xs h-full bg-white flex flex-col animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0C831F] text-white flex items-center justify-center font-bold text-lg">
                    {userInitial}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Welcome back!</p>
                    <p className="text-sm font-bold text-gray-900">{userName}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="bg-[#0C831F] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#0A6B19] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="border-2 border-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl hover:border-[#0C831F] hover:text-[#0C831F] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors ${link.className || 'text-gray-800'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-px bg-gray-100 my-2 mx-4" />

              {isLoggedIn && (
                <>
                  <Link to="/profile/details" className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                    👤 My Profile
                  </Link>
                  <Link to="/profile/orders" className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                    📦 My Orders
                  </Link>
                  <Link to="/wishlist" className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                    ❤️ Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 text-left"
                  >
                    🚪 Logout
                  </button>
                </>
              )}

              {user?.role === 'ROLE_ADMIN' && (
                <Link to="/admin" className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                  🛠️ Admin Dashboard
                </Link>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} BELLEDONNE
            </div>
          </div>
        </div>
      )}

      {/* Mini Cart Drawer */}
      <MiniCartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
}
