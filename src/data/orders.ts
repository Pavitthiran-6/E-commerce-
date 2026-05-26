export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  qty: number;
}

export interface Address {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Order {
  orderId: string;
  placedAt: string;
  status: 'Processing' | 'Shipped' | 'OutForDelivery' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  total: number;
  address: Address;
  paymentMethod: string;
  trackingNumber: string;
  estimatedDelivery: string;
}

export const mockOrders: Order[] = [
  {
    orderId: 'ORD-20240512-001',
    placedAt: '2024-05-12T10:30:00Z',
    status: 'Delivered',
    total: 23000,
    paymentMethod: 'UPI',
    trackingNumber: 'TRK987654321',
    estimatedDelivery: '2024-05-15T00:00:00Z',
    address: {
      fullName: 'John Doe',
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001'
    },
    items: [
      {
        productId: 'bo-velcro',
        name: 'Bo Velcro Sneaker',
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500',
        qty: 1
      }
    ]
  },
  {
    orderId: 'ORD-20240428-089',
    placedAt: '2024-04-28T14:20:00Z',
    status: 'Processing',
    total: 4500,
    paymentMethod: 'Credit Card',
    trackingNumber: 'TRK123456789',
    estimatedDelivery: '2024-05-05T00:00:00Z',
    address: {
      fullName: 'John Doe',
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001'
    },
    items: [
      {
        productId: 'linen-pants',
        name: 'Wide Leg Linen Pants',
        image: 'https://images.unsplash.com/photo-1509631179647-0c12ac9c68f2?q=80&w=500',
        qty: 1
      }
    ]
  },
  {
    orderId: 'ORD-20240214-042',
    placedAt: '2024-02-14T09:15:00Z',
    status: 'Cancelled',
    total: 15500,
    paymentMethod: 'COD',
    trackingNumber: '',
    estimatedDelivery: '',
    address: {
      fullName: 'John Doe',
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001'
    },
    items: [
      {
        productId: 'blender-pro',
        name: 'High-Speed Blender',
        image: 'https://images.unsplash.com/photo-1585237748805-728b75fba184?q=80&w=500',
        qty: 1
      }
    ]
  }
];
