/**
 * Account Screen — professional redesign with gradient hero, live stats,
 * quick actions, grouped menu sections, and profile completion indicator.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import {
  useListMyFlightBookings,
  useListMyVisaApplications,
  useGetProfileCompletion,
} from '@workspace/api-client-react';

// Brand accent constants — only used in gradient colors and brand-specific elements
const GOLD   = '#C9A060';
const GOLD2  = '#E8C07A';

// ─── Menu definition ───────────────────────────────────────────────────────────
const MENU_SECTIONS = [
  {
    title: 'السفر والحجوزات',
    items: [
      { icon: 'airplane-outline',       label: 'رحلاتي',               route: '/my-flights',   badge: null },
      { icon: 'document-text-outline',  label: 'طلباتي وحجوزاتي',      route: '/bookings',     badge: null },
      { icon: 'earth-outline',          label: 'تأشيراتي',              route: '/visa',          badge: null },
      { icon: 'briefcase-outline',      label: 'الباقات السياحية',      route: '/packages',     badge: null },
    ],
  },
  {
    title: 'الحساب الشخصي',
    items: [
      { icon: 'id-card-outline',        label: 'الملف الشخصي',         route: '/my-profile',   badge: null },
      { icon: 'create-outline',         label: 'تعديل الملف الشخصي',   route: '/profile-edit', badge: null },
      { icon: 'notifications-outline',  label: 'الإشعارات',             route: '/notifications',badge: null },
      { icon: 'shield-checkmark-outline',label: 'الأمان والخصوصية',    route: '/security',     badge: null },
    ],
  },
  {
    title: 'الدعم والمساعدة',
    items: [
      { icon: 'call-outline',           label: 'اتصل بنا',              route: '/contact',      badge: null },
      { icon: 'help-circle-outline',    label: 'المساعدة والدعم',       route: '/help',         badge: null },
    ],
  },
] as const;

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatTile({ icon, value, label, onPress }: { icon: string; value: string | number; label: string; onPress?: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity style={styles.statTile} onPress={onPress} activeOpacity={onPress ? 0.75 : 1}>
      <View style={[styles.statIconWrap, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MenuSection({ title, items }: { title: string; items: readonly { icon: string; label: string; route: string; badge: null }[] }) {
  const colors = useColors();
  return (
    <View style={styles.menuSection}>
      <Text style={[styles.menuSectionTitle, { color: colors.primary }]}>{title}</Text>
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={16} color={colors.mutedForeground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
            <View style={[styles.menuIconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name={item.icon as any} size={17} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Guest screen ───────────────────────────────────────────────────────────────
function GuestScreen({ paddingTop }: { paddingTop: number }) {
  const colors = useColors();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop }]}>
      <View style={styles.guestCenter}>
        <View style={[styles.guestLogoWrap, { backgroundColor: colors.primary + '18', borderColor: colors.border }]}>
          <Ionicons name="airplane" size={42} color={colors.primary} />
        </View>
        <Text style={[styles.guestTitle, { color: colors.foreground }]}>قمة للسفر والسياحة</Text>
        <Text style={[styles.guestSub, { color: colors.mutedForeground }]}>سجّل دخولك للوصول إلى رحلاتك وطلباتك وملفك الشخصي</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push('/auth/login')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[GOLD, GOLD2]} style={styles.loginGradient}>
            <Text style={[styles.loginBtnText, { color: '#0B1628' }]}>تسجيل الدخول</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.registerBtn, { borderColor: colors.primary + '60' }]}
          onPress={() => router.push('/auth/register')}
          activeOpacity={0.8}
        >
          <Text style={[styles.registerBtnText, { color: colors.primary }]}>إنشاء حساب جديد</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────────
export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const [loggingOut, setLoggingOut] = useState(false);

  // Live stats
  const { data: flightsData } = useListMyFlightBookings({ query: { enabled: isAuthenticated } } as any);
  const { data: visasData }   = useListMyVisaApplications({ query: { enabled: isAuthenticated } } as any);
  const { data: completion }  = useGetProfileCompletion();

  const flightsCount = Array.isArray(flightsData) ? flightsData.length : 0;
  const visasCount   = Array.isArray(visasData)   ? visasData.length   : 0;
  const pct          = completion?.percentage ?? 0;
  const isComplete   = completion?.isComplete ?? false;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logout(); } catch { /* already cleared */ } finally { setLoggingOut(false); }
    router.replace('/auth/login' as any);
  }

  const colors = useColors();

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) return <GuestScreen paddingTop={paddingTop} />;

  const initials = (user!.fullName ?? '?').charAt(0).toUpperCase();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 110 }}
      >
        {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[colors.card as string, colors.background as string, colors.card as string]}
          style={[styles.hero, { paddingTop: paddingTop + 20, borderBottomColor: colors.border }]}
        >
          {/* Top row: settings icon */}
          <View style={styles.heroTopRow}>
            <TouchableOpacity onPress={() => router.push('/security' as any)} activeOpacity={0.7} style={[styles.settingsBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="settings-outline" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.heroScreenTitle, { color: colors.foreground }]}>حسابي</Text>
          </View>

          {/* Avatar + name */}
          <View style={styles.heroCenter}>
            {/* Gold-ringed avatar */}
            <View style={styles.avatarRing}>
              <LinearGradient colors={[GOLD, GOLD2, GOLD]} style={styles.avatarGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
                  {user!.avatarUrl ? (
                    <Image
                      source={{ uri: user!.avatarUrl }}
                      style={{ width: 80, height: 80, borderRadius: 40 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                  )}
                </View>
              </LinearGradient>
            </View>

            <Text style={[styles.heroName, { color: colors.foreground }]}>{user!.fullName}</Text>
            {user!.phone  && <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>{user!.phone}</Text>}
            {user!.email  && <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>{user!.email}</Text>}

            {/* Edit profile shortcut */}
            <TouchableOpacity
              style={[styles.editProfileBtn, { borderColor: colors.border, backgroundColor: colors.primary + '14' }]}
              onPress={() => router.push('/profile-edit' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={14} color={colors.primary} />
              <Text style={[styles.editProfileText, { color: colors.primary }]}>تعديل الملف</Text>
            </TouchableOpacity>
          </View>

          {/* Membership card strip */}
          <View style={[styles.memberCard, { borderColor: colors.border, backgroundColor: colors.primary + '12' }]}>
            <View style={styles.memberLeft}>
              <Text style={[styles.memberTier, { color: colors.primary }]}>عضو قمة</Text>
              <Text style={[styles.memberSince, { color: colors.mutedForeground }]}>Qema Member</Text>
            </View>
            <View style={styles.memberRight}>
              <Ionicons name="diamond-outline" size={22} color={colors.primary} />
            </View>
          </View>

          {/* Profile completion */}
          {!isComplete && pct > 0 && (
            <TouchableOpacity
              style={[styles.completionBar, { borderColor: colors.border, backgroundColor: colors.muted }]}
              onPress={() => router.push('/profile-edit' as any)}
              activeOpacity={0.85}
            >
              <View style={styles.completionTop}>
                <Text style={[styles.completionPct, { color: colors.primary }]}>{pct}%</Text>
                <Text style={[styles.completionLabel, { color: colors.mutedForeground }]}>أكمل ملفك الشخصي لتسريع الحجز ↑</Text>
              </View>
              <View style={[styles.completionTrack, { backgroundColor: colors.border }]}>
                <LinearGradient
                  colors={[GOLD, GOLD2]}
                  style={[styles.completionFill, { width: `${pct}%` as any }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </TouchableOpacity>
          )}
          {isComplete && (
            <View style={styles.completionDone}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.completionDoneText}>الملف الشخصي مكتمل ✓</Text>
            </View>
          )}
        </LinearGradient>

        {/* ── Live Stats ──────────────────────────────────────────────────────── */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StatTile
            icon="airplane"
            value={flightsCount}
            label="رحلة"
            onPress={() => router.push('/my-flights' as any)}
          />
          <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
          <StatTile
            icon="earth"
            value={visasCount}
            label="تأشيرة"
            onPress={() => router.push('/visa' as any)}
          />
          <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
          <StatTile
            icon="person-circle"
            value={`${pct}%`}
            label="إكمال الملف"
            onPress={() => router.push('/my-profile' as any)}
          />
        </View>

        {/* ── Quick Actions ────────────────────────────────────────────────────── */}
        <View style={styles.quickRow}>
          {[
            { icon: 'airplane',        label: 'رحلاتي',    route: '/my-flights'   },
            { icon: 'earth',           label: 'تأشيراتي',  route: '/visa'          },
            { icon: 'briefcase',       label: 'الباقات',   route: '/packages'      },
            { icon: 'document-text',   label: 'طلباتي',    route: '/bookings'      },
          ].map(({ icon, label, route }) => (
            <TouchableOpacity
              key={label}
              style={[styles.quickTile, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIconWrap, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name={icon as any} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Grouped Menu ─────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
          {MENU_SECTIONS.map(s => <MenuSection key={s.title} title={s.title} items={s.items} />)}
        </View>

        {/* ── Logout ───────────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          activeOpacity={0.75}
          disabled={loggingOut}
        >
          {loggingOut
            ? <ActivityIndicator size="small" color="#EF4444" />
            : <Ionicons name="log-out-outline" size={20} color="#EF4444" />}
          <Text style={styles.logoutText}>
            {loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}
          </Text>
        </TouchableOpacity>

        {/* App version */}
        <Text style={styles.version}>قمة للسفر والسياحة · v1.0</Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles — no hardcoded colors; all dynamic values applied as inline styles ──
const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },

  // ── Hero
  hero: {
    paddingHorizontal: 20, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, borderBottomWidth: 1,
  },
  heroTopRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  heroScreenTitle: { fontSize: 20, fontFamily: 'Tajawal_800ExtraBold' },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroCenter: { alignItems: 'center', marginBottom: 18 },
  avatarRing: { marginBottom: 14 },
  avatarGradient: { width: 88, height: 88, borderRadius: 44, padding: 3 },
  avatarInner: { flex: 1, borderRadius: 41, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { color: GOLD, fontSize: 34, fontFamily: 'Tajawal_800ExtraBold' },
  heroName: { fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center', marginBottom: 4 },
  heroSub: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'center' },
  editProfileBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  editProfileText: { fontSize: 12, fontFamily: 'Tajawal_500Medium' },

  // ── Member card
  memberCard: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, marginBottom: 12 },
  memberLeft: { alignItems: 'flex-end' },
  memberTier: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  memberSince: { fontFamily: 'Tajawal_400Regular', fontSize: 11 },
  memberRight: {},

  // ── Completion
  completionBar: { borderRadius: 12, padding: 12, borderWidth: 1 },
  completionTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  completionLabel: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  completionPct: { fontSize: 13, fontFamily: 'Tajawal_700Bold' },
  completionTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: 3 },
  completionDone: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 0 },
  completionDoneText: { color: '#22c55e', fontSize: 13, fontFamily: 'Tajawal_500Medium' },

  // ── Stats
  statsRow: { flexDirection: 'row-reverse', marginHorizontal: 16, marginTop: 16, borderRadius: 18, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 8 },
  statTile: { flex: 1, alignItems: 'center', gap: 6 },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Tajawal_800ExtraBold' },
  statLabel: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  statsDivider: { width: 1, marginHorizontal: 4 },

  // ── Quick actions
  quickRow: { flexDirection: 'row-reverse', marginHorizontal: 16, marginTop: 14, gap: 10 },
  quickTile: { flex: 1, alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1, paddingVertical: 14 },
  quickIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontFamily: 'Tajawal_700Bold', textAlign: 'center' },

  // ── Menu sections
  menuSection: { marginBottom: 16 },
  menuSectionTitle: { fontSize: 12, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 8, paddingRight: 4, letterSpacing: 0.5 },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: 'Tajawal_500Medium', textAlign: 'right' },

  // ── Logout
  logoutBtn: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.06)' },
  logoutText: { color: '#EF4444', fontFamily: 'Tajawal_700Bold', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 11, fontFamily: 'Tajawal_400Regular', marginTop: 12, marginBottom: 4, opacity: 0.35 },

  // ── Guest
  guestCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  guestLogoWrap: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  guestTitle: { fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  guestSub: { fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'center', lineHeight: 22 },
  loginBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  loginGradient: { paddingVertical: 16, alignItems: 'center' },
  loginBtnText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  registerBtn: { width: '100%', paddingVertical: 15, borderRadius: 16, borderWidth: 1.5, alignItems: 'center' },
  registerBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 16 },
});
