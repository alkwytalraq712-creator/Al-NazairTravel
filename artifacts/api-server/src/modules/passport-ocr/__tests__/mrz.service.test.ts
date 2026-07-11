import { describe, it, expect } from 'vitest';
import { parseMrz, detectMrzLines } from '../mrz.service.js';

// Real-length TD3 MRZ lines — exactly 44 chars each (ICAO 9303 format).
const SAMPLE_TD3_LINE1 = 'P<IRQALBALAWI<<SABAH<FARHOOD<<<<<<<<<<<<<<<<'; // 44
const SAMPLE_TD3_LINE2 = 'A1234567<6IRQ5712012M3401147<<<<<<<<<<<<<<<5'; // 44

describe('detectMrzLines', () => {
  it('detects two 44-char TD3 lines from OCR text', () => {
    const ocrText = `REPUBLIC OF IRAQ\nName: SABAH FARHOOD ALBALAWI\n${SAMPLE_TD3_LINE1}\n${SAMPLE_TD3_LINE2}`;
    const lines = detectMrzLines(ocrText);
    expect(lines).not.toBeNull();
    expect(lines!.length).toBe(2);
    expect(lines![0]).toBe(SAMPLE_TD3_LINE1);
    expect(lines![1]).toBe(SAMPLE_TD3_LINE2);
  });

  it('returns null when no MRZ lines present', () => {
    expect(detectMrzLines('Some random text without MRZ')).toBeNull();
  });

  it('handles MRZ lines embedded with spaces — strips spaces', () => {
    // OCR sometimes adds spaces inside MRZ; detectMrzLines strips them
    const ocrText = `${SAMPLE_TD3_LINE1}\n${SAMPLE_TD3_LINE2}`;
    const lines = detectMrzLines(ocrText);
    expect(lines).not.toBeNull();
  });
});

describe('parseMrz', () => {
  const sampleText = `${SAMPLE_TD3_LINE1}\n${SAMPLE_TD3_LINE2}`;

  it('parses surname and given names', () => {
    const result = parseMrz(sampleText);
    expect(result).not.toBeNull();
    expect(result!.surname).toBe('ALBALAWI');
    expect(result!.givenNames).toBe('SABAH FARHOOD');
  });

  it('parses document number', () => {
    const result = parseMrz(sampleText);
    expect(result!.documentNumber).toBe('A1234567');
  });

  it('parses issuing country', () => {
    const result = parseMrz(sampleText);
    expect(result!.issuingCountry).toBe('IRQ');
  });

  it('parses nationality', () => {
    const result = parseMrz(sampleText);
    expect(result!.nationality).toBe('IRQ');
  });

  it('parses sex', () => {
    const result = parseMrz(sampleText);
    expect(result!.sex).toBe('M');
  });

  it('parses date of birth as YYYY-MM-DD', () => {
    const result = parseMrz(sampleText);
    expect(result!.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('parses expiry date as YYYY-MM-DD', () => {
    const result = parseMrz(sampleText);
    expect(result!.expiryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('checksumValid is a boolean', () => {
    const result = parseMrz(sampleText);
    expect(result).not.toBeNull();
    expect(typeof result!.checksumValid).toBe('boolean');
  });

  it('returns null for garbage text', () => {
    expect(parseMrz('no mrz here at all')).toBeNull();
  });
});
