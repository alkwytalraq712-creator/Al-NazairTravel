import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

type LoginTab = 'phone' | 'email';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useColorScheme() === 'dark';
  const { login } = useAuth();

  const [tab, setTab] = useState<LoginTab>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  async function handleLogin() {
    const identifier = tab === 'phone' ? ('+964' + phone.trim()) : email.trim();
    if (!identifier || identifier === '+964' || !password.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      await login({ identifier, password });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('خطأ في تسجيل الدخول', e?.message ?? 'بيانات خاطئة، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  }

  if (!isDark) {
    // ─── Light Mode ───────────────────────────────────────────────
    const inputStyle = [stylesLight.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }];
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={[stylesLight.topSection, { backgroundColor: '#0D1526', paddingTop: paddingTop + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={stylesLight.backBtn}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={stylesLight.topTitle}>تسجيل الدخول</Text>
          <Text style={stylesLight.topSub}>مرحباً بعودتك في قمة النظائر</Text>
        </View>

        <View style={[stylesLight.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Tab selector */}
          <View style={[stylesLight.tabRow, { backgroundColor: colors.muted }]}>
            <TouchableOpacity style={[stylesLight.tab, tab === 'email' && { backgroundColor: colors.primary }]} onPress={() => setTab('email')}>
              <Text style={[stylesLight.tabText, { color: tab === 'email' ? '#fff' : colors.mutedForeground }]}>البريد الإلكتروني</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[stylesLight.tab, tab === 'phone' && { backgroundColor: colors.primary }]} onPress={() => setTab('phone')}>
              <Text style={[stylesLight.tabText, { color: tab === 'phone' ? '#fff' : colors.mutedForeground }]}>رقم الموبايل</Text>
            </TouchableOpacity>
          </View>

          {tab === 'phone' ? (
            <>
              <Text style={[stylesLight.label, { color: colors.mutedForeground }]}>رقم الموبايل العراقي</Text>
              <View style={[stylesLight.phoneRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <TextInput style={[stylesLight.phoneInput, { color: colors.foreground }]} placeholder="7X XXX XXXX" placeholderTextColor={colors.mutedForeground} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign="right" />
                <View style={[stylesLight.countryCode, { borderColor: colors.border }]}>
                  <Text style={[stylesLight.countryCodeText, { color: colors.foreground }]}>+964</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={[stylesLight.label, { color: colors.mutedForeground }]}>البريد الإلكتروني</Text>
              <TextInput style={inputStyle} placeholder="example@email.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textAlign="right" />
            </>
          )}

          <Text style={[stylesLight.label, { color: colors.mutedForeground }]}>كلمة المرور</Text>
          <View style={[stylesLight.passRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TextInput style={[stylesLight.passInput, { color: colors.foreground }]} placeholder="كلمة المرور" placeholderTextColor={colors.mutedForeground} value={password} onChangeText={setPassword} secureTextEntry={!showPass} textAlign="right" />
          </View>

          <View style={stylesLight.remRow}>
            <TouchableOpacity onPress={() => {}}>
              <Text style={[stylesLight.forgotText, { color: colors.primary }]}>نسيت كلمة المرور؟</Text>
            </TouchableOpacity>
            <TouchableOpacity style={stylesLight.checkRow} onPress={() => setRememberMe(!rememberMe)}>
              <Text style={[stylesLight.remText, { color: colors.foreground }]}>تذكرني</Text>
              <View style={[stylesLight.checkbox, { borderColor: colors.border, backgroundColor: rememberMe ? colors.primary : 'transparent' }]}>
                {rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[stylesLight.loginBtn, { backgroundColor: colors.primary }]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={stylesLight.loginBtnText}>تسجيل الدخول</Text>}
          </TouchableOpacity>

          <View style={stylesLight.dividerRow}>
            <View style={[stylesLight.line, { backgroundColor: colors.border }]} />
            <Text style={[stylesLight.orText, { color: colors.mutedForeground }]}>أو تسجيل الدخول باستخدام</Text>
            <View style={[stylesLight.line, { backgroundColor: colors.border }]} />
          </View>

          <View style={stylesLight.socialRow}>
            {(['logo-google', 'logo-apple', 'logo-facebook'] as const).map((icon) => (
              <TouchableOpacity key={icon} style={[stylesLight.socialBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name={icon} size={22} color={colors.foreground} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={stylesLight.registerLink} onPress={() => router.replace('/auth/register')}>
            <Text style={[stylesLight.registerLinkText, { color: colors.primary }]}>ليس لديك حساب؟ إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── Dark (Golden) Mode ────────────────────────────────────────
  return (
    <View style={stylesDark.screen}>
      <LinearGradient colors={['#080C18', '#0A1020', '#080C18']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[stylesDark.header, { paddingTop: paddingTop + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={stylesDark.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#C8962A" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 4 }}>
          <Text style={stylesDark.headerTitle}>تسجيل الدخول</Text>
          <Text style={stylesDark.headerSub}>اختر طريقة تسجيل الدخول</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Tab selector */}
        <View style={stylesDark.tabRow}>
          <TouchableOpacity
            style={[stylesDark.tab, tab === 'email' && stylesDark.tabActive]}
            onPress={() => setTab('email')}
          >
            <Text style={[stylesDark.tabText, tab === 'email' && stylesDark.tabTextActive]}>البريد الإلكتروني</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[stylesDark.tab, tab === 'phone' && stylesDark.tabActive]}
            onPress={() => setTab('phone')}
          >
            <Text style={[stylesDark.tabText, tab === 'phone' && stylesDark.tabTextActive]}>رقم الموبايل</Text>
          </TouchableOpacity>
        </View>

        {/* Phone or email field */}
        {tab === 'phone' ? (
          <>
            <Text style={stylesDark.label}>رقم الموبايل العراقي</Text>
            <View style={stylesDark.phoneRow}>
              <TextInput
                style={stylesDark.phoneInput}
                placeholder="7X XXX XXXX"
                placeholderTextColor="#4A5568"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textAlign="right"
              />
              <View style={stylesDark.countryCode}>
                <Text style={stylesDark.countryCodeText}>+964</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={stylesDark.label}>البريد الإلكتروني</Text>
            <TextInput
              style={stylesDark.input}
              placeholder="example@email.com"
              placeholderTextColor="#4A5568"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textAlign="right"
            />
          </>
        )}

        {/* Password */}
        <Text style={stylesDark.label}>كلمة المرور</Text>
        <View style={stylesDark.passRow}>
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#4A5568" />
          </TouchableOpacity>
          <TextInput
            style={stylesDark.passInput}
            placeholder="••••••••"
            placeholderTextColor="#4A5568"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            textAlign="right"
          />
        </View>

        {/* Remember me + Forgot */}
        <View style={stylesDark.remRow}>
          <TouchableOpacity onPress={() => {}}>
            <Text style={stylesDark.forgotText}>نسيت كلمة المرور؟</Text>
          </TouchableOpacity>
          <TouchableOpacity style={stylesDark.checkRow} onPress={() => setRememberMe(!rememberMe)}>
            <Text style={stylesDark.remText}>تذكرني</Text>
            <View style={[stylesDark.checkbox, rememberMe && stylesDark.checkboxActive]}>
              {rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8, elevation: 4, shadowColor: '#C8962A', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 }}>
          <LinearGradient colors={['#D4A32A', '#C8962A', '#B8821A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={stylesDark.loginBtn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={stylesDark.loginBtnText}>تسجيل الدخول</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {/* Social divider */}
        <View style={stylesDark.dividerRow}>
          <View style={stylesDark.line} />
          <Text style={stylesDark.orText}>أو تسجيل الدخول باستخدام</Text>
          <View style={stylesDark.line} />
        </View>

        {/* Social buttons */}
        <View style={stylesDark.socialRow}>
          {(['logo-google', 'logo-apple', 'logo-facebook'] as const).map((icon) => (
            <TouchableOpacity key={icon} style={stylesDark.socialBtn}>
              <Ionicons name={icon} size={22} color="#F0E8D4" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={stylesDark.registerLink} onPress={() => router.replace('/auth/register')}>
          <Text style={stylesDark.registerLinkText}>ليس لديك حساب؟ <Text style={{ color: '#C8962A', fontFamily: 'Tajawal_700Bold' }}>إنشاء حساب جديد</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Light styles ──────────────────────────────────────────────────────────────
const stylesLight = StyleSheet.create({
  topSection: { paddingHorizontal: 24, paddingBottom: 28, alignItems: 'flex-end' },
  backBtn: { position: 'absolute', top: 16, right: 16, padding: 8 },
  topTitle: { color: '#fff', fontSize: 24, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right', marginTop: 8 },
  topSub: { color: '#ffffffaa', fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginTop: 4 },
  form: { margin: 16, padding: 20, borderRadius: 20, borderWidth: 1 },
  tabRow: { flexDirection: 'row-reverse', borderRadius: 12, padding: 4, marginBottom: 18 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontFamily: 'Tajawal_500Medium', fontSize: 14 },
  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 8 },
  input: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1, fontFamily: 'Tajawal_400Regular', fontSize: 15, marginBottom: 14 },
  phoneRow: { flexDirection: 'row-reverse', borderRadius: 12, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontFamily: 'Tajawal_400Regular', fontSize: 15 },
  countryCode: { paddingHorizontal: 14, justifyContent: 'center', borderRightWidth: 1 },
  countryCodeText: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  passRow: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, marginBottom: 10 },
  passInput: { flex: 1, paddingVertical: 14, fontFamily: 'Tajawal_400Regular', fontSize: 15 },
  remRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  checkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  remText: { fontFamily: 'Tajawal_500Medium', fontSize: 13 },
  forgotText: { fontFamily: 'Tajawal_500Medium', fontSize: 13 },
  loginBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 4 },
  loginBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  dividerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginVertical: 16 },
  line: { flex: 1, height: 1 },
  orText: { fontFamily: 'Tajawal_400Regular', fontSize: 11, textAlign: 'center' },
  socialRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 14, marginBottom: 16 },
  socialBtn: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  registerLink: { alignItems: 'center', paddingTop: 4 },
  registerLinkText: { fontFamily: 'Tajawal_500Medium', fontSize: 14 },
});

// ── Dark (Golden) styles ──────────────────────────────────────────────────────
const stylesDark = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080C18' },
  header: { flexDirection: 'row-reverse', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { padding: 8, marginTop: 2 },
  headerTitle: { color: '#F0E8D4', fontSize: 24, fontFamily: 'Tajawal_800ExtraBold' },
  headerSub: { color: '#8A97B0', fontSize: 13, fontFamily: 'Tajawal_400Regular', marginTop: 2 },

  tabRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0F1526',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1A2640',
  },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: '#C8962A' },
  tabText: { color: '#8A97B0', fontFamily: 'Tajawal_500Medium', fontSize: 14 },
  tabTextActive: { color: '#fff', fontFamily: 'Tajawal_700Bold' },

  label: { color: '#8A97B0', fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 8 },

  input: {
    backgroundColor: '#0F1526',
    borderWidth: 1,
    borderColor: '#1A2640',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: '#F0E8D4',
    fontFamily: 'Tajawal_400Regular',
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'right',
  },
  phoneRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0F1526',
    borderWidth: 1,
    borderColor: '#1A2640',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: '#F0E8D4',
    fontFamily: 'Tajawal_400Regular',
    fontSize: 15,
  },
  countryCode: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#1A2640',
    backgroundColor: '#111A2E',
  },
  countryCodeText: { color: '#C8962A', fontFamily: 'Tajawal_700Bold', fontSize: 15 },

  passRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#0F1526',
    borderWidth: 1,
    borderColor: '#1A2640',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  passInput: {
    flex: 1,
    paddingVertical: 15,
    color: '#F0E8D4',
    fontFamily: 'Tajawal_400Regular',
    fontSize: 15,
  },

  remRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  checkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: '#1A2640', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#C8962A', borderColor: '#C8962A' },
  remText: { color: '#8A97B0', fontFamily: 'Tajawal_500Medium', fontSize: 13 },
  forgotText: { color: '#C8962A', fontFamily: 'Tajawal_500Medium', fontSize: 13 },

  loginBtn: { paddingVertical: 17, alignItems: 'center', borderRadius: 14 },
  loginBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 17 },

  dividerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#1A2640' },
  orText: { color: '#4A5568', fontFamily: 'Tajawal_400Regular', fontSize: 11, textAlign: 'center' },

  socialRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 16, marginBottom: 20 },
  socialBtn: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#0F1526',
    borderWidth: 1, borderColor: '#1A2640',
    justifyContent: 'center', alignItems: 'center',
  },

  registerLink: { alignItems: 'center', paddingTop: 4 },
  registerLinkText: { color: '#8A97B0', fontFamily: 'Tajawal_400Regular', fontSize: 14 },
});
