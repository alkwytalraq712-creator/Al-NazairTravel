import React, { useCallback, useRef, useState } from 'react';
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActiveVisaEntry {
  country: string;
  visaType: string;
  visaNumber: string;
  issueDate: string;
  expiryDate: string;
  imageUrl: string;
}

interface TravelTripEntry {
  country: string;
  entryDate: string;
  exitDate: string;
}

interface ProfileForm {
  avatarUrl: string;
  fullName: string;
  email: string;
  phone: string;
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  familyName: string;
  englishName: string;
  gender: string;
  dob: string;
  nationality: string;
  placeOfBirth: string;
  maritalStatus: string;
  occupation: string;
  whatsapp: string;
  address: string;
  passportNumber: string;
  passportIssuingCountry: string;
  passportIssuingPlace: string;
  passportIssueDate: string;
  passportExpiry: string;
  passportImageUrl: string;
  hasGulfResidence: boolean;
  gulfResidenceCountry: string;
  gulfResidenceNumber: string;
  gulfResidenceExpiry: string;
  gulfResidenceFrontUrl: string;
  gulfResidenceBackUrl: string;
  hasActiveForeignVisa: boolean;
  activeVisas: ActiveVisaEntry[];
  hasTravelHistory: boolean;
  travelHistory: TravelTripEntry[];
}

// ─── Step configuration ───────────────────────────────────────────────────────

const STEPS = [
  { icon: 'person-outline',    label: 'البيانات\nالشخصية'   },
  { icon: 'card-outline',      label: 'جواز\nالسفر'         },
  { icon: 'home-outline',      label: 'الإقامة\nالخليجية'   },
  { icon: 'globe-outline',     label: 'التأشيرات\nالسارية'  },
  { icon: 'airplane-outline',  label: 'سجل\nالسفر'          },
] as const;

const GENDER_OPTIONS = ['ذكر', 'أنثى'];
const MARITAL_OPTIONS = ['أعزب/عزباء', 'متزوج/متزوجة', 'مطلق/مطلقة', 'أرمل/أرملة'];

// ─── Shared sub-components ────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, keyboard = 'default', required, multiline,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboard?: TextInput['props']['keyboardType'];
  required?: boolean; multiline?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>
        {label}{required ? <Text style={{ color: colors.destructive }}> *</Text> : ''}
      </Text>
      <TextInput
        style={[
          s.input,
          multiline && { height: 80, textAlignVertical: 'top', paddingTop: 10 },
          { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboard}
        textAlign="right"
        multiline={multiline}
      />
    </View>
  );
}

