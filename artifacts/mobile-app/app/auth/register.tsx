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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useColorScheme() === 'dark';
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  async function handleRegister() {
    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى ملء الاسم ورقم الهاتف وكلمة المرور');
      return;
    }
    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        phone: ('+964' + phone.trim()),
        email: email.trim() || undefined,
        password,
      });
      Alert.alert('تم إنشاء الحساب', 'تم التسجيل بنجاح!', [
        { text: 'حسناً', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (e: any) {
      Alert.alert('خطأ في التسجيل', e?.message ?? 'حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  }

  if (!isDark) {
    // ─── Light Mode ────────────────────────────────────────────────
    const inputStyle = [stylesLight.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }];
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={[stylesLight.topSection, { backgroundColor: '#0D1526', paddingTop: paddingTop + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={stylesLight.backBtn}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={stylesLight.topTitle}>إنشاء حساب</Text>
          <Text style={stylesLight.topSub}>انضم إلى قمة النظائر للسفريات</Text>
        </View>

        <View style={[stylesLight.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[stylesLight.label, { color: colors.mutedForeground }]}>الاسم الكامل *</Text>
          <TextInput style={inputStyle} placeholder="الاسم الكامل" placeholderTextColor={colors.mutedForeground} value={fullName} onChangeText={setFullName} textAlign="right" />

          <Text style={[stylesLight.label, { color: colors.mutedForeground }]}>رقم الموبايل العراقي *</Text>
          <View style={[stylesLight.phoneRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <TextInput style={[stylesLight.phoneInput, { color: colors.foreground }]} placeholder="7X XXX XXXX" placeholderTextColor={colors.mutedForeground} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign="right" />
            <View style={[stylesLight.countryCode, { borderColor: colors.border }]}>
              <Text style={[stylesLight.countryCodeText, { color: colors.foreground }]}>+964</Text>
            </View>
          </View>

          <Text style={[stylesLight.label, { color: colors.mutedForeground }]}>البريد الإلكتروني (اختياري)</Text>
          <TextInput style={inputStyle} placeholder="example@email.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textAlign="right" />

          <Text style={[stylesLight.label, { color: colors.mutedForeground }]}>كلمة المرور *</Text>
          <View style={[stylesLight.passRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TextInput style={[stylesLight.passInput, { color: colors.foreground }]} placeholder="6 أحرف على الأقل" placeholderTextColor={colors.mutedForeground} value={password} onChangeText={setPassword} secureTextEntry={!showPass} textAlign="right" />
          </View>

          <TouchableOpacity style={[stylesLight.submitBtn, { backgroundColor: colors.primary }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={stylesLight.submitBtnText}>إنشاء الحساب</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={stylesLight.loginLink} onPress={() => router.replace('/auth/login')}>
            <Text style={[stylesLight.loginLinkText, { color: colors.primary }]}>لديك حساب؟ سجل دخولك</Text>
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
          <Text style={stylesDark.headerTitle}>إنشاء حساب جديد</Text>
          <Text style={stylesDark.headerSub}>انضم إلى قمة النظائر للسفريات</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Full Name */}
        <Text style={stylesDark.label}>الاسم الكامل *</Text>
        <TextInput
          style={stylesDark.input}
          placeholder="الاسم الكامل"
          placeholderTextColor="#4A5568"
          value={fullName}
          onChangeText={setFullName}
          textAlign="right"
        />

        {/* Phone */}
        <Text style={stylesDark.label}>رقم الموبايل العراقي *</Text>
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

        {/* Email */}
        <Text style={stylesDark.label}>البريد الإلكتروني (اختياري)</Text>
        <TextInput
          style={stylesDark.input}
          placeholder="example@email.com"
          placeholderTextColor="#4A5568"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign="right"
        />

        {/* Password */}
        <Text style={stylesDark.label}>كلمة المرور * (6 أحرف على الأقل)</Text>
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

        {/* Submit */}
        <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8, elevation: 4, shadowColor: '#C8962A', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 }}>
          <LinearGradient colors={['#D4A32A', '#C8962A', '#B8821A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={stylesDark.submitBtn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={stylesDark.submitBtnText}>إنشاء الحساب</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={stylesDark.loginLink} onPress={() => router.replace('/auth/login')}>
          <Text style={stylesDark.loginLinkText}>
            لديك حساب؟ <Text style={{ color: '#C8962A', fontFamily: 'Tajawal_700Bold' }}>سجل دخولك</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Light styles ──────────────────────────────────────────────────────────────
const stylesLight = StyleSheet.create({
  topSection: { paddingHorizontal: 24, paddingBottom: 28, alignItems: 'flex-end' },
  backBtn: { position: 'absolute', top: 16, right: 16, padding: 8 },
  topTitle: { color: '#fff', fontSize: 24, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right', marginTop: 40 },
  topSub: { color: '#ffffffaa', fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginTop: 4 },
  form: { margin: 16, padding: 20, borderRadius: 20, borderWidth: 1 },
  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 8, marginTop: 4 },
  input: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1, fontFamily: 'Tajawal_400Regular', fontSize: 15, marginBottom: 4 },
  phoneRow: { flexDirection: 'row-reverse', borderRadius: 12, borderWidth: 1, marginBottom: 4, overflow: 'hidden' },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontFamily: 'Tajawal_400Regular', fontSize: 15 },
  countryCode: { paddingHorizontal: 14, justifyContent: 'center', borderRightWidth: 1 },
  countryCodeText: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  passRow: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, marginBottom: 4 },
  passInput: { flex: 1, paddingVertical: 14, fontFamily: 'Tajawal_400Regular', fontSize: 15 },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  loginLink: { alignItems: 'center', marginTop: 14 },
  loginLinkText: { fontFamily: 'Tajawal_500Medium', fontSize: 14 },
});

// ── Dark (Golden) styles ──────────────────────────────────────────────────────
const stylesDark = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080C18' },
  header: { flexDirection: 'row-reverse', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { padding: 8, marginTop: 2 },
  headerTitle: { color: '#F0E8D4', fontSize: 24, fontFamily: 'Tajawal_800ExtraBold' },
  headerSub: { color: '#8A97B0', fontSize: 13, fontFamily: 'Tajawal_400Regular', marginTop: 2 },

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

  submitBtn: { paddingVertical: 17, alignItems: 'center', borderRadius: 14 },
  submitBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 17 },

  loginLink: { alignItems: 'center', paddingTop: 20 },
  loginLinkText: { color: '#8A97B0', fontFamily: 'Tajawal_400Regular', fontSize: 14 },
});
