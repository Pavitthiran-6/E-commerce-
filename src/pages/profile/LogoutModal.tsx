import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    // Perform logout logic here (clear tokens, etc.)
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <LogOut className="w-8 h-8" />
          </div>
          
          <h3 className="font-headline-md text-2xl mb-2">Ready to leave?</h3>
          <p className="text-gray-500 text-sm mb-8">
            Are you sure you want to log out of your account? You will need to log back in to access your orders and wishlist.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Yes, Logout
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-gray-50 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
