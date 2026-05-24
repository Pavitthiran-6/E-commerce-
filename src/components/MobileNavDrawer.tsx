import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, User, ShoppingBag, Heart, MapPin, LogOut } from 'lucide-react';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  avatarLetter: string;
  onLogout: () => void;
}

export default function MobileNavDrawer({ isOpen, onClose, isLoggedIn, avatarLetter, onLogout }: MobileNavDrawerProps) {
  const location = useLocation();

  const handleLinkClick = () => {
    onClose();
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Men', path: '/collection?category=men' },
    { label: 'Women', path: '/collection?category=women' },
    { label: 'Tech & Kitchen', path: '/collection?category=tech-kitchen' },
    { label: 'New Arrivals', path: '/new-arrivals' },
    { label: 'Sale', path: '/sale', isRed: true },
    { label: 'About Us', path: '/about' },
    { label: 'Contact Us', path: '/contact' },
  ];

  return (
    <div className={`fixed inset-0 z-[200] md:hidden ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`absolute top-0 left-0 w-[85%] max-w-[320px] h-full bg-white flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.2,1,0.2,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header / User Info */}
        <div className="bg-gray-50 p-6 flex flex-col gap-6">
          <div className="flex justify-end">
             <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-charcoal-stone -mr-2">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-charcoal-stone text-white flex items-center justify-center font-bold text-xl">
                {avatarLetter}
              </div>
              <div>
                <p className="font-bold text-charcoal-stone">Welcome back!</p>
                <Link to="/profile" onClick={handleLinkClick} className="text-xs text-gray-500 underline mt-1 block">View Profile</Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <Link to="/login" onClick={handleLinkClick} className="w-full bg-charcoal-stone text-white text-center py-3 font-bold uppercase tracking-widest text-xs rounded hover:bg-black transition-colors">
                Log In
              </Link>
              <Link to="/signup" onClick={handleLinkClick} className="w-full border border-gray-300 text-charcoal-stone text-center py-3 font-bold uppercase tracking-widest text-xs rounded hover:border-charcoal-stone transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-6 flex flex-col gap-6 border-b border-gray-100">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={handleLinkClick}
                className={`font-serif text-2xl tracking-wide ${link.isRed ? 'text-red-600 font-bold' : 'text-charcoal-stone'} ${location.pathname === link.path ? 'underline decoration-2 underline-offset-8' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {isLoggedIn && (
            <div className="p-6 flex flex-col gap-6">
              <Link to="/profile" onClick={handleLinkClick} className="flex items-center gap-4 text-gray-600 font-medium">
                <User className="w-5 h-5 text-gray-400" /> My Profile
              </Link>
              <Link to="/orders" onClick={handleLinkClick} className="flex items-center gap-4 text-gray-600 font-medium">
                <ShoppingBag className="w-5 h-5 text-gray-400" /> My Orders
              </Link>
              <Link to="/addresses" onClick={handleLinkClick} className="flex items-center gap-4 text-gray-600 font-medium">
                <MapPin className="w-5 h-5 text-gray-400" /> Saved Addresses
              </Link>
              <Link to="/wishlist" onClick={handleLinkClick} className="flex items-center gap-4 text-gray-600 font-medium">
                <Heart className="w-5 h-5 text-gray-400" /> Wishlist
              </Link>
              <button onClick={() => { onLogout(); handleLinkClick(); }} className="flex items-center gap-4 text-red-600 font-medium mt-2">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex justify-center gap-6">
          <a href="#" className="text-gray-400 hover:text-charcoal-stone text-xs font-bold tracking-widest">IG</a>
          <a href="#" className="text-gray-400 hover:text-charcoal-stone text-xs font-bold tracking-widest">FB</a>
          <a href="#" className="text-gray-400 hover:text-charcoal-stone text-xs font-bold tracking-widest">X</a>
          <a href="#" className="text-gray-400 hover:text-charcoal-stone text-xs font-bold tracking-widest">YT</a>
        </div>
      </div>
    </div>
  );
}
