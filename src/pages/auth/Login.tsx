import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingButton } from '../../components/LoadingButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsLoading(true);
      setTimeout(() => {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        window.location.href = '/'; 
      }, 1500);
    }
  };

  return (
    <main className="w-full min-h-[80vh] flex flex-col items-center justify-center pt-32 pb-24 px-6">
      <div className="w-full max-w-md bg-white border border-outline-variant/30 p-8 md:p-12 shadow-sm rounded-sm">
        <div className="text-center mb-10">
          <h1 className="font-headline-display text-3xl text-primary tracking-wide mb-2">Welcome Back</h1>
          <p className="font-body-md text-on-surface-variant">Please log in to your account.</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleLogin}>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-label-caps text-xs text-primary uppercase tracking-widest">
              Email Address
            </label>
            <input 
              id="email" 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b-2 border-outline-variant/50 pb-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder-on-surface-variant/50"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="font-label-caps text-xs text-primary uppercase tracking-widest">
                Password
              </label>
              <Link to="/forgot-password" className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4 decoration-outline-variant">
                Forgot password?
              </Link>
            </div>
            <input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              className="w-full border-b-2 border-outline-variant/50 pb-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder-on-surface-variant/50"
              required
            />
          </div>

          <LoadingButton 
            type="submit" 
            loading={isLoading}
            className="w-full bg-primary text-white font-button text-button uppercase py-4 mt-4 hover:bg-primary/90 transition-colors duration-400 ease-in-out tracking-[0.1em] flex justify-center items-center h-14"
          >
            Log In
          </LoadingButton>
        </form>

        <div className="mt-8 text-center border-t border-outline-variant/30 pt-8">
          <p className="font-body-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-primary/70 font-semibold underline underline-offset-4 decoration-outline-variant transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
