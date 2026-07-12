/**
 * My Profile Screen — professional view of the user's travel profile.
 * Shows completion indicator, all profile sections, and document images.
 */
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useGetProfileCompletion } from '@workspace/api-client-react';

// Brand accent — only used in gradient definitions
const GOLD  = '#C9A060';
const GOLD2 = '#E8C07A';

// ─── Helpers ────────────────────────────────────────────────────────────────────
const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
function formatDateAr(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS_AR[m - 1]} ${y}`;
  } catch { return iso; }
}

const RESIDENCE_LABELS: Record<string, string> = {
  none: '—', gcc: 'دول مجلس التعاون الخليجي',
  schengen: 'دول شنغن', uk: 'المملكة المتحدة', usa: 'الولايات المتحدة الأمريكية',
};
const GENDER_LABELS:  Record<string, string> = { M: 'ذكر', F: 'أنثى', X: 'غير محدد' };
const MARITAL_LABELS: Record<string, string> = {
  single: 'أعزب', married: 'متزوج', divorced: 'مطلّق', widowed: 'أرمل',
};

function arabicFullName(u: any): string {
  return [u?.firstName, u?.fatherName, u?.grandfatherName, u?.familyName]
    .filter(Boolean).join(' ').trim();
}
function displayName(u: any): string {
  return arabicFullName(u) || u?.englishName || u?.fullName || '—';
}

// ─── Sub-components ─────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  const colors = useColors();
  if (!value || value === '—') return null;
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={styles.infoLeft}>
        {icon && <Ionicons name={icon as any} size={13} color={colors.mutedForeground} style={{ marginLeft: 4 }} />}
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function SectionCard({
  title, icon, color = GOLD, children,
}: { title: string; icon: string; color?: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sectionHeader, { borderLeftColor: color, borderBottomColor: colors.border }]}>
        <View style={[styles.sectionIconWrap, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={16} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function DocImage({ uri, label }: { uri: string; label: string }) {
  const colors = useColors();
  return (
    <View style={styles.docImageWrap}>
      <Text style={[styles.docLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Image source={{ uri }} style={[styles.docImage, { backgroundColor: colors.muted }]} contentFit="cover" />
    </View>
  );
}

function CompletionRing({ pct, isComplete }: { pct: number; isComplete: boolean }) {
  const colors = useColors();
  const color = isComplete ? '#22c55e' : pct >= 60 ? '#f59e0b' : GOLD;
  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ringTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.ringFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <View style={styles.ringLabels}>
        <Text style={[styles.ringPct, { color }]}>{pct}%</Text>
        <Text style={[styles.ringText, { color: colors.mutedForeground }]}>
          {isComplete ? 'الملف مكتمل ✓' : 'اكتمال الملف'}
        </Text>
      </View>
    </View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────────
export default function MyProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { data: completion } = useGetProfileCompletion();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop, alignItems: 'center', justifyContent: 'center', gap: 14 }]}>
        <Ionicons name="person-circle-outline" size={56} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_500Medium', fontSize: 15 }}>يجب تسجيل الدخول أولاً</Text>
        <TouchableOpacity
          onPress={() => router.push('/auth/login' as any)}
          style={{ backgroundColor: GOLD, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 }}
        >
          <Text style={{ color: '#0B1628', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const u = user as any;
  const name = displayName(u);
  const pct = completion?.percentage ?? 0;
  const isComplete = completion?.isComplete ?? false;
  const residenceType = u?.residenceType ?? 'none';
  const hasResidence = residenceType !== 'none';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: paddingTop + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>الملف الشخصي</Text>
        <TouchableOpacity onPress={() => router.push('/profile-edit' as any)} style={[styles.editBtn, { backgroundColor: GOLD + '20' }]}>
          <Ionicons name="create-outline" size={20} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* ── Profile Hero ─────────────────────────────────────────────────── */}
        <View style={[styles.profileHero, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {/* Avatar */}
          <View style={styles.heroAvatarRing}>
            <LinearGradient colors={[GOLD, GOLD2, GOLD]} style={styles.heroAvatarGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={[styles.heroAvatarInner, { backgroundColor: colors.background }]}>
                {u?.avatarUrl ? (
                  <Image source={{ uri: u.avatarUrl }} style={{ width: 84, height: 84, borderRadius: 42 }} contentFit="cover" />
                ) : (
                  <Text style={styles.heroAvatarInitial}>
                    {name !== '—' ? name.charAt(0) : 'م'}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </View>

          <Text style={[styles.heroName, { color: colors.foreground }]}>{name}</Text>
          {u?.phone  && <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>{u.phone}</Text>}
          {u?.email  && <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>{u.email}</Text>}
          {u?.nationality && (
            <View style={[styles.nationalityBadge, { borderColor: colors.border, backgroundColor: GOLD + '14' }]}>
              <Ionicons name="flag-outline" size={12} color={GOLD} />
              <Text style={[styles.nationalityText, { color: GOLD }]}>{u.nationality}</Text>
            </View>
          )}

          {/* Completion bar */}
          <CompletionRing pct={pct} isComplete={isComplete} />

          {/* CTA edit */}
          <TouchableOpacity onPress={() => router.push('/profile-edit' as any)} style={styles.editCta} activeOpacity={0.85}>
            <LinearGradient colors={[GOLD, GOLD2]} style={styles.editCtaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="create-outline" size={16} color="#0B1628" />
              <Text style={styles.editCtaText}>تعديل الملف الشخصي</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Sections ─────────────────────────────────────────────────────── */}
        <View style={styles.sectionsWrap}>

          <SectionCard title="المعلومات الشخصية" icon="person-outline" color={GOLD}>
            <InfoRow label="الاسم الكامل"       value={name} />
            <InfoRow label="الجنسية"            value={u?.nationality ?? ''} />
            <InfoRow label="الجنس"              value={GENDER_LABELS[u?.gender] ?? u?.gender ?? ''} />
            <InfoRow label="تاريخ الميلاد"      value={formatDateAr(u?.dob)} />
            <InfoRow label="مكان الميلاد"       value={u?.placeOfBirth ?? ''} />
            <InfoRow label="الحالة الاجتماعية"  value={MARITAL_LABELS[u?.maritalStatus] ?? u?.maritalStatus ?? ''} />
            <InfoRow label="المهنة"             value={u?.occupation ?? ''} />
          </SectionCard>

          <SectionCard title="جواز السفر" icon="card-outline" color="#60A5FA">
            <InfoRow label="رقم الجواز"         value={u?.passportNumber ?? ''} />
            <InfoRow label="الاسم بالإنجليزية"  value={u?.englishName ?? ''} />
            <InfoRow label="بلد الإصدار"        value={u?.passportIssuingCountry ?? ''} />
            <InfoRow label="مكان الإصدار"       value={u?.passportIssuingPlace ?? ''} />
            <InfoRow label="تاريخ الإصدار"      value={formatDateAr(u?.passportIssueDate)} />
            <InfoRow label="تاريخ الانتهاء"     value={formatDateAr(u?.passportExpiry)} />
            {u?.passportImageUrl && <DocImage uri={u.passportImageUrl} label="صورة جواز السفر" />}
          </SectionCard>

          <SectionCard title="الإقامة والتأشيرة" icon="home-outline" color="#A78BFA">
            <InfoRow label="نوع الإقامة" value={RESIDENCE_LABELS[residenceType] ?? ''} />
            {hasResidence && (
              <>
                <InfoRow label="بلد الإقامة"    value={u?.gulfResidenceCountry ?? ''} />
                <InfoRow label="رقم الإقامة"    value={u?.gulfResidenceNumber ?? ''} />
                <InfoRow label="تاريخ الانتهاء" value={formatDateAr(u?.gulfResidenceExpiry)} />
                {u?.gulfResidenceFrontUrl && <DocImage uri={u.gulfResidenceFrontUrl} label="الإقامة/التأشيرة — الوجه الأمامي" />}
                {u?.gulfResidenceBackUrl  && <DocImage uri={u.gulfResidenceBackUrl}  label="الإقامة/التأشيرة — الوجه الخلفي" />}
              </>
            )}
            {!hasResidence && (
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>لا توجد إقامة أو تأشيرة مسجّلة</Text>
            )}
          </SectionCard>

          {(u?.whatsapp || u?.address) && (
            <SectionCard title="معلومات التواصل" icon="call-outline" color="#34D399">
              <InfoRow label="واتساب"  value={u?.whatsapp ?? ''} />
              <InfoRow label="العنوان" value={u?.address  ?? ''} />
            </SectionCard>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles — no hardcoded colors; dynamic values applied as inline styles ──────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16, gap: 10, borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Tajawal_700Bold' },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  profileHero: {
    alignItems: 'center', paddingTop: 28, paddingBottom: 28,
    paddingHorizontal: 24, marginBottom: 16, borderBottomWidth: 1,
  },
  heroAvatarRing: { marginBottom: 14 },
  heroAvatarGradient: { width: 92, height: 92, borderRadius: 46, padding: 3 },
  heroAvatarInner: { flex: 1, borderRadius: 43, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroAvatarInitial: { color: GOLD, fontSize: 34, fontFamily: 'Tajawal_800ExtraBold' },
  heroName: { fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center', marginBottom: 4 },
  heroSub: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'center' },
  nationalityBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    marginTop: 8, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  nationalityText: { fontSize: 12, fontFamily: 'Tajawal_500Medium' },

  ringWrap: { width: '100%', marginTop: 18, marginBottom: 4 },
  ringTrack: { height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  ringFill: { height: '100%', borderRadius: 4 },
  ringLabels: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  ringPct: { fontSize: 13, fontFamily: 'Tajawal_700Bold' },
  ringText: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },

  editCta: { width: '100%', borderRadius: 14, overflow: 'hidden', marginTop: 20 },
  editCtaGradient: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  editCtaText: { color: '#0B1628', fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },

  sectionsWrap: { paddingHorizontal: 16 },
  section: { borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    padding: 14, borderBottomWidth: 1, borderLeftWidth: 3,
  },
  sectionIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontFamily: 'Tajawal_700Bold' },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 6 },

  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1 },
  infoLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  infoValue: { fontSize: 13, fontFamily: 'Tajawal_500Medium', flex: 1, textAlign: 'right', marginRight: 14 },

  emptyHint: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right', paddingVertical: 16 },

  docImageWrap: { marginVertical: 10 },
  docLabel: { fontSize: 12, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginBottom: 8 },
  docImage: { width: '100%', height: 190, borderRadius: 12 },
});
