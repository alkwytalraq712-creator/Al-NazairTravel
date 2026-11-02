import { describe, expect, it } from 'vitest';
import {
  createVerificationCode,
  hashVerificationCode,
  isVerificationCodeValid,
  normalizeEmail,
  OTP_TTL_MS,
} from './otp';

describe('otp helpers', () => {
  it('normalizes email consistently', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
    expect(normalizeEmail(undefined)).toBe('');
  });

  it('creates exactly six numeric digits', () => {
    expect(createVerificationCode()).toMatch(/^\d{6}$/);
  });

  it('accepts the correct code only before the three-minute expiry', () => {
    const now = Date.now();
    const code = '123456';
    const hash = hashVerificationCode(code);
    expect(isVerificationCodeValid(code, hash, new Date(now + OTP_TTL_MS), now)).toBe(true);
    expect(isVerificationCodeValid('123457', hash, new Date(now + OTP_TTL_MS), now)).toBe(false);
    expect(isVerificationCodeValid(code, hash, new Date(now), now)).toBe(false);
    expect(isVerificationCodeValid(code, hash, new Date(now - 1), now)).toBe(false);
  });
});
