import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingButton } from '../../components/LoadingButton';
import { registerUser } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

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
  const { showToast } = useToast();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters and include a symbol, number, uppercase, and lowercase letter.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await registerUser({
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
        phone
      });
      showToast('Verification code sent! Please verify your email.', 'success');
      navigate('/auth/verify-registration', { state: { email } });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create account.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
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
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
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
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-b-2 border-outline-variant/50 pb-2 text-sm focus:outline-none focus:border-primary transition-colors bg-transparent placeholder-on-surface-variant/50"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="font-label-caps text-xs text-primary uppercase tracking-widest">
            Phone Number
          </label>
          <input 
            id="phone" 
            type="tel" 
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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

      <div className="mt-8 text-center border-t border-outline-variant/30 pt-6">
        <p className="font-body-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary/70 font-semibold underline underline-offset-4 decoration-outline-variant transition-colors">
            Log In
          </Link>
        </p>
      </div>
    </>
  );
}
