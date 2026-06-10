import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser, googleLogin } from '../services/authService';
import { useToast } from './ToastContext';
import { extractNameFromEmail } from '../utils/extractNameFromEmail';
import axiosInstance, { isTokenExpired } from '../api/axiosInstance';

interface AuthUser {
  id?: string;
  name: string;
  email: string;
  token: string;
  refreshToken?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
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
    // Must have at minimum a token and an email to be considered valid
    if (parsed && parsed.token && parsed.email) return parsed as AuthUser;
    return null;
  } catch {
    // Corrupted storage — remove and start fresh, but do NOT dispatch logout
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Initialise from localStorage immediately — no flicker on page refresh
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  // Track whether we have already run the startup validation this session
  const validationRanRef = useRef(false);

  // ── Cross-tab sync: re-hydrate when another tab logs in or out ───────────
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

  // ── Same-tab sync: react to events fired by the Axios interceptor ────────
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setUser(customEvent.detail as AuthUser);
      }
    };
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:update', handleUpdate);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:update', handleUpdate);
    };
  }, []);

  // ── Startup token validation ──────────────────────────────────────────────
  //
  // Rules:
  //   ✅ Logout when: server explicitly returns 401 (token definitively invalid)
  //   ❌ Do NOT logout on:
  //       - Token is still valid locally (skip the network call entirely)
  //       - 500, 502, 503, 504 (server/infra issue — Render cold start etc.)
  //       - Network error / timeout (user may be offline)
  //       - Any non-401 error
  //
  // We also skip this check if we already ran it during this session, to
  // avoid unnecessary requests on every strict-mode double-mount in dev.
  useEffect(() => {
    const storedUser = readStoredUser();
    if (!storedUser?.token) return;
    if (validationRanRef.current) return;
    validationRanRef.current = true;

    // If the token is not yet expired locally, skip the network round-trip
    // entirely — the interceptor will handle proactive refresh on the next
    // real API call.
    if (!isTokenExpired(storedUser.token)) return;

    let cancelled = false;

    const validateWithServer = async () => {
      try {
        // A lightweight endpoint; the interceptor will proactively refresh
        // an expired token before this request hits the wire.
        await axiosInstance.get('/api/user/profile');
      } catch (err: any) {
        if (cancelled) return;

        const status: number | undefined = err?.response?.status;

        if (status === 401) {
          // Server explicitly rejected the token — session is over
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
          return;
        }

        // 403, 5xx, network errors, timeouts → keep the session alive.
        // The server may be sleeping (Render cold start) or the user may
        // be briefly offline.  A valid token should survive infra hiccups.
        console.warn(
          '[Auth] Startup validation failed with non-401 status — keeping session alive.',
          status ?? 'network error'
        );
      }
    };

    validateWithServer();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await loginUser({ email, password });
      const { accessToken, refreshToken, user: userData } = response.data;

      // Guard: if refreshToken is missing, the session will not auto-refresh.
      // Root cause is usually @JsonIgnore on AuthResponse.refreshToken — check backend.
      if (!refreshToken) {
        console.error(
          '[Auth] ⚠️ Login response is missing refreshToken. ' +
          'Ensure @JsonIgnore is NOT present on AuthResponse.refreshToken in the backend. ' +
          'User will be logged out when the access token expires.'
        );
      }

      const loggedInUser: AuthUser = {
        ...userData,
        id: userData?.id ? String(userData.id) : undefined,
        token: accessToken,
        refreshToken,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      window.dispatchEvent(new CustomEvent('belledonne:login'));
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

  // ── Login with Google ──────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async (idToken: string) => {
    try {
      const response = await googleLogin(idToken);
      const { accessToken, refreshToken, user: userData } = response.data;

      // Guard: same as above — refreshToken must be present for auto-refresh to work.
      if (!refreshToken) {
        console.error(
          '[Auth] ⚠️ Google login response is missing refreshToken. ' +
          'Ensure @JsonIgnore is NOT present on AuthResponse.refreshToken in the backend.'
        );
      }

      const loggedInUser: AuthUser = {
        ...userData,
        id: userData?.id ? String(userData.id) : undefined,
        token: accessToken,
        refreshToken,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      window.dispatchEvent(new CustomEvent('belledonne:login'));
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
      const message = error.response?.data?.message || 'Google login failed. Please try again.';
      showToast(message, 'error');
      throw error;
    }
  }, [navigate, showToast]);

  // ── Logout ────────────────────────────────────────────────────────────────
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
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, isLoggedIn, userInitial, userName }}>
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
