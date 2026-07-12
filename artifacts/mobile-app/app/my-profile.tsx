import React, { useEffect, useRef } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useGetProfileCompletion } from '@workspace/api-client-react';

const GOLD  = '#C9A060';
const GOLD2 = '#E8C07A';
const NAVY  = '#060B18';
const NAVY2 = '#0C1628';
const NAVY3 = '#121F38';

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

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  const colors = useColors();
  if (!value || value === '—') return null;
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={styles.infoLeft}>
        {icon && <Ionicons name={icon as any} size={14} color={colors.mutedForeground} style={{ marginLeft: 6 }} />}
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function SectionCard({
  title, icon, gradientColors, children, index,
}: { title: string; icon: string; gradientColors: readonly [string, string]; children: React.ReactNode; index: number }) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 100,
      useNativeDriver: true,
      bounciness: 10,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View style={[
      styles.section,
      { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground },
      {
        opacity: anim,
        transform: [{
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }
    ]}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <LinearGradient colors={gradientColors} style={styles.sectionIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name={icon as any} size={20} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </Animated.View>
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
  const color = isComplete ? colors.success : pct >= 60 ? colors.warning : GOLD;
  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ringTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.ringFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <View style={styles.ringLabels}>
        <Text style={[styles.ringPct, { color }]}>{pct}%</Text>
        <Text style={[styles.ringText, { color: colors.mutedForeground }]}>
          {isComplete ? 'الملف مكتمل' : 'اكتمال الملف'}
        </Text>
      </View>
    </View>
  );
}

export default function MyProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { data: completion } = useGetProfileCompletion();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop, alignItems: 'center', justifyContent: 'center', gap: 14 }]}>
        <Ionicons name="person-circle-outline" size={64} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_500Medium', fontSize: 16 }}>يجب تسجيل الدخول أولاً</Text>
        <TouchableOpacity
          onPress={() => router.push('/auth/login' as any)}
        >
          <LinearGradient colors={[GOLD, GOLD2]} style={{ paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={{ color: '#0B1628', fontFamily: 'Tajawal_700Bold', fontSize: 16 }}>تسجيل الدخول</Text>
          </LinearGradient>
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
      <LinearGradient colors={[NAVY, NAVY2, NAVY3]} style={[styles.headerGradient, { paddingTop: paddingTop + 12 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
          <TouchableOpacity onPress={() => router.push('/profile-edit' as any)} style={styles.circleBtn}>
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        <Animated.View style={[styles.profileHero, { opacity: fadeAnim }]}>
          <View style={styles.heroAvatarRing}>
            <LinearGradient colors={[GOLD, GOLD2, GOLD]} style={styles.heroAvatarGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={[styles.heroAvatarInner, { backgroundColor: colors.background }]}>
                {u?.avatarUrl ? (
                  <Image source={{ uri: u.avatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} contentFit="cover" />
                ) : (
                  <Text style={[styles.heroAvatarInitial, { color: GOLD }]}>
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
            <View style={[styles.nationalityBadge, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Ionicons name="flag-outline" size={14} color={GOLD} />
              <Text style={[styles.nationalityText, { color: GOLD }]}>{u.nationality}</Text>
            </View>
          )}

          <CompletionRing pct={pct} isComplete={isComplete} />
        </Animated.View>

        <View style={styles.sectionsWrap}>
          <SectionCard title="المعلومات الشخصية" icon="person" gradientColors={['#3B82F6', '#2563EB']} index={0}>
            <InfoRow label="الاسم الكامل"       value={name} />
            <InfoRow label="الجنسية"            value={u?.nationality ?? ''} />
            <InfoRow label="الجنس"              value={GENDER_LABELS[u?.gender] ?? u?.gender ?? ''} />
            <InfoRow label="تاريخ الميلاد"      value={formatDateAr(u?.dob)} />
            <InfoRow label="مكان الميلاد"       value={u?.placeOfBirth ?? ''} />
            <InfoRow label="الحالة الاجتماعية"  value={MARITAL_LABELS[u?.maritalStatus] ?? u?.maritalStatus ?? ''} />
            <InfoRow label="المهنة"             value={u?.occupation ?? ''} />
          </SectionCard>

          <SectionCard title="جواز السفر" icon="card" gradientColors={['#10B981', '#059669']} index={1}>
            <InfoRow label="رقم الجواز"         value={u?.passportNumber ?? ''} />
            <InfoRow label="الاسم بالإنجليزية"  value={u?.englishName ?? ''} />
            <InfoRow label="بلد الإصدار"        value={u?.passportIssuingCountry ?? ''} />
            <InfoRow label="مكان الإصدار"       value={u?.passportIssuingPlace ?? ''} />
            <InfoRow label="تاريخ الإصدار"      value={formatDateAr(u?.passportIssueDate)} />
            <InfoRow label="تاريخ الانتهاء"     value={formatDateAr(u?.passportExpiry)} />
            {u?.passportImageUrl && <DocImage uri={u.passportImageUrl} label="صورة جواز السفر" />}
          </SectionCard>

          <SectionCard title="الإقامة والتأشيرة" icon="home" gradientColors={['#8B5CF6', '#6D28D9']} index={2}>
            <InfoRow label="نوع الإقامة" value={RESIDENCE_LABELS[residenceType] ?? ''} />
            {hasResidence && (
              <>
                <InfoRow label="بلد الإقامة"    value={u?.gulfResidenceCountry ?? ''} />
                <InfoRow label="رقم الإقامة"    value={u?.gulfResidenceNumber ?? ''} />
                <InfoRow label="تاريخ الانتهاء" value={formatDateAr(u?.gulfResidenceExpiry)} />
                {u?.gulfResidenceFrontUrl && <DocImage uri={u.gulfResidenceFrontUrl} label="الإقامة والتأشيرة - الوجه الأمامي" />}
                {u?.gulfResidenceBackUrl  && <DocImage uri={u.gulfResidenceBackUrl}  label="الإقامة والتأشيرة - الوجه الخلفي" />}
              </>
            )}
            {!hasResidence && (
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>لا توجد إقامة أو تأشيرة مسجّلة</Text>
            )}
          </SectionCard>

          {(u?.whatsapp || u?.address) && (
            <SectionCard title="معلومات التواصل" icon="call" gradientColors={['#F59E0B', '#D97706']} index={3}>
              <InfoRow label="واتساب"  value={u?.whatsapp ?? ''} />
              <InfoRow label="العنوان" value={u?.address  ?? ''} />
            </SectionCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
    marginBottom: 24,
  },
  headerInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'center',
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileHero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  heroAvatarRing: { marginBottom: 16 },
  heroAvatarGradient: { width: 98, height: 98, borderRadius: 49, padding: 4 },
  heroAvatarInner: { flex: 1, borderRadius: 46, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroAvatarInitial: { fontSize: 36, fontFamily: 'Tajawal_800ExtraBold' },
  heroName: { fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center', marginBottom: 6 },
  heroSub: { fontSize: 14, fontFamily: 'Tajawal_500Medium', textAlign: 'center', marginBottom: 4 },
  nationalityBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    marginTop: 12, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  nationalityText: { fontSize: 13, fontFamily: 'Tajawal_700Bold' },

  ringWrap: { width: '100%', marginTop: 24, marginBottom: 8 },
  ringTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  ringFill: { height: '100%', borderRadius: 4 },
  ringLabels: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  ringPct: { fontSize: 14, fontFamily: 'Tajawal_800ExtraBold' },
  ringText: { fontSize: 13, fontFamily: 'Tajawal_500Medium' },

  sectionsWrap: { paddingHorizontal: 16 },
  section: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Tajawal_800ExtraBold' },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },

  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  infoLeft: { flexDirection: 'row-reverse', alignItems: 'center' },
  infoLabel: { fontSize: 13, fontFamily: 'Tajawal_500Medium' },
  infoValue: { fontSize: 14, fontFamily: 'Tajawal_700Bold', flex: 1, textAlign: 'left', marginLeft: 16 },

  emptyHint: { fontSize: 14, fontFamily: 'Tajawal_500Medium', textAlign: 'right', paddingVertical: 20 },

  docImageWrap: { marginVertical: 14 },
  docLabel: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 10 },
  docImage: { width: '100%', height: 210, borderRadius: 16 },
});
