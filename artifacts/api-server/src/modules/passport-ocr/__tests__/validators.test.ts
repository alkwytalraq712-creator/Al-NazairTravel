import { describe, it, expect } from 'vitest';
import {
  isValidPassportNumber,
  isValidDate,
  isFutureDate,
  isPastDate,
  isValidNationality,
  validatePassportData,
} from '../validators.js';

describe('isValidPassportNumber', () => {
  it('accepts standard Iraqi passport number', () => {
    expect(isValidPassportNumber('A1234567')).toBe(true);
  });
  it('accepts all-digit number', () => {
    expect(isValidPassportNumber('123456789')).toBe(true);
  });
  it('rejects too-short numbers', () => {
    expect(isValidPassportNumber('A12')).toBe(false);
  });
  it('rejects numbers with invalid chars', () => {
    expect(isValidPassportNumber('A123-567')).toBe(false);
  });
  it('accepts lowercase (normalizes)', () => {
    expect(isValidPassportNumber('a1234567')).toBe(true);
  });
});

describe('isValidDate', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(isValidDate('2024-01-14')).toBe(true);
  });
  it('rejects invalid month', () => {
    expect(isValidDate('2024-13-01')).toBe(false);
  });
  it('rejects wrong format', () => {
    expect(isValidDate('14/01/2024')).toBe(false);
  });
  it('rejects empty string', () => {
    expect(isValidDate('')).toBe(false);
  });
});

describe('isFutureDate', () => {
  it('returns true for a far future date', () => {
    expect(isFutureDate('2099-01-01')).toBe(true);
  });
  it('returns false for a past date', () => {
    expect(isFutureDate('2000-01-01')).toBe(false);
  });
});

describe('isPastDate', () => {
  it('returns true for a past date', () => {
    expect(isPastDate('2000-01-01')).toBe(true);
  });
  it('returns false for a future date', () => {
    expect(isPastDate('2099-01-01')).toBe(false);
  });
});

describe('isValidNationality', () => {
  it('accepts ICAO code', () => {
    expect(isValidNationality('IRQ')).toBe(true);
  });
  it('accepts human-readable name', () => {
    expect(isValidNationality('IRAQI')).toBe(true);
  });
  it('rejects empty', () => {
    expect(isValidNationality('')).toBe(false);
  });
  it('rejects single char', () => {
    expect(isValidNationality('I')).toBe(false);
  });
});

describe('validatePassportData', () => {
  const validData = {
    passportNumber: 'A1234567',
    passportExpiry: '2034-01-14',
    passportIssueDate: '2024-01-14',
    dateOfBirth: '1957-12-01',
    nationality: 'IRQ',
  };

  it('returns no errors for valid data', () => {
    expect(validatePassportData(validData)).toHaveLength(0);
  });

  it('returns error for invalid passport number', () => {
    const errs = validatePassportData({ ...validData, passportNumber: 'X' });
    expect(errs.some(e => e.includes('passport number'))).toBe(true);
  });

  it('returns error for expired passport', () => {
    const errs = validatePassportData({ ...validData, passportExpiry: '2000-01-01' });
    expect(errs.some(e => e.includes('expired'))).toBe(true);
  });

  it('returns error for missing dob', () => {
    const errs = validatePassportData({ ...validData, dateOfBirth: '' });
    expect(errs.some(e => e.includes('Date of birth'))).toBe(true);
  });

  it('returns error for future dob', () => {
    const errs = validatePassportData({ ...validData, dateOfBirth: '2099-01-01' });
    expect(errs.some(e => e.includes('Date of birth'))).toBe(true);
  });
});
