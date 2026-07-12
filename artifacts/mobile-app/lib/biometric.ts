/**
 * Biometric authentication helper (expo-local-authentication).
 * Supports FaceID, TouchID, and Fingerprint on iOS & Android.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_KEY = '@qema_biometric';

export type BiometricType = 'fingerprint' | 'faceid' | 'iris' | 'none';

/** Check if the device supports biometric auth and has enrolled credentials. */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return isEnrolled;
}

/** Return a human-readable Arabic label for the strongest available authenticator. */
export async function getBiometricLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'التعرف على الوجه (Face ID)';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'بصمة الإصبع';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'بصمة القزحية';
  }
  return 'المصادقة البيومترية';
}

/** Prompt the user with a biometric challenge. Returns true on success. */
export async function authenticateBiometric(promptMessage = 'تحقق من هويتك للمتابعة'): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'استخدم كلمة المرور',
      cancelLabel: 'إلغاء',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

/** Return whether the user has biometric login enabled. */
export async function isBiometricEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(BIOMETRIC_KEY);
  return val === 'true';
}

/** Enable or disable biometric login preference. */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
}
