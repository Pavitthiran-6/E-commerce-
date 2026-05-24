export type CouponType = 'percentage' | 'flat' | 'freeshipping';

export interface Coupon {
  code: string;
  type: CouponType;
  value: number;
  minCart: number;
  description?: string;
  expiry?: string;
}

export const coupons: Coupon[] = [
  { code: 'WELCOME10', type: 'percentage', value: 10, minCart: 999, description: "10% off on first order", expiry: "Valid till 31 May 2026" },
  { code: 'FREESHIP',  type: 'freeshipping', value: 0, minCart: 0, description: "Free shipping on any order", expiry: "Valid till 30 Jun 2026" },
  { code: 'SUMMER20',  type: 'percentage', value: 20, minCart: 1499, description: "20% off on men's collection", expiry: "Valid till 15 Jun 2026" },
  { code: 'KITCHEN15', type: 'percentage', value: 15, minCart: 799, description: "15% off on kitchen items", expiry: "Valid till 30 Jun 2026" },
  { code: 'PAYTM50',   type: 'flat', value: 50, minCart: 500, description: "Flat ₹50 off on Paytm payment", expiry: "Valid till 31 May 2026" },
  { code: 'SAVE500',   type: 'flat', value: 500, minCart: 5000, description: "Flat ₹500 off on orders above ₹5,000", expiry: "Valid till 30 Jun 2026" }
];

export function getCouponError(code: string, subtotal: number): string | null {
  const coupon = coupons.find(c => c.code === code.toUpperCase());
  if (!coupon) {
    return '❌ Invalid coupon code. Please try again.';
  }
  if (subtotal < coupon.minCart) {
    return `Minimum cart value of ₹${coupon.minCart.toLocaleString()} required for this coupon.`;
  }
  return null;
}

export function calculateDiscount(code: string, subtotal: number): number {
  const error = getCouponError(code, subtotal);
  if (error) return 0;

  const coupon = coupons.find(c => c.code === code.toUpperCase());
  if (!coupon) return 0;

  if (coupon.type === 'percentage') {
    return Math.round(subtotal * (coupon.value / 100));
  } else if (coupon.type === 'flat') {
    return coupon.value;
  } else if (coupon.type === 'freeshipping') {
    // We handle free shipping directly by zeroing out shipping cost
    // But we might want to return 0 here and just check if the coupon is FREESHIP
    return 0; 
  }
  return 0;
}
