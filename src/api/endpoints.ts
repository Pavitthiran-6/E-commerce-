export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_OTP: '/api/auth/verify-otp',

  // Products
  PRODUCTS: '/api/products',
  PRODUCT_BY_ID: (id: string) => `/api/products/${id}`,
  PRODUCTS_BY_CATEGORY: (cat: string) => `/api/products?category=${cat}`,

  // Cart
  CART: '/api/cart',

  // Wishlist
  WISHLIST: '/api/wishlist',

  // Orders
  ORDERS: '/api/orders',
  ORDER_BY_ID: (id: string) => `/api/orders/${id}`,
  CANCEL_ORDER: (id: string) => `/api/orders/${id}/cancel`,
  TRACK_ORDER: (id: string) => `/api/orders/${id}/track`,

  // Payments
  CREATE_PAYMENT_ORDER: '/api/payments/create-order',
  VERIFY_PAYMENT: '/api/payments/verify',

  // Profile
  PROFILE: '/api/user/profile',
  ADDRESSES: '/api/user/addresses',
  CHANGE_PASSWORD: '/api/user/change-password',

  // Coupons
  COUPONS: '/api/coupons',
  VALIDATE_COUPON: '/api/coupons/validate',

  // Reviews
  REVIEWS: '/api/reviews',
};
