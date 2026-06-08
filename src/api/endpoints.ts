export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_OTP: '/api/auth/verify-otp',
  VERIFY_REGISTRATION: '/api/auth/verify-registration',
  RESEND_REGISTRATION_OTP: '/api/auth/resend-registration-otp',

  // Products
  PRODUCTS: '/api/products',
  PRODUCT_BY_ID: (id: string) => `/api/products/${id}`,
  PRODUCTS_BY_CATEGORY: (cat: string) => `/api/products?category=${cat}`,

  // Cart
  CART: '/api/cart',
  CART_MERGE: '/api/cart/merge',

  // Wishlist
  WISHLIST: '/api/wishlist',
  WISHLIST_MERGE: '/api/wishlist/merge',

  // Orders
  ORDERS: '/api/orders',
  ORDER_BY_ID: (id: string) => `/api/orders/${id}`,
  CANCEL_ORDER: (id: string) => `/api/orders/${id}/cancel`,
  TRACK_ORDER: (id: string) => `/api/orders/${id}/track`,

  // Payments
  CREATE_PAYMENT_ORDER: '/api/payments/create-order',
  VERIFY_PAYMENT: '/api/payments/verify',
  REPORT_PAYMENT_FAILURE: '/api/payments/failure',

  // Profile
  PROFILE: '/api/user/profile',
  ADDRESSES: '/api/user/addresses',
  CHANGE_PASSWORD: '/api/user/change-password',

  // Coupons
  COUPONS: '/api/coupons',
  COUPONS_FEATURED: '/api/coupons/featured',
  VALIDATE_COUPON: '/api/coupons/validate',
  ADMIN_COUPONS_TOGGLE_HOME: (id: number) => `/api/admin/coupons/${id}/toggle-home`,

  // Reviews
  REVIEWS: '/api/reviews',

  // Sale (public)
  SALE_SETTINGS: '/api/sales/settings',
  SALE_DEAL_OF_THE_DAY: '/api/sales/deal-of-the-day',

  // Admin Sale
  ADMIN_SALE_SETTINGS: '/api/admin/sales/settings',
  ADMIN_SALE_DEAL_OF_THE_DAY: '/api/admin/sales/deal-of-the-day',
  ADMIN_PRODUCT_DISCOUNT: (id: string) => `/api/admin/products/${id}/discount`,
  ADMIN_PRODUCTS_ALL: '/api/products',

  // Hero (public)
  HERO: '/api/hero',
  // Admin Hero
  ADMIN_HERO: '/api/admin/hero',
  ADMIN_HERO_DELETE_CARD: (id: number | string) => `/api/admin/hero/cards/${id}`,

  // Search Analytics & Synonyms
  SEARCH_TRENDING: '/api/search/trending',
  SYNONYMS: '/api/synonyms',
  ADMIN_SYNONYMS: '/api/admin/synonyms',
  ADMIN_SYNONYM_BY_ID: (id: number | string) => `/api/admin/synonyms/${id}`,
};
