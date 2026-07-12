import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from '@/context/AuthContext';
import CountryPickerModal from '@/components/CountryPickerModal';
import { DEFAULT_COUNTRY, type Country } from '@/lib/countries';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  getBiometricLabel,
  authenticateBiometric,
  setBiometricEnabled,
} from '@/lib/biometric';
import { useColors } from '@/hooks/useColors';

const GOLD   = '#C9A060';
const GOLD2  = '#E8C07A';

type Tab = 'phone' | 'email';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { login, tryRestoreFromBiometric } = useAuth();
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
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('البصمة البيومترية');
  const [biometricLoading, setBiometricLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 12, bounciness: 4, useNativeDriver: true })
    ]).start();

    if (Platform.OS === 'web') return;
    (async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      if (available && enabled) {
        setBiometricReady(true);
        const label = await getBiometricLabel();
        setBiometricLabel(label);
      }
    })();
  }, [fadeAnim, slideAnim]);

  async function handleBiometricLogin() {
    setBiometricLoading(true);
    try {
      const authOk = await authenticateBiometric('تسجيل الدخول إلى قمة للسفر والسياحة');
      if (!authOk) return;
      const restored = await tryRestoreFromBiometric();
      if (restored) {
        router.replace('/(tabs)');
      } else {
        await setBiometricEnabled(false);
        setBiometricReady(false);
        Alert.alert(
          'انتهت صلاحية الجلسة',
          'يرجى تسجيل الدخول بكلمة المرور مرة واحدة لإعادة تفعيل ميزة البصمة.',
        );
      }
    } finally {
      setBiometricLoading(false);
    }
  }

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
    focusedField === field ? colors.primary : colors.border;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Brand */}
          <View style={styles.brandWrap}>
            <Image
              source={require('@/assets/images/company-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.brandName, { color: colors.foreground }]}>قمة للسفر والسياحة</Text>
            <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>QEMA TRAVEL &amp; TOURISM</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>تسجيل الدخول</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>مرحباً بعودتك</Text>

            {/* Tab selector */}
            <View style={[styles.tabRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.tab, tab === 'phone' && { backgroundColor: colors.primary }]}
                onPress={() => setTab('phone')}
                activeOpacity={0.8}
              >
                <Ionicons name="call-outline" size={16} color={tab === 'phone' ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.tabText, { color: tab === 'phone' ? colors.primaryForeground : colors.mutedForeground }]}>رقم الهاتف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'email' && { backgroundColor: colors.primary }]}
                onPress={() => setTab('email')}
                activeOpacity={0.8}
              >
                <Ionicons name="mail-outline" size={16} color={tab === 'email' ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.tabText, { color: tab === 'email' ? colors.primaryForeground : colors.mutedForeground }]}>البريد الإلكتروني</Text>
              </TouchableOpacity>
            </View>

            {/* Phone input */}
            {tab === 'phone' && (
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>رقم الهاتف</Text>
                <View style={[styles.phoneRow, { backgroundColor: colors.input, borderColor: inputBorder('phone') }]}>
                  <TouchableOpacity
                    style={styles.countryBtn}
                    onPress={() => setShowPicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <Text style={[styles.countryDial, { color: colors.primary }]}>{country.dial}</Text>
                    <Ionicons name="chevron-down" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <View style={[styles.phoneDivider, { backgroundColor: colors.border }]} />
                  <TextInput
                    style={[styles.phoneInput, { color: colors.foreground }]}
                    placeholder="رقم الهاتف"
                    placeholderTextColor={colors.mutedForeground}
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
                <Text style={[styles.label, { color: colors.mutedForeground }]}>البريد الإلكتروني</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: inputBorder('email') }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.mutedForeground}
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
              <Text style={[styles.label, { color: colors.mutedForeground }]}>كلمة المرور</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: inputBorder('pass') }]}>
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
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
              <Text style={[styles.forgotText, { color: colors.primary }]}>نسيت كلمة المرور؟</Text>
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
                  ? <ActivityIndicator size="small" color="#0B1628" />
                  : (
                    <>
                      <Ionicons name="log-in-outline" size={22} color="#0B1628" />
                      <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
                    </>
                  )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>أو</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Biometric button */}
            {biometricReady && Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.biometricBtn, { borderColor: colors.primary, backgroundColor: colors.accent }, biometricLoading && { opacity: 0.7 }]}
                onPress={handleBiometricLogin}
                disabled={biometricLoading}
                activeOpacity={0.85}
              >
                {biometricLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="finger-print" size={24} color={colors.primary} />
                    <Text style={[styles.biometricText, { color: colors.primary }]}>تسجيل الدخول بـ {biometricLabel}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Google button */}
            <TouchableOpacity
              style={[styles.googleBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => Alert.alert('قريباً', 'تسجيل الدخول بجوجل قيد الإعداد')}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleText, { color: colors.foreground }]}>المتابعة عبر Google</Text>
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <TouchableOpacity onPress={() => router.replace('/auth/register')} activeOpacity={0.7}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>إنشاء حساب جديد</Text>
              </TouchableOpacity>
              <Text style={[styles.registerHint, { color: colors.mutedForeground }]}>ليس لديك حساب؟</Text>
            </View>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={showPicker}
        selected={country}
        onSelect={setCountry}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  brandWrap: { alignItems: 'center', paddingVertical: 32 },
  logo: { width: 150, height: 128, marginBottom: 16 },
  brandName: { fontSize: 24, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  brandSub: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'center', letterSpacing: 1.5, marginTop: 4 },
  card: {
    borderRadius: 24, borderWidth: 1, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15, shadowRadius: 32, elevation: 10,
  },
  cardTitle: { fontSize: 24, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right', marginBottom: 6 },
  cardSub: { fontSize: 15, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 24 },
  tabRow: { flexDirection: 'row-reverse', borderRadius: 14, borderWidth: 1, padding: 6, marginBottom: 24, gap: 6 },
  tab: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  tabText: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 8 },
  phoneRow: { flexDirection: 'row-reverse', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  countryBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 16 },
  countryFlag: { fontSize: 22 },
  countryDial: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
  phoneDivider: { width: 1 },
  phoneInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 16, fontFamily: 'Tajawal_500Medium', fontSize: 16 },
  inputWrap: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  inputIcon: { marginLeft: 10 },
  eyeBtn: { padding: 8, marginLeft: 4 },
  input: { flex: 1, paddingVertical: 16, fontFamily: 'Tajawal_500Medium', fontSize: 16 },
  forgotWrap: { alignItems: 'flex-start', marginBottom: 24 },
  forgotText: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  loginBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  btnGradient: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  loginBtnText: { color: '#0B1628', fontFamily: 'Tajawal_800ExtraBold', fontSize: 18 },
  divider: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: 'Tajawal_500Medium', fontSize: 14 },
  googleBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  googleIcon: { color: '#EA4335', fontFamily: 'Tajawal_800ExtraBold', fontSize: 20, width: 28, textAlign: 'center' },
  googleText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  biometricBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  biometricText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  registerRow: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  registerHint: { fontFamily: 'Tajawal_500Medium', fontSize: 15 },
  registerLink: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
});
