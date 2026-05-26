export const formatPrice = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};
