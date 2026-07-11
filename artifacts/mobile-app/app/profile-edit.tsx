/**
 * Profile Edit — 3-step onboarding flow:
 *   0. Face photo (AI-validated)
 *   1. Passport scan (OCR auto-fill, no manual input)
 *   2. Residence type
 */

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import {
  useUpdateProfile,
  useScanPassportOcr,
  customFetch,
} from '@workspace/api-client-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ResidenceType = 'none' | 'gcc' | 'schengen' | 'uk' | 'usa';

interface ExtractedPassport {
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
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const STEPS = [
  { icon: 'camera-outline' as const, label: 'صورة\nالوجه' },
  { icon: 'card-outline' as const, label: 'جواز\nالسفر' },
  { icon: 'home-outline' as const, label: 'الإقامة' },
];

const RESIDENCE_OPTIONS: { value: ResidenceType; label: string; flag: string; desc: string }[] = [
  { value: 'none', label: 'لا، لست مقيماً', flag: '🚫', desc: 'غير مقيم خارج بلدي' },
  { value: 'gcc', label: 'دول الخليج (GCC)', flag: '🇸🇦', desc: 'السعودية، الإمارات، الكويت، قطر، البحرين، عُمان' },
  { value: 'schengen', label: 'دول شنغن الأوروبية', flag: '🇪🇺', desc: 'ألمانيا، فرنسا، هولندا وبقية دول شنغن' },
  { value: 'uk', label: 'المملكة المتحدة', flag: '🇬🇧', desc: 'إنجلترا، اسكتلندا، ويلز، أيرلندا الشمالية' },
  { value: 'usa', label: 'الولايات المتحدة', flag: '🇺🇸', desc: 'أمريكا (تأشيرة أو إقامة سارية)' },
];

const GENDER_MAP: Record<string, string> = { M: 'ذكر', F: 'أنثى', X: 'غير محدد' };

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

async function blobFromUri(uri: string): Promise<Blob> {
  const r = await fetch(uri);
  return r.blob();
}

// ─── Object-storage upload ──────────────────────────────────────────────────────

async function uploadToStorage(blob: Blob, fileName: string): Promise<string> {
  // 1. Request pre-signed URL
  const req = await customFetch<{ uploadURL: string; name: string; size: number }>(
    '/api/storage/uploads/request-url',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: blob.type || 'image/jpeg', isPublic: true }),
    } as any,
  );
  const { uploadURL, name: objectName } = req as any;

  // 2. PUT to GCS
  await fetch(uploadURL, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type || 'image/jpeg' },
    body: blob,
  });

  // 3. Finalize → get public URL
  const fin = await customFetch<{ publicUrl: string }>(
    '/api/storage/uploads/finalize',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectPath: `/objects/uploads/${objectName}`, isPublic: true }),
    } as any,
  );
  return (fin as any).publicUrl as string;
}

// ─── StepHeader component ───────────────────────────────────────────────────────

function StepHeader({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ paddingHorizontal: 24, paddingBottom: 20, paddingTop: 12 }}>
      {/* Step pills */}
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <View
              key={i}
              style={{
                alignItems: 'center',
                gap: 5,
                opacity: done || active ? 1 : 0.4,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: done
                    ? 'rgba(34,197,94,0.25)'
                    : active
                    ? 'rgba(59,130,246,0.3)'
                    : 'rgba(255,255,255,0.08)',
                  borderWidth: 2,
                  borderColor: done ? '#22c55e' : active ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {done ? (
                  <Ionicons name="checkmark" size={20} color="#22c55e" />
                ) : (
                  <Ionicons name={s.icon} size={18} color={active ? '#60a5fa' : 'rgba(255,255,255,0.5)'} />
                )}
              </View>
              <Text
                style={{
                  color: done ? '#22c55e' : active ? '#93c5fd' : 'rgba(255,255,255,0.4)',
                  fontSize: 10,
                  fontFamily: active ? 'Tajawal_700Bold' : 'Tajawal_400Regular',
                  textAlign: 'center',
                }}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: '#3b82f6',
            width: `${((step + 1) / total) * 100}%`,
          }}
        />
      </View>
    </View>
  );
}

// ─── Row for OCR data display ───────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal_400Regular', fontSize: 13 }}>
        {label}
      </Text>
      <Text
        style={{
          color: '#fff',
          fontFamily: 'Tajawal_700Bold',
          fontSize: 14,
          textAlign: 'left',
          maxWidth: '65%',
        }}
        numberOfLines={2}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

