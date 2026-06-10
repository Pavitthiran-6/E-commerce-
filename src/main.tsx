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

console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
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
