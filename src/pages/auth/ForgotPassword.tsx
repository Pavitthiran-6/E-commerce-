import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingButton } from '../../components/LoadingButton';
import { forgotPassword } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await forgotPassword(email);
      showToast('OTP sent to your email!', 'success');
      navigate('/auth/verify-otp', { state: { email, source: 'forgot_password' } });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to send OTP.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full min-h-[80vh] flex flex-col items-center justify-center pt-32 pb-24 px-6">
      <div className="w-full max-w-md bg-white border border-outline-variant/30 p-8 md:p-12 shadow-sm rounded-sm">
        <div className="text-center mb-10">
          <h1 className="font-headline-display text-3xl text-primary tracking-wide mb-2">Reset Password</h1>
          <p className="font-body-md text-on-surface-variant">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
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

          <LoadingButton 
            type="submit" 
            loading={isLoading}
            className="w-full bg-primary text-white font-button text-button uppercase py-4 mt-4 hover:bg-primary/90 transition-colors duration-400 ease-in-out tracking-[0.1em] flex justify-center items-center h-14"
          >
            Send Reset Link
          </LoadingButton>
        </form>

        <div className="mt-8 text-center border-t border-outline-variant/30 pt-8">
          <p className="font-body-sm text-on-surface-variant">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary hover:text-primary/70 font-semibold underline underline-offset-4 decoration-outline-variant transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
