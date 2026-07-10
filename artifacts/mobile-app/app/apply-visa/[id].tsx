import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCreateVisaApplication, useGetVisa } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoAsset {
  uri: string;
  base64: string;
  mimeType: string;
}

interface PhotoValidationResult {
  valid: boolean;
  issues: string[];
  checks?: Record<string, boolean>;
}

interface PassportData {
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  passportNumber: string;
  nationality: string;
  nationalityAr: string;
  gender: string;
  dateOfBirth: string;
  placeOfBirth: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  nationalId: string;
  mrz: string;
}

interface ScanResult {
  valid: boolean;
  issues: string[];
  data: PassportData;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return '';
}

function normalizeValidation(raw: unknown): PhotoValidationResult {
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    return {
      valid: r.valid === true,
      issues: Array.isArray(r.issues) ? (r.issues as unknown[]).map(String) : [],
      checks: (r.checks && typeof r.checks === 'object') ? r.checks as Record<string, boolean> : {},
    };
  }
  return { valid: false, issues: ['استجابة غير متوقعة من الخادم، يرجى المحاولة مجدداً'] };
}

function normalizeScan(raw: unknown): ScanResult {
  const empty: PassportData = {
    firstName: '', middleName: '', lastName: '', fullName: '',
    passportNumber: '', nationality: '', nationalityAr: '', gender: '',
    dateOfBirth: '', placeOfBirth: '', issuingCountry: '', issueDate: '',
    expiryDate: '', nationalId: '', mrz: '',
  };
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    return {
      valid: r.valid === true,
      issues: Array.isArray(r.issues) ? (r.issues as unknown[]).map(String) : [],
      data: r.data && typeof r.data === 'object' ? { ...empty, ...(r.data as PassportData) } : empty,
    };
  }
  return { valid: false, issues: ['استجابة غير متوقعة من الخادم، يرجى المحاولة مجدداً'], data: empty };
}