function Picker({
  label, value, options, onSelect,
}: {
  label: string; value: string; options: string[]; onSelect: (v: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              style={[
                s.chip,
                {
                  backgroundColor: active ? colors.primary : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text style={{ color: active ? '#fff' : colors.foreground, fontSize: 13 }}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function YesNoToggle({
  question, value, onToggle,
}: {
  question: string; value: boolean; onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[s.questionText, { color: colors.foreground }]}>{question}</Text>
      <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 10 }}>
        {(['نعم', 'لا'] as const).map(opt => {
          const active = opt === 'نعم' ? value : !value;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => { if (opt === 'نعم' ? !value : value) onToggle(); }}
              style={[
                s.yesNoBtn,
                {
                  backgroundColor: active ? (opt === 'نعم' ? '#22c55e' : '#ef4444') : colors.muted,
                  borderColor: active ? (opt === 'نعم' ? '#22c55e' : '#ef4444') : colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={opt === 'نعم' ? 'checkmark-circle-outline' : 'close-circle-outline'}
                size={18}
                color={active ? '#fff' : colors.mutedForeground}
              />
              <Text style={{ color: active ? '#fff' : colors.foreground, fontWeight: '700', fontSize: 15 }}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ImageUploadField({
  label, value, folder, uploading, onUpload, onClear,
}: {
  label: string; value: string; folder: string; uploading: string | null;
  onUpload: (folder: string) => void; onClear?: () => void;
}) {
  const colors = useColors();
  const busy = uploading === folder;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[s.imgBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
        {value ? (
          <View style={{ flex: 1, position: 'relative' }}>
            <Image source={{ uri: value }} style={s.imgPreview} resizeMode="cover" />
            {onClear && (
              <TouchableOpacity
                style={s.imgClearBtn}
                onPress={onClear}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={s.imgEmpty}>
            <Ionicons name="image-outline" size={32} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>لا توجد صورة</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => onUpload(folder)}
          disabled={busy}
          style={[s.imgUploadBtn, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                {value ? 'استبدال' : 'رفع صورة'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CardSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.cardHeader}>
        <View style={[s.cardIconWrap, { backgroundColor: colors.accent }]}>
          <Ionicons name={icon as any} size={18} color={colors.primary} />
        </View>
        <Text style={[s.cardTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={[s.cardDivider, { backgroundColor: colors.border }]} />
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
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('الأذونات', 'يرجى السماح بالوصول إلى الصور');
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const name = `${folder}_${Date.now()}.${ext}`;

      setUploading(folder);
      try {
        const body = await fetch(asset.uri).then(r => r.blob());
        const size = body.size;

        const { uploadURL, objectPath } = await new Promise<any>((res, rej) =>
          requestUrl.mutate(
            { data: { name, size, contentType } },
            { onSuccess: res, onError: rej },
          ),
        );

        const put = await fetch(uploadURL, { method: 'PUT', body, headers: { 'Content-Type': contentType } });
        if (!put.ok) throw new Error('Upload failed');

        const { publicUrl } = await new Promise<any>((res, rej) =>
          finalize.mutate(
            { data: { objectPath, isPublic: true } },
            { onSuccess: res, onError: rej },
          ),
        );
        return (publicUrl ?? objectPath) as string;
      } catch {
        Alert.alert('خطأ', 'فشل رفع الصورة، حاول مجدداً');
        return null;
      } finally {
        setUploading(null);
      }
    },
    [requestUrl, finalize],
  );

  return { upload, uploading };
}

// ─── Step header + progress strip ────────────────────────────────────────────

function WizardHeader({
  step, completionPct,
}: { step: number; completionPct: number }) {
  const colors = useColors();
  const pct = completionPct;
  const barColor = pct === 100 ? '#22c55e' : pct >= 60 ? '#f59e0b' : colors.primary;

  return (
    <View style={[s.wizHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {/* Step dots */}
      <View style={s.stepRow}>
        {STEPS.map((st, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <View
                  style={[
                    s.stepConnector,
                    { backgroundColor: done ? colors.primary : colors.border },
                  ]}
                />
              )}
              <View style={s.stepItem}>
                <View
                  style={[
                    s.stepCircle,
                    {
                      backgroundColor: done
                        ? colors.primary
                        : active
                        ? colors.primary
                        : colors.muted,
                      borderColor: done || active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  ) : (
                    <Ionicons
                      name={st.icon as any}
                      size={13}
                      color={active ? '#fff' : colors.mutedForeground}
                    />
                  )}
                </View>
                <Text
                  style={[
                    s.stepLabel,
                    { color: active ? colors.primary : done ? colors.primary : colors.mutedForeground },
                  ]}
                  numberOfLines={2}
                >
                  {st.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Progress bar row */}
      <View style={s.progressRow}>
        <Text style={[s.stepCount, { color: colors.mutedForeground }]}>
          الخطوة {step + 1} من {STEPS.length}
        </Text>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
          {pct === 100 && <Ionicons name="checkmark-circle" size={16} color="#22c55e" />}
          <Text style={[s.pctText, { color: barColor }]}>{pct}%</Text>
        </View>
      </View>
      <View style={[s.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
      </View>
      {pct === 100 && (
        <Text style={{ color: '#15803d', fontSize: 12, textAlign: 'right', marginTop: 4 }}>
          ✔ تم إكمال الملف الشخصي بنجاح
        </Text>
      )}
    </View>
  );
}

// ─── Bottom navigation ────────────────────────────────────────────────────────

function BottomNav({
  step, loading, onBack, onNext, nextLabel,
}: {
  step: number; loading: boolean; onBack: () => void; onNext: () => void; nextLabel: string;
}) {
  const colors = useColors();
  return (
    <View style={[s.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {step > 0 ? (
        <TouchableOpacity
          style={[s.backNavBtn, { borderColor: colors.border }]}
          onPress={onBack}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 15 }}>السابق</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <TouchableOpacity
        style={[s.nextNavBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
        onPress={onNext}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{nextLabel}</Text>
            {step < STEPS.length - 1 && <Ionicons name="chevron-back" size={18} color="#fff" />}
          </>
        )}
      </TouchableOpacity>
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

  const u = user as any;

  const [form, setForm] = useState<ProfileForm>({
    avatarUrl: u?.avatarUrl ?? '',
    fullName: u?.fullName ?? '',
    email: u?.email ?? '',
    phone: u?.phone ?? '',
    firstName: u?.firstName ?? '',
    fatherName: u?.fatherName ?? '',
    grandfatherName: u?.grandfatherName ?? '',
    familyName: u?.familyName ?? '',
    englishName: u?.englishName ?? '',
    gender: u?.gender ?? '',
    dob: u?.dob ?? '',
    nationality: u?.nationality ?? '',
    placeOfBirth: u?.placeOfBirth ?? '',
    maritalStatus: u?.maritalStatus ?? '',
    occupation: u?.occupation ?? '',
    whatsapp: u?.whatsapp ?? '',
    address: u?.address ?? '',
    passportNumber: u?.passportNumber ?? '',
    passportIssuingCountry: u?.passportIssuingCountry ?? '',
    passportIssuingPlace: u?.passportIssuingPlace ?? '',
    passportIssueDate: u?.passportIssueDate ?? '',
    passportExpiry: u?.passportExpiry ?? '',
    passportImageUrl: u?.passportImageUrl ?? '',
    hasGulfResidence: u?.hasGulfResidence ?? false,
    gulfResidenceCountry: u?.gulfResidenceCountry ?? '',
    gulfResidenceNumber: u?.gulfResidenceNumber ?? '',
    gulfResidenceExpiry: u?.gulfResidenceExpiry ?? '',
    gulfResidenceFrontUrl: u?.gulfResidenceFrontUrl ?? '',
    gulfResidenceBackUrl: u?.gulfResidenceBackUrl ?? '',
    hasActiveForeignVisa: u?.hasActiveForeignVisa ?? false,
    activeVisas: (u?.activeVisas ?? []) as ActiveVisaEntry[],
    hasTravelHistory: u?.hasTravelHistory ?? false,
    travelHistory: (u?.travelHistory ?? []) as TravelTripEntry[],
  });

  const set = <K extends keyof ProfileForm>(key: K) =>
    (val: ProfileForm[K]) => setForm(f => ({ ...f, [key]: val }));

  // ── Image uploads ──────────────────────────────────────────────────────────

  async function handleImageUpload(folder: string) {
    const url = await upload(folder);
    if (!url) return;

    const staticMap: Partial<Record<string, keyof ProfileForm>> = {
      avatar: 'avatarUrl',
      passport: 'passportImageUrl',
      gulf_front: 'gulfResidenceFrontUrl',
      gulf_back: 'gulfResidenceBackUrl',
    };
    const key = staticMap[folder];
    if (key) { setForm(f => ({ ...f, [key!]: url })); return; }

    const vm = folder.match(/^visa_(\d+)$/);
    if (vm) {
      const i = parseInt(vm[1], 10);
      setForm(f => {
        const av = [...f.activeVisas];
        av[i] = { ...av[i], imageUrl: url };
        return { ...f, activeVisas: av };
      });
    }
  }

  // ── Build payload for current step (or full payload for final step) ─────────

  function buildPayload(all = false) {
    const f = form;
    const base = {
      avatarUrl: f.avatarUrl || undefined,
      fullName: f.fullName.trim() || undefined,
      email: f.email.trim() || undefined,
      phone: f.phone.trim() || undefined,
    };
    if (step === 0 || all) {
      Object.assign(base, {
        firstName: f.firstName.trim() || undefined,
        fatherName: f.fatherName.trim() || undefined,
        grandfatherName: f.grandfatherName.trim() || undefined,
        familyName: f.familyName.trim() || undefined,
        englishName: f.englishName.trim() || undefined,
        gender: f.gender || undefined,
        dob: f.dob.trim() || undefined,
        nationality: f.nationality.trim() || undefined,
        placeOfBirth: f.placeOfBirth.trim() || undefined,
        maritalStatus: f.maritalStatus || undefined,
        occupation: f.occupation.trim() || undefined,
        whatsapp: f.whatsapp.trim() || undefined,
        address: f.address.trim() || undefined,
      });
    }
    if (step === 1 || all) {
      Object.assign(base, {
        passportNumber: f.passportNumber.trim() || undefined,
        passportIssuingCountry: f.passportIssuingCountry.trim() || undefined,
        passportIssuingPlace: f.passportIssuingPlace.trim() || undefined,
        passportIssueDate: f.passportIssueDate.trim() || undefined,
        passportExpiry: f.passportExpiry.trim() || undefined,
        passportImageUrl: f.passportImageUrl || undefined,
      });
    }
    if (step === 2 || all) {
      Object.assign(base, {
        hasGulfResidence: f.hasGulfResidence,
        gulfResidenceCountry: f.hasGulfResidence ? (f.gulfResidenceCountry.trim() || undefined) : undefined,
        gulfResidenceNumber: f.hasGulfResidence ? (f.gulfResidenceNumber.trim() || undefined) : undefined,
        gulfResidenceExpiry: f.hasGulfResidence ? (f.gulfResidenceExpiry.trim() || undefined) : undefined,
        gulfResidenceFrontUrl: f.hasGulfResidence ? (f.gulfResidenceFrontUrl || undefined) : undefined,
        gulfResidenceBackUrl: f.hasGulfResidence ? (f.gulfResidenceBackUrl || undefined) : undefined,
      });
    }
    if (step === 3 || all) {
      Object.assign(base, {
        hasActiveForeignVisa: f.hasActiveForeignVisa,
        activeVisas: f.hasActiveForeignVisa ? f.activeVisas : [],
      });
    }
    if (step === 4 || all) {
      Object.assign(base, {
        hasTravelHistory: f.hasTravelHistory,
        travelHistory: f.hasTravelHistory ? f.travelHistory : [],
      });
    }
    return base;
  }

  // ── Save current step and advance ──────────────────────────────────────────

  function saveStep(isFinal: boolean) {
    updateMutation.mutate(
      { data: buildPayload(isFinal) as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProfileCompletionQueryKey() });
          if (isFinal) {
            Alert.alert('✅ تم الحفظ', 'تم تحديث ملفك الشخصي بنجاح', [
              { text: 'حسناً', onPress: () => router.back() },
            ]);
          } else {
            setStep(s => s + 1);
            scrollRef.current?.scrollTo({ y: 0, animated: false });
          }
        },
        onError: (e: any) => {
          const msg = e?.data?.error ?? e?.message ?? 'فشل الحفظ، حاول مجدداً';
          Alert.alert('خطأ', msg);
        },
      },
    );
  }

  function handleBack() {
    setStep(s => s - 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  // ─── Step content ────────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      // ── Step 1: Personal data ──────────────────────────────────────────────
      case 0:
        return (
          <>
            {/* Avatar */}
            <CardSection title="الصورة الشخصية" icon="camera-outline">
              <View style={s.avatarCenter}>
                <View style={s.avatarWrap}>
                  {form.avatarUrl ? (
                    <Image source={{ uri: form.avatarUrl }} style={s.avatarImg} />
                  ) : (
                    <View style={[s.avatarPlaceholder, { backgroundColor: colors.muted }]}>
                      <Ionicons name="person" size={48} color={colors.mutedForeground} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={[s.avatarCamBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleImageUpload('avatar')}
                    disabled={uploading === 'avatar'}
                    activeOpacity={0.85}
                  >
                    {uploading === 'avatar' ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="camera" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8 }}>
                  اضغط على الكاميرا لتغيير الصورة
                </Text>
              </View>
            </CardSection>

            {/* Name fields */}
            <CardSection title="الاسم الكامل" icon="text-outline">
              <Field label="الاسم الرباعي (عربي)" value={form.fullName} onChangeText={set('fullName')} required />
              <Field label="الاسم الأول" value={form.firstName} onChangeText={set('firstName')} required />
              <Field label="اسم الأب" value={form.fatherName} onChangeText={set('fatherName')} required />
              <Field label="اسم الجد" value={form.grandfatherName} onChangeText={set('grandfatherName')} required />
              <Field label="اسم العائلة" value={form.familyName} onChangeText={set('familyName')} required />
              <Field label="الاسم بالإنجليزية" value={form.englishName} onChangeText={set('englishName')} required placeholder="As in passport" />
            </CardSection>

            {/* Personal details */}
            <CardSection title="التفاصيل الشخصية" icon="information-circle-outline">
              <Picker label="الجنس" value={form.gender} options={GENDER_OPTIONS} onSelect={set('gender') as any} />
              <Field label="تاريخ الميلاد" value={form.dob} onChangeText={set('dob')} required placeholder="1990-01-15" />
              <Field label="الجنسية" value={form.nationality} onChangeText={set('nationality')} required />
              <Field label="مكان الميلاد" value={form.placeOfBirth} onChangeText={set('placeOfBirth')} required />
              <Picker label="الحالة الاجتماعية" value={form.maritalStatus} options={MARITAL_OPTIONS} onSelect={set('maritalStatus') as any} />
              <Field label="المهنة" value={form.occupation} onChangeText={set('occupation')} required />
            </CardSection>

            {/* Contact */}
            <CardSection title="بيانات التواصل" icon="call-outline">
              <Field label="رقم الجوال" value={form.phone} onChangeText={set('phone')} keyboard="phone-pad" required />
              <Field label="رقم الواتساب" value={form.whatsapp} onChangeText={set('whatsapp')} keyboard="phone-pad" />
              <Field label="البريد الإلكتروني" value={form.email} onChangeText={set('email')} keyboard="email-address" />
              <Field label="عنوان السكن" value={form.address} onChangeText={set('address')} multiline />
            </CardSection>
          </>
        );

      // ── Step 2: Passport ───────────────────────────────────────────────────
      case 1:
        return (
          <CardSection title="بيانات جواز السفر" icon="card-outline">
            <Field label="رقم الجواز" value={form.passportNumber} onChangeText={set('passportNumber')} required />
            <Field label="دولة الإصدار" value={form.passportIssuingCountry} onChangeText={set('passportIssuingCountry')} required />
            <Field label="مكان الإصدار" value={form.passportIssuingPlace} onChangeText={set('passportIssuingPlace')} required />
            <Field label="تاريخ الإصدار" value={form.passportIssueDate} onChangeText={set('passportIssueDate')} placeholder="2020-03-10" required />
            <Field label="تاريخ الانتهاء" value={form.passportExpiry} onChangeText={set('passportExpiry')} placeholder="2030-03-10" required />
            <ImageUploadField
              label="صورة الجواز (الصفحة الرئيسية) *"
              value={form.passportImageUrl}
              folder="passport"
              uploading={uploading}
              onUpload={handleImageUpload}
              onClear={() => setForm(f => ({ ...f, passportImageUrl: '' }))}
            />
          </CardSection>
        );

      // ── Step 3: Gulf residence ─────────────────────────────────────────────
      case 2:
        return (
          <CardSection title="الإقامة الخليجية" icon="home-outline">
            <YesNoToggle
              question="هل لديك إقامة سارية في إحدى دول مجلس التعاون الخليجي؟"
              value={form.hasGulfResidence}
              onToggle={() => setForm(f => ({ ...f, hasGulfResidence: !f.hasGulfResidence }))}
            />
            {form.hasGulfResidence && (
              <>
                <View style={[s.separator, { backgroundColor: colors.border }]} />
                <Field label="دولة الإقامة" value={form.gulfResidenceCountry} onChangeText={set('gulfResidenceCountry')} required />
                <Field label="رقم الإقامة" value={form.gulfResidenceNumber} onChangeText={set('gulfResidenceNumber')} required />
                <Field label="تاريخ انتهاء الإقامة" value={form.gulfResidenceExpiry} onChangeText={set('gulfResidenceExpiry')} placeholder="2026-12-31" required />
                <ImageUploadField
                  label="صورة الإقامة - الوجه الأمامي *"
                  value={form.gulfResidenceFrontUrl}
                  folder="gulf_front"
                  uploading={uploading}
                  onUpload={handleImageUpload}
                  onClear={() => setForm(f => ({ ...f, gulfResidenceFrontUrl: '' }))}
                />
                <ImageUploadField
                  label="صورة الإقامة - الوجه الخلفي *"
                  value={form.gulfResidenceBackUrl}
                  folder="gulf_back"
                  uploading={uploading}
                  onUpload={handleImageUpload}
                  onClear={() => setForm(f => ({ ...f, gulfResidenceBackUrl: '' }))}
                />
              </>
            )}
          </CardSection>
        );

      // ── Step 4: Active visas ───────────────────────────────────────────────
      case 3:
        return (
          <CardSection title="التأشيرات السارية" icon="globe-outline">
            <YesNoToggle
              question="هل لديك تأشيرة سارية في إحدى الدول؟"
              value={form.hasActiveForeignVisa}
              onToggle={() => setForm(f => ({ ...f, hasActiveForeignVisa: !f.hasActiveForeignVisa }))}
            />
            {form.hasActiveForeignVisa && (
              <>
                <View style={[s.separator, { backgroundColor: colors.border }]} />
                {form.activeVisas.map((av, i) => (
                  <View
                    key={i}
                    style={[s.entryCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <View style={s.entryCardHeader}>
                      <TouchableOpacity
                        onPress={() => setForm(f => ({ ...f, activeVisas: f.activeVisas.filter((_, x) => x !== i) }))}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                      <Text style={[s.entryCardTitle, { color: colors.foreground }]}>
                        تأشيرة {i + 1}
                      </Text>
                    </View>
                    <Field label="الدولة" value={av.country} onChangeText={v => setForm(f => { const a = [...f.activeVisas]; a[i] = { ...a[i], country: v }; return { ...f, activeVisas: a }; })} required />
                    <Field label="نوع التأشيرة" value={av.visaType} onChangeText={v => setForm(f => { const a = [...f.activeVisas]; a[i] = { ...a[i], visaType: v }; return { ...f, activeVisas: a }; })} required />
                    <Field label="رقم التأشيرة" value={av.visaNumber} onChangeText={v => setForm(f => { const a = [...f.activeVisas]; a[i] = { ...a[i], visaNumber: v }; return { ...f, activeVisas: a }; })} />
                    <Field label="تاريخ الإصدار" value={av.issueDate} onChangeText={v => setForm(f => { const a = [...f.activeVisas]; a[i] = { ...a[i], issueDate: v }; return { ...f, activeVisas: a }; })} placeholder="2024-01-01" />
                    <Field label="تاريخ الانتهاء" value={av.expiryDate} onChangeText={v => setForm(f => { const a = [...f.activeVisas]; a[i] = { ...a[i], expiryDate: v }; return { ...f, activeVisas: a }; })} placeholder="2026-01-01" required />
                    <ImageUploadField
                      label="صورة التأشيرة"
                      value={av.imageUrl ?? ''}
                      folder={`visa_${i}`}
                      uploading={uploading}
                      onUpload={handleImageUpload}
                      onClear={() => setForm(f => { const a = [...f.activeVisas]; a[i] = { ...a[i], imageUrl: '' }; return { ...f, activeVisas: a }; })}
                    />
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => setForm(f => ({
                    ...f,
                    activeVisas: [...f.activeVisas, { country: '', visaType: '', visaNumber: '', issueDate: '', expiryDate: '', imageUrl: '' }],
                  }))}
                  style={[s.addEntryBtn, { borderColor: colors.primary, backgroundColor: colors.accent }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>+ إضافة تأشيرة أخرى</Text>
                </TouchableOpacity>
              </>
            )}
          </CardSection>
        );

      // ── Step 5: Travel history ─────────────────────────────────────────────
      case 4:
        return (
          <CardSection title="سجل السفر (آخر 5 سنوات)" icon="airplane-outline">
            <YesNoToggle
              question="هل سبق لك السفر خارج بلدك خلال آخر خمس سنوات؟"
              value={form.hasTravelHistory}
              onToggle={() => setForm(f => ({ ...f, hasTravelHistory: !f.hasTravelHistory }))}
            />
            {form.hasTravelHistory && (
              <>
                <View style={[s.separator, { backgroundColor: colors.border }]} />
                {form.travelHistory.map((trip, i) => (
                  <View
                    key={i}
                    style={[s.entryCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <View style={s.entryCardHeader}>
                      <TouchableOpacity
                        onPress={() => setForm(f => ({ ...f, travelHistory: f.travelHistory.filter((_, x) => x !== i) }))}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                      <Text style={[s.entryCardTitle, { color: colors.foreground }]}>رحلة {i + 1}</Text>
                    </View>
                    <Field label="الدولة" value={trip.country} onChangeText={v => setForm(f => { const t = [...f.travelHistory]; t[i] = { ...t[i], country: v }; return { ...f, travelHistory: t }; })} required />
                    <Field label="تاريخ الدخول" value={trip.entryDate} onChangeText={v => setForm(f => { const t = [...f.travelHistory]; t[i] = { ...t[i], entryDate: v }; return { ...f, travelHistory: t }; })} placeholder="2023-06-01" required />
                    <Field label="تاريخ المغادرة" value={trip.exitDate} onChangeText={v => setForm(f => { const t = [...f.travelHistory]; t[i] = { ...t[i], exitDate: v }; return { ...f, travelHistory: t }; })} placeholder="2023-06-15" required />
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => setForm(f => ({
                    ...f,
                    travelHistory: [...f.travelHistory, { country: '', entryDate: '', exitDate: '' }],
                  }))}
                  style={[s.addEntryBtn, { borderColor: colors.primary, backgroundColor: colors.accent }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>+ إضافة رحلة أخرى</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Completion hint */}
            {completion && completion.missingFields.length > 0 && (
              <View style={[s.hintBox, { backgroundColor: '#fef3c7', borderColor: '#f59e0b', marginTop: 8 }]}>
                <Text style={{ color: '#92400e', fontWeight: '700', marginBottom: 4, textAlign: 'right' }}>
                  الحقول المطلوبة لاكتمال الملف:
                </Text>
                {completion.missingFields.slice(0, 8).map(f => (
                  <Text key={f} style={{ color: '#78350f', textAlign: 'right', fontSize: 12 }}>• {f}</Text>
                ))}
                {completion.missingFields.length > 8 && (
                  <Text style={{ color: '#78350f', fontSize: 12, textAlign: 'right' }}>
                    وأيضاً {completion.missingFields.length - 8} حقول أخرى...
                  </Text>
                )}
              </View>
            )}
          </CardSection>
        );

      default:
        return null;
    }
  }

  const isLastStep = step === STEPS.length - 1;
  const nextLabel = isLastStep ? 'حفظ وإكمال الملف الشخصي' : 'التالي';

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      {/* App header */}
      <View style={[s.appHeader, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.appHeaderTitle}>الملف الشخصي</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Wizard header (steps + progress) */}
      <WizardHeader step={step} completionPct={completionPct} />

      {/* Step content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step title */}
        <View style={[s.stepTitleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.stepTitleIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name={STEPS[step].icon as any} size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.stepTitleText, { color: colors.foreground }]}>
              {STEPS[step].label.replace('\n', ' ')}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
              الخطوة {step + 1} من {STEPS.length}
            </Text>
          </View>
        </View>

        {renderStep()}
      </ScrollView>

      {/* Bottom nav */}
      <BottomNav
        step={step}
        loading={updateMutation.isPending}
        onBack={handleBack}
        onNext={() => saveStep(isLastStep)}
        nextLabel={nextLabel}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1 },

  // App header
  appHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: { width: 32, alignItems: 'center' },
  appHeaderTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },

  // Wizard header
  wizHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  stepRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepItem: { alignItems: 'center', width: 52 },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnector: { flex: 1, height: 2, marginTop: 14, marginHorizontal: 2 },
  stepLabel: { fontSize: 9, textAlign: 'center', marginTop: 4, lineHeight: 13 },
  progressRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepCount: { fontSize: 12 },
  pctText: { fontSize: 16, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  // Step title banner
  stepTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  stepTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitleText: { fontSize: 16, fontWeight: '800' },

  // Cards
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '800', flex: 1, textAlign: 'right' },
  cardDivider: { height: 1, marginBottom: 14 },

  // Fields
  fieldLabel: { fontSize: 12, marginBottom: 5, textAlign: 'right' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    textAlign: 'right',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  // Yes/No toggle
  questionText: { fontSize: 15, fontWeight: '600', textAlign: 'right', lineHeight: 22 },
  yesNoBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },

  // Avatar
  avatarCenter: { alignItems: 'center', paddingVertical: 8 },
  avatarWrap: { position: 'relative', width: 96, height: 96 },
  avatarImg: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#f3f4f6' },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  avatarCamBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },

  // Image upload field
  imgBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 100,
  },
  imgPreview: { width: '100%', height: 120 },
  imgEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  imgClearBtn: { position: 'absolute', top: 6, right: 6 },
  imgUploadBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },

  // Entry cards (visa / trip)
  entryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  entryCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  entryCardTitle: { fontWeight: '700', fontSize: 14 },

  // Add entry button
  addEntryBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
  },

  separator: { height: 1, marginBottom: 14 },
  hintBox: { borderRadius: 10, borderWidth: 1, padding: 12 },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  backNavBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  nextNavBtn: {
    flex: 2,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
});
