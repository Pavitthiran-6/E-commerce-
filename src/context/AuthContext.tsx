import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser } from '../services/authService';
import { useToast } from './ToastContext';
import { extractNameFromEmail } from '../utils/extractNameFromEmail';
import axiosInstance from '../api/axiosInstance';

interface AuthUser {
  id?: string;
  name: string;
  email: string;
  token: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  userInitial: string;
  userName: string;
}

const AUTH_STORAGE_KEY = 'auth_user';

/** Safely parse the stored user from localStorage — never throws. */
function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Sanity check: must have at minimum a token and an email
    if (parsed && parsed.token && parsed.email) return parsed as AuthUser;
    return null;
  } catch {
    // Corrupted — remove and start fresh
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // ── Initialise from localStorage immediately (no flicker / redirect on refresh) ──
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  // ── Re-hydrate whenever another tab logs in/out ──────────────────────────────
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        const next = readStoredUser();
        setUser(next);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Validate stored token on startup ─────────────────────────────────────────
  // We only clear the session if the server explicitly returns 401 (invalid/expired
  // token).  A network outage or 5xx should NOT log the user out.
  useEffect(() => {
    if (!user?.token) return;

    let cancelled = false;

    const validate = async () => {
      // If we're in mock mode, skip server validation — the mock is always "valid"
      if (sessionStorage.getItem('belledonne_backend_unreachable') === 'true') return;

      try {
        await axiosInstance.get('/api/user/profile');
      } catch (err: any) {
        if (cancelled) return;
        // Only log out on definitive auth rejection, not on network errors
        if (err.response?.status === 401) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
        }
        // 403, 5xx, network errors → keep the session alive
      }
    };

    validate();
    return () => { cancelled = true; };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await loginUser({ email, password });
      const { accessToken, user: userData } = response.data;

      const loggedInUser: AuthUser = { ...userData, token: accessToken };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      showToast('Welcome back! 👋', 'success');

      const redirectPath = localStorage.getItem('redirectAfterLogin');
      localStorage.removeItem('redirectAfterLogin');

      if (redirectPath) {
        navigate(redirectPath);
      } else if (loggedInUser.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      showToast(message, 'error');
      throw error;
    }
  }, [navigate, showToast]);

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      navigate('/auth/login');
      showToast('Logged out successfully', 'info');
    }
  }, [navigate, showToast]);

  const isLoggedIn = !!user;
  const userName = user?.email ? extractNameFromEmail(user.email) : '';
  const userInitial = userName
    ? userName.charAt(0).toUpperCase()
    : (user?.email ? user.email.charAt(0).toUpperCase() : '');

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, userInitial, userName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
