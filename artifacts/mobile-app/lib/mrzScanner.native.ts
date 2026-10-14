import {
  EnumDocumentType,
  EnumResultStatus,
  MRZScanner,
} from 'dynamsoft-mrz-scanner-bundle-react-native';
import { normalizeNativeMrzData, type NativeMrzResult } from './mrzScanner.validation';

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

  const image = result.mrzSideDocumentImage;
  const documentImageUri = image && typeof image === 'object' && 'uri' in image
    ? String((image as { uri?: string }).uri ?? '')
    : undefined;

  // Dynamsoft validates the MRZ check digits before returning a finished scan.
  // The shared normalizer rejects partial payloads before profile save.
  return normalizeNativeMrzData(data, documentImageUri);
}
