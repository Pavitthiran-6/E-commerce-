import { mockProducts } from '../data/products';

// Helper to get/set localStorage items with key prefixes
const getStored = (key: string, defaultValue: any) => {
  const item = localStorage.getItem(`belledonne_mock_${key}`);
  if (!item) {
    localStorage.setItem(`belledonne_mock_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
};

const setStored = (key: string, value: any) => {
  localStorage.setItem(`belledonne_mock_${key}`, JSON.stringify(value));
};

// Initialize mock products in localStorage if not set
getStored('products', mockProducts);

export const handleMockRequest = async (config: any): Promise<any> => {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  
  // Extract path and clean up query string
  // url could be "/api/products" or "http://localhost:8080/api/products" or "https://api.belledonne.in/api/products"
  const cleanUrl = url.replace(/^https?:\/\/[^\/]+/, '');
  const [path, queryString] = cleanUrl.split('?');
  
  // Helper to parse query parameters
  const queryParams: Record<string, string> = {};
  if (queryString) {
    queryString.split('&').forEach((param: string) => {
      const [key, val] = param.split('=');
      queryParams[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });
  }
  
  // Let's get updated products list from localStorage
  const productsList = getStored('products', mockProducts);

  // Delay a bit to simulate real server response
  await new Promise(resolve => setTimeout(resolve, 300));

  // 1. PRODUCTS
  if (path === '/api/products') {
    if (method === 'get') {
      let filtered = [...productsList];
      
      // Filter by category
      if (queryParams.category) {
        filtered = filtered.filter((p: any) => p.category?.toLowerCase() === queryParams.category.toLowerCase());
      }
      
      // Filter by search
      if (queryParams.q) {
        const query = queryParams.q.toLowerCase();
        filtered = filtered.filter((p: any) => 
          p.name?.toLowerCase().includes(query) || 
          p.brand?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(query))
        );
      }
      
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: {
            content: filtered,
            totalPages: 1,
            totalElements: filtered.length
          }
        },
        headers: {},
        config
      };
    }
  }

  // 2. FEATURED PRODUCTS
  if (path === '/api/products/featured') {
    if (method === 'get') {
      const filtered = productsList.filter((p: any) => p.isBestseller);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: {
            content: filtered
          }
        },
        headers: {},
        config
      };
    }
  }

  // 3. NEW ARRIVALS PRODUCTS
  if (path === '/api/products/new-arrivals') {
    if (method === 'get') {
      const filtered = productsList.filter((p: any) => p.isNew || p.arrivalTag);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: {
            content: filtered
          }
        },
        headers: {},
        config
      };
    }
  }

  // 4. SALE PRODUCTS
  if (path === '/api/products/sale') {
    if (method === 'get') {
      const filtered = productsList.filter((p: any) => p.discount > 0);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: {
            content: filtered
          }
        },
        headers: {},
        config
      };
    }
  }

  // 5. SEARCH PRODUCTS
  if (path.startsWith('/api/products/search')) {
    if (method === 'get') {
      const query = (queryParams.q || '').toLowerCase();
      const filtered = productsList.filter((p: any) => 
        p.name?.toLowerCase().includes(query) || 
        p.brand?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: {
            content: filtered
          }
        },
        headers: {},
        config
      };
    }
  }

  // 6. PRODUCT BY ID
  // e.g. /api/products/bo-velcro
  const productMatch = path.match(/^\/api\/products\/([^\/]+)$/);
  if (productMatch) {
    const productId = productMatch[1];
    const product = productsList.find((p: any) => p.id === productId);
    if (product) {
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: product
        },
        headers: {},
        config
      };
    } else {
      return Promise.reject({
        response: {
          status: 404,
          data: { message: 'Product not found' }
        }
      });
    }
  }

  // 7. ADMIN UPDATE PRODUCT ARRIVAL TAG
  // /api/admin/products/:id/arrival-tag
  const arrivalTagMatch = path.match(/^\/api\/admin\/products\/([^\/]+)\/arrival-tag$/);
  if (arrivalTagMatch) {
    if (method === 'put') {
      const productId = arrivalTagMatch[1];
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const tag = payload?.arrivalTag || null;
      
      const updatedList = productsList.map((p: any) => {
        if (p.id === productId) {
          return { ...p, arrivalTag: tag };
        }
        return p;
      });
      setStored('products', updatedList);
      
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: updatedList.find((p: any) => p.id === productId)
        },
        headers: {},
        config
      };
    }
  }

  // 8. AUTH ROUTING
  if (path === '/api/auth/login') {
    const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const email = payload?.email || 'demo@example.com';
    const mockUser = {
      token: 'mock-jwt-token-xyz',
      id: '1',
      name: 'Demo User',
      email: email,
      phone: '+1234567890',
      role: email.includes('admin') ? 'ROLE_ADMIN' : 'ROLE_USER'
    };
    return {
      status: 200,
      statusText: 'OK',
      data: {
        data: mockUser
      },
      headers: {},
      config
    };
  }

  if (path === '/api/auth/register' || path === '/api/auth/verify-otp' || path === '/api/auth/forgot-password' || path === '/api/auth/reset-password') {
    return {
      status: 200,
      statusText: 'OK',
      data: {
        message: 'Mock response successful'
      },
      headers: {},
      config
    };
  }

  if (path === '/api/auth/logout') {
    return {
      status: 200,
      statusText: 'OK',
      data: {
        message: 'Logout successful'
      },
      headers: {},
      config
    };
  }

  // 9. CART
  if (path === '/api/cart') {
    if (method === 'get') {
      const cart = getStored('cart', { cartId: 'mock-cart-1', items: [], subtotal: 0, itemCount: 0 });
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: cart
        },
        headers: {},
        config
      };
    }
  }

  if (path === '/api/cart/add') {
    if (method === 'post') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const { productId, quantity } = payload;
      const product = productsList.find((p: any) => p.id === productId);
      
      const cart = getStored('cart', { cartId: 'mock-cart-1', items: [], subtotal: 0, itemCount: 0 });
      
      // Check if item already in cart
      const existingItem = cart.items.find((item: any) => item.productId === productId);
      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
      } else if (product) {
        cart.items.push({
          id: Math.floor(Math.random() * 10000),
          productId: product.id,
          productName: product.name,
          productImage: product.images?.[0] || product.image || '',
          size: product.sizes?.[0] || 'Standard',
          color: product.colors?.[0] || 'Standard',
          unitPrice: product.price,
          quantity: quantity,
          totalPrice: product.price * quantity
        });
      }
      
      // Update totals
      cart.subtotal = cart.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      cart.itemCount = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      
      setStored('cart', cart);
      
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: cart
        },
        headers: {},
        config
      };
    }
  }

  if (path.startsWith('/api/cart/update/')) {
    if (method === 'put') {
      const itemId = parseInt(path.split('/').pop() || '0');
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const { quantity } = payload;
      
      const cart = getStored('cart', { cartId: 'mock-cart-1', items: [], subtotal: 0, itemCount: 0 });
      const item = cart.items.find((i: any) => i.id === itemId);
      if (item) {
        item.quantity = quantity;
        item.totalPrice = item.quantity * item.unitPrice;
      }
      
      // Update totals
      cart.subtotal = cart.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      cart.itemCount = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      
      setStored('cart', cart);
      
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: cart
        },
        headers: {},
        config
      };
    }
  }

  if (path.startsWith('/api/cart/remove/')) {
    if (method === 'delete') {
      const itemId = parseInt(path.split('/').pop() || '0');
      const cart = getStored('cart', { cartId: 'mock-cart-1', items: [], subtotal: 0, itemCount: 0 });
      cart.items = cart.items.filter((i: any) => i.id !== itemId);
      
      // Update totals
      cart.subtotal = cart.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      cart.itemCount = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      
      setStored('cart', cart);
      
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: cart
        },
        headers: {},
        config
      };
    }
  }

  if (path === '/api/cart/clear') {
    if (method === 'delete') {
      const cart = { cartId: 'mock-cart-1', items: [], subtotal: 0, itemCount: 0 };
      setStored('cart', cart);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: cart
        },
        headers: {},
        config
      };
    }
  }

  if (path === '/api/cart/count') {
    if (method === 'get') {
      const cart = getStored('cart', { cartId: 'mock-cart-1', items: [], subtotal: 0, itemCount: 0 });
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: {
            count: cart.itemCount
          }
        },
        headers: {},
        config
      };
    }
  }

  // 10. WISHLIST
  if (path === '/api/wishlist') {
    if (method === 'get') {
      const wishlist = getStored('wishlist', []);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: wishlist
        },
        headers: {},
        config
      };
    }
  }

  if (path === '/api/wishlist/add') {
    if (method === 'post') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const { productId } = payload;
      const wishlist = getStored('wishlist', []);
      const product = productsList.find((p: any) => p.id === productId);
      
      if (product && !wishlist.some((p: any) => p.id === productId)) {
        wishlist.push(product);
        setStored('wishlist', wishlist);
      }
      
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: wishlist
        },
        headers: {},
        config
      };
    }
  }

  if (path.startsWith('/api/wishlist/remove/')) {
    if (method === 'delete') {
      const productId = path.split('/').pop() || '';
      let wishlist = getStored('wishlist', []);
      wishlist = wishlist.filter((p: any) => p.id !== productId);
      setStored('wishlist', wishlist);
      
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: wishlist
        },
        headers: {},
        config
      };
    }
  }

  if (path.startsWith('/api/wishlist/check/')) {
    if (method === 'get') {
      const productId = path.split('/').pop() || '';
      const wishlist = getStored('wishlist', []);
      const inWishlist = wishlist.some((p: any) => p.id === productId);
      
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: {
            inWishlist
          }
        },
        headers: {},
        config
      };
    }
  }

  if (path === '/api/wishlist/clear') {
    if (method === 'delete') {
      setStored('wishlist', []);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: []
        },
        headers: {},
        config
      };
    }
  }

  // 11. ADDRESSES
  if (path === '/api/user/addresses') {
    if (method === 'get') {
      const addresses = getStored('addresses', [
        {
          id: 1,
          fullName: 'John Doe',
          phone: '+1234567890',
          addressLine1: '123 Avenue des Champs-Élysées',
          addressLine2: 'Apt 4B',
          city: 'Paris',
          state: 'Île-de-France',
          pincode: '75008',
          isDefault: true
        }
      ]);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: addresses
        },
        headers: {},
        config
      };
    }

    if (method === 'post') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const addresses = getStored('addresses', []);
      const newAddress = {
        ...payload,
        id: Math.floor(Math.random() * 10000),
        isDefault: addresses.length === 0
      };
      addresses.push(newAddress);
      setStored('addresses', addresses);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: newAddress
        },
        headers: {},
        config
      };
    }
  }

  if (path.startsWith('/api/user/addresses/')) {
    const addrId = parseInt(path.split('/').pop() || '0');
    const addresses = getStored('addresses', []);
    
    if (method === 'put') {
      if (path.endsWith('/default')) {
        const updated = addresses.map((addr: any) => ({
          ...addr,
          isDefault: addr.id === addrId
        }));
        setStored('addresses', updated);
        return {
          status: 200,
          statusText: 'OK',
          data: {
            data: updated.find((a: any) => a.id === addrId)
          },
          headers: {},
          config
        };
      } else {
        const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        const updated = addresses.map((addr: any) => {
          if (addr.id === addrId) {
            return { ...addr, ...payload };
          }
          return addr;
        });
        setStored('addresses', updated);
        return {
          status: 200,
          statusText: 'OK',
          data: {
            data: updated.find((a: any) => a.id === addrId)
          },
          headers: {},
          config
        };
      }
    }

    if (method === 'delete') {
      const filtered = addresses.filter((a: any) => a.id !== addrId);
      setStored('addresses', filtered);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: true
        },
        headers: {},
        config
      };
    }
  }

  // 12. USER PROFILE
  if (path === '/api/user/profile') {
    if (method === 'get') {
      const profile = getStored('profile', {
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        phone: '+1234567890',
        dateOfBirth: '1995-01-01',
        gender: 'Male'
      });
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: profile
        },
        headers: {},
        config
      };
    }

    if (method === 'put') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const profile = getStored('profile', {});
      const updatedProfile = { ...profile, ...payload };
      setStored('profile', updatedProfile);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: updatedProfile
        },
        headers: {},
        config
      };
    }
  }

  // 13. COUPONS (PUBLIC & ADMIN)
  const mockCouponsList = getStored('coupons_list', [
    {
      id: 1,
      code: 'WELCOME10',
      description: 'On your first order',
      type: 'PERCENTAGE',
      value: 10,
      minCartValue: 999,
      maxDiscount: 300,
      usageLimit: 500,
      usedCount: 12,
      isActive: true,
      showOnHome: true,
      validFrom: null,
      validUntil: null
    },
    {
      id: 2,
      code: 'SUMMER20',
      description: 'Summer special discount',
      type: 'PERCENTAGE',
      value: 20,
      minCartValue: 1499,
      maxDiscount: 500,
      usageLimit: 300,
      usedCount: 45,
      isActive: true,
      showOnHome: true,
      validFrom: null,
      validUntil: null
    },
    {
      id: 3,
      code: 'SAVE500',
      description: 'Flat savings on big carts',
      type: 'FLAT',
      value: 500,
      minCartValue: 5000,
      maxDiscount: null,
      usageLimit: 100,
      usedCount: 8,
      isActive: true,
      showOnHome: true,
      validFrom: null,
      validUntil: null
    }
  ]);

  // Public available list
  if (path === '/api/coupons/available') {
    if (method === 'get') {
      const activeOnly = mockCouponsList
        .filter((c: any) => c.isActive)
        .map((c: any) => ({
          code: c.code,
          description: c.description,
          minOrderValue: c.minCartValue || 0,
          discountType: c.type === 'FLAT' ? 'FIXED' : 'PERCENTAGE',
          discountValue: c.value,
          showOnHome: c.showOnHome
        }));
      return {
        status: 200,
        statusText: 'OK',
        data: { data: activeOnly },
        headers: {},
        config
      };
    }
  }

  // Public featured list
  if (path === '/api/coupons/featured') {
    if (method === 'get') {
      const featured = mockCouponsList
        .filter((c: any) => c.isActive && c.showOnHome)
        .map((c: any) => ({
          code: c.code,
          description: c.description,
          minOrderValue: c.minCartValue || 0,
          discountType: c.type === 'FLAT' ? 'FIXED' : 'PERCENTAGE',
          discountValue: c.value,
          showOnHome: c.showOnHome
        }));
      return {
        status: 200,
        statusText: 'OK',
        data: { data: featured },
        headers: {},
        config
      };
    }
  }

  // Validate coupon (using live mock database)
  if (path === '/api/coupons/validate') {
    if (method === 'post') {
      // Cart validation can pass query params or body fields
      const code = (queryParams.code || '').toUpperCase();
      const cartTotal = parseFloat(queryParams.cartTotal || '0');
      
      const coupon = mockCouponsList.find((c: any) => c.code.toUpperCase() === code);
      if (!coupon) {
        return Promise.reject({
          response: { status: 400, data: { message: 'Coupon code not found.' } }
        });
      }

      // Check if this coupon has already been used by the current user (one-time rule)
      const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      if (currentUser && (currentUser.email || currentUser.id)) {
        const orders = getStored('orders', []);
        const hasUsed = orders.some((o: any) => 
          (o.userId === currentUser.id || o.userEmail === currentUser.email || o.user?.email === currentUser.email) &&
          o.couponCode?.toUpperCase() === code &&
          o.status?.toLowerCase() !== 'cancelled'
        );
        if (hasUsed) {
          return Promise.reject({
            response: { status: 400, data: { message: `You have already used this coupon code '${code}' once.` } }
          });
        }
      }

      if (!coupon.isActive) {
        return Promise.reject({
          response: { status: 400, data: { message: 'This coupon is not available.' } }
        });
      }

      if (coupon.minCartValue && cartTotal < coupon.minCartValue) {
        return Promise.reject({
          response: { status: 400, data: { message: `Minimum order value is ₹${coupon.minCartValue} for this coupon.` } }
        });
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return Promise.reject({
          response: { status: 400, data: { message: 'This coupon has reached its usage limit.' } }
        });
      }

      let discount = 0;
      if (coupon.type === 'PERCENTAGE') {
        discount = (cartTotal * coupon.value) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.value;
      }
      discount = Math.min(discount, cartTotal);

      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: {
            valid: true,
            discountAmount: discount,
            message: `Coupon applied! You save ₹${discount}`,
            coupon: {
              code: coupon.code,
              description: coupon.description,
              minOrderValue: coupon.minCartValue || 0,
              discountType: coupon.type === 'FLAT' ? 'FIXED' : 'PERCENTAGE',
              discountValue: coupon.value,
              showOnHome: coupon.showOnHome
            }
          }
        },
        headers: {},
        config
      };
    }
  }

  // Admin GET coupons
  if (path === '/api/admin/coupons') {
    if (method === 'get') {
      return {
        status: 200,
        statusText: 'OK',
        data: { data: mockCouponsList },
        headers: {},
        config
      };
    }

    if (method === 'post') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      
      if (mockCouponsList.some((c: any) => c.code.toLowerCase() === payload.code.toLowerCase())) {
        return Promise.reject({
          response: { status: 400, data: { message: `Coupon with code '${payload.code}' already exists.` } }
        });
      }

      const newCoupon = {
        id: Math.floor(Math.random() * 10000) + 10,
        code: payload.code.toUpperCase().trim(),
        description: payload.description,
        type: payload.type.toUpperCase().trim(),
        value: payload.value,
        minCartValue: payload.minCartValue || 0,
        maxDiscount: payload.maxDiscount || null,
        usageLimit: payload.usageLimit || null,
        usedCount: 0,
        isActive: true,
        showOnHome: payload.showOnHome || false,
        validFrom: payload.validFrom || null,
        validUntil: payload.validUntil || null
      };

      mockCouponsList.push(newCoupon);
      setStored('coupons_list', mockCouponsList);

      return {
        status: 200,
        statusText: 'OK',
        data: { data: newCoupon },
        headers: {},
        config
      };
    }
  }

  // Admin operations by ID
  const adminCouponIdMatch = path.match(/^\/api\/admin\/coupons\/([^\/]+)$/);
  if (adminCouponIdMatch) {
    const couponId = parseInt(adminCouponIdMatch[1]);
    
    if (method === 'delete') {
      const filtered = mockCouponsList.filter((c: any) => c.id !== couponId);
      setStored('coupons_list', filtered);
      return {
        status: 200,
        statusText: 'OK',
        data: { data: true },
        headers: {},
        config
      };
    }
  }

  // Admin toggles
  const adminCouponToggleMatch = path.match(/^\/api\/admin\/coupons\/([^\/]+)\/toggle$/);
  if (adminCouponToggleMatch) {
    if (method === 'put') {
      const couponId = parseInt(adminCouponToggleMatch[1]);
      const updated = mockCouponsList.map((c: any) => {
        if (c.id === couponId) {
          return { ...c, isActive: !c.isActive };
        }
        return c;
      });
      setStored('coupons_list', updated);
      return {
        status: 200,
        statusText: 'OK',
        data: { data: updated.find((c: any) => c.id === couponId) },
        headers: {},
        config
      };
    }
  }

  const adminCouponToggleHomeMatch = path.match(/^\/api\/admin\/coupons\/([^\/]+)\/toggle-home$/);
  if (adminCouponToggleHomeMatch) {
    if (method === 'put') {
      const couponId = parseInt(adminCouponToggleHomeMatch[1]);
      const updated = mockCouponsList.map((c: any) => {
        if (c.id === couponId) {
          return { ...c, showOnHome: !c.showOnHome };
        }
        return c;
      });
      setStored('coupons_list', updated);
      return {
        status: 200,
        statusText: 'OK',
        data: { data: updated.find((c: any) => c.id === couponId) },
        headers: {},
        config
      };
    }
  }

  // 14. ORDERS
  if (path === '/api/orders') {
    if (method === 'get') {
      const orders = getStored('orders', []);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: {
            content: orders,
            totalPages: 1
          }
        },
        headers: {},
        config
      };
    }

    if (method === 'post') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const cart = getStored('cart', { items: [], subtotal: 0 });
      const addresses = getStored('addresses', []);
      const address = addresses.find((a: any) => a.id === payload.addressId) || addresses[0] || {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Avenue des Champs-Élysées',
        city: 'Paris',
        state: 'Île-de-France',
        pincode: '75008',
        isDefault: true
      };

      const orderItems = cart.items.map((item: any) => ({
        id: Math.floor(Math.random() * 10000),
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }));

      const discountAmount = payload.couponCode === 'WELCOME10' ? cart.subtotal * 0.1 : 0;
      const totalAmount = cart.subtotal - discountAmount;
      
      const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const newOrder = {
        id: `ord_${Math.floor(100000 + Math.random() * 900000)}`,
        orderNumber: `BLD-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: currentUser?.id || 'demo-user-id',
        userEmail: currentUser?.email || 'demo@example.com',
        status: 'processing',
        subtotal: cart.subtotal,
        shippingCharge: 0,
        taxAmount: 0,
        discountAmount: discountAmount,
        totalAmount: totalAmount,
        couponCode: payload.couponCode,
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentMethod === 'COD' ? 'Pending' : 'Paid',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        address: {
          fullName: address.fullName,
          email: 'demo@example.com',
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.pincode,
          country: 'France'
        },
        items: orderItems,
        trackingHistory: [
          {
            status: 'processing',
            message: 'Order placed and being processed.',
            trackingTime: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString()
      };

      const orders = getStored('orders', []);
      orders.unshift(newOrder);
      setStored('orders', orders);

      // Clear cart
      setStored('cart', { cartId: 'mock-cart-1', items: [], subtotal: 0, itemCount: 0 });

      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: newOrder
        },
        headers: {},
        config
      };
    }
  }

  const orderIdMatch = path.match(/^\/api\/orders\/([^\/]+)$/);
  if (orderIdMatch) {
    const orderId = orderIdMatch[1];
    const orders = getStored('orders', []);
    const order = orders.find((o: any) => o.id === orderId || o.orderNumber === orderId);
    
    if (order) {
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: order
        },
        headers: {},
        config
      };
    }
    return Promise.reject({
      response: {
        status: 404,
        data: { message: 'Order not found' }
      }
    });
  }

  const cancelOrderMatch = path.match(/^\/api\/orders\/([^\/]+)\/cancel$/);
  if (cancelOrderMatch) {
    if (method === 'put') {
      const orderId = cancelOrderMatch[1];
      const orders = getStored('orders', []);
      const order = orders.find((o: any) => o.id === orderId);
      if (order) {
        order.status = 'cancelled';
        order.trackingHistory.push({
          status: 'cancelled',
          message: 'Order cancelled by customer.',
          trackingTime: new Date().toISOString()
        });
        setStored('orders', orders);
        return {
          status: 200,
          statusText: 'OK',
          data: {
            data: order
          },
          headers: {},
          config
        };
      }
    }
  }

  const trackOrderMatch = path.match(/^\/api\/orders\/([^\/]+)\/track$/);
  if (trackOrderMatch) {
    const orderId = trackOrderMatch[1];
    const orders = getStored('orders', []);
    const order = orders.find((o: any) => o.id === orderId);
    if (order) {
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: order.trackingHistory || []
        },
        headers: {},
        config
      };
    }
  }

  // 15. REVIEWS
  if (path === '/api/reviews') {
    return {
      status: 200,
      statusText: 'OK',
      data: {
        data: []
      },
      headers: {},
      config
    };
  }

  // 16. SALE SETTINGS (PUBLIC & ADMIN)
  if (path === '/api/sales/settings' || path === '/api/admin/sales/settings') {
    if (method === 'get') {
      const settings = getStored('sale_settings', {
        id: 1,
        saleTitle: 'SALE IS LIVE 🔥',
        saleSubtitle: 'Limited time deals — up to 70% off on selected products!',
        maxDiscountText: 'up to 70% off',
        saleEndDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        dealOfTheDayProductId: 'bo-velcro',
        dealProductName: 'Bo Velcro Sneaker',
        dealProductImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500',
        dealProductPrice: 16500,
        dealProductOriginalPrice: 22000,
        dealProductDiscountPercentage: 25,
        dealProductDescription: 'Classic minimalist sneaker featuring dual velcro straps for effortless style.'
      });
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: settings
        },
        headers: {},
        config
      };
    }
    
    if (method === 'put') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const settings = getStored('sale_settings', {});
      const updatedSettings = { ...settings, ...payload };
      setStored('sale_settings', updatedSettings);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: updatedSettings
        },
        headers: {},
        config
      };
    }
  }

  // 16B. REVIEWS
  const reviewProductMatch = path.match(/^\/api\/reviews\/product\/([^\/]+)$/);
  if (reviewProductMatch) {
    if (method === 'get') {
      const productId = reviewProductMatch[1];
      const allReviews = getStored('reviews_list', []);
      const productReviews = allReviews.filter((r: any) => r.productId === productId && r.isApproved !== false);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: {
            content: productReviews,
            totalElements: productReviews.length,
            totalPages: 1,
            size: 20,
            number: 0
          }
        },
        headers: {},
        config
      };
    }
  }

  if (path === '/api/reviews') {
    if (method === 'post') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const allReviews = getStored('reviews_list', []);
      const newReview = {
        id: Math.floor(1000 + Math.random() * 9000),
        productId: payload.productId,
        userId: currentUser?.id || 'demo-user-id',
        userName: currentUser?.name || 'Anonymous',
        rating: payload.rating,
        comment: payload.comment,
        images: payload.images || [],
        isApproved: true,
        isVerifiedPurchase: true,
        createdAt: new Date().toISOString()
      };
      allReviews.unshift(newReview);
      setStored('reviews_list', allReviews);
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: newReview
        },
        headers: {},
        config
      };
    }
  }

  // 17. DEAL OF THE DAY (PUBLIC)
  if (path === '/api/sales/deal-of-the-day') {
    if (method === 'get') {
      const settings = getStored('sale_settings', { dealOfTheDayProductId: 'bo-velcro' });
      const dealProdId = settings.dealOfTheDayProductId;
      const product = productsList.find((p: any) => p.id === dealProdId) || null;
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: product
        },
        headers: {},
        config
      };
    }
  }

  // 18. ADMIN UPDATE DEAL OF THE DAY
  if (path === '/api/admin/sales/deal-of-the-day') {
    if (method === 'put') {
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const dealProdId = payload?.productId;
      const product = productsList.find((p: any) => p.id === dealProdId);
      
      const settings = getStored('sale_settings', {});
      if (product) {
        settings.dealOfTheDayProductId = product.id;
        settings.dealProductName = product.name;
        settings.dealProductImage = product.image || (product.images && product.images[0]) || '';
        settings.dealProductPrice = product.price;
        settings.dealProductOriginalPrice = product.originalPrice || product.price;
        settings.dealProductDiscountPercentage = product.discountPercentage || product.discount || 0;
        settings.dealProductDescription = product.description || '';
      } else {
        settings.dealOfTheDayProductId = dealProdId || null;
      }
      setStored('sale_settings', settings);
      
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: settings
        },
        headers: {},
        config
      };
    }
  }

  // 19. ADMIN UPDATE PRODUCT DISCOUNT
  // /api/admin/products/:id/discount
  const discountMatch = path.match(/^\/api\/admin\/products\/([^\/]+)\/discount$/);
  if (discountMatch) {
    if (method === 'put') {
      const productId = discountMatch[1];
      const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const discountPercentage = payload?.discountPercentage || 0;
      const isOnSale = payload?.isOnSale || false;
      
      const updatedList = productsList.map((p: any) => {
        if (p.id === productId) {
          return {
            ...p,
            discount: discountPercentage,
            discountPercentage: discountPercentage,
            isOnSale: isOnSale
          };
        }
        return p;
      });
      setStored('products', updatedList);
      
      return {
        status: 200,
        statusText: 'OK',
        data: {
          data: updatedList.find((p: any) => p.id === productId)
        },
        headers: {},
        config
      };
    }
  }

  // Fallback default error response
  return Promise.reject({
    response: {
      status: 404,
      data: { message: `Mock handler not implemented for ${method.toUpperCase()} ${path}` }
    }
  });
};
