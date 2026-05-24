import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const validatePassword = (pwd: string) => {
  const minLength = 8;
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  return pwd.length >= minLength && hasSymbol && hasNumber && hasUpper && hasLower;
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(newPassword)) {
      setError('Password must be at least 8 characters and include a symbol, number, uppercase, and lowercase letter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  return (
    <main className="w-full min-h-[80vh] flex flex-col items-center justify-center pt-32 pb-24 px-6">
      <div className="w-full max-w-md bg-white border border-outline-variant/30 p-8 md:p-12 shadow-sm rounded-sm">
        <div className="text-center mb-10">
          <h1 className="font-headline-display text-3xl text-primary tracking-wide mb-2">New Password</h1>
          <p className="font-body-md text-on-surface-variant">Create a new secure password for your account.</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="newPassword" className="font-label-caps text-xs text-primary uppercase tracking-widest">
              New Password
            </label>
            <input 
              id="newPassword" 
              type="password" 
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border-b-2 border-outline-variant/50 pb-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder-on-surface-variant/50"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="font-label-caps text-xs text-primary uppercase tracking-widest">
              Confirm Password
            </label>
            <input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border-b-2 border-outline-variant/50 pb-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder-on-surface-variant/50"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary text-white font-button text-button uppercase py-4 mt-4 hover:bg-primary/90 transition-colors duration-400 ease-in-out tracking-[0.1em] flex justify-center items-center h-14 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
