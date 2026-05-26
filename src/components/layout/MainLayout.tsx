import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col font-body-md">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
