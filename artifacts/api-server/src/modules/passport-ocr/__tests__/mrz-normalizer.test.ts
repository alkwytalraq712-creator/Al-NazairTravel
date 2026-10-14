import { describe, expect, it } from 'vitest';
import { normalizeNativeMrzData } from '../../../../../mobile-app/lib/mrzScanner.validation';

describe('normalizeNativeMrzData', () => {
  const validPayload = {
    firstName: 'AHMED',
    lastName: 'ALI',
    documentNumber: 'A12<3456',
    dateOfBirth: '1990-01-02',
    dateOfExpire: '2030-01-02',
    nationalityRaw: 'IRQ',
    issuingStateRaw: 'IRQ',
    sex: 'M',
    mrzText: 'P<IRQALI<<AHMED<<<<<<<<<<<<<<<<<<<<<<<<<<<<\nA123456<7IRQ9001028M3001027<<<<<<<<<<<<<<02',
  };

  it('normalizes a complete SDK payload for profile save', () => {
    expect(normalizeNativeMrzData(validPayload, 'data:image/jpeg;base64,abc')).toMatchObject({
      fullName: 'AHMED ALI',
      passportNumber: 'A123456',
      nationality: 'IRQ',
      passportExpiry: '2030-01-02',
      confidence: 100,
      documentImageUri: 'data:image/jpeg;base64,abc',
    });
  });

  it('rejects partial SDK payloads instead of saving blank profile fields', () => {
    expect(() => normalizeNativeMrzData({ ...validPayload, mrzText: '' })).toThrow('بيانات MRZ غير مكتملة');
    expect(() => normalizeNativeMrzData({ ...validPayload, documentNumber: undefined })).toThrow(
      'بيانات MRZ غير مكتملة',
    );
  });
});
