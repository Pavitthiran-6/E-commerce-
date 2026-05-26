import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, CartProvider, WishlistProvider, ToastProvider } from './context'
import { SmoothScrollProvider } from './context/SmoothScrollProvider'
import AppRouter from './router/AppRouter'
import ScrollToTop from './components/common/ScrollToTop'
import { ErrorBoundary } from './ErrorBoundary'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
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
    </ErrorBoundary>
  </StrictMode>,
)
