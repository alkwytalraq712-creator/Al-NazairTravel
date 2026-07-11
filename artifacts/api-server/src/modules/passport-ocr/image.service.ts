/**
 * Image preprocessing service using Sharp.
 * Prepares passport images for OCR: auto-rotate, grayscale,
 * normalize brightness/contrast, sharpen, and resize.
 */

import sharp from 'sharp';

const MAX_OCR_DIMENSION = 2400; // px — resize very large images for OCR
const OCR_JPEG_QUALITY = 92;

/** Accepted MIME types */
export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: string;
  originalSize: number;
  processedSize: number;
  widthPx: number;
  heightPx: number;
}

/**
 * Preprocess a passport image for OCR:
 * 1. Auto-rotate based on EXIF orientation
 * 2. Resize if too large (preserving aspect ratio)
 * 3. Convert to grayscale
 * 4. Normalize brightness
 * 5. Sharpen
 * 6. Output as JPEG
 */
export async function preprocessPassportImage(
  inputBuffer: Buffer,
): Promise<ProcessedImage> {
  const originalSize = inputBuffer.length;

  const pipeline = sharp(inputBuffer, { failOn: 'truncated' })
    // Auto-rotate from EXIF — removes EXIF orientation tag after rotating
    .rotate()
    // Resize very large images (keep aspect ratio, never upscale)
    .resize(MAX_OCR_DIMENSION, MAX_OCR_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    // Grayscale for cleaner OCR
    .grayscale()
    // Normalize to stretch contrast
    .normalize()
    // Modest sharpen to enhance text edges
    .sharpen({ sigma: 1.2, m1: 0, m2: 3 })
    // Output as JPEG for consistent OCR input
    .jpeg({ quality: OCR_JPEG_QUALITY, progressive: false });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    mimeType: 'image/jpeg',
    originalSize,
    processedSize: data.length,
    widthPx: info.width,
    heightPx: info.height,
  };
}

/**
 * Validate the raw upload buffer: size and (basic) MIME type check.
 * Returns error string or null if valid.
 */
export function validateImageBuffer(
  buffer: Buffer,
  mimetype: string,
): string | null {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return `File too large: ${(buffer.length / 1024 / 1024).toFixed(1)} MB (max 10 MB)`;
  }

  const normalized = mimetype.toLowerCase();
  if (!ACCEPTED_MIME_TYPES.some(t => normalized.includes(t.split('/')[1]))) {
    return `Unsupported image type: ${mimetype}. Accepted: JPEG, PNG`;
  }

  // Magic bytes check for JPEG (FFD8FF) and PNG (89504E47)
  if (buffer.length >= 4) {
    const hex = buffer.slice(0, 4).toString('hex').toLowerCase();
    if (!hex.startsWith('ffd8ff') && !hex.startsWith('89504e47')) {
      return 'File content does not match a valid JPEG or PNG image';
    }
  }

  return null;
}