// ─── Processing overlay ─────────────────────────────────────────────────────────

function ProcessingOverlay({ message }: { message: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        gap: 14,
        zIndex: 10,
      }}
    >
      <ActivityIndicator size="large" color="#60a5fa" />
      <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15, textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────────

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user: u } = useAuth();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  // ── Navigation state ──
  const [step, setStep] = useState(0);

  // ── Step 0: Face photo ──
  const [avatarUrl, setAvatarUrl] = useState(u?.avatarUrl ?? '');
  const [faceValid, setFaceValid] = useState(!!u?.avatarUrl);
  const [faceValidating, setFaceValidating] = useState(false);
  const [faceError, setFaceError] = useState('');

  // ── Step 1: Passport ──
  const [passportImageUrl, setPassportImageUrl] = useState(u?.passportImageUrl ?? '');
  const [passportData, setPassportData] = useState<ExtractedPassport | null>(
    u?.passportNumber
      ? {
          fullName: u.englishName ?? '',
          nationality: u.nationality ?? '',
          passportNumber: u.passportNumber ?? '',
          dob: u.dob ?? '',
          passportIssueDate: u.passportIssueDate ?? '',
          passportExpiry: u.passportExpiry ?? '',
          issuingCountry: u.passportIssuingCountry ?? '',
          gender: u.gender ?? '',
          placeOfBirth: u.placeOfBirth ?? '',
          confidence: 100,
        }
      : null,
  );
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');

  // ── Step 2: Residence ──
  const [residenceType, setResidenceType] = useState<ResidenceType>(
    (u?.residenceType as ResidenceType | null) ?? 'none',
  );
  const [residenceFrontUrl, setResidenceFrontUrl] = useState(u?.gulfResidenceFrontUrl ?? '');
  const [residenceBackUrl, setResidenceBackUrl] = useState(u?.gulfResidenceBackUrl ?? '');
  const [residenceUploading, setResidenceUploading] = useState<'front' | 'back' | null>(null);

  // ── Global saving ──
  const [successVisible, setSuccessVisible] = useState(false);
  const successOpacity = useRef(new Animated.Value(0)).current;

  const updateMutation = useUpdateProfile();
  const ocrMutation = useScanPassportOcr();

  // ─── Image picker ─────────────────────────────────────────────────────────────

  async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('الإذن مطلوب', 'يرجى السماح للتطبيق بالوصول إلى معرض الصور');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    return result.canceled ? null : result.assets[0];
  }

  async function pickPassportImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('الإذن مطلوب', 'يرجى السماح للتطبيق بالوصول إلى معرض الصور');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });
    return result.canceled ? null : result.assets[0];
  }

  // ─── Step 0: Face photo upload + validation ────────────────────────────────────

  async function handleFaceUpload() {
    const asset = await pickImage();
    if (!asset) return;

    setFaceValidating(true);
    setFaceError('');
    setFaceValid(false);

    try {
      const blob = await blobFromUri(asset.uri);

      // 1. Validate face with AI
      const formData = new FormData();
      formData.append('faceImage', blob, 'face.jpg');
      const validation = await customFetch<{ valid: boolean; reason: string }>(
        '/api/validate/face',
        { method: 'POST', body: formData } as any,
      );
      const v = validation as any;
      if (!v?.valid) {
        setFaceError(v?.reason || 'لم يتم التعرف على وجه واضح. يرجى التقاط صورة بوضوح، وتأكد من ظهور الوجه والعينين.');
        setFaceValidating(false);
        return;
      }

      // 2. Upload to object storage
      const url = await uploadToStorage(blob, 'avatar.jpg');
      setAvatarUrl(url);
      setFaceValid(true);
    } catch (err: any) {
      setFaceError('حدث خطأ أثناء رفع الصورة. يرجى المحاولة مجدداً.');
    } finally {
      setFaceValidating(false);
    }
  }

  // ─── Step 1: Passport scan + OCR ──────────────────────────────────────────────

  async function handlePassportScan() {
    const asset = await pickPassportImage();
    if (!asset) return;

    setOcrLoading(true);
    setOcrError('');
    setPassportData(null);

    try {
      const blob = await blobFromUri(asset.uri);
      const blobAsFile = new File([blob], 'passport.jpg', { type: blob.type || 'image/jpeg' });

      // Call OCR — the hook sends multipart/form-data automatically
      await ocrMutation.mutateAsync(
        { data: { passportImage: blobAsFile } },
        {
          onSuccess: async (res: any) => {
            const p = res?.passport ?? res?.data?.passport;
            if (!p || p.confidence < 30) {
              setOcrError(
                'لم تتمكن من قراءة بيانات الجواز بوضوح. يرجى التقاط صورة أوضح مع إضاءة جيدة وتجنب الانعكاسات.',
              );
              return;
            }

            const extracted: ExtractedPassport = {
              fullName: p.fullName ?? `${p.givenNames ?? ''} ${p.surname ?? ''}`.trim(),
              nationality: p.nationality ?? '',
              passportNumber: p.passportNumber ?? '',
              dob: p.dateOfBirth ?? '',
              passportIssueDate: p.passportIssueDate ?? '',
              passportExpiry: p.passportExpiry ?? '',
              issuingCountry: p.issuingCountry ?? '',
              gender: p.gender ?? '',
              placeOfBirth: p.placeOfBirth ?? '',
              confidence: p.confidence,
            };

            // Upload passport image to object storage for display
            try {
              const imgUrl = await uploadToStorage(blob, 'passport.jpg');
              setPassportImageUrl(imgUrl);
            } catch {
              // Non-fatal — passport data is still valid
            }

            setPassportData(extracted);
          },
          onError: (err: any) => {
            const msg = err?.data?.error || err?.message || '';
            if (msg.toLowerCase().includes('not detected') || msg.toLowerCase().includes('invalid')) {
              setOcrError('لم يتم التعرف على الجواز. يرجى التحقق من أن الصورة واضحة وتظهر صفحة الجواز كاملة.');
            } else {
              setOcrError('حدث خطأ أثناء قراءة الجواز. يرجى المحاولة مجدداً.');
            }
          },
        },
      );
    } catch (err: any) {
      setOcrError('حدث خطأ غير متوقع. يرجى المحاولة مجدداً.');
    } finally {
      setOcrLoading(false);
    }
  }

  // ─── Residence image upload ────────────────────────────────────────────────────

  async function handleResidenceImage(side: 'front' | 'back') {
    const asset = await pickPassportImage();
    if (!asset) return;
    setResidenceUploading(side);
    try {
      const blob = await blobFromUri(asset.uri);
      const url = await uploadToStorage(blob, `residence_${side}.jpg`);
      if (side === 'front') setResidenceFrontUrl(url);
      else setResidenceBackUrl(url);
    } catch {
      Alert.alert('خطأ', 'تعذّر رفع الصورة. يرجى المحاولة مجدداً.');
    } finally {
      setResidenceUploading(null);
    }
  }

  // ─── Navigation ────────────────────────────────────────────────────────────────

  function handleBack() {
    if (step === 0) router.back();
    else setStep(step - 1);
  }

  async function handleNext() {
    // ── Step 0 validation ──
    if (step === 0) {
      if (!faceValid || !avatarUrl) {
        Alert.alert('صورة الوجه مطلوبة', 'يرجى رفع صورة وجه واضحة والتأكد من اجتياز التحقق.');
        return;
      }
      setStep(1);
      return;
    }

    // ── Step 1 validation ──
    if (step === 1) {
      if (!passportData || !passportData.passportNumber) {
        Alert.alert('مسح الجواز مطلوب', 'يرجى مسح جواز السفر ضوئياً حتى يمكن متابعة التسجيل.');
        return;
      }
      setStep(2);
      return;
    }

    // ── Step 2: Save everything ──
    updateMutation.mutate(
      {
        data: {
          avatarUrl,
          passportImageUrl,
          // Passport fields from OCR
          englishName: passportData?.fullName,
          nationality: passportData?.nationality,
          passportNumber: passportData?.passportNumber,
          passportIssuingCountry: passportData?.issuingCountry,
          passportIssueDate: passportData?.passportIssueDate,
          passportExpiry: passportData?.passportExpiry,
          dob: passportData?.dob,
          gender: passportData?.gender,
          placeOfBirth: passportData?.placeOfBirth,
          // Residence
          residenceType,
          hasGulfResidence: residenceType === 'gcc',
          gulfResidenceFrontUrl: ['gcc', 'schengen', 'uk', 'usa'].includes(residenceType)
            ? residenceFrontUrl
            : '',
          gulfResidenceBackUrl: ['gcc', 'schengen', 'uk', 'usa'].includes(residenceType)
            ? residenceBackUrl
            : '',
        },
      },
      {
        onSuccess: () => {
          setSuccessVisible(true);
          Animated.sequence([
            Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.delay(1800),
            Animated.timing(successOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start(() => {
            setSuccessVisible(false);
            router.back();
          });
        },
        onError: () => {
          Alert.alert('خطأ', 'تعذّر حفظ البيانات. يرجى المحاولة مجدداً.');
        },
      },
    );
  }

  // ─── Step renderers ────────────────────────────────────────────────────────────

  function renderStep0() {
    return (
      <View style={{ alignItems: 'center', gap: 24 }}>
        {/* Title */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 22, textAlign: 'center' }}>
            صورة الوجه الشخصية
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Tajawal_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
            يجب أن تظهر الوجه بوضوح مع العينين والأنف والأذنين{'\n'}سيتم التحقق منها بالذكاء الاصطناعي
          </Text>
        </View>

        {/* Avatar preview */}
        <View style={{ position: 'relative' }}>
          <View
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              borderWidth: 3,
              borderColor: faceValid ? '#22c55e' : 'rgba(255,255,255,0.2)',
              overflow: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 160, height: 160 }}
                contentFit="cover"
              />
            ) : (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Ionicons name="person-outline" size={52} color="rgba(255,255,255,0.3)" />
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Tajawal_400Regular', fontSize: 12 }}>
                  لا توجد صورة
                </Text>
              </View>
            )}
            {faceValidating && <ProcessingOverlay message={'جاري التحقق\nمن صورة الوجه...'} />}
          </View>

          {/* Validated badge */}
          {faceValid && !faceValidating && (
            <View
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#22c55e',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#0a1628',
              }}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
          )}
        </View>

        {/* Validation result */}
        {faceValid && !faceValidating && (
          <View
            style={{
              backgroundColor: 'rgba(34,197,94,0.12)',
              borderRadius: 12,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: 'rgba(34,197,94,0.3)',
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
            <Text style={{ color: '#4ade80', fontFamily: 'Tajawal_700Bold', fontSize: 14 }}>
              تم التحقق من صورة الوجه ✓
            </Text>
          </View>
        )}

        {faceError ? (
          <View
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.3)',
              width: '100%',
            }}
          >
            <Text style={{ color: '#f87171', fontFamily: 'Tajawal_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              {faceError}
            </Text>
          </View>
        ) : null}

        {/* Upload button */}
        <TouchableOpacity
          onPress={handleFaceUpload}
          disabled={faceValidating}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={faceValid ? ['#166534', '#15803d'] : ['#1d4ed8', '#1a56db']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 32,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 10,
              opacity: faceValidating ? 0.6 : 1,
            }}
          >
            <Ionicons name={faceValid ? 'refresh-outline' : 'camera-outline'} size={20} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>
              {faceValid ? 'تغيير الصورة' : 'اختيار صورة الوجه'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Requirements list */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 14,
            padding: 16,
            width: '100%',
            gap: 8,
          }}
        >
          {[
            'صورة واضحة وبإضاءة جيدة',
            'يجب أن يظهر الوجه كاملاً',
            'العينان والأنف والفم مرئيان',
            'بدون نظارات شمسية أو قناع',
            'شخص واحد فقط في الصورة',
          ].map((req, i) => (
            <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#60a5fa" />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Tajawal_400Regular', fontSize: 13 }}>
                {req}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  function renderStep1() {
    return (
      <View style={{ gap: 20 }}>
        {/* Title */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 22, textAlign: 'center' }}>
            مسح جواز السفر
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Tajawal_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
            سيقوم التطبيق بقراءة بيانات الجواز تلقائياً{'\n'}لا حاجة لإدخال أي بيانات يدوياً
          </Text>
        </View>

        {/* Passport preview / scanner */}
        <View style={{ position: 'relative' }}>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: passportData ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.12)',
              borderStyle: passportData ? 'solid' : 'dashed',
              minHeight: 160,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: 20,
            }}
          >
            {passportImageUrl && !ocrLoading ? (
              <Image
                source={{ uri: passportImageUrl }}
                style={{ width: '100%', height: 180, borderRadius: 10 }}
                contentFit="contain"
              />
            ) : !ocrLoading ? (
              <View style={{ alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="scan-outline" size={36} color="#60a5fa" />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Tajawal_400Regular', fontSize: 13, textAlign: 'center' }}>
                  اضغط "مسح الجواز" لرفع صورة جواز السفر
                </Text>
              </View>
            ) : null}
            {ocrLoading && <ProcessingOverlay message={'جاري قراءة بيانات الجواز...\nقد تستغرق بضع ثوانٍ'} />}
          </View>
        </View>

        {/* OCR error */}
        {ocrError ? (
          <View
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.3)',
            }}
          >
            <Text style={{ color: '#f87171', fontFamily: 'Tajawal_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              {ocrError}
            </Text>
          </View>
        ) : null}

        {/* Scan button */}
        <TouchableOpacity onPress={handlePassportScan} disabled={ocrLoading} activeOpacity={0.8}>
          <LinearGradient
            colors={ocrLoading ? ['#374151', '#374151'] : ['#1d4ed8', '#1a56db']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 24,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="scan-outline" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>
              {passportData ? 'إعادة مسح الجواز' : 'مسح جواز السفر'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Extracted data display */}
        {passportData && (
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: 'rgba(34,197,94,0.25)',
              gap: 2,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
              <Text style={{ color: '#4ade80', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>
                تم قراءة بيانات الجواز بنجاح
              </Text>
              <View style={{ flex: 1 }} />
              <View
                style={{
                  backgroundColor: 'rgba(34,197,94,0.15)',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: '#22c55e', fontFamily: 'Tajawal_700Bold', fontSize: 11 }}>
                  {passportData.confidence}%
                </Text>
              </View>
            </View>

            <DataRow label="الاسم الكامل (إنجليزي)" value={passportData.fullName} />
            <DataRow label="الجنسية" value={passportData.nationality} />
            <DataRow label="رقم الجواز" value={passportData.passportNumber} />
            <DataRow label="الجنس" value={GENDER_MAP[passportData.gender] ?? passportData.gender} />
            <DataRow label="تاريخ الميلاد" value={formatDate(passportData.dob)} />
            <DataRow label="تاريخ الإصدار" value={formatDate(passportData.passportIssueDate)} />
            <DataRow label="تاريخ الانتهاء" value={formatDate(passportData.passportExpiry)} />
            <DataRow label="دولة الإصدار" value={passportData.issuingCountry} />
            {passportData.placeOfBirth ? (
              <DataRow label="مكان الميلاد" value={passportData.placeOfBirth} />
            ) : null}

            {/* Low confidence warning */}
            {passportData.confidence < 70 && (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: 'rgba(245,158,11,0.1)',
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(245,158,11,0.3)',
                  flexDirection: 'row-reverse',
                  gap: 10,
                }}
              >
                <Ionicons name="warning-outline" size={18} color="#f59e0b" />
                <Text style={{ flex: 1, color: '#fbbf24', fontFamily: 'Tajawal_400Regular', fontSize: 13, lineHeight: 20 }}>
                  دقة القراءة منخفضة. إذا كانت البيانات غير صحيحة، اضغط "إعادة مسح الجواز" بصورة أوضح.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 14,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal_700Bold', fontSize: 13, textAlign: 'right', marginBottom: 4 }}>
            نصائح للحصول على أفضل نتيجة:
          </Text>
          {[
            'ضع الجواز على سطح مضيء وثابت',
            'التقط الصورة من فوق مباشرة بدون ميل',
            'تجنّب الانعكاسات والظلال',
            'تأكد من وضوح الخطوط السفلية (MRZ)',
          ].map((tip, i) => (
            <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
              <Ionicons name="bulb-outline" size={14} color="#f59e0b" />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal_400Regular', fontSize: 12 }}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  function renderStep2() {
    const needsPermit = residenceType !== 'none';
    return (
      <View style={{ gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 22, textAlign: 'center' }}>
            الإقامة الخارجية
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Tajawal_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
            هل لديك إقامة سارية في إحدى الدول التالية؟
          </Text>
        </View>

        {/* Residence options */}
        {RESIDENCE_OPTIONS.map((opt) => {
          const active = residenceType === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setResidenceType(opt.value)}
              activeOpacity={0.8}
            >
              <View
                style={{
                  backgroundColor: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: active ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <Text style={{ fontSize: 28 }}>{opt.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: active ? '#93c5fd' : '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15, textAlign: 'right' }}>
                    {opt.label}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right' }}>
                    {opt.desc}
                  </Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: active ? '#3b82f6' : 'rgba(255,255,255,0.3)',
                    backgroundColor: active ? '#3b82f6' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' }} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Residence permit images */}
        {needsPermit && (
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 16,
              padding: 16,
              gap: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: '#93c5fd', fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' }}>
              صورة وثيقة الإقامة
            </Text>

            {/* Front */}
            <TouchableOpacity
              onPress={() => handleResidenceImage('front')}
              disabled={residenceUploading === 'front'}
              activeOpacity={0.8}
            >
              <View
                style={{
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderStyle: residenceFrontUrl ? 'solid' : 'dashed',
                  borderColor: residenceFrontUrl ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.2)',
                  minHeight: 80,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  flexDirection: 'row-reverse',
                  gap: 12,
                  padding: 14,
                }}
              >
                {residenceUploading === 'front' ? (
                  <ActivityIndicator color="#60a5fa" />
                ) : residenceFrontUrl ? (
                  <>
                    <Image source={{ uri: residenceFrontUrl }} style={{ width: 56, height: 42, borderRadius: 6 }} contentFit="cover" />
                    <Text style={{ color: '#4ade80', fontFamily: 'Tajawal_700Bold', fontSize: 13 }}>
                      ✓ الوجه الأمامي
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={22} color="rgba(255,255,255,0.4)" />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal_400Regular', fontSize: 13 }}>
                      الوجه الأمامي للإقامة
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Back */}
            <TouchableOpacity
              onPress={() => handleResidenceImage('back')}
              disabled={residenceUploading === 'back'}
              activeOpacity={0.8}
            >
              <View
                style={{
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderStyle: residenceBackUrl ? 'solid' : 'dashed',
                  borderColor: residenceBackUrl ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.2)',
                  minHeight: 80,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  flexDirection: 'row-reverse',
                  gap: 12,
                  padding: 14,
                }}
              >
                {residenceUploading === 'back' ? (
                  <ActivityIndicator color="#60a5fa" />
                ) : residenceBackUrl ? (
                  <>
                    <Image source={{ uri: residenceBackUrl }} style={{ width: 56, height: 42, borderRadius: 6 }} contentFit="cover" />
                    <Text style={{ color: '#4ade80', fontFamily: 'Tajawal_700Bold', fontSize: 13 }}>
                      ✓ الوجه الخلفي
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={22} color="rgba(255,255,255,0.4)" />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal_400Regular', fontSize: 13 }}>
                      الوجه الخلفي للإقامة (اختياري)
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  const isNextLoading = step === 2 && updateMutation.isPending;
  const isNextDisabled =
    (step === 0 && (!faceValid || faceValidating)) ||
    (step === 1 && (!passportData || ocrLoading)) ||
    isNextLoading;

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0a1628', '#0f2040', '#0a1628']} style={{ flex: 1, paddingTop }}>
        {/* Nav bar */}
        <LinearGradient
          colors={['rgba(10,22,40,0.98)', 'rgba(10,22,40,0)']}
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 14,
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{ flex: 1, color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 17, textAlign: 'right' }}>
            اكتمال الملف الشخصي
          </Text>
        </LinearGradient>

        {/* Step header */}
        <StepHeader step={step} total={STEPS.length} />

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </ScrollView>

        {/* Bottom navigation */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: insets.bottom + 16,
            paddingTop: 14,
            paddingHorizontal: 20,
            gap: 10,
            backgroundColor: 'rgba(10,22,40,0.95)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.07)',
          }}
        >
          <TouchableOpacity onPress={handleNext} disabled={isNextDisabled} activeOpacity={0.85}>
            <LinearGradient
              colors={isNextDisabled ? ['#374151', '#374151'] : ['#1d4ed8', '#1a56db']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row-reverse',
                gap: 10,
              }}
            >
              {isNextLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={step === STEPS.length - 1 ? 'checkmark-circle-outline' : 'chevron-back'}
                    size={20}
                    color="#fff"
                  />
                  <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 16 }}>
                    {step === STEPS.length - 1 ? 'حفظ وإتمام الملف الشخصي' : 'التالي'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {step > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              style={{
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Tajawal_400Regular', fontSize: 15 }}>
                الخطوة السابقة
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Success banner */}
        {successVisible && (
          <Animated.View
            style={{
              position: 'absolute',
              top: paddingTop + 10,
              left: 20,
              right: 20,
              opacity: successOpacity,
              zIndex: 99,
            }}
          >
            <LinearGradient
              colors={['#166534', '#15803d']}
              style={{
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 20,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>
                تم حفظ الملف الشخصي بنجاح ✓
              </Text>
            </LinearGradient>
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );
}
