export const extractNameFromEmail = (email: string): string => {
  if (!email) return '';
  const rawName = email.split('@')[0];
  const cleanName = rawName.replace(/[^a-zA-Z]/g, '');
  if (!cleanName) return rawName; // Fallback if no letters at all
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
};
