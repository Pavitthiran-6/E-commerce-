import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute() {
  const location = useLocation();
  // Replace this with actual auth check later
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoggedIn) {
    // Save the intended destination so we can redirect them back after login
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
