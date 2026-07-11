/**
 * Login Screen — professional dark-luxury design.
 * Supports phone (any country) + email login.
 * Links to register and forgot-password.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '@/context/AuthContext';
import CountryPickerModal from '@/components/CountryPickerModal';
import { DEFAULT_COUNTRY, type Country } from '@/lib/countries';

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD   = '#C9A060';
const GOLD2  = '#E8C07A';
const DARK   = '#0B1628';
const DARK2  = '#0F1E36';
const DARK3  = '#162035';
const BORDER = 'rgba(201,160,96,0.15)';
const MUTED  = 'rgba(255,255,255,0.48)';
const WHITE  = '#FFFFFF';
const INPUT_BG = 'rgba(255,255,255,0.06)';
const INPUT_FOCUS = 'rgba(201,160,96,0.20)';
const ERROR  = '#EF4444';

type Tab = 'phone' | 'email';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [tab, setTab] = useState<Tab>('phone');
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [showPicker, setShowPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleLogin() {
    const identifier = tab === 'phone'
      ? (country.dial + phone.replace(/^0+/, '').trim())
      : email.trim();

    if (!identifier || (tab === 'phone' && !phone.trim()) || !password.trim()) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
      return;
    }
    if (password.length < 6) {
      Alert.alert('تنبيه', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      await login({ identifier, password });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert(
        'خطأ في تسجيل الدخول',
        e?.message ?? 'البيانات غير صحيحة، يرجى المحاولة مجدداً',
      );
    } finally {
      setLoading(false);
    }
  }

  const inputBorder = (field: string) =>
    focusedField === field ? INPUT_FOCUS : BORDER;

  return (
    <LinearGradient colors={[DARK, DARK2, '#111E35']} style={[styles.screen, { paddingTop }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand ─────────────────────────────────────────────────────── */}
          <View style={styles.brandWrap}>
            <View style={styles.logoCircle}>
              <LinearGradient colors={[GOLD, GOLD2]} style={styles.logoGradient}>
                <Ionicons name="airplane" size={28} color={DARK} />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>قمة للسفر والسياحة</Text>
            <Text style={styles.brandSub}>QEMA TRAVEL &amp; TOURISM</Text>
          </View>

          {/* ── Card ──────────────────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>تسجيل الدخول</Text>
            <Text style={styles.cardSub}>مرحباً بعودتك ✦</Text>

            {/* Tab selector */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, tab === 'phone' && styles.tabActive]}
                onPress={() => setTab('phone')}
                activeOpacity={0.8}
              >
                <Ionicons name="call-outline" size={15} color={tab === 'phone' ? DARK : MUTED} />
                <Text style={[styles.tabText, tab === 'phone' && styles.tabTextActive]}>رقم الهاتف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'email' && styles.tabActive]}
                onPress={() => setTab('email')}
                activeOpacity={0.8}
              >
                <Ionicons name="mail-outline" size={15} color={tab === 'email' ? DARK : MUTED} />
                <Text style={[styles.tabText, tab === 'email' && styles.tabTextActive]}>البريد الإلكتروني</Text>
              </TouchableOpacity>
            </View>

            {/* Phone input */}
            {tab === 'phone' && (
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>رقم الهاتف</Text>
                <View style={[styles.phoneRow, { borderColor: inputBorder('phone') }]}>
                  {/* Country selector */}
                  <TouchableOpacity
                    style={styles.countryBtn}
                    onPress={() => setShowPicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <Text style={styles.countryDial}>{country.dial}</Text>
                    <Ionicons name="chevron-down" size={12} color={MUTED} />
                  </TouchableOpacity>
                  <View style={styles.phoneDivider} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="رقم الهاتف"
                    placeholderTextColor={MUTED}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    textAlign="right"
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            )}

            {/* Email input */}
            {tab === 'email' && (
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>البريد الإلكتروني</Text>
                <View style={[styles.inputWrap, { borderColor: inputBorder('email') }]}>
                  <Ionicons name="mail-outline" size={18} color={MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="example@email.com"
                    placeholderTextColor={MUTED}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textAlign="right"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            )}

            {/* Password input */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>كلمة المرور</Text>
              <View style={[styles.inputWrap, { borderColor: inputBorder('pass') }]}>
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={MUTED} />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={MUTED}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  textAlign="right"
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={handleLogin}
                />
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotWrap}
              onPress={() => router.push('/auth/forgot-password' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.75 }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              <LinearGradient colors={[GOLD, GOLD2]} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <ActivityIndicator size="small" color={DARK} />
                  : (
                    <>
                      <Ionicons name="log-in-outline" size={20} color={DARK} />
                      <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
                    </>
                  )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google button */}
            <TouchableOpacity
              style={styles.googleBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert('قريباً', 'تسجيل الدخول بجوجل قيد الإعداد')}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>المتابعة عبر Google</Text>
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <TouchableOpacity onPress={() => router.replace('/auth/register')} activeOpacity={0.7}>
                <Text style={styles.registerLink}>إنشاء حساب جديد</Text>
              </TouchableOpacity>
              <Text style={styles.registerHint}>ليس لديك حساب؟</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country picker modal */}
      <CountryPickerModal
        visible={showPicker}
        selected={country}
        onSelect={setCountry}
        onClose={() => setShowPicker(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },

  // Brand
  brandWrap: { alignItems: 'center', paddingVertical: 28 },
  logoCircle: { marginBottom: 14 },
  logoGradient: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 18, elevation: 10,
  },
  brandName: {
    color: WHITE, fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center',
  },
  brandSub: {
    color: MUTED, fontSize: 11, fontFamily: 'Tajawal_400Regular',
    textAlign: 'center', letterSpacing: 1.5, marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: 'rgba(15,30,54,0.85)',
    borderRadius: 24, borderWidth: 1, borderColor: BORDER,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25, shadowRadius: 32, elevation: 10,
  },
  cardTitle: {
    color: WHITE, fontSize: 22, fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'right', marginBottom: 4,
  },
  cardSub: {
    color: MUTED, fontSize: 13, fontFamily: 'Tajawal_400Regular',
    textAlign: 'right', marginBottom: 20,
  },

  // Tab
  tabRow: {
    flexDirection: 'row-reverse', backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    padding: 4, marginBottom: 20, gap: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  tabActive: {
    backgroundColor: GOLD,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  tabText: { color: MUTED, fontFamily: 'Tajawal_700Bold', fontSize: 13 },
  tabTextActive: { color: DARK },

  // Fields
  fieldWrap: { marginBottom: 14 },
  label: {
    color: MUTED, fontSize: 12, fontFamily: 'Tajawal_500Medium',
    textAlign: 'right', marginBottom: 7,
  },

  // Phone
  phoneRow: {
    flexDirection: 'row-reverse', backgroundColor: INPUT_BG,
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
  },
  countryBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 14,
  },
  countryFlag: { fontSize: 20 },
  countryDial: { color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 13 },
  phoneDivider: { width: 1, backgroundColor: BORDER },
  phoneInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 15,
  },

  // Generic input
  inputWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: INPUT_BG, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: { marginLeft: 8 },
  eyeBtn: { padding: 4, marginLeft: 4 },
  input: {
    flex: 1, paddingVertical: 14,
    color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 15,
  },

  // Forgot
  forgotWrap: { alignItems: 'flex-start', marginBottom: 20 },
  forgotText: { color: GOLD, fontFamily: 'Tajawal_500Medium', fontSize: 13 },

  // Login button
  loginBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  btnGradient: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 17,
  },
  loginBtnText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 17 },

  // Divider
  divider: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12 },

  // Google
  googleBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 20,
  },
  googleIcon: {
    color: '#EA4335', fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 18, width: 24, textAlign: 'center',
  },
  googleText: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 15 },

  // Register link
  registerRow: {
    flexDirection: 'row-reverse', justifyContent: 'center',
    alignItems: 'center', gap: 6,
  },
  registerHint: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 14 },
  registerLink: { color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 14 },
});
