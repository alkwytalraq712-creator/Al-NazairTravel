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

export function scanNativePassportMrz(license?: string): Promise<NativeMrzResult | null>;
