/**
 * Direct-to-Cloudinary upload utility.
 * Uploads images from the browser to Cloudinary without going through the backend.
 *
 * Required env vars (set in Render → Frontend → Environment):
 *   VITE_CLOUDINARY_CLOUD_NAME   — your Cloudinary cloud name
 *   VITE_CLOUDINARY_UPLOAD_PRESET — an UNSIGNED upload preset (Cloudinary → Settings → Upload → Add preset)
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export function isCloudinaryConfigured(): boolean {
  return !!(CLOUD_NAME && UPLOAD_PRESET && CLOUD_NAME !== 'undefined' && UPLOAD_PRESET !== 'undefined');
}

/**
 * Upload a single File directly to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadToCloudinary(file: File, folder = 'belledonne/products'): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your Render environment variables.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `Cloudinary upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.secure_url as string;
}

/**
 * Upload multiple files to Cloudinary in parallel.
 * Returns array of secure URLs.
 */
export async function uploadMultipleToCloudinary(files: File[], folder = 'belledonne/products'): Promise<string[]> {
  return Promise.all(files.map(f => uploadToCloudinary(f, folder)));
}
