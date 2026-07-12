/**
 * Types for the Passport OCR module.
 * All dates normalized to YYYY-MM-DD.
 */

export interface MrzData {
  /** Raw MRZ lines joined by newline */
  raw: string;
  /** Passport type code (P, I, A) */
  type: string;
  /** Issuing country (3-letter ICAO code) */
  issuingCountry: string;
  /** Surname as in MRZ */
  surname: string;
  /** Given names as in MRZ */
  givenNames: string;
  /** Passport/document number (without check digit) */
  documentNumber: string;
  /** Nationality code */
  nationality: string;
  /** Date of birth YYYY-MM-DD */
  dateOfBirth: string;
  /** Sex: M, F, or X */
  sex: string;
  /** Expiry date YYYY-MM-DD */
  expiryDate: string;
  /** Whether MRZ checksum validated successfully */
  checksumValid: boolean;
}

export interface PassportData {
  passportType: string;
  passportNumber: string;
  surname: string;
  givenNames: string;
  fullName: string;
  nationality: string;
  issuingCountry: string;
  gender: string;
  dateOfBirth: string;
  passportIssueDate: string;
  passportExpiry: string;
  placeOfBirth: string;
  mrz: string;
  /** 0–100 */
  confidence: number;
}

export interface OcrResult {
  rawText: string;
  confidence: number;
  provider: string;
  durationMs: number;
}

/**
 * Structured passport fields read directly by a vision LLM.
 * Preferred over raw-text + MRZ regex parsing: vision models read the printed
 * fields reliably but cannot reproduce a character-perfect 44-char MRZ line.
 * All dates normalized to YYYY-MM-DD; empty string for unreadable fields.
 */
export interface StructuredPassport {
  passportType: string;
  passportNumber: string;
  surname: string;
  givenNames: string;
  nationality: string;
  issuingCountry: string;
  gender: string;
  dateOfBirth: string;
  passportIssueDate: string;
  passportExpiry: string;
  placeOfBirth: string;
}

/** Provider abstraction — all providers implement this */
export interface OcrProvider {
  readonly name: string;
  extractText(image: Buffer): Promise<OcrResult>;
  /**
   * Optional: extract structured fields directly (vision LLMs).
   * Returns null when the image is not a readable passport.
   */
  extractStructured?(image: Buffer): Promise<StructuredPassport | null>;
  isAvailable(): boolean;
}

export interface PassportOcrResult {
  success: boolean;
  passport: PassportData;
  provider: string;
  durationMs: number;
}
