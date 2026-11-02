import crypto from 'node:crypto';

export const OTP_TTL_MS = 3 * 60 * 1000;

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function createVerificationCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/** Constant-time verification with an explicit three-minute expiry check. */
export function isVerificationCodeValid(
  code: string,
  storedHash: string | null | undefined,
  expiresAt: Date | null | undefined,
  now = Date.now(),
): boolean {
  if (!storedHash || !expiresAt || expiresAt.getTime() <= now || !/^\d{6}$/.test(code)) {
    return false;
  }

  const actual = Buffer.from(hashVerificationCode(code), 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
