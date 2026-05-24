import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingButton } from '../../components/LoadingButton';

const validatePassword = (pwd: string) => {
  const minLength = 8;
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  return pwd.length >= minLength && hasSymbol && hasNumber && hasUpper && hasLower;
};

export default function Signup() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters and include a symbol, number, uppercase, and lowercase letter.');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <main className="w-full min-h-[80vh] flex flex-col items-center justify-center pt-32 pb-24 px-6">
      <div className="w-full max-w-md bg-white border border-outline-variant/30 p-8 md:p-12 shadow-sm rounded-sm">
        <div className="text-center mb-10">
          <h1 className="font-headline-display text-3xl text-primary tracking-wide mb-2">Create Account</h1>
          <p className="font-body-md text-on-surface-variant">Join us to enjoy a faster checkout experience.</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="firstName" className="font-label-caps text-xs text-primary uppercase tracking-widest">
                First Name
              </label>
              <input 
                id="firstName" 
                type="text" 
                placeholder="John"
                className="w-full border-b-2 border-outline-variant/50 pb-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder-on-surface-variant/50"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="lastName" className="font-label-caps text-xs text-primary uppercase tracking-widest">
                Last Name
              </label>
              <input 
                id="lastName" 
                type="text" 
                placeholder="Doe"
                className="w-full border-b-2 border-outline-variant/50 pb-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder-on-surface-variant/50"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-label-caps text-xs text-primary uppercase tracking-widest">
              Email Address
            </label>
            <input 
              id="email" 
              type="email" 
              placeholder="you@example.com"
              className="w-full border-b-2 border-outline-variant/50 pb-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder-on-surface-variant/50"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-label-caps text-xs text-primary uppercase tracking-widest">
              Password
            </label>
            <input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b-2 border-outline-variant/50 pb-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder-on-surface-variant/50"
              required
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <LoadingButton 
            type="submit" 
            loading={isLoading}
            className="w-full bg-primary text-white font-button text-button uppercase py-4 mt-4 hover:bg-primary/90 transition-colors duration-400 ease-in-out tracking-[0.1em] flex justify-center items-center h-14"
          >
            Create Account
          </LoadingButton>
        </form>

        <div className="mt-8 text-center border-t border-outline-variant/30 pt-8">
          <p className="font-body-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary/70 font-semibold underline underline-offset-4 decoration-outline-variant transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
