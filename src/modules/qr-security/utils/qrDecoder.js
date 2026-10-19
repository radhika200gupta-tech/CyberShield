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
  if (!imageData || !imageData.data || imageData.width <= 0 || imageData.height <= 0) {
    return null;
  }
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return result ? result.data : null;
}

/**
 * Helper to run decode on an HTMLCanvasElement context.
 */
function attemptDecodeFromCanvas(canvas) {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = decodeFromImageData(imageData);
    if (decoded) return decoded;

    // Optional grayscale contrast enhancement pass for low-contrast images
    const data = imageData.data;
    let sum = 0;
    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      sum += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }
    const avg = sum / (len / 4);
    const threshold = Math.max(50, Math.min(205, avg));

    const binarized = new Uint8ClampedArray(len);
    for (let i = 0; i < len; i += 4) {
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      const val = gray > threshold ? 255 : 0;
      binarized[i] = val;
      binarized[i + 1] = val;
      binarized[i + 2] = val;
      binarized[i + 3] = 255;
    }

    const binarizedResult = jsQR(binarized, canvas.width, canvas.height, {
      inversionAttempts: 'attemptBoth',
    });
    return binarizedResult ? binarizedResult.data : null;
  } catch {
    return null;
  }
}

/**
 * Decodes a QR code from a File, Blob, or image object with multi-scale passes.
 * Handles high-resolution camera photos, desktop screenshots, and mobile uploads
 * by testing native, downscaled, and cropped viewports where jsQR excels.
 *
 * Returns a Promise<string|null>.
 */
export function decodeFromImageFile(fileOrBlobOrObj) {
  return new Promise((resolve, reject) => {
    if (!fileOrBlobOrObj) {
      resolve(null);
      return;
    }

    let imageSrc = null;
    let createdUrl = null;

    if (typeof Blob !== 'undefined' && fileOrBlobOrObj instanceof Blob) {
      createdUrl = URL.createObjectURL(fileOrBlobOrObj);
      imageSrc = createdUrl;
    } else if (typeof File !== 'undefined' && fileOrBlobOrObj instanceof File) {
      createdUrl = URL.createObjectURL(fileOrBlobOrObj);
      imageSrc = createdUrl;
    } else if (fileOrBlobOrObj?.file && ((typeof Blob !== 'undefined' && fileOrBlobOrObj.file instanceof Blob) || (typeof File !== 'undefined' && fileOrBlobOrObj.file instanceof File))) {
      createdUrl = URL.createObjectURL(fileOrBlobOrObj.file);
      imageSrc = createdUrl;
    } else if (fileOrBlobOrObj?.rawFile && ((typeof Blob !== 'undefined' && fileOrBlobOrObj.rawFile instanceof Blob) || (typeof File !== 'undefined' && fileOrBlobOrObj.rawFile instanceof File))) {
      createdUrl = URL.createObjectURL(fileOrBlobOrObj.rawFile);
      imageSrc = createdUrl;
    } else if (typeof fileOrBlobOrObj?.previewUrl === 'string' && fileOrBlobOrObj.previewUrl) {
      imageSrc = fileOrBlobOrObj.previewUrl;
    } else if (typeof fileOrBlobOrObj === 'string' && fileOrBlobOrObj) {
      imageSrc = fileOrBlobOrObj;
    } else {
      reject(new Error('Invalid image file format provided.'));
      return;
    }

    const img = new Image();

    // Only set crossOrigin for remote http(s) URLs, NEVER for blob: or data: URLs
    if (typeof imageSrc === 'string' && (imageSrc.startsWith('http://') || imageSrc.startsWith('https://'))) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = async () => {
      try {
        if ('decode' in img) {
          try {
            await img.decode();
          } catch {}
        }

        const natW = img.naturalWidth || img.width;
        const natH = img.naturalHeight || img.height;

        if (!natW || !natH) {
          reject(new Error('Image has zero dimensions or could not be rendered.'));
          return;
        }

        const canvas = document.createElement('canvas');

        // Pass 1: Native Resolution
        canvas.width = natW;
        canvas.height = natH;
        let ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Canvas 2D context is not available.'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        let result = attemptDecodeFromCanvas(canvas);
        if (result) {
          resolve(result);
          return;
        }

        // Pass 2: Downscaled to max 900px (Crucial for high-res camera captures & 4K screenshots)
        const maxDim = Math.max(natW, natH);
        if (maxDim > 900) {
          const scale2 = 900 / maxDim;
          canvas.width = Math.round(natW * scale2);
          canvas.height = Math.round(natH * scale2);
          ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            result = attemptDecodeFromCanvas(canvas);
            if (result) {
              resolve(result);
              return;
            }
          }
        }

        // Pass 3: Downscaled to max 600px (Medium resolution)
        if (maxDim > 600) {
          const scale3 = 600 / maxDim;
          canvas.width = Math.round(natW * scale3);
          canvas.height = Math.round(natH * scale3);
          ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'medium';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            result = attemptDecodeFromCanvas(canvas);
            if (result) {
              resolve(result);
              return;
            }
          }
        }

        // Pass 4: Center Crop 70% (When QR code is surrounded by desktop padding or paper background)
        const cropW = Math.round(natW * 0.7);
        const cropH = Math.round(natH * 0.7);
        const cropX = Math.round((natW - cropW) / 2);
        const cropY = Math.round((natH - cropH) / 2);
        canvas.width = cropW;
        canvas.height = cropH;
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          result = attemptDecodeFromCanvas(canvas);
          if (result) {
            resolve(result);
            return;
          }
        }

        // All decoding passes completed without finding QR code
        resolve(null);
      } catch (err) {
        reject(err);
      } finally {
        if (createdUrl) {
          URL.revokeObjectURL(createdUrl);
        }
      }
    };

    img.onerror = () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
      reject(new Error('Could not load or decode image file.'));
    };

    img.src = imageSrc;
  });
}
