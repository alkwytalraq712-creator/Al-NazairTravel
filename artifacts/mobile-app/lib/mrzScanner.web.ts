import type { NativeMrzResult } from './mrzScanner.native';

/** Web keeps the existing image-upload OCR flow; Dynamsoft mobile SDK is native-only. */
export async function scanNativePassportMrz(_license?: string): Promise<NativeMrzResult | null> {
  return null;
}
