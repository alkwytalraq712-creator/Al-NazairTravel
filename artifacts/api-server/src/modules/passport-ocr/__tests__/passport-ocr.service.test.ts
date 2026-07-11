import { describe, it, expect, vi } from 'vitest';
import { PassportOcrService } from '../passport-ocr.service.js';
import type { OcrProvider, OcrResult } from '../types.js';
import sharp from 'sharp';

// Build a minimal real JPEG buffer using sharp for image preprocessing
async function makeTestJpeg(): Promise<Buffer> {
  return sharp({
    create: { width: 200, height: 100, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .jpeg()
    .toBuffer();
}

function makeMockProvider(rawText: string, confidence = 85): OcrProvider {
  return {
    name: 'mock',
    isAvailable: () => true,
    extractText: vi.fn(async (): Promise<OcrResult> => ({
      rawText,
      confidence,
      provider: 'mock',
      durationMs: 10,
    })),
  };
}

// Valid 44-char MRZ lines (ICAO TD3 format, docNum=A1234567)
const MRZ_L1 = 'P<IRQALBALAWI<<SABAH<FARHOOD<<<<<<<<<<<<<<<<'; // 44
const MRZ_L2 = 'A1234567<6IRQ5712012M3401147<<<<<<<<<<<<<<<5'; // 44

const FULL_OCR_WITH_MRZ = `
REPUBLIC OF IRAQ
Passport / جواز سفر
Nationality: IRAQI
Gender: M
Place of Birth: BAGHDAD
Date of Issue: 14 JAN 2024
${MRZ_L1}
${MRZ_L2}
`;

const OCR_WITH_ALL_FIELDS = `
Name: JOHN DOE
Passport No: A1234567
Nationality: GBR
Date of Birth: 1990-06-15
Date of Expiry: 2030-06-15
Date of Issue: 2020-06-15
Gender: M
`;

describe('PassportOcrService', () => {
  it('extracts passport data from OCR text with MRZ', async () => {
    const provider = makeMockProvider(FULL_OCR_WITH_MRZ, 90);
    const svc = new PassportOcrService(provider);
    const jpeg = await makeTestJpeg();
    const result = await svc.process(jpeg);

    expect(result.success).toBe(true);
    expect(result.passport.surname).toBe('ALBALAWI');
    expect(result.passport.givenNames).toBe('SABAH FARHOOD');
    expect(result.passport.passportNumber).toBe('A1234567');
    expect(result.passport.nationality).toBe('IRQ');
    expect(result.passport.gender).toBe('M');
    expect(result.passport.confidence).toBeGreaterThan(0);
    expect(result.passport.mrz).toContain('P<IRQ');
    expect(result.provider).toBe('mock');
  });

  it('extracts data from OCR text without MRZ (freetext path)', async () => {
    const provider = makeMockProvider(OCR_WITH_ALL_FIELDS, 75);
    const svc = new PassportOcrService(provider);
    const jpeg = await makeTestJpeg();
    const result = await svc.process(jpeg);

    expect(result.success).toBe(true);
    expect(result.passport.passportNumber).toBe('A1234567');
    expect(result.passport.nationality).toBe('GBR');
  });

  it('calls OCR provider once per process() invocation', async () => {
    const provider = makeMockProvider(FULL_OCR_WITH_MRZ);
    const svc = new PassportOcrService(provider);
    const jpeg = await makeTestJpeg();
    await svc.process(jpeg);
    expect(provider.extractText).toHaveBeenCalledTimes(1);
  });

  it('throws PASSPORT_INVALID for complete garbage OCR output without MRZ', async () => {
    const provider = makeMockProvider('random text no data at all', 30);
    const svc = new PassportOcrService(provider);
    const jpeg = await makeTestJpeg();
    await expect(svc.process(jpeg)).rejects.toMatchObject({ code: 'PASSPORT_INVALID' });
  });

  it('returns a confidence score between 0 and 100', async () => {
    const provider = makeMockProvider(FULL_OCR_WITH_MRZ, 85);
    const svc = new PassportOcrService(provider);
    const jpeg = await makeTestJpeg();
    const result = await svc.process(jpeg);
    expect(result.passport.confidence).toBeGreaterThanOrEqual(0);
    expect(result.passport.confidence).toBeLessThanOrEqual(100);
  });
});
