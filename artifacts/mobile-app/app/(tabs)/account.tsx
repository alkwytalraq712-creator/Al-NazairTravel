/**
 * Account Screen — Ultra-premium redesign.
 * Cinematic dark hero, floating stats card, gradient icon rows.
 * Emirates × Revolut × Apple quality.
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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

const { width: SCREEN_W } = Dimensions.get('window');

// ── Brand constants (LinearGradient requires string literals) ──────────────────
const GOLD   = '#C9A060';
const GOLD2  = '#E8C07A';
const NAVY   = '#060B18';
const NAVY2  = '#0C1628';
const NAVY3  = '#121F38';

// ── Stat bubble ───────────────────────────────────────────────────────────────
function StatBubble({
  value, label, icon, grad, onPress, delay,
}: {
  value: number; label: string; icon: string;
  grad: readonly [string, string]; onPress?: () => void; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, speed: 14, bounciness: 5 }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.75 : 1} style={styles.statBubble}>
        <LinearGradient colors={grad} style={styles.statBubbleGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name={icon as any} size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Menu row ─────────────────────────────────────────────────────────────────
function MenuRow({
  icon, label, route, grad, badge, badgeText, disabled, last, sublabel,
}: {
  icon: string; label: string; route?: string;
  grad: readonly [string, string]; badge?: boolean; badgeText?: string;
  disabled?: boolean; last?: boolean; sublabel?: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={() => { if (!disabled && route) router.push(route as any); }}
      activeOpacity={disabled ? 1 : 0.6}
      style={[
        styles.menuRow,
        { borderBottomColor: colors.border },
        last && { borderBottomWidth: 0 },
      ]}
    >
      {/* Icon tile */}
      <LinearGradient colors={grad} style={styles.menuIconTile} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon as any} size={18} color="#fff" />
      </LinearGradient>

      {/* Labels */}
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuLabel, { color: disabled ? colors.mutedForeground : colors.foreground }]}>
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.menuSublabel, { color: colors.mutedForeground }]}>{sublabel}</Text>
        )}
      </View>

      {/* Right side */}
      {badgeText ? (
        <View style={[styles.menuBadge, { backgroundColor: grad[0] + '25', borderColor: grad[0] + '50' }]}>
          <Text style={[styles.menuBadgeText, { color: grad[0] }]}>{badgeText}</Text>
        </View>
      ) : null}
      {badge && (
        <View style={[styles.soonPill, { backgroundColor: colors.muted }]}>
          <Text style={[styles.soonText, { color: colors.mutedForeground }]}>قريباً</Text>
        </View>
      )}
      {!badge && !badgeText && (
        <Ionicons name="chevron-back" size={15} color={disabled ? colors.border : colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.sectionOuter}>
      {title && <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

// ── Guest screen ─────────────────────────────────────────────────────────────
function GuestScreen({ paddingTop }: { paddingTop: number }) {
  const colors = useColors();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, speed: 12, bounciness: 4, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[NAVY, NAVY2, NAVY3, colors.background]} style={{ flex: 1 }}>
        <Animated.View
          style={[styles.guestContent, { paddingTop: paddingTop + 40, opacity: fade, transform: [{ translateY: slide }] }]}
        >
          <LinearGradient colors={[GOLD, GOLD2]} style={styles.guestIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="airplane" size={40} color={NAVY} />
          </LinearGradient>
          <Text style={styles.guestTitle}>قمة النظائر للسفر</Text>
          <Text style={[styles.guestSub, { color: 'rgba(255,255,255,0.55)' }]}>
            سجّل دخولك للوصول إلى رحلاتك، طلباتك، وملفك الشخصي الكامل
          </Text>
          <TouchableOpacity
            style={styles.guestLoginBtn}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[GOLD, GOLD2]} style={styles.guestLoginGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="log-in-outline" size={18} color={NAVY} />
              <Text style={styles.guestLoginText}>تسجيل الدخول</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.guestRegBtn, { borderColor: 'rgba(201,160,96,0.40)' }]}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.8}
          >
            <Text style={[styles.guestRegText, { color: GOLD }]}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AccountScreen() {
  const colors     = useColors();
  const insets     = useSafeAreaInsets();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const [loggingOut, setLoggingOut] = useState(false);

  const heroFade  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(heroFade,  { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, speed: 12, bounciness: 4, useNativeDriver: true }),
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
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (!isAuthenticated) return <GuestScreen paddingTop={paddingTop} />;

  const initials = (user!.fullName ?? '?').charAt(0).toUpperCase();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 120 }}
      >

        {/* ══════════ CINEMATIC HERO ══════════ */}
        <LinearGradient
          colors={[NAVY, NAVY2, NAVY3]}
          style={[styles.hero, { paddingTop: paddingTop + 12 }]}
        >
          <Animated.View style={{ opacity: heroFade }}>

            {/* Top action bar */}
            <View style={styles.heroBar}>
              <TouchableOpacity onPress={() => router.push('/security' as any)} style={styles.heroBarBtn} activeOpacity={0.7}>
                <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.80)" />
              </TouchableOpacity>
              <Text style={styles.heroTitle}>حسابي</Text>
              <TouchableOpacity onPress={() => router.push('/notifications' as any)} style={styles.heroBarBtn} activeOpacity={0.7}>
                <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.80)" />
              </TouchableOpacity>
            </View>

            {/* Avatar — centered + large */}
            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={[GOLD2, GOLD, GOLD2]}
                style={styles.avatarRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatarInner}>
                  {user!.avatarUrl ? (
                    <Image source={{ uri: user!.avatarUrl }} style={styles.avatarImg} contentFit="cover" />
                  ) : (
                    <Text style={styles.avatarInitial}>{initials}</Text>
                  )}
                </View>
              </LinearGradient>
              {/* Edit button */}
              <TouchableOpacity
                style={styles.editDot}
                onPress={() => router.push('/profile-edit' as any)}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[GOLD, GOLD2]} style={styles.editDotGrad}>
                  <Ionicons name="create" size={13} color={NAVY} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Name + info */}
            <Text style={styles.heroName}>{user!.fullName}</Text>
            {user!.email && (
              <View style={styles.heroInfoRow}>
                <Ionicons name="mail-outline" size={12} color="rgba(255,255,255,0.50)" />
                <Text style={styles.heroInfoText}>{user!.email}</Text>
              </View>
            )}
            {user!.phone && (
              <View style={styles.heroInfoRow}>
                <Ionicons name="call-outline" size={12} color="rgba(255,255,255,0.50)" />
                <Text style={styles.heroInfoText}>{user!.phone}</Text>
              </View>
            )}

            {/* Membership badge */}
            <View style={styles.memberBadgeWrap}>
              <LinearGradient
                colors={[GOLD + '28', GOLD2 + '18']}
                style={styles.memberBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="diamond" size={12} color={GOLD} />
                <Text style={styles.memberText}>عضو قمة · Qema Member</Text>
              </LinearGradient>
            </View>

            {/* Profile completion */}
            {!isComplete && pct > 0 && (
              <TouchableOpacity
                style={styles.completionRow}
                onPress={() => router.push('/profile-edit' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.completionTrack}>
                  <LinearGradient
                    colors={[GOLD, GOLD2]}
                    style={[styles.completionFill, { width: `${pct}%` as any }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.completionLabel}>{pct}% — أكمل ملفك لتسريع الحجز ←</Text>
              </TouchableOpacity>
            )}
            {isComplete && (
              <View style={styles.completionDone}>
                <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                <Text style={styles.completionDoneText}>الملف الشخصي مكتمل</Text>
              </View>
            )}

          </Animated.View>
        </LinearGradient>

        {/* ══════════ FLOATING STATS CARD ══════════ */}
        <Animated.View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateY: cardSlide }], opacity: heroFade }]}>
          <View style={styles.statsRow}>
            <StatBubble
              value={totalOrders}
              label="إجمالي الطلبات"
              icon="document-text"
              grad={['#6366F1', '#8B5CF6']}
              delay={0}
              onPress={() => router.push('/bookings' as any)}
            />
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            <StatBubble
              value={completedFlights}
              label="رحلات مكتملة"
              icon="checkmark-circle"
              grad={['#10B981', '#059669']}
              delay={80}
              onPress={() => router.push('/bookings' as any)}
            />
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            <StatBubble
              value={upcomingFlights}
              label="رحلات قادمة"
              icon="airplane"
              grad={[GOLD, GOLD2]}
              delay={160}
              onPress={() => router.push('/bookings' as any)}
            />
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            <StatBubble
              value={visas.length}
              label="طلبات التأشيرة"
              icon="earth"
              grad={['#3B82F6', '#2563EB']}
              delay={240}
              onPress={() => router.push('/bookings' as any)}
            />
          </View>
        </Animated.View>

        {/* ══════════ MENU SECTIONS ══════════ */}
        <View style={{ marginTop: 8 }}>

          {/* خدماتي */}
          <SectionCard title="خدماتي">
            <MenuRow
              icon="document-text"
              label="طلباتي وحجوزاتي"
              sublabel="تتبع حجوزاتك ورحلاتك"
              route="/bookings"
              grad={['#6366F1', '#8B5CF6']}
              badgeText={totalOrders > 0 ? String(totalOrders) : undefined}
            />
            <MenuRow
              icon="person"
              label="الملف الشخصي"
              sublabel="بيانات الهوية والجواز"
              route="/my-profile"
              grad={[GOLD, GOLD2]}
            />
            <MenuRow
              icon="card"
              label="وسائل الدفع"
              sublabel="البطاقات والمحافظ"
              grad={['#10B981', '#059669']}
              badge
              disabled
            />
            <MenuRow
              icon="pricetag"
              label="العروض والكوبونات"
              sublabel="خصومات حصرية لك"
              grad={['#F59E0B', '#D97706']}
              badge
              disabled
              last
            />
          </SectionCard>

          {/* الحساب والتفضيلات */}
          <SectionCard title="الحساب والتفضيلات">
            <MenuRow
              icon="notifications"
              label="الإشعارات"
              sublabel="تنبيهات الحجز والعروض"
              route="/notifications"
              grad={['#8B5CF6', '#7C3AED']}
            />
            <MenuRow
              icon="shield-checkmark"
              label="الأمان والخصوصية"
              sublabel="كلمة المرور والبيومتري"
              route="/security"
              grad={['#EF4444', '#DC2626']}
              last
            />
          </SectionCard>

          {/* الدعم والمعلومات */}
          <SectionCard title="الدعم والمعلومات">
            <MenuRow
              icon="headset"
              label="الدعم الفني"
              sublabel="تواصل مع فريقنا"
              route="/help"
              grad={['#3B82F6', '#2563EB']}
            />
            <MenuRow
              icon="call"
              label="اتصل بنا"
              sublabel="هاتف وواتساب"
              route="/contact"
              grad={['#10B981', '#059669']}
            />
            <MenuRow
              icon="document-text-outline"
              label="الشروط والأحكام"
              route="/legal/terms"
              grad={['#6B7280', '#4B5563']}
            />
            <MenuRow
              icon="lock-closed"
              label="سياسة الخصوصية"
              route="/legal/privacy"
              grad={['#6B7280', '#4B5563']}
              last
            />
          </SectionCard>

          {/* Logout */}
          <View style={styles.logoutWrap}>
            <TouchableOpacity
              style={[styles.logoutBtn, loggingOut && { opacity: 0.6 }]}
              onPress={handleLogout}
              activeOpacity={0.75}
              disabled={loggingOut}
            >
              {loggingOut
                ? <ActivityIndicator size="small" color="#EF4444" />
                : <Ionicons name="log-out-outline" size={20} color="#EF4444" />}
              <Text style={styles.logoutText}>{loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.version, { color: colors.mutedForeground }]}>
            قمة النظائر للسفريات والسياحة · v1.0
          </Text>

        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  // ── Hero ──
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  heroBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroTitle: { fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', color: '#FFFFFF' },
  heroBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Avatar ──
  avatarWrap: { alignItems: 'center', marginBottom: 16, position: 'relative' },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarInitial: { color: GOLD, fontSize: 38, fontFamily: 'Tajawal_800ExtraBold' },
  editDot: {
    position: 'absolute',
    bottom: 2,
    right: SCREEN_W / 2 - 60,
    borderRadius: 14,
    overflow: 'hidden',
  },
  editDotGrad: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero text ──
  heroName: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 3,
  },
  heroInfoText: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },

  // ── Member badge ──
  memberBadgeWrap: { alignItems: 'center', marginTop: 10, marginBottom: 14 },
  memberBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD + '45',
  },
  memberText: { fontFamily: 'Tajawal_700Bold', fontSize: 11, color: GOLD },

  // ── Completion ──
  completionRow: { marginTop: 4 },
  completionTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 7,
  },
  completionFill: { height: '100%', borderRadius: 3 },
  completionLabel: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  completionDone: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 6,
  },
  completionDoneText: { fontFamily: 'Tajawal_500Medium', fontSize: 13, color: '#4ADE80' },

  // ── Floating stats card ──
  statsCard: {
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statsDivider: { width: 1, height: 44, opacity: 0.5 },
  statBubble: { alignItems: 'center', gap: 6, flex: 1 },
  statBubbleGrad: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 20, color: '#FFFFFF' },
  statLabel: { fontFamily: 'Tajawal_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },

  // ── Menu sections ──
  sectionOuter: { paddingHorizontal: 16, marginTop: 18 },
  sectionTitle: {
    fontFamily: 'Tajawal_700Bold',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1 },
  menuLabel: { fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' },
  menuSublabel: { fontFamily: 'Tajawal_400Regular', fontSize: 11, textAlign: 'right', marginTop: 1 },
  menuBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  menuBadgeText: { fontFamily: 'Tajawal_700Bold', fontSize: 11 },
  soonPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  soonText: { fontFamily: 'Tajawal_400Regular', fontSize: 10 },

  // ── Logout ──
  logoutWrap: { paddingHorizontal: 16, marginTop: 18 },
  logoutBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  logoutText: { fontFamily: 'Tajawal_700Bold', fontSize: 15, color: '#EF4444' },

  // ── Version ──
  version: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Tajawal_400Regular',
    marginTop: 16,
    marginBottom: 8,
    opacity: 0.35,
  },

  // ── Guest ──
  guestContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  guestIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  guestTitle: { fontSize: 26, fontFamily: 'Tajawal_800ExtraBold', color: '#FFFFFF', textAlign: 'center' },
  guestSub: { fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'center', lineHeight: 22 },
  guestLoginBtn: { width: '100%', borderRadius: 18, overflow: 'hidden', marginTop: 10 },
  guestLoginGrad: {
    flexDirection: 'row-reverse',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guestLoginText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16, color: NAVY },
  guestRegBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  guestRegText: { fontFamily: 'Tajawal_700Bold', fontSize: 16 },
});
