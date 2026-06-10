import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, CartProvider, WishlistProvider, ToastProvider } from './context'
import { SmoothScrollProvider } from './context/SmoothScrollProvider'
import AppRouter from './router/AppRouter'
import ScrollToTop from './components/common/ScrollToTop'
import { ErrorBoundary } from './ErrorBoundary'
import './index.css'

//console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '692370832248-4k20n2rn4gt39bjj0gcq81g36h9gnk0p.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <SmoothScrollProvider>
                    <ScrollToTop />
                    <AppRouter />
                  </SmoothScrollProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