async function validatePhoto(asset: PhotoAsset): Promise<PhotoValidationResult> {
  const res = await fetch(`${getApiBase()}/api/visas/validate-photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ imageBase64: asset.base64, mimeType: asset.mimeType }),
  });
  if (!res.ok) throw new Error('فشل الاتصال بالخادم');
  return normalizeValidation(await res.json());
}

async function scanPassport(asset: PhotoAsset): Promise<ScanResult> {
  const res = await fetch(`${getApiBase()}/api/visas/scan-passport`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ imageBase64: asset.base64, mimeType: asset.mimeType }),
  });
  if (!res.ok) throw new Error('فشل الاتصال بالخادم');
  return normalizeScan(await res.json());
}

// ─── Image picker helper ──────────────────────────────────────────────────────

async function pickImage(source: 'camera' | 'gallery'): Promise<PhotoAsset | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول للكاميرا من إعدادات التطبيق');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      base64: true,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return null;
    const a = result.assets[0];
    return { uri: a.uri, base64: a.base64 ?? '', mimeType: a.mimeType ?? 'image/jpeg' };
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول لمعرض الصور من إعدادات التطبيق');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      base64: true,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return null;
    const a = result.assets[0];
    return { uri: a.uri, base64: a.base64 ?? '', mimeType: a.mimeType ?? 'image/jpeg' };
  }
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ step, colors }: { step: number; colors: ReturnType<typeof useColors> }) {
  const steps = ['الصورة الشخصية', 'جواز السفر', 'مراجعة وإرسال'];
  return (
    <View style={stepStyles.row}>
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={i}>
            <View style={stepStyles.item}>
              <View style={[stepStyles.circle,
                done && { backgroundColor: colors.primary },
                active && { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.primary },
                !done && !active && { backgroundColor: colors.muted, borderColor: colors.border },
              ]}>
                {done
                  ? <Ionicons name="checkmark" size={13} color="#fff" />
                  : <Text style={[stepStyles.num, { color: active ? '#fff' : colors.mutedForeground }]}>{i + 1}</Text>
                }
              </View>
              <Text style={[stepStyles.label, { color: active ? colors.primary : colors.mutedForeground }]}>{label}</Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[stepStyles.line, { backgroundColor: done ? colors.primary : colors.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 16 },
  item: { alignItems: 'center', width: 80 },
  circle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  num: { fontSize: 12, fontFamily: 'Tajawal_700Bold' },
  label: { fontSize: 10, fontFamily: 'Tajawal_500Medium', textAlign: 'center', marginTop: 4 },
  line: { flex: 1, height: 1.5, marginTop: 13 },
});

// ─── Photo picker card ────────────────────────────────────────────────────────

function PhotoCard({
  photo, label, aspectRatio = 1, colors, onCamera, onGallery,
}: {
  photo: PhotoAsset | null;
  label: string;
  aspectRatio?: number;
  colors: ReturnType<typeof useColors>;
  onCamera: () => void;
  onGallery: () => void;
}) {
  const slotH = aspectRatio === 1 ? 180 : 140;

  return (
    <View style={{ gap: 12 }}>
      <Text style={[photoStyles.label, { color: colors.foreground }]}>{label}</Text>
      <View style={[photoStyles.slot, { height: slotH, backgroundColor: colors.muted, borderColor: colors.border }]}>
        {photo
          ? <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode={aspectRatio === 1 ? 'cover' : 'contain'} />
          : (
            <View style={photoStyles.placeholder}>
              <Ionicons name={aspectRatio === 1 ? 'person-outline' : 'card-outline'} size={40} color={colors.mutedForeground} />
            </View>
          )
        }
      </View>
      <View style={photoStyles.btnRow}>
        <TouchableOpacity style={[photoStyles.btn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onCamera} activeOpacity={0.75}>
          <Ionicons name="camera-outline" size={18} color={colors.primary} />
          <Text style={[photoStyles.btnText, { color: colors.foreground }]}>الكاميرا</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[photoStyles.btn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onGallery} activeOpacity={0.75}>
          <Ionicons name="images-outline" size={18} color={colors.primary} />
          <Text style={[photoStyles.btnText, { color: colors.foreground }]}>المعرض</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const photoStyles = StyleSheet.create({
  label: { fontSize: 15, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },
  slot: { borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  placeholder: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  btnRow: { flexDirection: 'row-reverse', gap: 10 },
  btn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  btnText: { fontFamily: 'Tajawal_600SemiBold', fontSize: 14 },
});

// ─── Validation feedback ──────────────────────────────────────────────────────

function ValidationFeedback({ result, colors }: { result: PhotoValidationResult; colors: ReturnType<typeof useColors> }) {
  if (result.valid) {
    return (
      <View style={[vStyles.box, { backgroundColor: '#0a2a0a', borderColor: '#2a6a2a' }]}>
        <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
        <Text style={[vStyles.text, { color: '#4caf50' }]}>الصورة مطابقة للمتطلبات ✓</Text>
      </View>
    );
  }
  return (
    <View style={[vStyles.box, { backgroundColor: '#2a0a0a', borderColor: '#8b2020', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }]}>
      <View style={{ flexDirection: 'row-reverse', gap: 8, alignItems: 'center' }}>
        <Ionicons name="close-circle" size={20} color="#ef5350" />
        <Text style={[vStyles.text, { color: '#ef5350' }]}>الصورة غير مقبولة</Text>
      </View>
      {result.issues.map((issue, i) => (
        <View key={i} style={{ flexDirection: 'row-reverse', gap: 6, alignItems: 'flex-start' }}>
          <Text style={{ color: '#ef9a9a', fontSize: 13 }}>•</Text>
          <Text style={[vStyles.issue, { color: '#ef9a9a' }]}>{issue}</Text>
        </View>
      ))}
    </View>
  );
}

const vStyles = StyleSheet.create({
  box: { borderRadius: 10, borderWidth: 1, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  text: { fontFamily: 'Tajawal_700Bold', fontSize: 14, flex: 1, textAlign: 'right' },
  issue: { fontFamily: 'Tajawal_400Regular', fontSize: 13, flex: 1, textAlign: 'right' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ApplyVisaScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data: visa } = useGetVisa(Number(id));
  const createMutation = useCreateVisaApplication();

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const paddingBottom = Platform.OS === 'web' ? 34 : insets.bottom;

  // Steps: 0 = personal photo, 1 = passport photo, 2 = review + submit
  const [step, setStep] = useState(0);

  // Photos
  const [personalPhoto, setPersonalPhoto] = useState<PhotoAsset | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<PhotoAsset | null>(null);

  // Step 0 — photo validation
  const [photoValidating, setPhotoValidating] = useState(false);
  const [photoValidation, setPhotoValidation] = useState<PhotoValidationResult | null>(null);

  // Step 1 — passport scan
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Form state (step 2)
  const [form, setForm] = useState({
    fullName: '', firstName: '', middleName: '', lastName: '',
    passportNumber: '', nationality: '', gender: '', dob: '',
    placeOfBirth: '', issuingCountry: '', issueDate: '', expiryDate: '',
    nationalId: '',
    // extra required by backend
    phone: '', email: '', occupation: '', city: '',
  });

  const [submitting, setSubmitting] = useState(false);

  function updateField(key: keyof typeof form) {
    return (val: string) => setForm(prev => ({ ...prev, [key]: val }));
  }

  // ── Not authenticated guard ─────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={[S.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.mutedForeground} />
        <Text style={[S.lockText, { color: colors.foreground }]}>يجب تسجيل الدخول أولاً</Text>
        <TouchableOpacity style={[S.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/auth/login')}>
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Photo picker handlers ───────────────────────────────────────────────────

  async function handlePersonalPhoto(source: 'camera' | 'gallery') {
    const asset = await pickImage(source);
    if (!asset) return;
    setPersonalPhoto(asset);
    setPhotoValidation(null);
    setPhotoValidating(true);
    try {
      const result = await validatePhoto(asset);
      setPhotoValidation(result);
    } catch {
      setPhotoValidation({ valid: false, issues: ['تعذر الاتصال بالخادم، يرجى المحاولة مجدداً'] });
    } finally {
      setPhotoValidating(false);
    }
  }

  async function handlePassportPhoto(source: 'camera' | 'gallery') {
    const asset = await pickImage(source);
    if (!asset) return;
    setPassportPhoto(asset);
    setScanResult(null);
    setScanError(null);
  }

  async function handleScanPassport() {
    if (!passportPhoto) return;
    setScanning(true);
    setScanError(null);
    try {
      const result = await scanPassport(passportPhoto);
      setScanResult(result);
      if (result.valid && result.data) {
        const d = result.data;
        setForm(prev => ({
          ...prev,
          fullName: d.fullName || `${d.firstName} ${d.middleName} ${d.lastName}`.trim(),
          firstName: d.firstName || '',
          middleName: d.middleName || '',
          lastName: d.lastName || '',
          passportNumber: d.passportNumber || '',
          nationality: d.nationalityAr || d.nationality || '',
          gender: d.gender === 'M' ? 'ذكر' : d.gender === 'F' ? 'أنثى' : '',
          dob: d.dateOfBirth || '',
          placeOfBirth: d.placeOfBirth || '',
          issuingCountry: d.issuingCountry || '',
          issueDate: d.issueDate || '',
          expiryDate: d.expiryDate || '',
          nationalId: d.nationalId || '',
        }));
        setStep(2);
      }
    } catch (e) {
      setScanError('تعذر قراءة الجواز، يرجى المحاولة مجدداً');
    } finally {
      setScanning(false);
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const required: Array<keyof typeof form> = ['fullName', 'passportNumber', 'nationality', 'dob', 'expiryDate', 'gender', 'phone'];
    for (const key of required) {
      if (!form[key].trim()) {
        Alert.alert('بيانات ناقصة', `يرجى ملء الحقل: ${fieldLabels[key] ?? key}`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const result = await createMutation.mutateAsync({
        data: {
          visaId: Number(id),
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          nationality: form.nationality,
          passportNumber: form.passportNumber,
          passportExpiry: form.expiryDate,
          dob: form.dob,
          gender: form.gender,
          occupation: form.occupation,
          city: form.city,
        },
      });
      Alert.alert(
        '✅ تم إرسال الطلب',
        `رقم الطلب: ${result.referenceNumber}\nسيتم التواصل معك قريباً.`,
        [{ text: 'حسناً', onPress: () => router.push('/bookings') }],
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'حدث خطأ أثناء الإرسال';
      Alert.alert('خطأ', msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const inputStyle = [S.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }];
  const sectionCardStyle = [S.card, { backgroundColor: colors.card, borderColor: colors.border }];

  return (
    <View style={[S.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[S.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(s => s - 1) : router.back())}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>تقديم طلب التأشيرة</Text>
      </View>

      {/* Visa banner */}
      {visa && (
        <View style={[S.visaBanner, { backgroundColor: colors.primary }]}>
          <Text style={S.visaBannerText}>{visa.countryName} — {visa.currency} {visa.price}</Text>
        </View>
      )}

      {/* Step indicator */}
      <StepBar step={step} colors={colors} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: paddingBottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ────────── STEP 0: Personal Photo ────────── */}
        {step === 0 && (
          <View style={{ gap: 16 }}>
            <View style={sectionCardStyle}>
              <Text style={[S.sectionTitle, { color: colors.foreground }]}>الصورة الشخصية</Text>
              <Text style={[S.sectionDesc, { color: colors.mutedForeground }]}>
                يجب أن تكون الصورة ملونة بخلفية بيضاء، الوجه ظاهر بالكامل وللأمام، بدون نظارات شمسية
              </Text>

              <PhotoCard
                photo={personalPhoto}
                label="اختر الصورة الشخصية"
                aspectRatio={1}
                colors={colors}
                onCamera={() => handlePersonalPhoto('camera')}
                onGallery={() => handlePersonalPhoto('gallery')}
              />

              {/* Validation states */}
              {photoValidating && (
                <View style={[vStyles.box, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[vStyles.text, { color: colors.mutedForeground }]}>جاري التحقق من الصورة...</Text>
                </View>
              )}
              {photoValidation && !photoValidating && (
                <ValidationFeedback result={photoValidation} colors={colors} />
              )}
            </View>

            {/* Requirements list */}
            <View style={[sectionCardStyle, { gap: 8 }]}>
              <Text style={[S.sectionTitle, { color: colors.foreground }]}>متطلبات الصورة الشخصية</Text>
              {[
                'خلفية بيضاء أو فاتحة اللون',
                'وجه واضح وكامل ومواجه للأمام',
                'جودة عالية وبدون ضبابية',
                'بدون نظارات شمسية',
                'بدون قبعة (الحجاب مقبول)',
                'صورة حديثة وملونة',
              ].map((r, i) => (
                <View key={i} style={{ flexDirection: 'row-reverse', gap: 8, alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                  <Text style={[S.reqText, { color: colors.mutedForeground }]}>{r}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[S.nextBtn, { backgroundColor: colors.primary, opacity: photoValidation?.valid ? 1 : 0.4 }]}
              onPress={() => setStep(1)}
              disabled={!photoValidation?.valid}
              activeOpacity={0.85}
            >
              <Text style={S.nextBtnText}>التالي — صورة الجواز</Text>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ────────── STEP 1: Passport Photo ────────── */}
        {step === 1 && (
          <View style={{ gap: 16 }}>
            <View style={sectionCardStyle}>
              <Text style={[S.sectionTitle, { color: colors.foreground }]}>صورة جواز السفر</Text>
              <Text style={[S.sectionDesc, { color: colors.mutedForeground }]}>
                تأكد من ظهور الجواز كاملاً وبوضوح، بدون انعكاس للضوء، وأن جميع الأطراف مرئية
              </Text>

              <PhotoCard
                photo={passportPhoto}
                label="صوّر صفحة البيانات الرئيسية"
                aspectRatio={1.5}
                colors={colors}
                onCamera={() => handlePassportPhoto('camera')}
                onGallery={() => handlePassportPhoto('gallery')}
              />

              {/* Scan button */}
              {passportPhoto && !scanning && !scanResult && (
                <TouchableOpacity
                  style={[S.scanBtn, { backgroundColor: colors.primary }]}
                  onPress={handleScanPassport}
                  activeOpacity={0.85}
                >
                  <Ionicons name="scan-outline" size={20} color="#fff" />
                  <Text style={S.scanBtnText}>قراءة بيانات الجواز تلقائياً</Text>
                </TouchableOpacity>
              )}

              {/* Scanning progress */}
              {scanning && (
                <View style={[S.scanProgress, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[S.scanProgressTitle, { color: colors.foreground }]}>جاري قراءة الجواز...</Text>
                    <Text style={[S.scanProgressSub, { color: colors.mutedForeground }]}>يتم استخراج البيانات تلقائياً</Text>
                  </View>
                </View>
              )}

              {/* Scan result feedback */}
              {scanResult && !scanning && (
                <View>
                  {scanResult.valid ? (
                    <View style={[vStyles.box, { backgroundColor: '#0a2a0a', borderColor: '#2a6a2a' }]}>
                      <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
                      <Text style={[vStyles.text, { color: '#4caf50' }]}>تم استخراج البيانات بنجاح ✓</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 8 }}>
                      <View style={[vStyles.box, { backgroundColor: '#2a0a0a', borderColor: '#8b2020', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }]}>
                        <View style={{ flexDirection: 'row-reverse', gap: 8, alignItems: 'center' }}>
                          <Ionicons name="alert-circle" size={20} color="#ef5350" />
                          <Text style={[vStyles.text, { color: '#ef5350' }]}>مشكلة في قراءة الجواز</Text>
                        </View>
                        {scanResult.issues.map((issue, i) => (
                          <View key={i} style={{ flexDirection: 'row-reverse', gap: 6 }}>
                            <Text style={{ color: '#ef9a9a' }}>•</Text>
                            <Text style={[vStyles.issue, { color: '#ef9a9a' }]}>{issue}</Text>
                          </View>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={[S.scanBtn, { backgroundColor: colors.primary }]}
                        onPress={handleScanPassport}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="refresh-outline" size={18} color="#fff" />
                        <Text style={S.scanBtnText}>إعادة المحاولة</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {scanError && (
                <View style={[vStyles.box, { backgroundColor: '#2a0a0a', borderColor: '#8b2020' }]}>
                  <Ionicons name="wifi-outline" size={20} color="#ef5350" />
                  <Text style={[vStyles.text, { color: '#ef5350' }]}>{scanError}</Text>
                </View>
              )}
            </View>

            {/* Requirements */}
            <View style={[sectionCardStyle, { gap: 8 }]}>
              <Text style={[S.sectionTitle, { color: colors.foreground }]}>متطلبات صورة الجواز</Text>
              {[
                'صفحة البيانات ظاهرة بالكامل',
                'جميع أطراف الجواز مرئية',
                'صورة واضحة وغير مهزوزة',
                'بدون انعكاس للإضاءة',
                'إضاءة مناسبة وموحدة',
              ].map((r, i) => (
                <View key={i} style={{ flexDirection: 'row-reverse', gap: 8, alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                  <Text style={[S.reqText, { color: colors.mutedForeground }]}>{r}</Text>
                </View>
              ))}
            </View>

            {/* Skip to manual — only show if no scan or scan failed */}
            {!scanResult?.valid && (
              <TouchableOpacity
                style={[S.skipManual, { borderColor: colors.border }]}
                onPress={() => setStep(2)}
                activeOpacity={0.75}
              >
                <Text style={[S.skipManualText, { color: colors.mutedForeground }]}>إدخال البيانات يدوياً بدون مسح</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ────────── STEP 2: Review & Submit ────────── */}
        {step === 2 && (
          <View style={{ gap: 14 }}>
            {/* Photo previews */}
            <View style={[sectionCardStyle, { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' }]}>
              {personalPhoto && (
                <Image source={{ uri: personalPhoto.uri }} style={S.thumbPersonal} />
              )}
              {passportPhoto && (
                <Image source={{ uri: passportPhoto.uri }} style={S.thumbPassport} resizeMode="contain" />
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[{ color: colors.foreground, fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' }]}>المستندات المرفقة</Text>
                <Text style={[{ color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right' }]}>الصورة الشخصية وصورة الجواز</Text>
              </View>
            </View>

            {/* Passport data fields */}
            <View style={sectionCardStyle}>
              <Text style={[S.sectionTitle, { color: colors.foreground }]}>بيانات الجواز</Text>
              {[
                { key: 'fullName' as const, label: 'الاسم الكامل *', keyboard: 'default' },
                { key: 'passportNumber' as const, label: 'رقم الجواز *', keyboard: 'default' },
                { key: 'nationality' as const, label: 'الجنسية *', keyboard: 'default' },
                { key: 'gender' as const, label: 'الجنس *', keyboard: 'default', placeholder: 'ذكر / أنثى' },
                { key: 'dob' as const, label: 'تاريخ الميلاد *', keyboard: 'default', placeholder: 'YYYY-MM-DD' },
                { key: 'placeOfBirth' as const, label: 'مكان الميلاد', keyboard: 'default' },
                { key: 'issuingCountry' as const, label: 'دولة الإصدار', keyboard: 'default' },
                { key: 'issueDate' as const, label: 'تاريخ الإصدار', keyboard: 'default', placeholder: 'YYYY-MM-DD' },
                { key: 'expiryDate' as const, label: 'تاريخ الانتهاء *', keyboard: 'default', placeholder: 'YYYY-MM-DD' },
                { key: 'nationalId' as const, label: 'رقم الهوية الوطنية', keyboard: 'default' },
              ].map(f => (
                <View key={f.key}>
                  <Text style={[S.label, { color: colors.mutedForeground }]}>{f.label}</Text>
                  <TextInput
                    style={inputStyle}
                    value={form[f.key]}
                    onChangeText={updateField(f.key)}
                    keyboardType={(f.keyboard ?? 'default') as any}
                    placeholder={f.placeholder ?? ''}
                    placeholderTextColor={colors.mutedForeground}
                    textAlign="right"
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </View>

            {/* Contact & extra info */}
            <View style={sectionCardStyle}>
              <Text style={[S.sectionTitle, { color: colors.foreground }]}>معلومات التواصل</Text>
              {[
                { key: 'phone' as const, label: 'رقم الهاتف *', keyboard: 'phone-pad', placeholder: '+964 7XX XXXX' },
                { key: 'email' as const, label: 'البريد الإلكتروني', keyboard: 'email-address', placeholder: 'example@email.com' },
                { key: 'occupation' as const, label: 'المهنة', keyboard: 'default', placeholder: 'مهندس، طبيب...' },
                { key: 'city' as const, label: 'مدينة الإقامة', keyboard: 'default', placeholder: 'بغداد' },
              ].map(f => (
                <View key={f.key}>
                  <Text style={[S.label, { color: colors.mutedForeground }]}>{f.label}</Text>
                  <TextInput
                    style={inputStyle}
                    value={form[f.key]}
                    onChangeText={updateField(f.key)}
                    keyboardType={(f.keyboard ?? 'default') as any}
                    placeholder={f.placeholder ?? ''}
                    placeholderTextColor={colors.mutedForeground}
                    textAlign="right"
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer action */}
      {step === 2 && (
        <View style={[S.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: paddingBottom + 16 }]}>
          <TouchableOpacity
            style={[S.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.submitBtnText}>إرسال الطلب</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Field labels map ─────────────────────────────────────────────────────────

const fieldLabels: Partial<Record<string, string>> = {
  fullName: 'الاسم الكامل',
  passportNumber: 'رقم الجواز',
  nationality: 'الجنسية',
  gender: 'الجنس',
  dob: 'تاريخ الميلاد',
  expiryDate: 'تاريخ الانتهاء',
  phone: 'رقم الهاتف',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },
  lockText: { fontSize: 16, fontFamily: 'Tajawal_500Medium', textAlign: 'center' },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20, marginTop: 8 },

  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' },

  visaBanner: { padding: 12, alignItems: 'center' },
  visaBannerText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 14 },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
  sectionDesc: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right', lineHeight: 20 },

  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 5, marginTop: 8 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontFamily: 'Tajawal_400Regular', fontSize: 14 },

  reqText: { fontSize: 13, fontFamily: 'Tajawal_400Regular', flex: 1, textAlign: 'right' },

  nextBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, borderRadius: 14 },
  nextBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },

  scanBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 4 },
  scanBtnText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 },

  scanProgress: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  scanProgressTitle: { fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' },
  scanProgressSub: { fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right' },

  skipManual: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  skipManualText: { fontFamily: 'Tajawal_500Medium', fontSize: 14 },

  thumbPersonal: { width: 60, height: 60, borderRadius: 8 },
  thumbPassport: { width: 90, height: 60, borderRadius: 8, backgroundColor: '#111' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
});
