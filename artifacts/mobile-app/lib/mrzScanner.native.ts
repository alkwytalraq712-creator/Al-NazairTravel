import {
  EnumDocumentType,
  EnumResultStatus,
  MRZScanner,
} from 'dynamsoft-mrz-scanner-bundle-react-native';

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
 * Uses Dynamsoft's on-device MRZ scanner when a license is supplied.
 * The license is intentionally read from EXPO_PUBLIC_* at build time and is
 * never stored in the repository. A missing license returns null so callers
 * can use the existing upload/OCR flow instead.
 */
export async function scanNativePassportMrz(license?: string): Promise<NativeMrzResult | null> {
  if (!license?.trim()) return null;

  const result = await MRZScanner.launch({
    license: license.trim(),
    documentType: EnumDocumentType.DT_PASSPORT,
    isTorchButtonVisible: true,
    isBeepEnabled: false,
    isCloseButtonVisible: true,
    isGuideFrameVisible: true,
  });

  if (!result || result.resultStatus === EnumResultStatus.RS_CANCELED) return null;
  if (result.resultStatus === EnumResultStatus.RS_EXCEPTION) {
    throw new Error(result.errorString || 'تعذر تشغيل ماسح الجواز');
  }

  const data = result.data;
  if (!data) throw new Error('لم يتم العثور على بيانات MRZ قابلة للقراءة');

  const passportNumber = String(data.documentNumber ?? '').replace(/</g, '').trim().toUpperCase();
  const dob = String(data.dateOfBirth ?? '').trim();
  const expiry = String(data.dateOfExpire ?? '').trim();
  const nationality = String(data.nationalityRaw ?? data.nationality ?? '').trim();
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();

  // Dynamsoft validates the MRZ check digits before returning a finished scan.
  // Still reject incomplete payloads so no partial result reaches profile save.
  if (!passportNumber || !dob || !expiry || !nationality || !fullName || !data.mrzText) {
    throw new Error('بيانات MRZ غير مكتملة. يرجى إعادة تصوير صفحة الجواز بوضوح.');
  }

  const image = result.mrzSideDocumentImage;
  const documentImageUri = image && typeof image === 'object' && 'uri' in image
    ? String((image as { uri?: string }).uri ?? '')
    : undefined;

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
