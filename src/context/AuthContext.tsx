import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser } from '../services/authService';
import { useToast } from './ToastContext';
import { extractNameFromEmail } from '../utils/extractNameFromEmail';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string) => {
    try {
      const response = await loginUser({ email, password });
      const { accessToken, user: userData } = response.data;
      
      const loggedInUser = { ...userData, token: accessToken };
      
      localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      showToast('Welcome back! 👋', 'success');
      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      showToast(message, 'error');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      localStorage.removeItem('auth_user');
      setUser(null);
      navigate('/auth/login');
      showToast('Logged out successfully', 'info');
    }
  };

  const isLoggedIn = !!user;
  const userName = user ? extractNameFromEmail(user.email) : '';
  const userInitial = user ? (userName ? userName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()) : '';

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
