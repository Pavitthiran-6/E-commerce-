import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { LoadingButton } from '../../components/LoadingButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      try {
        await login(email, password);
      } catch (error) {
        // Error handling is managed by the context (toast notifications)
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <div className="text-center mb-8">
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
            disabled={isLoading || isGoogleLoading}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-b-2 border-outline-variant/50 pb-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder-on-surface-variant/50"
            required
            disabled={isLoading || isGoogleLoading}
          />
        </div>

        <LoadingButton 
          type="submit" 
          loading={isLoading}
          disabled={isGoogleLoading}
          className="w-full bg-primary text-white font-button text-button uppercase py-4 mt-4 hover:bg-primary/90 transition-colors duration-400 ease-in-out tracking-[0.1em] flex justify-center items-center h-14"
        >
          Log In
        </LoadingButton>
      </form>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-outline-variant/30"></div>
        <span className="px-4 font-body-sm text-xs text-on-surface-variant uppercase tracking-widest">or</span>
        <div className="flex-1 border-t border-outline-variant/30"></div>
      </div>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-sm">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                setIsGoogleLoading(true);
                try {
                  await loginWithGoogle(credentialResponse.credential);
                } catch (error) {
                  // Toast notifications handled by AuthContext
                } finally {
                  setIsGoogleLoading(false);
                }
              }
            }}
            onError={() => {
              showToast('Google authentication failed', 'error');
            }}
            text="continue_with"
            theme="outline"
            size="large"
            width="350"
          />
        </div>
      </div>

      <div className="mt-8 text-center border-t border-outline-variant/30 pt-6">
        <p className="font-body-sm text-on-surface-variant">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-primary/70 font-semibold underline underline-offset-4 decoration-outline-variant transition-colors">
            Create Account
          </Link>
        </p>
      </div>
    </>
  );
}
