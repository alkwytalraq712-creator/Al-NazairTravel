/**
 * Validators for extracted passport fields.
 */

const PASSPORT_NUMBER_RE = /^[A-Z0-9]{6,9}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ICAO_COUNTRY_RE = /^[A-Z]{3}$/;

export function isValidPassportNumber(n: string): boolean {
  return PASSPORT_NUMBER_RE.test(n.trim().toUpperCase());
}

export function isValidDate(d: string): boolean {
  if (!DATE_RE.test(d)) return false;
  const dt = new Date(d + 'T00:00:00Z');
  return !isNaN(dt.getTime());
}

export function isFutureDate(d: string): boolean {
  return isValidDate(d) && new Date(d + 'T00:00:00Z') > new Date();
}

export function isPastDate(d: string): boolean {
  return isValidDate(d) && new Date(d + 'T00:00:00Z') < new Date();
}

export function isValidNationality(n: string): boolean {
  if (!n) return false;
  // Allow 3-letter ICAO codes OR human-readable names of >= 2 chars
  return n.trim().length >= 2;
}

/** Returns list of validation errors; empty array = valid */
export function validatePassportData(data: {
  passportNumber: string;
  passportExpiry: string;
  passportIssueDate: string;
  dateOfBirth: string;
  nationality: string;
}): string[] {
  const errors: string[] = [];

  if (!isValidPassportNumber(data.passportNumber)) {
    errors.push(`Invalid passport number: "${data.passportNumber}"`);
  }

  if (data.passportExpiry && !isFutureDate(data.passportExpiry)) {
    errors.push('Passport is expired or has an invalid expiry date');
  } else if (!data.passportExpiry) {
    errors.push('Passport expiry date is missing');
  }

  if (data.passportIssueDate && !isPastDate(data.passportIssueDate)) {
    errors.push('Passport issue date is in the future');
  }

  if (data.dateOfBirth && !isPastDate(data.dateOfBirth)) {
    errors.push('Date of birth is in the future');
  } else if (!data.dateOfBirth) {
    errors.push('Date of birth is missing');
  }

  if (!isValidNationality(data.nationality)) {
    errors.push('Nationality is missing or too short');
  }

  return errors;
}
