import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ProfileSidebar from './ProfileSidebar';
import LogoutModal from './LogoutModal';
import './profile.css';

export default function Profile() {
  const [showLogout, setShowLogout] = useState(false);

  return (
    <div className="bg-[#fafaf8] min-h-screen pb-20">
      {/* Top Banner */}
      <div className="bg-charcoal-stone text-white pt-24 pb-12 mb-8">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-20">
          <h1 className="font-headline-md text-4xl md:text-5xl lg:text-6xl text-warm-sand">My Account</h1>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 lg:px-20">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
          <ProfileSidebar setShowLogout={setShowLogout} />
          
          <div className="flex-1 w-full min-w-0">
            <Outlet />
          </div>
        </div>
      </div>

      <LogoutModal 
        isOpen={showLogout} 
        onClose={() => setShowLogout(false)} 
      />
    </div>
  );
}
