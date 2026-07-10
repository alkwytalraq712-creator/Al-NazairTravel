import React, { useEffect, useState } from 'react';
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
import { useAuth, getAuthToken } from '@/context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoAsset { uri: string; base64: string; mimeType: string }
interface PhotoValidation { valid: boolean; issues: string[] }
interface PassportData {
  firstName: string; middleName: string; lastName: string; fullName: string;
  passportNumber: string; nationality: string; nationalityAr: string; gender: string;
  dateOfBirth: string; placeOfBirth: string; issuingCountry: string;
  issueDate: string; expiryDate: string; nationalId: string; mrz: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiBase(): string {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : '';
}

async function pickImage(source: 'camera' | 'gallery'): Promise<PhotoAsset | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول للكاميرا'); return null; }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85, base64: true, allowsEditing: true });
    if (r.canceled || !r.assets[0]) return null;
    const a = r.assets[0];
    return { uri: a.uri, base64: a.base64 ?? '', mimeType: a.mimeType ?? 'image/jpeg' };
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') { Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول للمعرض'); return null; }
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, base64: true, allowsEditing: true });
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  return { uri: a.uri, base64: a.base64 ?? '', mimeType: a.mimeType ?? 'image/jpeg' };
}

// ─── Step Bar ─────────────────────────────────────────────────────────────────

