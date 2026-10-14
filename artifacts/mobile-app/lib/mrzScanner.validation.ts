export interface NativeMrzSdkData {
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  dateOfBirth?: string;
  dateOfExpire?: string;
  nationalityRaw?: string;
  nationality?: string;
  issuingStateRaw?: string;
  issuingState?: string;
  sex?: string;
  mrzText?: string;
}

export interface NativeMrzResult {
  fullName: string;
  nationality: string;
  passportNumber: string;
  dob: string;
  passportIssueDate: string;
  passportExpiry: string;
  issuingCountry: string;
  gender: string;
  placeOfBirth: string;
  confidence: number;
  documentImageUri?: string;
}

/**
 * Converts the SDK payload into the application's profile shape.
 * Missing mandatory MRZ fields are rejected instead of being saved as blanks.
 */
export function normalizeNativeMrzData(
  data: NativeMrzSdkData,
  documentImageUri?: string,
): NativeMrzResult {
  const passportNumber = String(data.documentNumber ?? '').replace(/</g, '').trim().toUpperCase();
  const dob = String(data.dateOfBirth ?? '').trim();
  const expiry = String(data.dateOfExpire ?? '').trim();
  const nationality = String(data.nationalityRaw ?? data.nationality ?? '').trim();
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();

  if (!passportNumber || !dob || !expiry || !nationality || !fullName || !data.mrzText) {
    throw new Error('بيانات MRZ غير مكتملة. يرجى إعادة تصوير صفحة الجواز بوضوح.');
  }

  return {
    fullName,
    nationality,
    passportNumber,
    dob,
    passportIssueDate: '',
    passportExpiry: expiry,
    issuingCountry: String(data.issuingStateRaw ?? data.issuingState ?? '').trim(),
    gender: String(data.sex ?? '').trim().toUpperCase(),
    placeOfBirth: '',
    confidence: 100,
    documentImageUri,
  };
}
