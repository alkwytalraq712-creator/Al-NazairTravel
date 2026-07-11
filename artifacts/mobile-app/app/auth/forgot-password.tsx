/**
 * Forgot Password Screen — request a password reset by email or phone.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const GOLD  = '#C9A060';
const GOLD2 = '#E8C07A';
const DARK  = '#0B1628';
const DARK2 = '#0F1E36';
const DARK3 = '#162035';
const BORDER = 'rgba(201,160,96,0.15)';
const MUTED  = 'rgba(255,255,255,0.50)';
const WHITE  = '#FFFFFF';
const INPUT_BG = 'rgba(255,255,255,0.06)';

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return '';
}

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    const id = identifier.trim();
    if (!id) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف');
      return;
    }
    setLoading(true);
    try {
      await fetch(`${getApiBase()}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id }),
      });
      setSent(true);
    } catch {
      Alert.alert('خطأ', 'تعذر الإرسال، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[DARK, DARK2, DARK3]} style={[styles.screen, { paddingTop }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-forward" size={22} color={WHITE} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <LinearGradient colors={[GOLD, GOLD2]} style={styles.iconCircle}>
              <Ionicons name="lock-open-outline" size={32} color={DARK} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>نسيت كلمة المرور؟</Text>
          <Text style={styles.subtitle}>
            أدخل بريدك الإلكتروني أو رقم هاتفك وسنرسل لك تعليمات الاسترداد
          </Text>

          {sent ? (
            /* ── Success state ── */
            <View style={styles.successCard}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={52} color="#22c55e" />
              </View>
              <Text style={styles.successTitle}>تم الإرسال بنجاح!</Text>
              <Text style={styles.successText}>
                إذا كان الحساب موجوداً، ستصل إليك تعليمات استعادة كلمة المرور قريباً.
              </Text>
              <TouchableOpacity
                style={styles.backToLoginBtn}
                onPress={() => router.replace('/auth/login')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[GOLD, GOLD2]} style={styles.btnGradient}>
                  <Text style={styles.btnText}>العودة إلى تسجيل الدخول</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form ── */
            <View style={styles.form}>
              <Text style={styles.label}>البريد الإلكتروني أو رقم الهاتف</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com أو رقم الهاتف"
                  placeholderTextColor={MUTED}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                />
              </View>

              <TouchableOpacity
                style={[styles.sendBtn, loading && { opacity: 0.7 }]}
                onPress={handleSend}
                activeOpacity={0.85}
                disabled={loading}
              >
                <LinearGradient colors={[GOLD, GOLD2]} style={styles.btnGradient}>
                  {loading
                    ? <ActivityIndicator size="small" color={DARK} />
                    : (
                      <>
                        <Ionicons name="send" size={17} color={DARK} />
                        <Text style={styles.btnText}>إرسال تعليمات الاسترداد</Text>
                      </>
                    )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backLink}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={16} color={MUTED} />
                <Text style={styles.backLinkText}>العودة إلى تسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48, flexGrow: 1 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  iconWrap: { alignItems: 'center', marginBottom: 20 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    color: WHITE, fontSize: 24, fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'center', marginBottom: 10,
  },
  subtitle: {
    color: MUTED, fontSize: 14, fontFamily: 'Tajawal_400Regular',
    textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  form: {},
  label: {
    color: MUTED, fontSize: 13, fontFamily: 'Tajawal_500Medium',
    textAlign: 'right', marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: INPUT_BG, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER, marginBottom: 20,
    paddingHorizontal: 14,
  },
  inputIcon: { marginLeft: 8 },
  input: {
    flex: 1, paddingVertical: 15,
    color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 14,
  },
  sendBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  btnGradient: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  btnText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  backLink: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
  },
  backLinkText: { color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 14 },
  // Success
  successCard: { alignItems: 'center', paddingTop: 16, gap: 12 },
  successIconWrap: { marginBottom: 8 },
  successTitle: { color: '#22c55e', fontSize: 20, fontFamily: 'Tajawal_800ExtraBold' },
  successText: {
    color: MUTED, fontSize: 14, fontFamily: 'Tajawal_400Regular',
    textAlign: 'center', lineHeight: 22,
  },
  backToLoginBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginTop: 16 },
});