function StepBar({ step, colors }: { step: number; colors: any }) {
  const steps = ['الصور', 'بيانات الجواز', 'تواصل وإرسال'];
  return (
    <View style={SB.row}>
      {steps.map((label, i) => {
        const done = i < step, active = i === step;
        return (
          <React.Fragment key={i}>
            <View style={SB.item}>
              <View style={[SB.circle,
                done && { backgroundColor: colors.primary, borderColor: colors.primary },
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
                !done && !active && { backgroundColor: 'transparent', borderColor: colors.border },
              ]}>
                {done
                  ? <Ionicons name="checkmark" size={13} color="#fff" />
                  : <Text style={[SB.num, { color: active ? '#fff' : colors.mutedForeground }]}>{i + 1}</Text>}
              </View>
              <Text style={[SB.label, { color: active ? colors.primary : colors.mutedForeground }]} numberOfLines={1}>{label}</Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[SB.line, { backgroundColor: done ? colors.primary : colors.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
const SB = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14 },
  item: { alignItems: 'center', width: 80 },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 12, fontFamily: 'Tajawal_700Bold' },
  label: { fontSize: 10, fontFamily: 'Tajawal_500Medium', textAlign: 'center', marginTop: 4 },
  line: { flex: 1, height: 1.5, marginTop: 13 },
});

// ─── Photo Card ───────────────────────────────────────────────────────────────

function PhotoCard({ photo, label, ratio = 1, colors, onCamera, onGallery }: {
  photo: PhotoAsset | null; label: string; ratio?: number;
  colors: any; onCamera: () => void; onGallery: () => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={[PC.label, { color: colors.foreground }]}>{label}</Text>
      <View style={[PC.slot, { height: ratio === 1 ? 170 : 130, backgroundColor: colors.muted, borderColor: colors.border }]}>
        {photo
          ? <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={PC.empty}><Ionicons name={ratio === 1 ? 'person-outline' : 'card-outline'} size={38} color={colors.mutedForeground} /></View>}
      </View>
      <View style={PC.btns}>
        <TouchableOpacity style={[PC.btn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onCamera} activeOpacity={0.75}>
          <Ionicons name="camera-outline" size={17} color={colors.primary} />
          <Text style={[PC.btnText, { color: colors.foreground }]}>الكاميرا</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[PC.btn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onGallery} activeOpacity={0.75}>
          <Ionicons name="images-outline" size={17} color={colors.primary} />
          <Text style={[PC.btnText, { color: colors.foreground }]}>المعرض</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const PC = StyleSheet.create({
  label: { fontSize: 14, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },
  slot: { borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  btns: { flexDirection: 'row-reverse', gap: 10 },
  btn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  btnText: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },
});

// ─── Gender Picker ────────────────────────────────────────────────────────────

function GenderPicker({ value, onChange, colors }: { value: string; onChange: (v: string) => void; colors: any }) {
  return (
    <View style={GP.row}>
      {['ذكر', 'أنثى'].map(g => {
        const active = value === g;
        return (
          <TouchableOpacity key={g} onPress={() => onChange(g)} activeOpacity={0.8}
            style={[GP.btn, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.card }]}>
            <Ionicons name={g === 'ذكر' ? 'male-outline' : 'female-outline'} size={16} color={active ? '#fff' : colors.mutedForeground} />
            <Text style={[GP.txt, { color: active ? '#fff' : colors.foreground }]}>{g}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const GP = StyleSheet.create({
  row: { flexDirection: 'row-reverse', gap: 10 },
  btn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5 },
  txt: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
});

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, keyboard, colors, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboard?: any; colors: any; required?: boolean;
}) {
  return (
    <View style={{ gap: 5, marginBottom: 10 }}>
      <Text style={[F.label, { color: colors.mutedForeground }]}>{label}{required && <Text style={{ color: '#ef5350' }}> *</Text>}</Text>
      <TextInput
        style={[F.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
        value={value} onChangeText={onChange} placeholder={placeholder ?? ''}
        placeholderTextColor={colors.mutedForeground} keyboardType={keyboard ?? 'default'}
        textAlign="right" autoCapitalize="none"
      />
    </View>
  );
}
const F = StyleSheet.create({
  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right' },
  input: { paddingHorizontal: 14, paddingVertical: 13, borderRadius: 10, borderWidth: 1, fontFamily: 'Tajawal_400Regular', fontSize: 14 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ApplyVisaScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const { data: visa } = useGetVisa(Number(id));
  const createMutation = useCreateVisaApplication();

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const paddingBottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const [step, setStep] = useState(0);

  // Photos
  const [personalPhoto, setPersonalPhoto] = useState<PhotoAsset | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<PhotoAsset | null>(null);

  // Passport scan
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanError, setScanError] = useState('');

  // Photo validation
  const [validating, setValidating] = useState(false);
  const [photoValid, setPhotoValid] = useState<PhotoValidation | null>(null);

  // Form
  const [form, setForm] = useState({
    fullName: '', passportNumber: '', nationality: 'عراقية', gender: '',
    dob: '', placeOfBirth: '', issuingCountry: 'العراق',
    issueDate: '', expiryDate: '', nationalId: '',
    phone: '', email: '', occupation: '', city: 'بغداد',
  });

  // Pre-fill from logged-in user
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  function set(key: keyof typeof form) { return (v: string) => setForm(p => ({ ...p, [key]: v })); }

  // Guard
  if (!isAuthenticated) {
    return (
      <View style={[S.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.mutedForeground} />
        <Text style={[S.lockText, { color: colors.foreground }]}>يجب تسجيل الدخول أولاً</Text>
        <TouchableOpacity style={[S.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/auth/login')}>
          <Text style={S.primaryBtnText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Photo handlers ──────────────────────────────────────────────────────────

  async function handlePersonalPhoto(source: 'camera' | 'gallery') {
    const asset = await pickImage(source);
    if (!asset) return;
    setPersonalPhoto(asset);
    setPhotoValid(null);
    setValidating(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getApiBase()}/api/visas/validate-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ imageBase64: asset.base64, mimeType: asset.mimeType }),
      });
      const data: any = await res.json().catch(() => ({}));
      setPhotoValid({ valid: data?.valid === true, issues: Array.isArray(data?.issues) ? data.issues : [] });
    } catch {
      setPhotoValid({ valid: false, issues: ['تعذر التحقق من الصورة'] });
    } finally { setValidating(false); }
  }

  async function handlePassportPhoto(source: 'camera' | 'gallery') {
    const asset = await pickImage(source);
    if (!asset) return;
    setPassportPhoto(asset);
    setScanDone(false);
    setScanError('');
  }

  async function handleScan() {
    if (!passportPhoto) return;
    setScanning(true);
    setScanError('');
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getApiBase()}/api/visas/scan-passport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ imageBase64: passportPhoto.base64, mimeType: passportPhoto.mimeType }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (data?.valid && data?.data) {
        const d: PassportData = data.data;
        setForm(prev => ({
          ...prev,
          fullName: d.fullName || `${d.firstName} ${d.middleName} ${d.lastName}`.replace(/\s+/g, ' ').trim() || prev.fullName,
          passportNumber: d.passportNumber || prev.passportNumber,
          nationality: d.nationalityAr || d.nationality || prev.nationality,
          gender: d.gender === 'M' ? 'ذكر' : d.gender === 'F' ? 'أنثى' : prev.gender,
          dob: d.dateOfBirth || prev.dob,
          placeOfBirth: d.placeOfBirth || prev.placeOfBirth,
          issuingCountry: d.issuingCountry || prev.issuingCountry,
          issueDate: d.issueDate || prev.issueDate,
          expiryDate: d.expiryDate || prev.expiryDate,
          nationalId: d.nationalId || prev.nationalId,
        }));
        setScanDone(true);
        setStep(1); // Auto-advance to passport data step
      } else {
        const issues: string[] = Array.isArray(data?.issues) ? data.issues : [];
        setScanError(issues.join(' — ') || 'تعذر قراءة الجواز، يرجى المحاولة أو الإدخال اليدوي');
      }
    } catch {
      setScanError('تعذر الاتصال بالخادم');
    } finally { setScanning(false); }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const checks: Array<[keyof typeof form, string]> = [
      ['fullName', 'الاسم الكامل'],
      ['passportNumber', 'رقم الجواز'],
      ['nationality', 'الجنسية'],
      ['gender', 'الجنس'],
      ['dob', 'تاريخ الميلاد'],
      ['expiryDate', 'تاريخ انتهاء الجواز'],
      ['phone', 'رقم الهاتف'],
      ['email', 'البريد الإلكتروني'],
      ['occupation', 'المهنة'],
      ['city', 'مدينة الإقامة'],
    ];
    for (const [key, label] of checks) {
      if (!form[key].trim()) {
        Alert.alert('بيانات ناقصة', `يرجى ملء حقل: ${label}`);
        return;
      }
    }
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
        '✅ تم إرسال الطلب بنجاح',
        `رقم الطلب: ${result.referenceNumber}\n\nسيتم مراجعة طلبك والتواصل معك خلال ${visa?.processingTime ?? 'أيام قليلة'}.`,
        [{ text: 'عرض طلباتي', onPress: () => router.push('/bookings') }],
      );
    } catch (e: any) {
      Alert.alert('خطأ في الإرسال', e?.message ?? 'حدث خطأ، يرجى المحاولة مجدداً');
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const card = [S.card, { backgroundColor: colors.card, borderColor: colors.border }];

  return (
    <View style={[S.screen, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[S.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>
          {step === 0 ? 'المستندات والصور' : step === 1 ? 'بيانات جواز السفر' : 'التواصل والإرسال'}
        </Text>
      </View>

      {/* Visa banner */}
      {visa && (
        <View style={[S.banner, { backgroundColor: colors.primary + '22', borderBottomColor: colors.primary + '44' }]}>
          <Ionicons name="flag-outline" size={14} color={colors.primary} />
          <Text style={[S.bannerText, { color: colors.primary }]}>
            {visa.countryName} — {visa.visaType === 'tourism' ? 'سياحية' : visa.visaType === 'business' ? 'عمل' : visa.visaType} — {visa.currency} {visa.price}
          </Text>
        </View>
      )}

      {/* Step bar */}
      <StepBar step={step} colors={colors} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: paddingBottom + 120 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══════════ STEP 0: Photos ══════════ */}
        {step === 0 && (
          <View style={{ gap: 14 }}>

            {/* Personal photo */}
            <View style={card}>
              <Text style={[S.cardTitle, { color: colors.foreground }]}>📷 الصورة الشخصية</Text>
              <Text style={[S.cardDesc, { color: colors.mutedForeground }]}>
                خلفية بيضاء — وجه واضح — بدون نظارات شمسية
              </Text>
              <PhotoCard photo={personalPhoto} label="" ratio={1} colors={colors}
                onCamera={() => handlePersonalPhoto('camera')}
                onGallery={() => handlePersonalPhoto('gallery')} />

              {validating && (
                <View style={[S.feedbackRow, { backgroundColor: colors.muted }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[S.feedbackText, { color: colors.mutedForeground }]}>جاري التحقق من الصورة...</Text>
                </View>
              )}
              {photoValid && !validating && (
                <View style={[S.feedbackRow, {
                  backgroundColor: photoValid.valid ? '#0a2a0a' : '#2a0a0a',
                  borderWidth: 1, borderColor: photoValid.valid ? '#2a6a2a' : '#8b2020',
                }]}>
                  <Ionicons name={photoValid.valid ? 'checkmark-circle' : 'close-circle'} size={18}
                    color={photoValid.valid ? '#4caf50' : '#ef5350'} />
                  <Text style={[S.feedbackText, { color: photoValid.valid ? '#4caf50' : '#ef9a9a', flex: 1 }]}>
                    {photoValid.valid ? 'الصورة مقبولة ✓' : (photoValid.issues[0] ?? 'الصورة غير مقبولة')}
                  </Text>
                </View>
              )}
            </View>

            {/* Passport photo */}
            <View style={card}>
              <Text style={[S.cardTitle, { color: colors.foreground }]}>🛂 صورة جواز السفر</Text>
              <Text style={[S.cardDesc, { color: colors.mutedForeground }]}>
                صوّر صفحة البيانات كاملة — بدون انعكاس ضوء
              </Text>
              <PhotoCard photo={passportPhoto} label="" ratio={1.5} colors={colors}
                onCamera={() => handlePassportPhoto('camera')}
                onGallery={() => handlePassportPhoto('gallery')} />

              {passportPhoto && !scanning && !scanDone && (
                <TouchableOpacity style={[S.scanBtn, { backgroundColor: colors.primary }]} onPress={handleScan} activeOpacity={0.85}>
                  <Ionicons name="scan-outline" size={18} color="#fff" />
                  <Text style={S.scanBtnText}>استخراج البيانات تلقائياً (AI)</Text>
                </TouchableOpacity>
              )}
              {scanning && (
                <View style={[S.feedbackRow, { backgroundColor: colors.muted }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[S.feedbackText, { color: colors.mutedForeground }]}>جاري قراءة بيانات الجواز...</Text>
                </View>
              )}
              {scanDone && (
                <View style={[S.feedbackRow, { backgroundColor: '#0a2a0a', borderWidth: 1, borderColor: '#2a6a2a' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#4caf50" />
                  <Text style={[S.feedbackText, { color: '#4caf50' }]}>تم استخراج البيانات بنجاح ✓</Text>
                </View>
              )}
              {scanError.length > 0 && (
                <View style={{ gap: 8 }}>
                  <View style={[S.feedbackRow, { backgroundColor: '#2a0a0a', borderWidth: 1, borderColor: '#8b2020' }]}>
                    <Ionicons name="alert-circle" size={18} color="#ef5350" />
                    <Text style={[S.feedbackText, { color: '#ef9a9a', flex: 1 }]}>{scanError}</Text>
                  </View>
                  <TouchableOpacity style={[S.scanBtn, { backgroundColor: colors.primary }]} onPress={handleScan} activeOpacity={0.85}>
                    <Ionicons name="refresh-outline" size={17} color="#fff" />
                    <Text style={S.scanBtnText}>إعادة المحاولة</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Next */}
            <TouchableOpacity style={[S.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep(1)} activeOpacity={0.85}>
              <Text style={S.primaryBtnText}>التالي — بيانات الجواز</Text>
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={[S.skipText, { color: colors.mutedForeground }]}>تخطي — إدخال البيانات يدوياً</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════ STEP 1: Passport Data ══════════ */}
        {step === 1 && (
          <View style={{ gap: 14 }}>
            <View style={card}>
              <Text style={[S.cardTitle, { color: colors.foreground }]}>بيانات الجواز</Text>
              {scanDone && (
                <View style={[S.feedbackRow, { backgroundColor: '#0a2a0a', borderWidth: 1, borderColor: '#2a6a2a' }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                  <Text style={[S.feedbackText, { color: '#4caf50' }]}>تم ملء البيانات تلقائياً — يمكنك التعديل</Text>
                </View>
              )}

              <Field label="الاسم الكامل" value={form.fullName} onChange={set('fullName')}
                placeholder="محمد أحمد علي" colors={colors} required />
              <Field label="رقم الجواز" value={form.passportNumber} onChange={set('passportNumber')}
                placeholder="A12345678" colors={colors} required />
              <Field label="الجنسية" value={form.nationality} onChange={set('nationality')}
                placeholder="عراقية" colors={colors} required />

              {/* Gender picker */}
              <View style={{ gap: 5, marginBottom: 10 }}>
                <Text style={[F.label, { color: colors.mutedForeground }]}>
                  الجنس<Text style={{ color: '#ef5350' }}> *</Text>
                </Text>
                <GenderPicker value={form.gender} onChange={set('gender')} colors={colors} />
              </View>

              <Field label="تاريخ الميلاد" value={form.dob} onChange={set('dob')}
                placeholder="1990-01-15 (YYYY-MM-DD)" colors={colors} required />
              <Field label="مكان الميلاد" value={form.placeOfBirth} onChange={set('placeOfBirth')}
                placeholder="بغداد" colors={colors} />
              <Field label="دولة الإصدار" value={form.issuingCountry} onChange={set('issuingCountry')}
                placeholder="العراق" colors={colors} />
              <Field label="تاريخ الإصدار" value={form.issueDate} onChange={set('issueDate')}
                placeholder="2020-06-01 (YYYY-MM-DD)" colors={colors} />
              <Field label="تاريخ الانتهاء" value={form.expiryDate} onChange={set('expiryDate')}
                placeholder="2030-06-01 (YYYY-MM-DD)" colors={colors} required />
              <Field label="رقم الهوية الوطنية" value={form.nationalId} onChange={set('nationalId')}
                placeholder="(اختياري)" colors={colors} />
            </View>

            <TouchableOpacity style={[S.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => setStep(2)} activeOpacity={0.85}>
              <Text style={S.primaryBtnText}>التالي — التواصل والإرسال</Text>
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════ STEP 2: Contact & Submit ══════════ */}
        {step === 2 && (
          <View style={{ gap: 14 }}>

            {/* Summary card */}
            <View style={[card, { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' }]}>
              <View style={[S.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.summaryName, { color: colors.foreground }]} numberOfLines={1}>{form.fullName || 'غير محدد'}</Text>
                <Text style={[S.summarySub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {form.passportNumber || 'رقم الجواز غير محدد'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={[{ color: colors.primary, fontFamily: 'Tajawal_700Bold', fontSize: 12 }]}>تعديل</Text>
              </TouchableOpacity>
            </View>

            {/* Photos summary */}
            {(personalPhoto || passportPhoto) && (
              <View style={[card, { flexDirection: 'row-reverse', gap: 10, alignItems: 'center' }]}>
                {personalPhoto && <Image source={{ uri: personalPhoto.uri }} style={S.thumb} />}
                {passportPhoto && <Image source={{ uri: passportPhoto.uri }} style={[S.thumb, { width: 90 }]} resizeMode="contain" />}
                <Text style={[S.summarySub, { color: colors.mutedForeground, flex: 1, textAlign: 'right' }]}>المستندات مرفقة ✓</Text>
              </View>
            )}

            {/* Contact form */}
            <View style={card}>
              <Text style={[S.cardTitle, { color: colors.foreground }]}>معلومات التواصل</Text>
              <Field label="رقم الهاتف" value={form.phone} onChange={set('phone')}
                placeholder="+964 7XX XXX XXXX" keyboard="phone-pad" colors={colors} required />
              <Field label="البريد الإلكتروني" value={form.email} onChange={set('email')}
                placeholder="example@email.com" keyboard="email-address" colors={colors} required />
              <Field label="المهنة" value={form.occupation} onChange={set('occupation')}
                placeholder="مهندس، طبيب، معلم..." colors={colors} required />
              <Field label="مدينة الإقامة" value={form.city} onChange={set('city')}
                placeholder="بغداد" colors={colors} required />
            </View>

            {/* Terms note */}
            <View style={[S.feedbackRow, { backgroundColor: colors.muted, borderRadius: 10 }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
              <Text style={[S.feedbackText, { color: colors.mutedForeground, flex: 1, fontSize: 12 }]}>
                بإرسال الطلب تؤكد صحة البيانات المدخلة. سيتواصل معك فريقنا خلال {visa?.processingTime ?? 'أيام قليلة'}.
              </Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[S.primaryBtn, { backgroundColor: colors.primary, opacity: createMutation.isPending ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              activeOpacity={0.85}
            >
              {createMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={S.primaryBtnText}>إرسال طلب التأشيرة</Text>
                </>}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },
  lockText: { fontSize: 16, fontFamily: 'Tajawal_500Medium', textAlign: 'center' },

  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 17, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' },

  banner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  bannerText: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right', marginBottom: 2 },
  cardDesc: { fontSize: 12, fontFamily: 'Tajawal_400Regular', textAlign: 'right', lineHeight: 18, marginBottom: 4 },

  feedbackRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 11, borderRadius: 10 },
  feedbackText: { fontFamily: 'Tajawal_500Medium', fontSize: 13, textAlign: 'right' },

  scanBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12 },
  scanBtnText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 14 },

  primaryBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  primaryBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
  skipText: { fontFamily: 'Tajawal_400Regular', fontSize: 13 },

  summaryIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryName: { fontFamily: 'Tajawal_700Bold', fontSize: 15, textAlign: 'right' },
  summarySub: { fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right', marginTop: 2 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#111' },
});
