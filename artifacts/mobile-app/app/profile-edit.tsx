import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import {
  useUpdateProfile,
  useGetProfileCompletion,
  useRequestUploadUrl,
  useFinalizeUpload,
  getGetCurrentUserQueryKey,
  getGetProfileCompletionQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { icon: 'person-outline',   label: 'البيانات\nالأساسية'  },
  { icon: 'card-outline',     label: 'صورة\nالجواز'         },
  { icon: 'home-outline',     label: 'الإقامة'               },
] as const;

const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
const DAYS_SHORT = ['سبت','أحد','اثن','ثلا','أرب','خمي','جمع'];

const RESIDENCE_OPTIONS = [
  { value: 'none',     label: 'لا' },
  { value: 'gcc',      label: 'نعم، مقيم في إحدى دول مجلس التعاون الخليجي' },
  { value: 'schengen', label: 'نعم، مقيم في إحدى دول شنغن' },
  { value: 'uk',       label: 'نعم، مقيم في المملكة المتحدة' },
  { value: 'usa',      label: 'نعم، مقيم في الولايات المتحدة الأمريكية' },
] as const;

type ResidenceType = 'none' | 'gcc' | 'schengen' | 'uk' | 'usa';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateAr(iso: string) {
  if (!iso) return 'اختر التاريخ';
  try {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS_AR[m - 1]} ${y}`;
  } catch {
    return iso;
  }
}

// ─── Calendar for DatePicker ──────────────────────────────────────────────────

function DateCalendar({
  selected, onSelect, maxDate, minDate,
}: { selected: string; onSelect: (d: string) => void; maxDate?: string; minDate?: string }) {
  const colors = useColors();
  const todayStr = todayISO();
  const initialDate = selected || todayStr;
  const [yr, setYr] = useState(() => parseInt(initialDate.split('-')[0]));
  const [mo, setMo] = useState(() => parseInt(initialDate.split('-')[1]) - 1);

  function prevMonth() { if (mo === 0) { setMo(11); setYr(y => y - 1); } else setMo(m => m - 1); }
  function nextMonth() { if (mo === 11) { setMo(0); setYr(y => y + 1); } else setMo(m => m + 1); }

  const grid = useMemo(() => {
    const first = new Date(yr, mo, 1);
    const dow = first.getDay();
    const offset = (dow + 1) % 7;
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const cells: (number | null)[] = Array(offset).fill(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [yr, mo]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const toISO = (d: number) => `${yr}-${pad(mo + 1)}-${pad(d)}`;

  return (
    <View>
      {/* Year/month nav */}
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_700Bold', fontSize: 16 }}>
            {MONTHS_AR[mo]} {yr}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity onPress={() => setYr(y => y - 1)} style={{ padding: 2 }}>
              <Ionicons name="chevron-back" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Tajawal_400Regular' }}>تغيير السنة</Text>
            <TouchableOpacity onPress={() => setYr(y => y + 1)} style={{ padding: 2 }}>
              <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={{ flexDirection: 'row-reverse' }}>
        {DAYS_SHORT.map(d => (
          <Text key={d} style={{ width: `${100 / 7}%`, textAlign: 'center', color: colors.mutedForeground, fontSize: 11, fontFamily: 'Tajawal_400Regular', paddingVertical: 4 }}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap' }}>
        {grid.map((d, i) => {
          if (!d) return <View key={`_${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const iso = toISO(d);
          const isSel = iso === selected;
          const isToday = iso === todayStr;
          const isDisabled = (maxDate ? iso > maxDate : false) || (minDate ? iso < minDate : false);
          return (
            <TouchableOpacity
              key={iso}
              style={[
                { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
                isSel && { backgroundColor: colors.primary, borderRadius: 50 },
              ]}
              onPress={() => !isDisabled && onSelect(iso)}
              activeOpacity={isDisabled ? 1 : 0.75}
              disabled={isDisabled}
            >
              <Text style={[
                { fontFamily: 'Tajawal_500Medium', fontSize: 14, color: colors.foreground },
                isSel && { color: '#fff', fontFamily: 'Tajawal_700Bold' },
                isToday && !isSel && { color: colors.primary },
                isDisabled && { color: colors.border },
              ]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── DatePickerButton ─────────────────────────────────────────────────────────

function DatePickerButton({
  label, value, onSelect, maxDate, minDate, required,
}: {
  label: string; value: string; onSelect: (d: string) => void;
  maxDate?: string; minDate?: string; required?: boolean;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Tajawal_500Medium', marginBottom: 6, textAlign: 'right' }}>
        {label}{required && <Text style={{ color: colors.destructive }}> *</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.muted,
          borderColor: value ? colors.primary : colors.border,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 13,
        }}
      >
        <Ionicons name="calendar-outline" size={18} color={value ? colors.primary : colors.mutedForeground} />
        <Text style={{ color: value ? colors.foreground : colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 15 }}>
          {value ? formatDateAr(value) : 'اختر التاريخ'}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setOpen(false)} />
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 17, fontFamily: 'Tajawal_700Bold', color: colors.foreground }}>{label}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <DateCalendar
            selected={value}
            onSelect={d => { onSelect(d); setOpen(false); }}
            maxDate={maxDate}
            minDate={minDate}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, keyboard = 'default', required,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboard?: TextInput['props']['keyboardType'];
  required?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Tajawal_500Medium', marginBottom: 6, textAlign: 'right' }}>
        {label}{required && <Text style={{ color: colors.destructive }}> *</Text>}
      </Text>
      <TextInput
        style={{
          backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1,
          borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
          color: colors.foreground, fontFamily: 'Tajawal_400Regular', fontSize: 15,
          textAlign: 'right',
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboard}
        textAlign="right"
      />
    </View>
  );
}

// ─── ImageUploadField ─────────────────────────────────────────────────────────

function ImageUploadField({
  label, value, uploading, onUpload, onClear,
}: {
  label: string; value: string; uploading: boolean;
  onUpload: () => void; onClear?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Tajawal_500Medium', marginBottom: 8, textAlign: 'right' }}>{label}</Text>
      <View style={{ borderWidth: 1.5, borderColor: value ? colors.primary : colors.border, borderStyle: value ? 'solid' : 'dashed', borderRadius: 12, overflow: 'hidden', backgroundColor: colors.muted, minHeight: 140 }}>
        {value ? (
          <View style={{ position: 'relative' }}>
            <Image source={{ uri: value }} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
            {onClear && (
              <TouchableOpacity onPress={onClear} style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 4 }}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 30 }}>
            <Ionicons name="image-outline" size={40} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 8, fontFamily: 'Tajawal_400Regular' }}>لا توجد صورة</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onUpload}
          disabled={uploading}
          style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 12, opacity: uploading ? 0.6 : 1 }}
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 14 }}>
                {value ? 'استبدال الصورة' : 'رفع صورة'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── CardSection ──────────────────────────────────────────────────────────────

function CardSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon as any} size={18} color={colors.primary} />
        </View>
        <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_700Bold', fontSize: 16 }}>{title}</Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 14 }} />
      {children}
    </View>
  );
}

