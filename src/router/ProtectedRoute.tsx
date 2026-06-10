import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Guards routes that require authentication.
 *
 * Key rule: We initialise `user` from localStorage synchronously, so by the
 * time React renders this component for the first time the auth state is
 * already known — there is no asynchronous "loading" phase that could cause
 * a spurious redirect.
 *
 * A redirect to /auth/login ONLY happens when localStorage contains no valid
 * auth_user entry (i.e. the user is genuinely not logged in).  A Render cold
 * start, a 5xx response, or a network error will NOT clear localStorage, so
 * the user will never be redirected to the login page just because the server
 * was slow.
 */
export default function ProtectedRoute() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    // Persist the intended destination so we can redirect back after login
    localStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
