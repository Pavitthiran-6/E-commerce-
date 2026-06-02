import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Layouts & Utility Components
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';
import PageLoader from '../components/common/PageLoader';
import ScrollToTop from '../components/common/ScrollToTop';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import { useAuth } from '../context/AuthContext';

const lazyWithRetry = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  componentName?: string
) => {
  return React.lazy(async () => {
    // Generate a unique storage key based on the component's import path to isolate retries
    const name = componentName || importFn.toString();
    const storageKey = `chunk_retry_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;

    try {
      const component = await importFn();
      // On success, clear any previous retry flags for this chunk
      try {
        sessionStorage.removeItem(storageKey);
      } catch (e) {
        // Silently capture storage exceptions (e.g. sandboxed iframe or disabled cookies)
      }
      return component;
    } catch (error) {
      console.error(`[lazyWithRetry] Failed to load dynamic chunk for: ${name}`, error);

      const isChunkError =
        error instanceof TypeError ||
        String(error).includes('Failed to fetch') ||
        String(error).includes('dynamically imported module');

      if (isChunkError) {
        let hasRetried = null;
        try {
          hasRetried = sessionStorage.getItem(storageKey);
        } catch (e) {
          // Silently capture storage exceptions
        }

        if (!hasRetried) {
          console.warn(`[lazyWithRetry] Chunk load failure detected. Forcing page reload to sync assets...`);
          try {
            sessionStorage.setItem(storageKey, 'true');
          } catch (e) {
            // Silently capture storage exceptions
          }
          window.location.reload();
          // Return a pending promise to prevent rendering half-loaded states while reloading
          return new Promise(() => {});
        } else {
          console.error(
            `[lazyWithRetry] Page has already reloaded once for this chunk and still failed. ` +
            `Aborting reload to prevent infinite loop. User action is required.`
          );
        }
      }
      throw error;
    }
  });
};

// ----------------------------------------------------------------------
// Lazy Loaded Pages — Wrapped with Auto-Retry
// ----------------------------------------------------------------------

// Public Pages
const Home = lazyWithRetry(() => import('../pages/Home'));
const Collection = lazyWithRetry(() => import('../pages/Collection'));
const Product = lazyWithRetry(() => import('../pages/Product'));
const Cart = lazyWithRetry(() => import('../pages/Cart'));
const Wishlist = lazyWithRetry(() => import('../pages/Wishlist'));
const Sale = lazyWithRetry(() => import('../pages/Sale'));
const NewArrivals = lazyWithRetry(() => import('../pages/NewArrivals'));
const About = lazyWithRetry(() => import('../pages/About'));
const Contact = lazyWithRetry(() => import('../pages/Contact'));
const ComingSoon = lazyWithRetry(() => import('../pages/ComingSoon'));
const NotFound = lazyWithRetry(() => import('../pages/NotFound'));

// Auth Pages
const Login = lazyWithRetry(() => import('../pages/auth/Login'));
const Signup = lazyWithRetry(() => import('../pages/auth/Signup'));
const ForgotPassword = lazyWithRetry(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('../pages/auth/ResetPassword'));
const VerifyOTP = lazyWithRetry(() => import('../pages/auth/VerifyOTP'));

// Checkout Pages
const Address = lazyWithRetry(() => import('../pages/checkout/Address'));
const Payment = lazyWithRetry(() => import('../pages/checkout/Payment'));
const Confirmation = lazyWithRetry(() => import('../pages/checkout/Confirmation'));

// Profile Pages
const Profile = lazyWithRetry(() => import('../pages/profile/Profile'));
const ProfileDetails = lazyWithRetry(() => import('../pages/profile/ProfileDetails'));
const ProfileOrders = lazyWithRetry(() => import('../pages/profile/ProfileOrders'));
const ProfileAddresses = lazyWithRetry(() => import('../pages/profile/ProfileAddresses'));
const ProfileWishlist = lazyWithRetry(() => import('../pages/profile/ProfileWishlist'));
const ProfilePassword = lazyWithRetry(() => import('../pages/profile/ProfilePassword'));
const TrackOrder = lazyWithRetry(() => import('../pages/TrackOrder'));

// Policy Pages
const FAQ = lazyWithRetry(() => import('../pages/policies/FAQ'));
const PrivacyPolicy = lazyWithRetry(() => import('../pages/policies/PrivacyPolicy'));
const ReturnRefundPolicy = lazyWithRetry(() => import('../pages/policies/ReturnRefundPolicy'));
const ShippingPolicy = lazyWithRetry(() => import('../pages/policies/ShippingPolicy'));
const Terms = lazyWithRetry(() => import('../pages/policies/Terms'));

// Admin Pages
const AdminLayout = lazyWithRetry(() => import('../pages/admin/AdminLayout'));
const AdminDashboard = lazyWithRetry(() => import('../pages/admin/AdminDashboard'));
const ManageProducts = lazyWithRetry(() => import('../pages/admin/ManageProducts'));
const AddProduct = lazyWithRetry(() => import('../pages/admin/AddProduct'));
const EditProduct = lazyWithRetry(() => import('../pages/admin/EditProduct'));
const ManageCategories = lazyWithRetry(() => import('../pages/admin/ManageCategories'));
const ManageOrders = lazyWithRetry(() => import('../pages/admin/ManageOrders'));
const ManageUsers = lazyWithRetry(() => import('../pages/admin/ManageUsers'));
const ManageCoupons = lazyWithRetry(() => import('../pages/admin/ManageCoupons'));
const ManageNewArrivals = lazyWithRetry(() => import('../pages/admin/ManageNewArrivals'));
const ManageSales = lazyWithRetry(() => import('../pages/admin/ManageSales'));

// ----------------------------------------------------------------------

// ⛔ Protects admin routes — redirects non-admins to home
function AdminRoute() {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/auth/login" replace />;
  if (user?.role !== 'ROLE_ADMIN') return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          
          {/* STANDALONE ROUTES (No Layout) */}
          <Route path="/coming-soon" element={<ComingSoon />} />
          
          {/* AUTH ROUTES (Guest Only) */}
          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/verify-otp" element={<VerifyOTP />} />
              
              {/* Backwards compatibility / root-level paths */}
              <Route path="/login" element={<Navigate to="/auth/login" replace />} />
              <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
              <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
              <Route path="/reset-password" element={<Navigate to="/auth/reset-password" replace />} />
              <Route path="/verify-otp" element={<Navigate to="/auth/verify-otp" replace />} />
            </Route>
          </Route>

          {/* MAIN LAYOUT ROUTES */}
          <Route element={<MainLayout />}>
            
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/search" element={<Collection />} />
            <Route path="/product/:productId" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/sale" element={<Sale />} />
            <Route path="/new-arrivals" element={<NewArrivals />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Policy Routes */}
            <Route path="/policies/faq" element={<FAQ />} />
            <Route path="/policies/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/policies/return-refund" element={<ReturnRefundPolicy />} />
            <Route path="/policies/shipping" element={<ShippingPolicy />} />
            <Route path="/policies/terms" element={<Terms />} />

            {/* PROTECTED ROUTES (Login Required) */}
            <Route element={<ProtectedRoute />}>
              
              {/* Checkout Flow */}
              <Route path="/checkout" element={<Navigate to="/checkout/address" replace />} />
              <Route path="/checkout/address" element={<Address />} />
              <Route path="/checkout/payment" element={<Payment />} />
              <Route path="/checkout/confirmation" element={<Confirmation />} />

              {/* Order Tracking */}
              <Route path="/track-order/:orderId" element={<TrackOrder />} />

              {/* Profile Nested Routes */}
              <Route path="/profile" element={<Profile />}>
                <Route index element={<Navigate to="/profile/details" replace />} />
                <Route path="details" element={<ProfileDetails />} />
                <Route path="orders" element={<ProfileOrders />} />
                <Route path="addresses" element={<ProfileAddresses />} />
                <Route path="wishlist" element={<ProfileWishlist />} />
                <Route path="password" element={<ProfilePassword />} />
              </Route>

            </Route>
          </Route>

          {/* ADMIN ROUTES */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/categories" element={<ManageCategories />} />
              <Route path="/admin/products" element={<ManageProducts />} />
              <Route path="/admin/products/add" element={<AddProduct />} />
              <Route path="/admin/products/edit/:id" element={<EditProduct />} />
              <Route path="/admin/orders" element={<ManageOrders />} />
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/coupons" element={<ManageCoupons />} />
              <Route path="/admin/new-arrivals" element={<ManageNewArrivals />} />
              <Route path="/admin/sales" element={<ManageSales />} />
            </Route>
          </Route>

          {/* CATCH ALL (404) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