// ─── Image upload hook ────────────────────────────────────────────────────────

function useImageUpload() {
  const requestUrl = useRequestUploadUrl();
  const finalize = useFinalizeUpload();
  const [uploading, setUploading] = useState<string | null>(null);

  const upload = useCallback(
    async (folder: string): Promise<string | null> => {
      // Request permissions
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('الأذونات', 'يرجى السماح بالوصول إلى الصور من إعدادات الجهاز');
        return null;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];

      setUploading(folder);
      try {
        // Get blob
        const blobRes = await fetch(asset.uri);
        const body = await blobRes.blob();
        const size = body.size;

        // Validate size (10MB)
        if (size > 10 * 1024 * 1024) {
          Alert.alert('الملف كبير جداً', 'الحد الأقصى لحجم الصورة 10 ميغابايت');
          return null;
        }

        // Determine content type
        const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif' };
        const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
        const contentType = asset.type === 'image' && body.type ? body.type : (mimeMap[ext] ?? 'image/jpeg');
        const name = `${folder}_${Date.now()}.${ext}`;

        // Request signed upload URL
        const uploadData = await new Promise<{ uploadURL: string; objectPath: string }>((res, rej) =>
          requestUrl.mutate(
            { data: { name, size, contentType } },
            {
              onSuccess: (d: any) => res(d),
              onError: (e: any) => rej(new Error(e?.data?.error ?? e?.message ?? 'فشل الحصول على رابط الرفع')),
            },
          ),
        );

        // Upload to storage
        const put = await fetch(uploadData.uploadURL, {
          method: 'PUT',
          body,
          headers: { 'Content-Type': contentType },
        });
        if (!put.ok) throw new Error(`فشل رفع الملف (${put.status})`);

        // Finalize and get public URL
        const finalData = await new Promise<{ publicUrl?: string; objectPath: string }>((res, rej) =>
          finalize.mutate(
            { data: { objectPath: uploadData.objectPath, isPublic: true } },
            {
              onSuccess: (d: any) => res(d),
              onError: (e: any) => rej(new Error(e?.data?.error ?? e?.message ?? 'فشل إنهاء رفع الصورة')),
            },
          ),
        );

        return (finalData.publicUrl ?? finalData.objectPath) as string;
      } catch (e: any) {
        Alert.alert('خطأ في رفع الصورة', e?.message ?? 'حاول مجدداً');
        return null;
      } finally {
        setUploading(null);
      }
    },
    [requestUrl, finalize],
  );

  return { upload, uploading };
}

