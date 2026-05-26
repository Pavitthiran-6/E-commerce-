import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function GuestRoute() {
  // Replace this with actual auth check later
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
