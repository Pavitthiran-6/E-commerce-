import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, Package, MapPin, Heart, KeyRound, LogOut, Bell } from 'lucide-react';

interface ProfileSidebarProps {
  setShowLogout: (show: boolean) => void;
}

export default function ProfileSidebar({ setShowLogout }: ProfileSidebarProps) {
  const tabs = [
    { id: 'details', label: 'My Profile', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'password', label: 'Change Password', icon: KeyRound },
  ];

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      {/* Mobile view: horizontal scroll */}
      <div className="lg:hidden w-full overflow-x-auto no-scrollbar tab-scroll-container mb-6 border-b border-gray-200">
        <div className="flex gap-6 px-1 w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.id}
                to={`/profile/${tab.id}`}
                className={({ isActive }) => `flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-charcoal-stone'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </NavLink>
            );
          })}
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-2 pb-4 text-sm font-medium border-b-2 border-transparent text-red-500 hover:text-red-600 whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Desktop view: vertical sidebar */}
      <div className="hidden lg:flex flex-col gap-1 sticky top-32">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.id}
              to={`/profile/${tab.id}`}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-[#f6f5f0] text-primary' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-charcoal-stone'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </NavLink>
          );
        })}
        <button
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all mt-4"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