// ─── Step header ──────────────────────────────────────────────────────────────

function StepHeader({ step, completionPct }: { step: number; completionPct: number }) {
  const colors = useColors();
  const barColor = completionPct === 100 ? '#22c55e' : colors.primary;
  return (
    <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 18, paddingVertical: 14 }}>
      {/* Steps */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        {STEPS.map((st, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={i}>
              {i > 0 && <View style={{ flex: 1, height: 2, backgroundColor: done ? colors.primary : colors.border, marginHorizontal: 4 }} />}
              <View style={{ alignItems: 'center', gap: 4 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: (done || active) ? colors.primary : colors.muted, borderWidth: 1.5, borderColor: (done || active) ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  {done ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Ionicons name={st.icon as any} size={16} color={active ? '#fff' : colors.mutedForeground} />
                  )}
                </View>
                <Text style={{ color: active ? colors.primary : done ? colors.primary : colors.mutedForeground, fontSize: 10, fontFamily: 'Tajawal_500Medium', textAlign: 'center' }} numberOfLines={2}>
                  {st.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Progress bar */}
      {completionPct === 100 ? (
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
          <Text style={{ color: '#22c55e', fontFamily: 'Tajawal_700Bold', fontSize: 14 }}>✔ تم إكمال الملف الشخصي</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: barColor, fontFamily: 'Tajawal_700Bold', fontSize: 13, minWidth: 36, textAlign: 'right' }}>{completionPct}%</Text>
          <View style={{ flex: 1, height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ width: `${completionPct}%`, height: '100%', backgroundColor: barColor, borderRadius: 3 }} />
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Tajawal_400Regular' }}>اكتمال الملف</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateProfile();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const { upload, uploading } = useImageUpload();
  const scrollRef = useRef<ScrollView>(null);
  const { data: completion } = useGetProfileCompletion();
  const completionPct = completion?.percentage ?? 0;
  const [step, setStep] = useState(0);
  const today = todayISO();

  const u = user as any;

  const [successVisible, setSuccessVisible] = useState(false);

  const [form, setForm] = useState({
    avatarUrl: u?.avatarUrl ?? '',
    fullName: u?.fullName ?? '',
    nationality: u?.nationality ?? '',
    dob: u?.dob ?? '',
    passportNumber: u?.passportNumber ?? '',
    passportIssueDate: u?.passportIssueDate ?? '',
    passportExpiry: u?.passportExpiry ?? '',
    passportImageUrl: u?.passportImageUrl ?? '',
    residenceType: (u?.residenceType ?? 'none') as ResidenceType,
    residenceFrontUrl: u?.gulfResidenceFrontUrl ?? '',
    residenceBackUrl: u?.gulfResidenceBackUrl ?? '',
  });

  const set = <K extends keyof typeof form>(key: K) =>
    (val: typeof form[K]) => setForm(f => ({ ...f, [key]: val }));

  // ── Image upload handlers ──────────────────────────────────────────────────

  async function handleUpload(field: keyof typeof form, folder: string) {
    const url = await upload(folder);
    if (url) setForm(f => ({ ...f, [field]: url }));
  }

  // ── Build payload for each step ────────────────────────────────────────────

  function buildPayload() {
    const f = form;
    if (step === 0) {
      return {
        avatarUrl: f.avatarUrl || undefined,
        fullName: f.fullName.trim() || undefined,
        nationality: f.nationality.trim() || undefined,
        dob: f.dob || undefined,
        passportNumber: f.passportNumber.trim() || undefined,
        passportIssueDate: f.passportIssueDate || undefined,
        passportExpiry: f.passportExpiry || undefined,
      };
    }
    if (step === 1) {
      return { passportImageUrl: f.passportImageUrl || undefined };
    }
    // step 2 — residence
    return {
      residenceType: f.residenceType,
      gulfResidenceFrontUrl: f.residenceType !== 'none' ? (f.residenceFrontUrl || undefined) : undefined,
      gulfResidenceBackUrl: f.residenceType !== 'none' ? (f.residenceBackUrl || undefined) : undefined,
      hasGulfResidence: f.residenceType === 'gcc',
    };
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.fullName.trim()) return 'يرجى إدخال الاسم الكامل';
      if (!form.nationality.trim()) return 'يرجى إدخال جنسيتك';
      if (!form.dob) return 'يرجى اختيار تاريخ الميلاد';
      if (!form.passportNumber.trim()) return 'يرجى إدخال رقم جواز السفر';
      if (!form.passportIssueDate) return 'يرجى اختيار تاريخ الإصدار';
      if (!form.passportExpiry) return 'يرجى اختيار تاريخ الانتهاء';
    }
    if (step === 1) {
      if (!form.passportImageUrl) return 'يرجى رفع صورة جواز السفر';
    }
    if (step === 2) {
      if (form.residenceType !== 'none') {
        if (!form.residenceFrontUrl) return 'يرجى رفع صورة الوجه الأمامي للإقامة/التأشيرة';
        if (!form.residenceBackUrl) return 'يرجى رفع صورة الوجه الخلفي للإقامة/التأشيرة';
      }
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { Alert.alert('تنبيه', err); return; }

    const isFinal = step === STEPS.length - 1;
    updateMutation.mutate(
      { data: buildPayload() as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProfileCompletionQueryKey() });
          if (isFinal) {
            setSuccessVisible(true);
            setTimeout(() => {
              setSuccessVisible(false);
              router.back();
            }, 2000);
          } else {
            setStep(s => s + 1);
            scrollRef.current?.scrollTo({ y: 0, animated: false });
          }
        },
        onError: (e: any) => {
          Alert.alert('خطأ', e?.data?.error ?? e?.message ?? 'فشل الحفظ، حاول مجدداً');
        },
      },
    );
  }

  function handleBack() {
    setStep(s => s - 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  const loading = updateMutation.isPending;

  // ─── Step content ───────────────────────────────────────────────────────────

  function renderStep() {
    if (step === 0) {
      return (
        <>
          {/* Avatar */}
          <CardSection title="الصورة الشخصية" icon="camera-outline">
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ position: 'relative' }}>
                <View style={{ width: 100, height: 100, borderRadius: 50, overflow: 'hidden', backgroundColor: colors.muted, borderWidth: 2, borderColor: colors.border }}>
                  {form.avatarUrl ? (
                    <Image source={{ uri: form.avatarUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person" size={44} color={colors.mutedForeground} />
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleUpload('avatarUrl', 'avatar')}
                  disabled={uploading === 'avatar'}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card }}
                  activeOpacity={0.85}
                >
                  {uploading === 'avatar' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8, fontFamily: 'Tajawal_400Regular' }}>
                اضغط على الكاميرا لتغيير الصورة
              </Text>
            </View>
          </CardSection>

          {/* Core info */}
          <CardSection title="بيانات الجواز" icon="card-outline">
            <Field
              label="الاسم الكامل كما هو في جواز السفر"
              value={form.fullName}
              onChangeText={set('fullName')}
              required
              placeholder="الاسم الرباعي"
            />
            <Field
              label="الجنسية (دولة الجواز)"
              value={form.nationality}
              onChangeText={set('nationality')}
              required
              placeholder="مثال: سعودي، يمني، مصري"
            />
            <DatePickerButton
              label="تاريخ الميلاد"
              value={form.dob}
              onSelect={set('dob')}
              maxDate={today}
              required
            />
            <Field
              label="رقم جواز السفر"
              value={form.passportNumber}
              onChangeText={set('passportNumber')}
              required
              placeholder="A12345678"
            />
            <DatePickerButton
              label="تاريخ إصدار الجواز"
              value={form.passportIssueDate}
              onSelect={set('passportIssueDate')}
              maxDate={today}
              required
            />
            <DatePickerButton
              label="تاريخ انتهاء صلاحية الجواز"
              value={form.passportExpiry}
              onSelect={set('passportExpiry')}
              minDate={today}
              required
            />
          </CardSection>
        </>
      );
    }

    if (step === 1) {
      return (
        <CardSection title="صورة جواز السفر" icon="image-outline">
          <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginBottom: 14 }}>
            يرجى رفع صورة واضحة لصفحة الجواز التي تحتوي على المعلومات الشخصية.
          </Text>
          <ImageUploadField
            label="صورة جواز السفر"
            value={form.passportImageUrl}
            uploading={uploading === 'passport'}
            onUpload={() => handleUpload('passportImageUrl', 'passport')}
            onClear={() => set('passportImageUrl')('')}
          />
        </CardSection>
      );
    }

    // Step 2 — Residence
    return (
      <CardSection title="حالة الإقامة" icon="home-outline">
        <Text style={{ color: colors.foreground, fontSize: 15, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 14 }}>
          هل أنت مقيم في إحدى الدول التالية؟
        </Text>

        {RESIDENCE_OPTIONS.map(opt => {
          const active = form.residenceType === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => set('residenceType')(opt.value as ResidenceType)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 13,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? `${colors.primary}15` : colors.muted,
                marginBottom: 10,
              }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: active ? colors.primary : colors.mutedForeground, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.primary : 'transparent' }}>
                {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
              </View>
              <Text style={{ flex: 1, color: colors.foreground, fontFamily: active ? 'Tajawal_700Bold' : 'Tajawal_400Regular', fontSize: 14, textAlign: 'right' }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {form.residenceType !== 'none' && (
          <View style={{ marginTop: 8 }}>
            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />
            <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 12 }}>
              صور الإقامة / التأشيرة
            </Text>
            <ImageUploadField
              label="الوجه الأمامي"
              value={form.residenceFrontUrl}
              uploading={uploading === 'res_front'}
              onUpload={() => handleUpload('residenceFrontUrl', 'res_front')}
              onClear={() => set('residenceFrontUrl')('')}
            />
            <ImageUploadField
              label="الوجه الخلفي"
              value={form.residenceBackUrl}
              uploading={uploading === 'res_back'}
              onUpload={() => handleUpload('residenceBackUrl', 'res_back')}
              onClear={() => set('residenceBackUrl')('')}
            />
          </View>
        )}
      </CardSection>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop }}>
      {/* Success banner */}
      {successVisible && (
        <View style={{ position: 'absolute', top: paddingTop + 60, left: 16, right: 16, zIndex: 999, backgroundColor: '#22c55e', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 }}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 16, flex: 1, textAlign: 'right' }}>
            ✅ تم تحديث الملف الشخصي بنجاح
          </Text>
        </View>
      )}
      {/* Header */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
          <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Tajawal_700Bold', color: colors.foreground }}>
          تعديل الملف الشخصي
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Step indicator + progress */}
      <StepHeader step={step} completionPct={completionPct} />

      {/* Content */}
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Bottom nav */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row-reverse', padding: 16, gap: 12, paddingBottom: Math.max(insets.bottom, 16) }}>
        {step > 0 && (
          <TouchableOpacity
            onPress={handleBack}
            disabled={loading}
            style={{ flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 14 }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.foreground} />
            <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_600SemiBold', fontSize: 15 }}>السابق</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleNext}
          disabled={loading}
          style={{ flex: 2, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, opacity: loading ? 0.7 : 1 }}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>
                {step < STEPS.length - 1 ? 'التالي' : 'إكمال الملف الشخصي'}
              </Text>
              {step < STEPS.length - 1 && <Ionicons name="chevron-back" size={18} color="#fff" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
