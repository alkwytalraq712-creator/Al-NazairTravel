import React, { useCallback, useState } from 'react';
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

// ─── Types ─────────────────────────────────────────────────────────────────

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
  // Base
  fullName: string;
  email: string;
  phone: string;
  // Personal
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
  // Passport
  passportNumber: string;
  passportIssuingCountry: string;
  passportIssuingPlace: string;
  passportIssueDate: string;
  passportExpiry: string;
  passportImageUrl: string;
  // Gulf residence
  hasGulfResidence: boolean;
  gulfResidenceCountry: string;
  gulfResidenceNumber: string;
  gulfResidenceExpiry: string;
  gulfResidenceFrontUrl: string;
  gulfResidenceBackUrl: string;
  // Active foreign visas
  hasActiveForeignVisa: boolean;
  activeVisas: ActiveVisaEntry[];
  // Travel history
  hasTravelHistory: boolean;
  travelHistory: TravelTripEntry[];
}

// ─── Constants ─────────────────────────────────────────────────────────────

const GENDER_OPTIONS = ['ذكر', 'أنثى'];
const MARITAL_OPTIONS = ['أعزب/عزباء', 'متزوج/متزوجة', 'مطلق/مطلقة', 'أرمل/أرملة'];

// ─── Sub-components ─────────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, keyboard = 'default', required,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboard?: TextInput['props']['keyboardType']; required?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 4 }}>
        {label}{required ? ' *' : ''}
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
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

