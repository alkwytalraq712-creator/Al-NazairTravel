export type { NativeMrzResult } from './mrzScanner.validation';

export function scanNativePassportMrz(
  license?: string,
): Promise<import('./mrzScanner.validation').NativeMrzResult | null>;
