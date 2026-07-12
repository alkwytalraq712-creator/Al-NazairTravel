/**
 * Account Screen — Redesigned following Booking / Almosafer / Wego standards.
 * Clean hero, 4-stat grid, single services list, no duplication.
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

const GOLD  = '#C9A060';
const GOLD2 = '#E8C07A';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, value, label, color, onPress,
}: {
  icon: string; value: string | number; label: string; color: string; onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={[s.statIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[s.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
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
  const handlePress = () => { if (!disabled && route) router.push(route as any); };
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
      style={[s.menuItem, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
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
      <View style={[s.menuIconWrap, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon as any} size={17} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Menu Group ───────────────────────────────────────────────────────────────
function MenuGroup({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[s.menuGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

// ─── Guest Screen ─────────────────────────────────────────────────────────────
function GuestScreen({ paddingTop }: { paddingTop: number }) {
  const colors = useColors();
  return (
    <View style={[s.screen, { backgroundColor: colors.background, paddingTop }]}>
      <View style={s.guestWrap}>
        <View style={[s.guestLogo, { backgroundColor: GOLD + '18', borderColor: GOLD + '30' }]}>
          <Ionicons name="airplane" size={44} color={GOLD} />
        </View>
        <Text style={[s.guestTitle, { color: colors.foreground }]}>قمة النظائر للسفر</Text>
        <Text style={[s.guestSub, { color: colors.mutedForeground }]}>
          سجّل دخولك للوصول إلى رحلاتك، طلباتك، وملفك الشخصي
        </Text>
        <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/auth/login')} activeOpacity={0.85}>
          <LinearGradient colors={[GOLD, GOLD2]} style={s.loginGrad}>
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
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AccountScreen() {
  const colors      = useColors();
  const insets      = useSafeAreaInsets();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const paddingTop  = Platform.OS === 'web' ? 67 : insets.top;
  const [loggingOut, setLoggingOut] = useState(false);

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    }
  }, [isLoading]);

  // Live data
  const { data: flightsData  } = useListMyFlightBookings({ query: { enabled: isAuthenticated } } as any);
  const { data: visasData    } = useListMyVisaApplications({ query: { enabled: isAuthenticated } } as any);
  const { data: packagesData } = useListMyPackageBookings({ query: { enabled: isAuthenticated } } as any);
  const { data: completion   } = useGetProfileCompletion();

  const flights  = Array.isArray(flightsData)  ? flightsData  : [];
  const visas    = Array.isArray(visasData)    ? visasData    : [];
  const packages = Array.isArray(packagesData) ? packagesData : [];

  const totalOrders   = flights.length + visas.length + packages.length;
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
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ══════════ HERO ══════════ */}
          <View style={[s.hero, { paddingTop: paddingTop + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>

            {/* Top bar */}
            <View style={s.heroTopBar}>
              <TouchableOpacity
                style={[s.topBarBtn, { backgroundColor: colors.muted }]}
                onPress={() => router.push('/security' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={19} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[s.screenTitle, { color: colors.foreground }]}>حسابي</Text>
              <TouchableOpacity
                style={[s.topBarBtn, { backgroundColor: colors.muted }]}
                onPress={() => router.push('/notifications' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={19} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Avatar + info */}
            <View style={s.profileRow}>
              {/* Avatar */}
              <View style={s.avatarRing}>
                <LinearGradient colors={[GOLD, GOLD2, GOLD]} style={s.avatarGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={[s.avatarInner, { backgroundColor: colors.card }]}>
                    {user!.avatarUrl ? (
                      <Image source={{ uri: user!.avatarUrl }} style={s.avatarImg} contentFit="cover" />
                    ) : (
                      <Text style={s.avatarInitial}>{initials}</Text>
                    )}
                  </View>
                </LinearGradient>
              </View>

              {/* Text info */}
              <View style={s.profileInfo}>
                <Text style={[s.profileName, { color: colors.foreground }]} numberOfLines={1}>{user!.fullName}</Text>
                {user!.email && (
                  <View style={s.infoRow}>
                    <Ionicons name="mail-outline" size={12} color={colors.mutedForeground} />
                    <Text style={[s.infoText, { color: colors.mutedForeground }]} numberOfLines={1}>{user!.email}</Text>
                  </View>
                )}
                {user!.phone && (
                  <View style={s.infoRow}>
                    <Ionicons name="call-outline" size={12} color={colors.mutedForeground} />
                    <Text style={[s.infoText, { color: colors.mutedForeground }]}>{user!.phone}</Text>
                  </View>
                )}

                {/* Membership badge */}
                <View style={[s.memberBadge, { backgroundColor: GOLD + '18', borderColor: GOLD + '35' }]}>
                  <Ionicons name="diamond-outline" size={11} color={GOLD} />
                  <Text style={[s.memberText, { color: GOLD }]}>عضو قمة · Qema Member</Text>
                </View>
              </View>

              {/* Edit button */}
              <TouchableOpacity
                onPress={() => router.push('/profile-edit' as any)}
                style={[s.editBtn, { backgroundColor: GOLD + '15', borderColor: GOLD + '35' }]}
                activeOpacity={0.75}
              >
                <Ionicons name="create-outline" size={16} color={GOLD} />
              </TouchableOpacity>
            </View>

            {/* Profile completion */}
            {!isComplete && pct > 0 && (
              <TouchableOpacity
                style={[s.completionWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => router.push('/profile-edit' as any)}
                activeOpacity={0.85}
              >
                <View style={s.completionHeader}>
                  <Text style={[s.completionPct, { color: GOLD }]}>{pct}%</Text>
                  <Text style={[s.completionLabel, { color: colors.mutedForeground }]}>أكمل ملفك لتسريع الحجز →</Text>
                </View>
                <View style={[s.completionTrack, { backgroundColor: colors.border }]}>
                  <LinearGradient colors={[GOLD, GOLD2]} style={[s.completionFill, { width: `${pct}%` as any }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                </View>
              </TouchableOpacity>
            )}
            {isComplete && (
              <View style={s.completionDone}>
                <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
                <Text style={s.completionDoneText}>الملف الشخصي مكتمل ✓</Text>
              </View>
            )}
          </View>

          {/* ══════════ STATS GRID ══════════ */}
          <View style={s.statsGrid}>
            <StatCard icon="document-text"  value={totalOrders}      label="إجمالي الطلبات"    color="#6366F1" onPress={() => router.push('/bookings' as any)} />
            <StatCard icon="checkmark-done" value={completedFlights} label="رحلات مكتملة"      color="#10B981" onPress={() => router.push('/bookings' as any)} />
            <StatCard icon="airplane"       value={upcomingFlights}  label="رحلات قادمة"       color={GOLD}    onPress={() => router.push('/bookings' as any)} />
            <StatCard icon="earth"          value={visas.length}     label="طلبات التأشيرة"   color="#3B82F6" onPress={() => router.push('/bookings' as any)} />
          </View>

          {/* ══════════ SERVICES ══════════ */}
          <View style={s.sectionWrap}>
            <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>الخدمات</Text>
            <MenuGroup>
              <MenuItem
                icon="document-text"
                label="طلباتي وحجوزاتي"
                route="/bookings"
                iconColor="#6366F1"
                badgeText={totalOrders > 0 ? String(totalOrders) : undefined}
              />
              <MenuItem icon="person"               label="الملف الشخصي"        route="/my-profile"   iconColor={GOLD} />
              <MenuItem icon="card-outline"         label="وسائل الدفع"          iconColor="#10B981"   badge disabled />
              <MenuItem icon="notifications"        label="الإشعارات"            route="/notifications" iconColor="#8B5CF6" />
              <MenuItem icon="pricetag-outline"     label="العروض والكوبونات"    iconColor="#F59E0B"   badge disabled />
              <MenuItem icon="settings"             label="الإعدادات"            route="/security"     iconColor="#6B7280" last />
            </MenuGroup>
          </View>

          {/* ══════════ SUPPORT ══════════ */}
          <View style={s.sectionWrap}>
            <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>الدعم والمعلومات</Text>
            <MenuGroup>
              <MenuItem icon="headset-outline"     label="الدعم الفني"          route="/help"              iconColor="#3B82F6" />
              <MenuItem icon="call-outline"         label="اتصل بنا"             route="/contact"           iconColor="#10B981" />
              <MenuItem icon="shield-checkmark"     label="سياسة الخصوصية"      route="/legal/privacy"     iconColor="#8B5CF6" />
              <MenuItem icon="document-text-outline" label="الشروط والأحكام"    route="/legal/terms"       iconColor="#6B7280" last />
            </MenuGroup>
          </View>

          {/* ══════════ LOGOUT ══════════ */}
          <View style={s.sectionWrap}>
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

          <Text style={[s.version, { color: colors.mutedForeground }]}>قمة النظائر للسفريات والسياحة · v1.0</Text>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Hero
  hero: { paddingHorizontal: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTopBar: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  screenTitle: { fontSize: 19, fontFamily: 'Tajawal_800ExtraBold' },
  topBarBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Profile row
  profileRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  avatarRing: {},
  avatarGrad: { width: 76, height: 76, borderRadius: 38, padding: 3 },
  avatarInner: { flex: 1, borderRadius: 35, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 70, height: 70, borderRadius: 35 },
  avatarInitial: { color: GOLD, fontSize: 30, fontFamily: 'Tajawal_800ExtraBold' },

  profileInfo: { flex: 1 },
  profileName: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 17, marginBottom: 4, textAlign: 'right' },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginBottom: 2 },
  infoText: { fontFamily: 'Tajawal_400Regular', fontSize: 12 },
  memberBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-end' },
  memberText: { fontFamily: 'Tajawal_500Medium', fontSize: 10 },

  editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  // Completion
  completionWrap: { borderRadius: 12, padding: 12, borderWidth: 1 },
  completionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  completionPct: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },
  completionLabel: { fontFamily: 'Tajawal_400Regular', fontSize: 12 },
  completionTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: 3 },
  completionDone: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, justifyContent: 'center', paddingVertical: 4 },
  completionDoneText: { color: '#22c55e', fontFamily: 'Tajawal_500Medium', fontSize: 12 },

  // Stats 2×2 grid
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', paddingHorizontal: 14, paddingTop: 14, gap: 10 },
  statCard: {
    width: '47.5%', borderRadius: 16, borderWidth: 1, padding: 14,
    alignItems: 'flex-end',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 22, marginBottom: 2 },
  statLabel: { fontFamily: 'Tajawal_400Regular', fontSize: 11 },

  // Menu groups
  sectionWrap: { paddingHorizontal: 14, marginTop: 16 },
  sectionTitle: { fontFamily: 'Tajawal_700Bold', fontSize: 11, textAlign: 'right', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  menuGroup: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  menuItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontFamily: 'Tajawal_500Medium', fontSize: 14, textAlign: 'right' },
  menuCountBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  menuCountText: { fontFamily: 'Tajawal_700Bold', fontSize: 11 },
  menuSoonBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  menuSoonText: { fontFamily: 'Tajawal_400Regular', fontSize: 10 },

  // Logout
  logoutBtn: {
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 16, borderWidth: 1.5,
  },
  logoutText: { color: '#EF4444', fontFamily: 'Tajawal_700Bold', fontSize: 15 },

  version: { textAlign: 'center', fontSize: 11, fontFamily: 'Tajawal_400Regular', marginTop: 14, marginBottom: 6, opacity: 0.4 },

  // Guest
  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  guestLogo: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  guestTitle: { fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  guestSub: { fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'center', lineHeight: 22 },
  loginBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  loginGrad: { paddingVertical: 16, alignItems: 'center' },
  loginBtnText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16, color: '#0B1628' },
  registerBtn: { width: '100%', paddingVertical: 15, borderRadius: 16, borderWidth: 1.5, alignItems: 'center' },
  registerBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 16 },
});
