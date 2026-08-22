/**
 * qrDecoder.js
 *
 * Thin wrapper around the jsQR decoding library. This is the ONLY file
 * that talks to jsQR directly — camera + upload components call these
 * helpers rather than importing jsQR themselves, so the decoding
 * engine could be swapped later without touching UI code.
 */

import jsQR from 'jsqr';

/**
 * Decodes a QR code from a raw ImageData object (e.g. a video frame
 * drawn to a canvas). Returns the decoded string, or null if nothing
 * was found.
 */
export function decodeFromImageData(imageData) {
  if (!imageData) return null;
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return result ? result.data : null;
}

/**
 * Decodes a QR code from a File/Blob (an uploaded image). Loads it
 * into an offscreen canvas, then reuses decodeFromImageData.
 * Returns a Promise<string|null>.
 */
export function decodeFromImageFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(decodeFromImageData(imageData));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image'));
    };

    img.src = objectUrl;
  });
}
