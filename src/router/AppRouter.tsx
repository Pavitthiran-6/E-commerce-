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

// ----------------------------------------------------------------------
// Lazy Loaded Pages
// ----------------------------------------------------------------------

// Public Pages
const Home = React.lazy(() => import('../pages/Home'));
const Collection = React.lazy(() => import('../pages/Collection'));
const Product = React.lazy(() => import('../pages/Product'));
const Cart = React.lazy(() => import('../pages/Cart'));
const Wishlist = React.lazy(() => import('../pages/Wishlist'));
const Sale = React.lazy(() => import('../pages/Sale'));
const NewArrivals = React.lazy(() => import('../pages/NewArrivals'));
const About = React.lazy(() => import('../pages/About'));
const Contact = React.lazy(() => import('../pages/Contact'));
const ComingSoon = React.lazy(() => import('../pages/ComingSoon'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

// Auth Pages
const Login = React.lazy(() => import('../pages/auth/Login'));
const Signup = React.lazy(() => import('../pages/auth/Signup'));
const ForgotPassword = React.lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../pages/auth/ResetPassword'));
const VerifyOTP = React.lazy(() => import('../pages/auth/VerifyOTP'));

// Checkout Pages
const Address = React.lazy(() => import('../pages/checkout/Address'));
const Payment = React.lazy(() => import('../pages/checkout/Payment'));
const Confirmation = React.lazy(() => import('../pages/checkout/Confirmation'));

// Profile Pages
const Profile = React.lazy(() => import('../pages/profile/Profile'));
const ProfileDetails = React.lazy(() => import('../pages/profile/ProfileDetails'));
const ProfileOrders = React.lazy(() => import('../pages/profile/ProfileOrders'));
const ProfileAddresses = React.lazy(() => import('../pages/profile/ProfileAddresses'));
const ProfileWishlist = React.lazy(() => import('../pages/profile/ProfileWishlist'));
const ProfilePassword = React.lazy(() => import('../pages/profile/ProfilePassword'));
const TrackOrder = React.lazy(() => import('../pages/TrackOrder'));

// Policy Pages
const FAQ = React.lazy(() => import('../pages/policies/FAQ'));
const PrivacyPolicy = React.lazy(() => import('../pages/policies/PrivacyPolicy'));
const ReturnRefundPolicy = React.lazy(() => import('../pages/policies/ReturnRefundPolicy'));
const ShippingPolicy = React.lazy(() => import('../pages/policies/ShippingPolicy'));
const Terms = React.lazy(() => import('../pages/policies/Terms'));

// Admin Pages
const AdminLayout = React.lazy(() => import('../pages/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const ManageProducts = React.lazy(() => import('../pages/admin/ManageProducts'));
const AddProduct = React.lazy(() => import('../pages/admin/AddProduct'));
const EditProduct = React.lazy(() => import('../pages/admin/EditProduct'));
const ManageCategories = React.lazy(() => import('../pages/admin/ManageCategories'));
const ManageOrders = React.lazy(() => import('../pages/admin/ManageOrders'));
const ManageUsers = React.lazy(() => import('../pages/admin/ManageUsers'));
const ManageCoupons = React.lazy(() => import('../pages/admin/ManageCoupons'));
const ManageNewArrivals = React.lazy(() => import('../pages/admin/ManageNewArrivals'));
const ManageSales = React.lazy(() => import('../pages/admin/ManageSales'));

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
