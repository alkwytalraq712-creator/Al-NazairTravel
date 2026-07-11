import React from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useGetProfileCompletion } from '@workspace/api-client-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.fieldValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={18} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function DocImage({ label, uri }: { label: string; uri?: string | null }) {
  const colors = useColors();
  if (!uri) {
    return (
      <View style={[styles.docPlaceholder, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Ionicons name="image-outline" size={32} color={colors.mutedForeground} />
        <Text style={[styles.docPlaceholderText, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.docPlaceholderSub, { color: colors.mutedForeground }]}>لم يتم رفع الصورة بعد</Text>
      </View>
    );
  }
  return (
    <View style={styles.docImageContainer}>
      <Text style={[styles.docImageLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Image source={{ uri }} style={styles.docImage} resizeMode="cover" />
    </View>
  );
}

// ─── Completion Bar ───────────────────────────────────────────────────────────

function CompletionBar({ pct }: { pct: number }) {
  const colors = useColors();
  const color = pct < 40 ? '#EF4444' : pct < 80 ? '#F59E0B' : '#22c55e';
  return (
    <View style={styles.completionContainer}>
      <View style={styles.completionLabelRow}>
        <Text style={[styles.completionPct, { color }]}>{pct}%</Text>
        <Text style={[styles.completionLabel, { color: colors.mutedForeground }]}>اكتمال الملف</Text>
      </View>
      <View style={[styles.completionTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.completionFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MyProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: completion } = useGetProfileCompletion();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  if (authLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_500Medium' }}>يجب تسجيل الدخول أولاً</Text>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/auth/login' as any)}
        >
          <Text style={styles.editBtnText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const u = user as any;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
        <TouchableOpacity
          onPress={() => router.push('/profile-edit' as any)}
          style={styles.editIconBtn}
        >
          <Ionicons name="create-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 40 : 120 }}
      >
        {/* Profile Hero Card */}
        <View style={[styles.profileHero, { backgroundColor: '#0D1526' }]}>
          <View style={styles.avatarWrap}>
            {u.avatarUrl ? (
              <Image source={{ uri: u.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitial}>{(u.fullName ?? '?').charAt(0)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroName}>{u.fullName}</Text>
          <Text style={styles.heroPhone}>{u.phone}</Text>
          {u.email ? <Text style={styles.heroEmail}>{u.email}</Text> : null}
          {completion && <CompletionBar pct={completion.percentage} />}
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={[styles.editBtnFull, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/profile-edit' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.editBtnText}>تعديل الملف الشخصي</Text>
        </TouchableOpacity>

        {/* Personal Info */}
        <SectionCard title="المعلومات الشخصية" icon="person-outline">
          <FieldRow label="الاسم الكامل (عربي)" value={u.fullName} />
          <FieldRow label="الاسم (إنجليزي)" value={u.englishName} />
          <FieldRow label="رقم الجوال" value={u.phone} />
          <FieldRow label="البريد الإلكتروني" value={u.email} />
          <FieldRow label="الجنسية" value={u.nationality} />
          <FieldRow label="تاريخ الميلاد" value={u.dob} />
          <FieldRow label="الجنس" value={u.gender === 'male' ? 'ذكر' : u.gender === 'female' ? 'أنثى' : u.gender} />
          <FieldRow label="مكان الميلاد" value={u.placeOfBirth} />
          <FieldRow label="المهنة" value={u.occupation} />
          <FieldRow label="الحالة الاجتماعية" value={u.maritalStatus} />
          <FieldRow label="واتساب" value={u.whatsapp} />
          <FieldRow label="العنوان" value={u.address} />
        </SectionCard>

        {/* Passport Info */}
        <SectionCard title="معلومات جواز السفر" icon="reader-outline">
          <FieldRow label="رقم الجواز" value={u.passportNumber} />
          <FieldRow label="دولة الإصدار" value={u.passportIssuingCountry} />
          <FieldRow label="مكان الإصدار" value={u.passportIssuingPlace} />
          <FieldRow label="تاريخ الإصدار" value={u.passportIssueDate} />
          <FieldRow label="تاريخ الانتهاء" value={u.passportExpiry} />
        </SectionCard>

        {/* Gulf Residence */}
        {u.hasGulfResidence && (
          <SectionCard title="الإقامة الخليجية" icon="card-outline">
            <FieldRow label="دولة الإقامة" value={u.gulfResidenceCountry} />
            <FieldRow label="رقم الإقامة" value={u.gulfResidenceNumber} />
            <FieldRow label="تاريخ انتهاء الإقامة" value={u.gulfResidenceExpiry} />
          </SectionCard>
        )}

        {/* Documents */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="documents-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>المستندات</Text>
          </View>
          <View style={styles.docsGrid}>
            <DocImage label="صورة جواز السفر" uri={u.passportImageUrl} />
            {u.hasGulfResidence && (
              <DocImage label="صورة الإقامة (أمامية)" uri={u.gulfResidenceFrontUrl} />
            )}
            {u.hasGulfResidence && u.gulfResidenceBackUrl && (
              <DocImage label="صورة الإقامة (خلفية)" uri={u.gulfResidenceBackUrl} />
            )}
          </View>
          {(!u.passportImageUrl && !u.gulfResidenceFrontUrl) && (
            <TouchableOpacity
              style={[styles.uploadPrompt, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => router.push('/profile-edit' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
              <Text style={[styles.uploadPromptText, { color: colors.foreground }]}>رفع الجواز والإقامة</Text>
              <Text style={[styles.uploadPromptSub, { color: colors.mutedForeground }]}>
                ارفع صور الوثائق لإكمال ملفك الشخصي
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Incomplete fields notice */}
        {completion && !completion.isComplete && (
          <TouchableOpacity
            style={[styles.incompleteCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
            onPress={() => router.push('/profile-edit' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="warning-outline" size={22} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.incompleteTitle}>الملف غير مكتمل ({completion.percentage}%)</Text>
              <Text style={styles.incompleteSub}>
                أكمل بياناتك لتتمكن من التقديم على التأشيرات
              </Text>
            </View>
            <Ionicons name="chevron-back" size={18} color="#D97706" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { width: 32, alignItems: 'center' },
  editIconBtn: { width: 32, alignItems: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },

  profileHero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 8,
    gap: 6,
  },
  avatarWrap: {
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#F08015' },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#F08015',
  },
  avatarInitial: { color: '#fff', fontSize: 36, fontFamily: 'Tajawal_800ExtraBold' },
  heroName: { color: '#fff', fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  heroPhone: { color: '#ffffffcc', fontSize: 14, fontFamily: 'Tajawal_400Regular' },
  heroEmail: { color: '#ffffffaa', fontSize: 12, fontFamily: 'Tajawal_400Regular' },

  completionContainer: { width: '100%', marginTop: 12, gap: 4 },
  completionLabelRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  completionLabel: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  completionPct: { fontSize: 12, fontFamily: 'Tajawal_700Bold' },
  completionTrack: { height: 6, borderRadius: 3, width: '100%' },
  completionFill: { height: 6, borderRadius: 3 },

  editBtnFull: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  editBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  editBtnText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 },

  sectionContainer: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontFamily: 'Tajawal_800ExtraBold' },

  fieldCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  fieldRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  fieldLabel: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  fieldValue: { fontSize: 14, fontFamily: 'Tajawal_500Medium', textAlign: 'right', flex: 1, marginLeft: 8 },

  docsGrid: { gap: 12 },
  docImageContainer: { gap: 8 },
  docImageLabel: { fontSize: 12, fontFamily: 'Tajawal_500Medium', textAlign: 'right' },
  docImage: { width: '100%', height: 180, borderRadius: 12 },
  docPlaceholder: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  docPlaceholderText: { fontSize: 13, fontFamily: 'Tajawal_700Bold' },
  docPlaceholderSub: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },

  uploadPrompt: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  uploadPromptText: { fontSize: 15, fontFamily: 'Tajawal_700Bold' },
  uploadPromptSub: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },

  incompleteCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  incompleteTitle: { fontSize: 14, fontFamily: 'Tajawal_700Bold', color: '#92400E', textAlign: 'right' },
  incompleteSub: { fontSize: 12, fontFamily: 'Tajawal_400Regular', color: '#B45309', textAlign: 'right', marginTop: 2 },
});
