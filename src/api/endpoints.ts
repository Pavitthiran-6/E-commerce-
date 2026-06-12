export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  GOOGLE_LOGIN: '/api/auth/google',
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
  CANCEL_WITH_REFUND: (id: string) => `/api/orders/${id}/cancel-with-refund`,
  RETURN_ORDER: (id: string) => `/api/orders/${id}/return`,
  REFUND_STATUS: (id: string) => `/api/orders/${id}/refund-status`,

  // Payments
  CREATE_PAYMENT_ORDER: '/api/payments/create-order',
  VERIFY_PAYMENT: '/api/payments/verify',
  REPORT_PAYMENT_FAILURE: '/api/payments/failure',
  REFUND_PAYMENT: (orderId: string) => `/api/payments/${orderId}/refund`,

  // Order Invoice
  ORDER_INVOICE: (orderId: string) => `/api/orders/${orderId}/invoice`,

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
  SHIPPING_SETTINGS: '/api/sales/shipping/settings',

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

  // Admin Refunds
  ADMIN_REFUND_REQUESTS: '/api/admin/refund-requests',
  ADMIN_REFUND_REQUEST_BY_ID: (id: string) => `/api/admin/refund-requests/${id}`,
  ADMIN_APPROVE_REFUND: (id: string) => `/api/admin/refund-requests/${id}/approve`,
  ADMIN_REJECT_REFUND: (id: string) => `/api/admin/refund-requests/${id}/reject`,
  ADMIN_RETRY_REFUND: (id: string) => `/api/admin/refund-requests/${id}/retry`,
  ADMIN_MARK_REFUND_PAID: (id: string) => `/api/admin/refund-requests/${id}/mark-paid`,
  ADMIN_APPROVE_RETURN: (id: string) => `/api/admin/refund-requests/${id}/approve-return`,
  ADMIN_SCHEDULE_RETURN_PICKUP: (id: string) => `/api/admin/refund-requests/${id}/schedule-return-pickup`,
  ADMIN_MARK_RETURNED: (id: string) => `/api/admin/refund-requests/${id}/mark-returned`,
  ADMIN_PROCESS_REFUND: (id: string) => `/api/admin/refund-requests/${id}/process-refund`,
  ADMIN_REQUEST_PAYOUT_DETAILS: (id: string) => `/api/admin/refund-requests/${id}/request-payout-details`,
  ADMIN_UPDATE_ORDER_STATUS: (id: string) => `/api/admin/orders/${id}/status`,
  ADMIN_INVENTORY: '/api/admin/inventory',
  ADMIN_INVENTORY_ADJUST: '/api/admin/inventory/adjust',
  ADMIN_INVENTORY_REPORTS: '/api/admin/inventory/reports',
  ADMIN_INVENTORY_HISTORY: '/api/admin/inventory/history',

  // Shiprocket Logistics and Shipping Settings
  ADMIN_SHIPPING_SETTINGS: '/api/admin/shipping/settings',
  ADMIN_CREATE_SHIPMENT: (id: string) => `/api/admin/orders/${id}/create-shipment`,
  ADMIN_REQUEST_PICKUP: (id: string) => `/api/admin/orders/${id}/request-pickup`,
  ADMIN_CANCEL_SHIPMENT: (id: string) => `/api/admin/orders/${id}/cancel-shipment`,
  ADMIN_TRACK_SHIPMENT: (id: string) => `/api/admin/orders/${id}/track`,
};
