import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const GOLD = '#E97900';
const GOLD2 = '#F5A030';

export default function VerifyEmailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { verifyEmail, resendVerificationEmail } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(180);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const timer = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);

  async function confirm() {
    if (!/^\d{6}$/.test(code)) {
      Alert.alert('رمز غير مكتمل', 'أدخل الرمز المؤلف من 6 أرقام');
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(email, code);
      Alert.alert('تم تفعيل الحساب', 'مرحبًا بك في قمة النظائر');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('تعذر التحقق', error?.message ?? 'الرمز غير صحيح أو منتهي الصلاحية');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (resending || seconds > 0) return;
    setResending(true);
    try {
      await resendVerificationEmail(email);
      setCode('');
      setSeconds(180);
      Alert.alert('تم الإرسال', 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني');
    } catch (error: any) {
      Alert.alert('تعذر الإرسال', error?.message ?? 'حاول مرة أخرى لاحقًا');
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Ionicons name="arrow-forward" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/company-logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="mail-open-outline" size={34} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>تحقق من بريدك الإلكتروني</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>أرسلنا رمز التحقق إلى</Text>
            <Text style={[styles.email, { color: colors.primary }]} numberOfLines={1}>{email || 'بريدك الإلكتروني'}</Text>
            <TextInput
              value={code}
              onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.codeInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: code.length === 6 ? colors.primary : colors.border }]}
              textAlign="center"
            />
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={16} color={seconds > 0 ? colors.primary : colors.destructive} />
              <Text style={[styles.timer, { color: seconds > 0 ? colors.primary : colors.destructive }]}>ينتهي الرمز خلال {timer}</Text>
            </View>
            <TouchableOpacity onPress={confirm} disabled={loading} style={styles.primaryButton} activeOpacity={0.85}>
              <LinearGradient colors={[GOLD, GOLD2]} style={styles.gradient}>
                {loading ? <ActivityIndicator color="#0B1628" /> : <Text style={styles.primaryText}>تأكيد الرمز</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={resend} disabled={resending || seconds > 0} style={styles.resendButton}>
              {resending ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.resendText, { color: seconds > 0 ? colors.mutedForeground : colors.primary }]}>إعادة إرسال الرمز</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/auth/register')}>
              <Text style={[styles.editEmail, { color: colors.mutedForeground }]}>تعديل البريد الإلكتروني</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.security, { color: colors.mutedForeground }]}>لا تشارك رمز التحقق مع أي شخص</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 16 },
  backButton: { alignSelf: 'flex-start', width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 150, height: 128, marginTop: 18, marginBottom: 16 },
  card: { width: '100%', maxWidth: 460, borderRadius: 26, borderWidth: 1, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 30, elevation: 10 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 22, textAlign: 'center' },
  subtitle: { fontFamily: 'Tajawal_500Medium', fontSize: 14, marginTop: 12 },
  email: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 14, marginTop: 5, maxWidth: '100%' },
  codeInput: { width: '100%', borderRadius: 16, borderWidth: 1, marginTop: 24, paddingVertical: 14, fontSize: 30, letterSpacing: 10, fontFamily: 'Tajawal_800ExtraBold' },
  timerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 14 },
  timer: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },
  primaryButton: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 20 },
  gradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 17 },
  primaryText: { color: '#0B1628', fontFamily: 'Tajawal_800ExtraBold', fontSize: 17 },
  resendButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  resendText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
  editEmail: { fontFamily: 'Tajawal_500Medium', fontSize: 13, marginTop: 8 },
  securityRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 20 },
  security: { fontFamily: 'Tajawal_500Medium', fontSize: 12 },
});
