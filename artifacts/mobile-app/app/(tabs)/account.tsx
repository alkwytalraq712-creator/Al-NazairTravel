/**
 * Account Screen — Premium dark-hero redesign.
 * Navy gradient header, gold avatar ring, elevated stat cards,
 * crisp menu rows — Emirates / Qatar Airways quality.
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  ActivityIndicator, Animated, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
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
  useListMyPackageBookings,
  useGetProfileCompletion,
} from '@workspace/api-client-react';

// Brand constants — only for LinearGradient (must be string literals)
const GOLD  = '#C9A060';
const GOLD2 = '#E8C07A';
const NAVY  = '#080C18';
const NAVY2 = '#0D1526';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, value, label, color, onPress, delay = 0,
}: {
  icon: string; value: string | number; label: string;
  color: string; onPress?: () => void; delay?: number;
}) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, flex: 1 }}>
      <TouchableOpacity
        style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={onPress ? 0.75 : 1}
      >
        <View style={[s.statIconWrap, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text style={[s.statValue, { color: colors.foreground }]}>{value}</Text>
        <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Menu Item ────────────────────────────────────────────────────────────────
function MenuItem({
  icon, label, route, iconColor, badge, badgeText, disabled, last,
}: {
  icon: string; label: string; route?: string; iconColor: string;
  badge?: boolean; badgeText?: string; disabled?: boolean; last?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={() => { if (!disabled && route) router.push(route as any); }}
      activeOpacity={disabled ? 1 : 0.65}
      style={[s.menuItem, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
    >
      <Ionicons name="chevron-back" size={14} color={disabled ? colors.border : colors.mutedForeground} />
      <Text style={[s.menuLabel, { color: disabled ? colors.mutedForeground : colors.foreground }]}>{label}</Text>
      {badgeText ? (
        <View style={[s.menuCountBadge, { backgroundColor: iconColor + '20', borderColor: iconColor + '40' }]}>
          <Text style={[s.menuCountText, { color: iconColor }]}>{badgeText}</Text>
        </View>
      ) : null}
      {badge && (
        <View style={[s.menuSoonBadge, { backgroundColor: colors.muted }]}>
          <Text style={[s.menuSoonText, { color: colors.mutedForeground }]}>قريباً</Text>
        </View>
      )}
      <View style={[s.menuIconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Menu Group ───────────────────────────────────────────────────────────────
function MenuGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={s.sectionWrap}>
      {title && (
        <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      )}
      <View style={[s.menuGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

// ─── Guest Screen ─────────────────────────────────────────────────────────────
function GuestScreen({ paddingTop }: { paddingTop: number }) {
  const colors = useColors();
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);
  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[NAVY, NAVY2, colors.background]} style={[s.guestHero, { paddingTop }]}>
        <Animated.View style={[s.guestWrap, { opacity: fade }]}>
          <View style={[s.guestLogoRing]}>
            <LinearGradient colors={[GOLD, GOLD2]} style={s.guestLogoGrad}>
              <Ionicons name="airplane" size={36} color={NAVY} />
            </LinearGradient>
          </View>
          <Text style={s.guestTitle}>قمة النظائر للسفر</Text>
          <Text style={[s.guestSub, { color: colors.mutedForeground }]}>
            سجّل دخولك للوصول إلى رحلاتك، طلباتك، وملفك الشخصي
          </Text>
          <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/auth/login')} activeOpacity={0.85}>
            <LinearGradient colors={[GOLD, GOLD2]} style={s.loginGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.loginBtnText}>تسجيل الدخول</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.registerBtn, { borderColor: GOLD + '55' }]}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.8}
          >
            <Text style={[s.registerBtnText, { color: GOLD }]}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AccountScreen() {
  const colors     = useColors();
  const insets     = useSafeAreaInsets();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const [loggingOut, setLoggingOut] = useState(false);

  const heroFade  = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-20)).current;
  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(heroFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(heroSlide, { toValue: 0, speed: 14, bounciness: 3, useNativeDriver: true }),
      ]).start();
    }
  }, [isLoading]);

  const { data: flightsData  } = useListMyFlightBookings({ query: { enabled: isAuthenticated } } as any);
  const { data: visasData    } = useListMyVisaApplications({ query: { enabled: isAuthenticated } } as any);
  const { data: packagesData } = useListMyPackageBookings({ query: { enabled: isAuthenticated } } as any);
  const { data: completion   } = useGetProfileCompletion();

  const flights  = Array.isArray(flightsData)  ? flightsData  : [];
  const visas    = Array.isArray(visasData)    ? visasData    : [];
  const packages = Array.isArray(packagesData) ? packagesData : [];

  const totalOrders      = flights.length + visas.length + packages.length;
  const completedFlights = flights.filter((f: any) => ['ticketed', 'completed'].includes(f.status)).length;
  const upcomingFlights  = flights.filter((f: any) => ['confirmed', 'pending', 'held'].includes(f.status)).length;
  const pct        = completion?.percentage ?? 0;
  const isComplete = completion?.isComplete ?? false;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logout(); } catch {}
    finally { setLoggingOut(false); }
    router.replace('/auth/login' as any);
  }

  if (isLoading) {
    return (
      <View style={[s.screen, s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (!isAuthenticated) return <GuestScreen paddingTop={paddingTop} />;

  const initials = (user!.fullName ?? '?').charAt(0).toUpperCase();

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 120 }}
      >

        {/* ══════════ DARK HERO ══════════ */}
        <LinearGradient
          colors={[NAVY, NAVY2, NAVY2 + 'F0']}
          style={[s.hero, { paddingTop: paddingTop + 12 }]}
        >
          <Animated.View style={{ opacity: heroFade, transform: [{ translateY: heroSlide }] }}>

            {/* Top bar */}
            <View style={s.heroTopBar}>
              <TouchableOpacity
                style={s.topBarBtn}
                onPress={() => router.push('/security' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
              <Text style={s.screenTitle}>حسابي</Text>
              <TouchableOpacity
                style={s.topBarBtn}
                onPress={() => router.push('/notifications' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
            </View>

            {/* Avatar + info */}
            <View style={s.profileRow}>
              {/* Gold-ring avatar */}
              <View style={s.avatarShell}>
                <LinearGradient
                  colors={[GOLD2, GOLD, GOLD2]}
                  style={s.avatarGradRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={s.avatarInner}>
                    {user!.avatarUrl ? (
                      <Image source={{ uri: user!.avatarUrl }} style={s.avatarImg} contentFit="cover" />
                    ) : (
                      <Text style={s.avatarInitial}>{initials}</Text>
                    )}
                  </View>
                </LinearGradient>
              </View>

              {/* Text */}
              <View style={s.profileInfo}>
                <Text style={s.profileName} numberOfLines={1}>{user!.fullName}</Text>
                {user!.email && (
                  <View style={s.infoRow}>
                    <Ionicons name="mail-outline" size={12} color="rgba(255,255,255,0.55)" />
                    <Text style={s.infoText} numberOfLines={1}>{user!.email}</Text>
                  </View>
                )}
                {user!.phone && (
                  <View style={s.infoRow}>
                    <Ionicons name="call-outline" size={12} color="rgba(255,255,255,0.55)" />
                    <Text style={s.infoText}>{user!.phone}</Text>
                  </View>
                )}
                <View style={s.memberBadge}>
                  <Ionicons name="diamond-outline" size={11} color={GOLD} />
                  <Text style={s.memberText}>عضو قمة · Qema Member</Text>
                </View>
              </View>

              {/* Edit */}
              <TouchableOpacity
                onPress={() => router.push('/profile-edit' as any)}
                style={s.editBtn}
                activeOpacity={0.75}
              >
                <Ionicons name="create-outline" size={17} color={GOLD} />
              </TouchableOpacity>
            </View>

            {/* Profile completion */}
            {!isComplete && pct > 0 && (
              <TouchableOpacity
                style={s.completionWrap}
                onPress={() => router.push('/profile-edit' as any)}
                activeOpacity={0.85}
              >
                <View style={s.completionHeader}>
                  <Text style={[s.completionPct, { color: GOLD }]}>{pct}%</Text>
                  <Text style={s.completionLabel}>أكمل ملفك لتسريع الحجز ←</Text>
                </View>
                <View style={s.completionTrack}>
                  <LinearGradient
                    colors={[GOLD, GOLD2]}
                    style={[s.completionFill, { width: `${pct}%` as any }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              </TouchableOpacity>
            )}
            {isComplete && (
              <View style={s.completionDone}>
                <Ionicons name="checkmark-circle" size={15} color="#4ADE80" />
                <Text style={s.completionDoneText}>الملف الشخصي مكتمل</Text>
              </View>
            )}

          </Animated.View>
        </LinearGradient>

        {/* ══════════ STATS GRID ══════════ */}
        <View style={s.statsGrid}>
          <View style={s.statsRow}>
            <StatCard icon="document-text"  value={totalOrders}      label="إجمالي الطلبات"  color="#6366F1" delay={0}   onPress={() => router.push('/bookings' as any)} />
            <StatCard icon="checkmark-done" value={completedFlights} label="رحلات مكتملة"    color="#22C55E" delay={80}  onPress={() => router.push('/bookings' as any)} />
          </View>
          <View style={s.statsRow}>
            <StatCard icon="airplane"       value={upcomingFlights}  label="رحلات قادمة"     color={GOLD}    delay={160} onPress={() => router.push('/bookings' as any)} />
            <StatCard icon="earth"          value={visas.length}     label="طلبات التأشيرة"  color="#3B82F6" delay={240} onPress={() => router.push('/bookings' as any)} />
          </View>
        </View>

        {/* ══════════ SERVICES ══════════ */}
        <MenuGroup title="الخدمات">
          <MenuItem
            icon="document-text"
            label="طلباتي وحجوزاتي"
            route="/bookings"
            iconColor="#6366F1"
            badgeText={totalOrders > 0 ? String(totalOrders) : undefined}
          />
          <MenuItem icon="person"               label="الملف الشخصي"      route="/my-profile"    iconColor={GOLD} />
          <MenuItem icon="card-outline"         label="وسائل الدفع"        iconColor="#22C55E"    badge disabled />
          <MenuItem icon="notifications"        label="الإشعارات"          route="/notifications" iconColor="#8B5CF6" />
          <MenuItem icon="pricetag-outline"     label="العروض والكوبونات"  iconColor="#F59E0B"    badge disabled />
          <MenuItem icon="settings"             label="الإعدادات"          route="/security"      iconColor="#6B7280" last />
        </MenuGroup>

        {/* ══════════ SUPPORT ══════════ */}
        <MenuGroup title="الدعم والمعلومات">
          <MenuItem icon="headset-outline"       label="الدعم الفني"         route="/help"           iconColor="#3B82F6" />
          <MenuItem icon="call-outline"          label="اتصل بنا"            route="/contact"        iconColor="#22C55E" />
          <MenuItem icon="shield-checkmark"      label="سياسة الخصوصية"     route="/legal/privacy"  iconColor="#8B5CF6" />
          <MenuItem icon="document-text-outline" label="الشروط والأحكام"     route="/legal/terms"    iconColor="#6B7280" last />
        </MenuGroup>

        {/* ══════════ LOGOUT ══════════ */}
        <View style={[s.sectionWrap, { marginBottom: 0 }]}>
          <TouchableOpacity
            style={[s.logoutBtn, { borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.06)' }, loggingOut && { opacity: 0.6 }]}
            onPress={handleLogout}
            activeOpacity={0.75}
            disabled={loggingOut}
          >
            {loggingOut
              ? <ActivityIndicator size="small" color="#EF4444" />
              : <Ionicons name="log-out-outline" size={19} color="#EF4444" />}
            <Text style={s.logoutText}>{loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.version, { color: colors.mutedForeground }]}>
          قمة النظائر للسفريات والسياحة · v1.0
        </Text>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },

  // ── Hero (dark gradient) ──
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 20,
    fontFamily: 'Tajawal_800ExtraBold',
    color: '#FFFFFF',
  },
  topBarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  // ── Profile row ──
  profileRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  avatarShell: {},
  avatarGradRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 78, height: 78, borderRadius: 39 },
  avatarInitial: {
    color: GOLD,
    fontSize: 34,
    fontFamily: 'Tajawal_800ExtraBold',
  },

  profileInfo: { flex: 1, paddingTop: 4 },
  profileName: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'right',
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  infoText: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.60)',
  },
  memberBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: GOLD + '22',
    borderWidth: 1,
    borderColor: GOLD + '40',
    alignSelf: 'flex-end',
  },
  memberText: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 10,
    color: GOLD,
  },

  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD + '20',
    borderWidth: 1,
    borderColor: GOLD + '45',
  },

  // ── Completion bar ──
  completionWrap: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  completionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  completionPct: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  completionLabel: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.60)',
  },
  completionTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  completionFill: { height: '100%', borderRadius: 3 },
  completionDone: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  completionDoneText: {
    color: '#4ADE80',
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
  },

  // ── Stats 2×2 grid ──
  statsGrid: {
    paddingHorizontal: 14,
    paddingTop: 16,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  statCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 26,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 11,
    textAlign: 'right',
  },

  // ── Menu ──
  sectionWrap: { paddingHorizontal: 14, marginTop: 18 },
  sectionTitle: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  menuGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'Tajawal_500Medium',
    fontSize: 14,
    textAlign: 'right',
  },
  menuCountBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  menuCountText: { fontFamily: 'Tajawal_700Bold', fontSize: 11 },
  menuSoonBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  menuSoonText: { fontFamily: 'Tajawal_400Regular', fontSize: 10 },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  logoutText: { color: '#EF4444', fontFamily: 'Tajawal_700Bold', fontSize: 15 },

  version: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Tajawal_400Regular',
    marginTop: 16,
    marginBottom: 8,
    opacity: 0.35,
  },

  // ── Guest ──
  guestHero: { flex: 1, minHeight: 600 },
  guestWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
    paddingTop: 60,
  },
  guestLogoRing: { borderRadius: 44, overflow: 'hidden', marginBottom: 8 },
  guestLogoGrad: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 24,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  guestSub: {
    fontSize: 14,
    fontFamily: 'Tajawal_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginBtn: { width: '100%', borderRadius: 18, overflow: 'hidden', marginTop: 8 },
  loginGrad: { paddingVertical: 17, alignItems: 'center' },
  loginBtnText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16, color: NAVY },
  registerBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  registerBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 16 },
});
