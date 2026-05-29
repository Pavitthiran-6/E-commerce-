import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const email = location.state?.email;
  const source = location.state?.source;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!email) {
      navigate('/auth/login');
    }
  }, [email, navigate]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && e.currentTarget.previousSibling) {
        (e.currentTarget.previousSibling as HTMLInputElement).focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return;

    setIsLoading(true);
    try {
      await verifyOTP({ email, otp: otpValue });
      showToast('Email verified successfully!', 'success');
      
      if (source === 'forgot_password') {
        navigate('/auth/reset-password', { state: { email, otp: otpValue } });
      } else {
        navigate('/auth/login');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid OTP.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-headline-display text-3xl text-primary tracking-wide mb-2">Verify Email</h1>
        <p className="font-body-md text-on-surface-variant">We've sent a 6-digit code to your email.</p>
      </div>

      <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2 sm:gap-4">
          {otp.map((data, index) => {
            return (
              <input
                className="w-10 h-12 sm:w-12 sm:h-14 border border-outline-variant/50 text-center text-lg focus:outline-none focus:border-primary transition-colors bg-transparent rounded-sm"
                type="text"
                name="otp"
                maxLength={1}
                key={index}
                value={data}
                onChange={e => handleChange(e.target, index)}
                onFocus={e => e.target.select()}
                onKeyDown={e => handleKeyDown(e, index)}
                required
              />
            );
          })}
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-primary text-white font-button text-button uppercase py-4 mt-2 hover:bg-primary/90 transition-colors duration-400 ease-in-out tracking-[0.1em] flex justify-center items-center h-14 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Confirm'
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-outline-variant/30 pt-6">
        <p className="font-body-sm text-on-surface-variant">
          Didn't receive the code?{' '}
          <button className="text-primary hover:text-primary/70 font-semibold underline underline-offset-4 decoration-outline-variant transition-colors">
            Resend
          </button>
        </p>
      </div>
    </>
  );
}
