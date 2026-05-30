/**
 * Compresses and converts an image File to a base64 data URL.
 * Images are resized to max 800px width and compressed to ~75% JPEG quality,
 * keeping each image under ~80KB for efficient PostgreSQL storage.
 */
export async function compressImageToBase64(
  file: File,
  maxWidth = 800,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate target dimensions keeping aspect ratio
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG for photos, PNG for images with transparency
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const base64 = canvas.toDataURL(mimeType, quality);
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Compress multiple images to base64 in parallel.
 */
export async function compressMultipleToBase64(
  files: File[],
  maxWidth = 800,
  quality = 0.75
): Promise<string[]> {
  return Promise.all(files.map(f => compressImageToBase64(f, maxWidth, quality)));
}
