import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyRegistration, resendRegistrationOtp } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

export default function VerifyRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Timer state (15 minutes = 900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);
  
  const email = location.state?.email;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!email) {
      showToast('Session expired or invalid email context. Please register again.', 'error');
      navigate('/auth/signup');
    }
  }, [email, navigate, showToast]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // keep only last digit
    setOtp(newOtp);

    // Focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtp(newOtp);
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      showToast('Please enter the complete 6-digit code.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyRegistration({ email, otp: otpValue });
      showToast('Email verified successfully! Welcome to BELLEDONNE.', 'success');

      // Unpack response: { accessToken, refreshToken, user: userData }
      const { accessToken, refreshToken, user: userData } = response.data;
      const loggedInUser = { ...userData, token: accessToken, refreshToken };

      // Persist authentication state in localStorage and notify AuthProvider via CustomEvent
      localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
      window.dispatchEvent(new CustomEvent('auth:update', { detail: loggedInUser }));
      window.dispatchEvent(new CustomEvent('belledonne:login'));

      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Verification failed. Please check the code.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || isResending) return;
    setIsResending(true);
    try {
      await resendRegistrationOtp(email);
      showToast('New verification code sent to your email!', 'success');
      setTimeLeft(900); // Reset timer to 15 minutes
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to resend code.';
      showToast(message, 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-headline-display text-3xl text-primary tracking-wide mb-2">Verify Your Email</h1>
        <p className="font-body-md text-on-surface-variant">
          We have sent a 6-digit verification code to <span className="font-semibold text-primary">{email}</span>.
        </p>
      </div>

      <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2 sm:gap-4">
          {otp.map((data, index) => (
            <input
              ref={el => { inputRefs.current[index] = el; }}
              className="w-10 h-12 sm:w-12 sm:h-14 border border-outline-variant/50 text-center text-lg focus:outline-none focus:border-primary transition-colors bg-transparent rounded-sm font-semibold"
              type="text"
              name="otp"
              maxLength={1}
              key={index}
              value={data}
              onChange={e => handleChange(e, index)}
              onFocus={e => e.target.select()}
              onKeyDown={e => handleKeyDown(e, index)}
              onPaste={handlePaste}
              required
            />
          ))}
        </div>

        <div className="text-center">
          <p className="font-body-sm text-on-surface-variant mb-2">
            Code expires in: <span className="font-mono text-primary font-semibold">{formatTime(timeLeft)}</span>
          </p>
          {timeLeft === 0 && (
            <p className="text-red-500 text-xs">The OTP code has expired. Please request a new one.</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isLoading || timeLeft === 0}
          className="w-full bg-primary text-white font-button text-button uppercase py-4 mt-2 hover:bg-primary/90 transition-colors duration-400 ease-in-out tracking-[0.1em] flex justify-center items-center h-14 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Verify & Sign In'
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-outline-variant/30 pt-6">
        <p className="font-body-sm text-on-surface-variant">
          Didn't receive the code?{' '}
          <button 
            type="button"
            onClick={handleResend}
            disabled={timeLeft > 0 || isResending}
            className="text-primary hover:text-primary/70 font-semibold underline underline-offset-4 decoration-outline-variant transition-colors disabled:opacity-50 disabled:no-underline disabled:cursor-default"
          >
            {isResending ? 'Sending...' : timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Resend Code'}
          </button>
        </p>
      </div>
    </>
  );
}
