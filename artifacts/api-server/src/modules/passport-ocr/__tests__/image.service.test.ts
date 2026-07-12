import { describe, it, expect } from 'vitest';
import { validateImageBuffer, ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../image.service.js';

// Minimal valid JPEG header (SOI marker FFD8FF)
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
// Minimal valid PNG header
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('validateImageBuffer', () => {
  it('accepts a valid JPEG buffer', () => {
    expect(validateImageBuffer(JPEG_HEADER, 'image/jpeg')).toBeNull();
  });

  it('accepts a valid PNG buffer', () => {
    expect(validateImageBuffer(PNG_HEADER, 'image/png')).toBeNull();
  });

  it('rejects a buffer exceeding 10 MB', () => {
    const large = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1);
    // Copy JPEG header into large buffer so magic bytes pass
    JPEG_HEADER.copy(large);
    const err = validateImageBuffer(large, 'image/jpeg');
    expect(err).not.toBeNull();
    expect(err!.toLowerCase()).toContain('large');
  });

  it('rejects unsupported MIME type', () => {
    const err = validateImageBuffer(JPEG_HEADER, 'image/gif');
    expect(err).not.toBeNull();
    expect(err!.toLowerCase()).toContain('unsupported');
  });

  it('rejects buffer with invalid magic bytes', () => {
    const bad = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    const err = validateImageBuffer(bad, 'image/jpeg');
    expect(err).not.toBeNull();
    expect(err!.toLowerCase()).toContain('valid');
  });

  it('ACCEPTED_MIME_TYPES includes jpeg and png', () => {
    expect(ACCEPTED_MIME_TYPES).toContain('image/jpeg');
    expect(ACCEPTED_MIME_TYPES).toContain('image/png');
  });
});
