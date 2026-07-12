/**
 * Security & Privacy Screen — Ultra-premium redesign.
 * Dark gradient hero header, floating section cards,
 * password strength meter, gradient icon tiles.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Platform,
  ScrollView, StyleSheet, Switch, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useTheme, type ThemePreference } from '@/context/ThemeContext';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  getBiometricLabel,
  authenticateBiometric,
} from '@/lib/biometric';

// ── Brand constants ────────────────────────────────────────────────────────────
const GOLD  = '#C9A060';
const GOLD2 = '#E8C07A';
const NAVY  = '#060B18';
const NAVY2 = '#0C1628';
const NAVY3 = '#121F38';

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return '';
}

// ── Password strength ──────────────────────────────────────────────────────────
function getStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'ضعيفة', color: '#EF4444' };
  if (score <= 2) return { level: 2, label: 'متوسطة', color: '#F59E0B' };
  if (score <= 3) return { level: 3, label: 'جيدة', color: '#3B82F6' };
  return { level: 4, label: 'قوية', color: '#22C55E' };
}

// ── Password field ─────────────────────────────────────────────────────────────
function PasswordField({
  label, value, onChange, placeholder, showToggle, show, onToggle, focused, onFocus, onBlur,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; showToggle?: boolean; show?: boolean; onToggle?: () => void;
  focused?: boolean; onFocus?: () => void; onBlur?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[
        styles.fieldRow,
        { backgroundColor: colors.muted, borderColor: focused ? GOLD : colors.border },
      ]}>
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={styles.fieldEye} activeOpacity={0.7}>
            <Ionicons
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={focused ? GOLD : colors.mutedForeground}
            />
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.fieldInput, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          textAlign="right"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  icon, iconGrad, title, children, delay = 0,
}: {
  icon: string; iconGrad: readonly [string, string];
  title: string; children: React.ReactNode; delay?: number;
}) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, speed: 12, bounciness: 3, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: Animated.multiply(Animated.subtract(new Animated.Value(1), anim), new Animated.Value(16)) }] }}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <LinearGradient colors={iconGrad} style={styles.cardIconTile} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name={icon as any} size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
        </View>
        {children}
      </View>
    </Animated.View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  // Password state
  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [focusedField, setFocusedField]         = useState<string | null>(null);
  const [loading, setLoading]                   = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable]   = useState(false);
  const [biometricEnabled, setBiometricEnabledState]   = useState(false);
  const [biometricLabel, setBiometricLabelState]       = useState('البصمة البيومترية');
  const [biometricLoading, setBiometricLoading]        = useState(false);

  // Hero animation
  const heroFade  = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(heroSlide, { toValue: 0, speed: 14, bounciness: 3, useNativeDriver: true }),
    ]).start();

    if (Platform.OS === 'web') return;
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        setBiometricEnabledState(await isBiometricEnabled());
        setBiometricLabelState(await getBiometricLabel());
      }
    })();
  }, []);

  async function handleBiometricToggle(value: boolean) {
    if (biometricLoading) return;
    setBiometricLoading(true);
    try {
      if (value) {
        const ok = await authenticateBiometric('تفعيل تسجيل الدخول بالبصمة');
        if (!ok) return;
        await setBiometricEnabled(true);
        setBiometricEnabledState(true);
        Alert.alert('تم التفعيل', `يمكنك الآن استخدام ${biometricLabel} لتسجيل الدخول.`);
      } else {
        await setBiometricEnabled(false);
        setBiometricEnabledState(false);
      }
    } finally {
      setBiometricLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول'); return;
    }
    if (newPassword.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين'); return;
    }
    setLoading(true);
    try {
      const { getAuthToken } = await import('../context/AuthContext');
      const token = await getAuthToken();
      const res = await fetch(`${getApiBase()}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال' })) as { error?: string };
        throw new Error(err.error ?? 'فشل تغيير كلمة المرور');
      }
      Alert.alert('تم بنجاح', 'تم تغيير كلمة المرور. يرجى تسجيل الدخول مجدداً.', [{ text: 'حسناً', onPress: logout }]);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'حذف الحساب',
      'هل أنت متأكد من حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => Alert.alert('تواصل معنا', 'لحذف حسابك، يرجى التواصل مع خدمة العملاء عبر واتساب.') },
      ],
    );
  }

  const strength = getStrength(newPassword);

  const THEME_OPTIONS: { key: ThemePreference; label: string; icon: string; grad: readonly [string, string] }[] = [
    { key: 'light',  label: 'نهاري', icon: 'sunny',        grad: ['#F59E0B', '#FBBF24'] },
    { key: 'dark',   label: 'ليلي',  icon: 'moon',         grad: ['#6366F1', '#8B5CF6'] },
    { key: 'system', label: 'تلقائي',icon: 'phone-portrait',grad: [GOLD, GOLD2] },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>

      {/* ── Dark hero header ── */}
      <LinearGradient colors={[NAVY, NAVY2, NAVY3]} style={[styles.hero, { paddingTop: paddingTop + 12 }]}>
        <Animated.View style={[styles.heroInner, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <View style={styles.backBtnInner}>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
            </View>
          </TouchableOpacity>
          <View style={styles.heroCenter}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.heroIconTile} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="shield-checkmark" size={22} color="#fff" />
            </LinearGradient>
            <Text style={styles.heroTitle}>الأمان والخصوصية</Text>
            <Text style={styles.heroSub}>حافظ على أمان حسابك دائماً</Text>
          </View>
          <View style={styles.backBtnPlaceholder} />
        </Animated.View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Theme ── */}
        <SectionCard icon="contrast" iconGrad={[GOLD, GOLD2]} title="مظهر التطبيق" delay={0}>
          <View style={styles.themeGrid}>
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setTheme(opt.key)}
                  activeOpacity={0.75}
                  style={[styles.themeTile, active && styles.themeTileActive, { borderColor: active ? GOLD : colors.border }]}
                >
                  {active ? (
                    <LinearGradient colors={opt.grad} style={styles.themeIconActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name={opt.icon as any} size={20} color="#fff" />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.themeIconInactive, { backgroundColor: colors.muted }]}>
                      <Ionicons name={opt.icon as any} size={20} color={colors.mutedForeground} />
                    </View>
                  )}
                  <Text style={[styles.themeLabel, { color: active ? GOLD : colors.mutedForeground }]}>{opt.label}</Text>
                  {active && (
                    <View style={styles.themeCheck}>
                      <Ionicons name="checkmark-circle" size={14} color={GOLD} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* ── Biometric ── */}
        {biometricAvailable && Platform.OS !== 'web' && (
          <SectionCard icon="finger-print" iconGrad={['#6366F1', '#8B5CF6']} title="تسجيل الدخول البيومتري" delay={60}>
            <View style={[styles.biometricRow, { borderTopColor: colors.border }]}>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={biometricLoading}
                trackColor={{ false: colors.border, true: GOLD }}
                thumbColor="#fff"
              />
              <View style={styles.biometricText}>
                <Text style={[styles.biometricTitle, { color: colors.foreground }]}>{biometricLabel}</Text>
                <Text style={[styles.biometricSub, { color: colors.mutedForeground }]}>
                  {biometricEnabled ? 'مفعّل — تسجيل دخول بدون كلمة مرور' : 'غير مفعّل'}
                </Text>
              </View>
              {biometricLoading && <ActivityIndicator size="small" color={GOLD} />}
            </View>
          </SectionCard>
        )}

        {/* ── Change Password ── */}
        <SectionCard icon="key" iconGrad={['#3B82F6', '#2563EB']} title="تغيير كلمة المرور" delay={120}>

          <PasswordField
            label="كلمة المرور الحالية"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="••••••••"
            showToggle show={showCurrent} onToggle={() => setShowCurrent(v => !v)}
            focused={focusedField === 'current'}
            onFocus={() => setFocusedField('current')}
            onBlur={() => setFocusedField(null)}
          />

          <PasswordField
            label="كلمة المرور الجديدة"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="6 أحرف على الأقل"
            showToggle show={showNew} onToggle={() => setShowNew(v => !v)}
            focused={focusedField === 'new'}
            onFocus={() => setFocusedField('new')}
            onBlur={() => setFocusedField(null)}
          />

          {/* Strength meter */}
          {newPassword.length > 0 && (
            <View style={styles.strengthWrap}>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: i <= strength.level ? strength.color : colors.border },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          <PasswordField
            label="تأكيد كلمة المرور الجديدة"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="أعد إدخال كلمة المرور"
            showToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)}
            focused={focusedField === 'confirm'}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => setFocusedField(null)}
          />

          {/* Match indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchRow}>
              <Ionicons
                name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={newPassword === confirmPassword ? '#22C55E' : '#EF4444'}
              />
              <Text style={[styles.matchText, { color: newPassword === confirmPassword ? '#22C55E' : '#EF4444' }]}>
                {newPassword === confirmPassword ? 'كلمتا المرور متطابقتان' : 'كلمتا المرور غير متطابقتين'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="lock-closed" size={16} color="#fff" />
                    <Text style={styles.submitText}>تغيير كلمة المرور</Text>
                  </>}
            </LinearGradient>
          </TouchableOpacity>
        </SectionCard>

        {/* ── Privacy ── */}
        <SectionCard icon="shield-checkmark" iconGrad={['#8B5CF6', '#7C3AED']} title="الخصوصية" delay={180}>
          {[
            { icon: 'document-text', label: 'سياسة الخصوصية', sub: 'كيف نحمي بياناتك', route: '/legal/privacy', grad: ['#8B5CF6', '#7C3AED'] as const },
            { icon: 'newspaper',     label: 'الشروط والأحكام', sub: 'قواعد استخدام التطبيق', route: '/legal/terms',   grad: ['#6B7280', '#4B5563'] as const },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
              style={[styles.privacyRow, { borderTopColor: colors.border }, i === 0 && { borderTopWidth: 0 }]}
            >
              <Ionicons name="chevron-back" size={15} color={colors.mutedForeground} />
              <View style={styles.privacyText}>
                <Text style={[styles.privacyLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.privacySub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              <LinearGradient colors={item.grad} style={styles.privacyIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={item.icon as any} size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </SectionCard>

        {/* ── Danger zone ── */}
        <SectionCard icon="warning" iconGrad={['#EF4444', '#DC2626']} title="منطقة الخطر" delay={240}>
          <Text style={[styles.dangerNote, { color: colors.mutedForeground }]}>
            حذف الحساب إجراء لا يمكن التراجع عنه. ستُفقد جميع بياناتك وحجوزاتك نهائياً.
          </Text>
          <TouchableOpacity
            style={[styles.dangerBtn, { borderColor: 'rgba(239,68,68,0.40)', backgroundColor: 'rgba(239,68,68,0.06)' }]}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.dangerBtnText}>حذف الحساب نهائياً</Text>
          </TouchableOpacity>
        </SectionCard>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Hero
  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  heroInner: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  backBtnInner: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnPlaceholder: { width: 48 },
  heroCenter: { flex: 1, alignItems: 'center', gap: 8 },
  heroIconTile: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 20, color: '#FFFFFF' },
  heroSub: { fontFamily: 'Tajawal_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.50)' },

  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 14 },

  // Section card
  card: {
    borderRadius: 22, borderWidth: 1,
    padding: 20, marginBottom: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 18 },
  cardIconTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },

  // Theme
  themeGrid: { flexDirection: 'row-reverse', gap: 10 },
  themeTile: {
    flex: 1, alignItems: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16, borderWidth: 1.5,
    position: 'relative',
  },
  themeTileActive: { backgroundColor: GOLD + '10' },
  themeIconActive: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  themeIconInactive: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },
  themeCheck: { position: 'absolute', top: 6, left: 6 },

  // Biometric
  biometricRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    gap: 14, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth,
  },
  biometricText: { flex: 1 },
  biometricTitle: { fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' },
  biometricSub: { fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right', marginTop: 2 },

  // Password fields
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontFamily: 'Tajawal_500Medium', fontSize: 13, textAlign: 'right', marginBottom: 7 },
  fieldRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  fieldEye: { padding: 4 },
  fieldInput: {
    flex: 1, paddingVertical: 14,
    fontFamily: 'Tajawal_400Regular', fontSize: 15,
  },

  // Strength
  strengthWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: -4 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontFamily: 'Tajawal_700Bold', fontSize: 12 },

  // Match
  matchRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginBottom: 12, marginTop: -4 },
  matchText: { fontFamily: 'Tajawal_400Regular', fontSize: 12 },

  // Submit
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  submitGrad: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15,
  },
  submitText: { fontFamily: 'Tajawal_700Bold', fontSize: 15, color: '#fff' },

  // Privacy rows
  privacyRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    gap: 14, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth,
  },
  privacyText: { flex: 1 },
  privacyLabel: { fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' },
  privacySub: { fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right', marginTop: 2 },
  privacyIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Danger
  dangerNote: {
    fontFamily: 'Tajawal_400Regular', fontSize: 13,
    textAlign: 'right', lineHeight: 20, marginBottom: 14,
  },
  dangerBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14, borderWidth: 1.5,
  },
  dangerBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 15, color: '#EF4444' },
});
