import { useEffect } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Collection from './pages/Collection';
import Contact from './pages/Contact';
import About from './pages/About';
import Product from './pages/Product';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOTP from './pages/auth/VerifyOTP';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/profile/Profile';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import CheckoutAddress from './pages/checkout/Address';
import CheckoutPayment from './pages/checkout/Payment';
import CheckoutConfirmation from './pages/checkout/Confirmation';
import TrackOrder from './pages/TrackOrder';
import NotFound from './pages/NotFound';

import FAQ from './pages/policies/FAQ';
import PrivacyPolicy from './pages/policies/PrivacyPolicy';
import Terms from './pages/policies/Terms';
import ShippingPolicy from './pages/policies/ShippingPolicy';
import ReturnRefundPolicy from './pages/policies/ReturnRefundPolicy';

import Sale from './pages/Sale';
import NewArrivals from './pages/NewArrivals';
import ComingSoon from './pages/ComingSoon';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageProducts from './pages/admin/ManageProducts';
import AddProduct from './pages/admin/AddProduct';
import EditProduct from './pages/admin/EditProduct';
import ManageCoupons from './pages/admin/ManageCoupons';
import ManageOrders from './pages/admin/ManageOrders';
import ManageUsers from './pages/admin/ManageUsers';
import ManageNewArrivals from './pages/admin/ManageNewArrivals';
import ManageSales from './pages/admin/ManageSales';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// ⛔ Protects admin routes — redirects non-admins to home
function AdminRoute() {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  // Backend returns role as 'ROLE_ADMIN' (from Java enum .name())
  if (user?.role !== 'ROLE_ADMIN') return <Navigate to="/" replace />;
  return <Outlet />;
}

function Layout() {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col font-body-md">
      <ScrollToTop />
      <Routes>
        {/* Standalone Route for Coming Soon */}
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/pages/coming-soon/index.html" element={<ComingSoon />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<CheckoutAddress />} />
          <Route path="/checkout/payment" element={<CheckoutPayment />} />
          <Route path="/checkout/confirmation" element={<CheckoutConfirmation />} />

          <Route path="/faq" element={<FAQ />} />
          <Route path="/policies/faq" element={<FAQ />} />
          <Route path="/policies/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/policies/terms-and-conditions" element={<Terms />} />
          <Route path="/policies/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/policies/return-refund-policy" element={<ReturnRefundPolicy />} />
          <Route path="/pages/policies/return-refund-policy.html" element={<ReturnRefundPolicy />} />

          {/* New Pages */}
          <Route path="/sale" element={<Sale />} />
          <Route path="/pages/sale/index.html" element={<Sale />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/pages/new-arrivals/index.html" element={<NewArrivals />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/pages/track-order/index.html" element={<TrackOrder />} />

        </Route>

        {/* Admin Panel — protected by AdminRoute */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