function SelectRow({
  label, value, options, onSelect,
}: {
  label: string; value: string; options: string[]; onSelect: (v: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ color: active ? '#fff' : colors.foreground, fontSize: 13 }}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Toggle({
  label, value, onToggle,
}: {
  label: string; value: boolean; onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        styles.toggleRow,
        { borderColor: colors.border, backgroundColor: colors.muted },
      ]}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.toggleIndicator,
          { backgroundColor: value ? colors.primary : colors.border },
        ]}
      >
        {value && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
      <Text style={{ color: colors.foreground, flex: 1, textAlign: 'right' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

// ─── Image Upload Hook ──────────────────────────────────────────────────────

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
      const fileName = `${folder}_${Date.now()}.${ext}`;

      setUploading(folder);
      try {
        const { uploadUrl, objectPath } = await new Promise<any>((resolve, reject) =>
          requestUrl.mutate(
            { data: { fileName, contentType, folder } },
            { onSuccess: resolve, onError: reject },
          ),
        );

        const body = await fetch(asset.uri).then(r => r.blob());
        const put = await fetch(uploadUrl, { method: 'PUT', body, headers: { 'Content-Type': contentType } });
        if (!put.ok) throw new Error('Upload failed');

        const { publicUrl } = await new Promise<any>((resolve, reject) =>
          finalize.mutate(
            { data: { objectPath, isPublic: true } },
            { onSuccess: resolve, onError: reject },
          ),
        );
        return publicUrl as string;
      } catch (e: any) {
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

// ─── Image Field ────────────────────────────────────────────────────────────

function ImageField({
  label, value, onUploaded, folder, uploading,
}: {
  label: string; value: string; onUploaded: (url: string) => void;
  folder: string; uploading: string | null;
}) {
  const colors = useColors();
  const isUploading = uploading === folder;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row-reverse', gap: 10, alignItems: 'center' }}>
        {value ? (
          <Image source={{ uri: value }} style={styles.thumbImage} />
        ) : (
          <View style={[styles.thumbPlaceholder, { borderColor: colors.border }]}>
            <Ionicons name="image-outline" size={24} color={colors.mutedForeground} />
          </View>
        )}
        <TouchableOpacity
          onPress={() => onUploaded(folder)}
          disabled={isUploading}
          style={[styles.uploadBtn, { borderColor: colors.primary, opacity: isUploading ? 0.6 : 1 }]}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 12 }}> رفع صورة</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const colors = useColors();
  const color = pct === 100 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <View style={[styles.progressWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: colors.foreground, fontWeight: '600' }}>اكتمال الملف الشخصي</Text>
        <Text style={{ color, fontWeight: '700', fontSize: 16 }}>{pct}%</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      {pct < 100 && (
        <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4, textAlign: 'right' }}>
          أكمل ملفك الشخصي لتتمكن من تقديم طلبات التأشيرة
        </Text>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateProfile();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const { upload, uploading } = useImageUpload();

  const { data: completion } = useGetProfileCompletion();

  const [form, setForm] = useState<ProfileForm>({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    firstName: (user as any)?.firstName ?? '',
    fatherName: (user as any)?.fatherName ?? '',
    grandfatherName: (user as any)?.grandfatherName ?? '',
    familyName: (user as any)?.familyName ?? '',
    englishName: (user as any)?.englishName ?? '',
    gender: (user as any)?.gender ?? '',
    dob: (user as any)?.dob ?? '',
    nationality: (user as any)?.nationality ?? '',
    placeOfBirth: (user as any)?.placeOfBirth ?? '',
    maritalStatus: (user as any)?.maritalStatus ?? '',
    occupation: (user as any)?.occupation ?? '',
    whatsapp: (user as any)?.whatsapp ?? '',
    address: (user as any)?.address ?? '',
    passportNumber: (user as any)?.passportNumber ?? '',
    passportIssuingCountry: (user as any)?.passportIssuingCountry ?? '',
    passportIssuingPlace: (user as any)?.passportIssuingPlace ?? '',
    passportIssueDate: (user as any)?.passportIssueDate ?? '',
    passportExpiry: (user as any)?.passportExpiry ?? '',
    passportImageUrl: (user as any)?.passportImageUrl ?? '',
    hasGulfResidence: (user as any)?.hasGulfResidence ?? false,
    gulfResidenceCountry: (user as any)?.gulfResidenceCountry ?? '',
    gulfResidenceNumber: (user as any)?.gulfResidenceNumber ?? '',
    gulfResidenceExpiry: (user as any)?.gulfResidenceExpiry ?? '',
    gulfResidenceFrontUrl: (user as any)?.gulfResidenceFrontUrl ?? '',
    gulfResidenceBackUrl: (user as any)?.gulfResidenceBackUrl ?? '',
    hasActiveForeignVisa: (user as any)?.hasActiveForeignVisa ?? false,
    activeVisas: ((user as any)?.activeVisas ?? []) as ActiveVisaEntry[],
    hasTravelHistory: (user as any)?.hasTravelHistory ?? false,
    travelHistory: ((user as any)?.travelHistory ?? []) as TravelTripEntry[],
  });

  const set = (key: keyof ProfileForm) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  async function handleUploadField(folder: string) {
    // folder maps to form key for image fields
    const fieldMap: Record<string, keyof ProfileForm> = {
      passport: 'passportImageUrl',
      gulf_front: 'gulfResidenceFrontUrl',
      gulf_back: 'gulfResidenceBackUrl',
    };
    const url = await upload(folder);
    if (url) {
      const key = fieldMap[folder];
      if (key) set(key)(url);
    }
  }

  async function handleSave() {
    updateMutation.mutate(
      {
        data: {
          fullName: form.fullName.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          firstName: form.firstName.trim() || undefined,
          fatherName: form.fatherName.trim() || undefined,
          grandfatherName: form.grandfatherName.trim() || undefined,
          familyName: form.familyName.trim() || undefined,
          englishName: form.englishName.trim() || undefined,
          gender: form.gender || undefined,
          dob: form.dob.trim() || undefined,
          nationality: form.nationality.trim() || undefined,
          placeOfBirth: form.placeOfBirth.trim() || undefined,
          maritalStatus: form.maritalStatus || undefined,
          occupation: form.occupation.trim() || undefined,
          whatsapp: form.whatsapp.trim() || undefined,
          address: form.address.trim() || undefined,
          passportNumber: form.passportNumber.trim() || undefined,
          passportIssuingCountry: form.passportIssuingCountry.trim() || undefined,
          passportIssuingPlace: form.passportIssuingPlace.trim() || undefined,
          passportIssueDate: form.passportIssueDate.trim() || undefined,
          passportExpiry: form.passportExpiry.trim() || undefined,
          passportImageUrl: form.passportImageUrl || undefined,
          hasGulfResidence: form.hasGulfResidence,
          gulfResidenceCountry: form.hasGulfResidence ? (form.gulfResidenceCountry.trim() || undefined) : undefined,
          gulfResidenceNumber: form.hasGulfResidence ? (form.gulfResidenceNumber.trim() || undefined) : undefined,
          gulfResidenceExpiry: form.hasGulfResidence ? (form.gulfResidenceExpiry.trim() || undefined) : undefined,
          gulfResidenceFrontUrl: form.hasGulfResidence ? (form.gulfResidenceFrontUrl || undefined) : undefined,
          gulfResidenceBackUrl: form.hasGulfResidence ? (form.gulfResidenceBackUrl || undefined) : undefined,
          hasActiveForeignVisa: form.hasActiveForeignVisa,
          activeVisas: form.hasActiveForeignVisa ? form.activeVisas : [],
          hasTravelHistory: form.hasTravelHistory,
          travelHistory: form.hasTravelHistory ? form.travelHistory : [],
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProfileCompletionQueryKey() });
          Alert.alert('تم الحفظ', 'تم تحديث ملفك الشخصي بنجاح', [
            { text: 'حسناً', onPress: () => router.back() },
          ]);
        },
        onError: (e: any) => {
          const msg = e?.data?.error ?? e?.message ?? 'فشل الحفظ، حاول مجدداً';
          Alert.alert('خطأ', msg);
        },
      },
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        {completion && <ProgressBar pct={completion.percentage} />}

        {/* ── Personal Information ─────────────────────────────────────────── */}
        <SectionHeader title="البيانات الشخصية" icon="person-outline" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field label="الاسم الرباعي (عربي)" value={form.fullName} onChangeText={set('fullName')} required />
          <Field label="الاسم الأول" value={form.firstName} onChangeText={set('firstName')} required />
          <Field label="اسم الأب" value={form.fatherName} onChangeText={set('fatherName')} required />
          <Field label="اسم الجد" value={form.grandfatherName} onChangeText={set('grandfatherName')} required />
          <Field label="اسم العائلة" value={form.familyName} onChangeText={set('familyName')} required />
          <Field label="الاسم بالإنجليزية" value={form.englishName} onChangeText={set('englishName')} required />
          <SelectRow label="الجنس" value={form.gender} options={GENDER_OPTIONS} onSelect={set('gender') as (v: string) => void} />
          <Field label="تاريخ الميلاد (YYYY-MM-DD)" value={form.dob} onChangeText={set('dob')} placeholder="1990-01-15" required />
          <Field label="الجنسية" value={form.nationality} onChangeText={set('nationality')} required />
          <Field label="مكان الميلاد" value={form.placeOfBirth} onChangeText={set('placeOfBirth')} required />
          <SelectRow label="الحالة الاجتماعية" value={form.maritalStatus} options={MARITAL_OPTIONS} onSelect={set('maritalStatus') as (v: string) => void} />
          <Field label="المهنة" value={form.occupation} onChangeText={set('occupation')} required />
          <Field label="رقم الجوال" value={form.phone} onChangeText={set('phone')} keyboard="phone-pad" required />
          <Field label="رقم الواتساب" value={form.whatsapp} onChangeText={set('whatsapp')} keyboard="phone-pad" required />
          <Field label="البريد الإلكتروني" value={form.email} onChangeText={set('email')} keyboard="email-address" required />
          <Field label="عنوان السكن" value={form.address} onChangeText={set('address')} required />
        </View>

        {/* ── Passport ────────────────────────────────────────────────────── */}
        <SectionHeader title="بيانات جواز السفر" icon="card-outline" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field label="رقم الجواز" value={form.passportNumber} onChangeText={set('passportNumber')} required />
          <Field label="دولة الإصدار" value={form.passportIssuingCountry} onChangeText={set('passportIssuingCountry')} required />
          <Field label="مكان الإصدار" value={form.passportIssuingPlace} onChangeText={set('passportIssuingPlace')} required />
          <Field label="تاريخ الإصدار (YYYY-MM-DD)" value={form.passportIssueDate} onChangeText={set('passportIssueDate')} required />
          <Field label="تاريخ الانتهاء (YYYY-MM-DD)" value={form.passportExpiry} onChangeText={set('passportExpiry')} required />
          <ImageField
            label="صورة الجواز (الصفحة الرئيسية) *"
            value={form.passportImageUrl}
            onUploaded={handleUploadField}
            folder="passport"
            uploading={uploading}
          />
        </View>

        {/* ── Gulf Residence ───────────────────────────────────────────────── */}
        <SectionHeader title="الإقامة الخليجية" icon="home-outline" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Toggle
            label="لدي إقامة سارية في دولة خليجية"
            value={form.hasGulfResidence}
            onToggle={() => set('hasGulfResidence')(!form.hasGulfResidence)}
          />
          {form.hasGulfResidence && (
            <>
              <View style={styles.divider} />
              <Field label="الدولة" value={form.gulfResidenceCountry} onChangeText={set('gulfResidenceCountry')} required />
              <Field label="رقم الإقامة" value={form.gulfResidenceNumber} onChangeText={set('gulfResidenceNumber')} required />
              <Field label="تاريخ الانتهاء (YYYY-MM-DD)" value={form.gulfResidenceExpiry} onChangeText={set('gulfResidenceExpiry')} required />
              <ImageField
                label="صورة الإقامة - الوجه الأمامي *"
                value={form.gulfResidenceFrontUrl}
                onUploaded={handleUploadField}
                folder="gulf_front"
                uploading={uploading}
              />
              <ImageField
                label="صورة الإقامة - الوجه الخلفي *"
                value={form.gulfResidenceBackUrl}
                onUploaded={handleUploadField}
                folder="gulf_back"
                uploading={uploading}
              />
            </>
          )}
        </View>

        {/* ── Active Foreign Visas ──────────────────────────────────────────── */}
        <SectionHeader title="التأشيرات السارية في دول أخرى" icon="globe-outline" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Toggle
            label="لدي تأشيرة سارية في دولة أخرى"
            value={form.hasActiveForeignVisa}
            onToggle={() => set('hasActiveForeignVisa')(!form.hasActiveForeignVisa)}
          />
          {form.hasActiveForeignVisa && (
            <>
              <View style={styles.divider} />
              {form.activeVisas.map((av, i) => (
                <View key={i} style={{ marginBottom: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 }}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '600', textAlign: 'right' }}>تأشيرة {i + 1}</Text>
                    <TouchableOpacity onPress={() => setForm(f => ({ ...f, activeVisas: f.activeVisas.filter((_, idx) => idx !== i) }))}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <Field label="الدولة" value={av.country} onChangeText={v => setForm(f => { const av2 = [...f.activeVisas]; av2[i] = { ...av2[i], country: v }; return { ...f, activeVisas: av2 }; })} />
                  <Field label="نوع التأشيرة" value={av.visaType} onChangeText={v => setForm(f => { const av2 = [...f.activeVisas]; av2[i] = { ...av2[i], visaType: v }; return { ...f, activeVisas: av2 }; })} />
                  <Field label="رقم التأشيرة (اختياري)" value={av.visaNumber} onChangeText={v => setForm(f => { const av2 = [...f.activeVisas]; av2[i] = { ...av2[i], visaNumber: v }; return { ...f, activeVisas: av2 }; })} />
                  <Field label="تاريخ الإصدار (YYYY-MM-DD)" value={av.issueDate} onChangeText={v => setForm(f => { const av2 = [...f.activeVisas]; av2[i] = { ...av2[i], issueDate: v }; return { ...f, activeVisas: av2 }; })} />
                  <Field label="تاريخ الانتهاء (YYYY-MM-DD)" value={av.expiryDate} onChangeText={v => setForm(f => { const av2 = [...f.activeVisas]; av2[i] = { ...av2[i], expiryDate: v }; return { ...f, activeVisas: av2 }; })} />
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setForm(f => ({ ...f, activeVisas: [...f.activeVisas, { country: '', visaType: '', visaNumber: '', issueDate: '', expiryDate: '', imageUrl: '' }] }))}
                style={[styles.uploadBtn, { borderColor: colors.primary, alignSelf: 'flex-end', marginTop: 4 }]}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, marginRight: 4 }}>إضافة تأشيرة</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Travel History ────────────────────────────────────────────────── */}
        <SectionHeader title="سجل السفر (آخر 5 سنوات)" icon="airplane-outline" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Toggle
            label="سبق لي السفر إلى دول خارجية خلال آخر خمس سنوات"
            value={form.hasTravelHistory}
            onToggle={() => set('hasTravelHistory')(!form.hasTravelHistory)}
          />
          {form.hasTravelHistory && (
            <>
              <View style={styles.divider} />
              {form.travelHistory.map((trip, i) => (
                <View key={i} style={{ marginBottom: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 }}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '600', textAlign: 'right' }}>رحلة {i + 1}</Text>
                    <TouchableOpacity onPress={() => setForm(f => ({ ...f, travelHistory: f.travelHistory.filter((_, idx) => idx !== i) }))}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <Field label="الدولة" value={trip.country} onChangeText={v => setForm(f => { const t = [...f.travelHistory]; t[i] = { ...t[i], country: v }; return { ...f, travelHistory: t }; })} />
                  <Field label="تاريخ الدخول (YYYY-MM-DD)" value={trip.entryDate} onChangeText={v => setForm(f => { const t = [...f.travelHistory]; t[i] = { ...t[i], entryDate: v }; return { ...f, travelHistory: t }; })} />
                  <Field label="تاريخ المغادرة (YYYY-MM-DD)" value={trip.exitDate} onChangeText={v => setForm(f => { const t = [...f.travelHistory]; t[i] = { ...t[i], exitDate: v }; return { ...f, travelHistory: t }; })} />
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setForm(f => ({ ...f, travelHistory: [...f.travelHistory, { country: '', entryDate: '', exitDate: '' }] }))}
                style={[styles.uploadBtn, { borderColor: colors.primary, alignSelf: 'flex-end', marginTop: 4 }]}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, marginRight: 4 }}>إضافة رحلة</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Completion hints */}
        {completion && completion.missingFields.length > 0 && (
          <View style={[styles.hintBox, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
            <Text style={{ color: '#92400e', fontWeight: '700', marginBottom: 4, textAlign: 'right' }}>
              الحقول المطلوبة لاكتمال الملف:
            </Text>
            {completion.missingFields.map(f => (
              <Text key={f} style={{ color: '#78350f', textAlign: 'right', fontSize: 12 }}>
                • {f}
              </Text>
            ))}
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: updateMutation.isPending ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
          activeOpacity={0.85}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>حفظ الملف الشخصي</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: { width: 32, alignItems: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  progressWrap: {
    margin: 0,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 14 },
  thumbImage: { width: 72, height: 48, borderRadius: 8, backgroundColor: '#f3f4f6' },
  thumbPlaceholder: {
    width: 72,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  hintBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
