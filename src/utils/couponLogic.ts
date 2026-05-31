export type CouponType = 'percentage' | 'flat' | 'freeshipping' | 'PERCENTAGE' | 'FLAT' | 'FREE_SHIPPING';

export interface Coupon {
  code: string;
  type: CouponType;
  value: number;
  minCart: number;
  description?: string;
  expiry?: string;
}

/**
 * Calculates the discount amount for a given coupon code and cart subtotal.
 * This is purely a calculation utility — coupon validation is done by the backend API.
 * The frontend uses this only to show the user a discount preview before placing the order.
 */
export function calculateDiscount(code: string, subtotal: number, coupons: Coupon[]): number {
  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!coupon) return 0;

  const type = coupon.type.toLowerCase();

  if (type === 'percentage') {
    return Math.round(subtotal * (coupon.value / 100));
  } else if (type === 'flat') {
    return coupon.value;
  } else if (type === 'freeshipping' || type === 'free_shipping') {
    // Free shipping is handled by zeroing out the shipping cost — no monetary discount
    return 0;
  }
  return 0;
}

/**
 * Returns true if the coupon provides free shipping.
 */
export function isFreeShippingCoupon(code: string, coupons: Coupon[]): boolean {
  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!coupon) return false;
  const type = coupon.type.toLowerCase();
  return type === 'freeshipping' || type === 'free_shipping';
}
