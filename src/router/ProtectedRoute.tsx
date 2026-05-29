import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    // Save the intended destination so we can redirect them back after login
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
