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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateVisaApplication, useGetVisa } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

export default function ApplyVisaScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data: visa } = useGetVisa(Number(id));
  const createMutation = useCreateVisaApplication();

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', nationality: '',
    passportNumber: '', passportExpiry: '', dob: '',
    gender: '', occupation: '', city: '',
  });
  const [loading, setLoading] = useState(false);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  function updateField(key: keyof typeof form) {
    return (val: string) => setForm(prev => ({ ...prev, [key]: val }));
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.lockText, { color: colors.foreground }]}>يجب تسجيل الدخول أولاً</Text>
        <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/auth/login')}>
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleSubmit() {
    const required = ['fullName', 'phone', 'email', 'nationality', 'passportNumber', 'passportExpiry', 'dob', 'gender', 'occupation', 'city'] as const;
    for (const field of required) {
      if (!form[field].trim()) {
        Alert.alert('بيانات ناقصة', 'يرجى ملء جميع الحقول المطلوبة');
        return;
      }
    }
    setLoading(true);
    try {
      const result = await createMutation.mutateAsync({
        data: {
          visaId: Number(id),
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          nationality: form.nationality,
          passportNumber: form.passportNumber,
          passportExpiry: form.passportExpiry,
          dob: form.dob,
          gender: form.gender,
          occupation: form.occupation,
          city: form.city,
        },
      });
      Alert.alert(
        'تم إرسال الطلب',
        `رقم الطلب المرجعي: ${result.referenceNumber}\nسيتم التواصل معك قريباً.`,
        [{ text: 'حسناً', onPress: () => router.push('/bookings') }],
      );
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }];

  const fields = [
    { key: 'fullName' as const, label: 'الاسم الكامل', placeholder: 'الاسم الكامل', keyboard: 'default' },
    { key: 'phone' as const, label: 'رقم الهاتف', placeholder: '+964 7XX XXXX', keyboard: 'phone-pad' },
    { key: 'email' as const, label: 'البريد الإلكتروني', placeholder: 'example@email.com', keyboard: 'email-address' },
    { key: 'nationality' as const, label: 'الجنسية', placeholder: 'عراقي', keyboard: 'default' },
    { key: 'passportNumber' as const, label: 'رقم الجواز', placeholder: 'A12345678', keyboard: 'default' },
    { key: 'passportExpiry' as const, label: 'تاريخ انتهاء الجواز', placeholder: 'YYYY-MM-DD', keyboard: 'numbers-and-punctuation' },
    { key: 'dob' as const, label: 'تاريخ الميلاد', placeholder: 'YYYY-MM-DD', keyboard: 'numbers-and-punctuation' },
    { key: 'gender' as const, label: 'الجنس', placeholder: 'ذكر / أنثى', keyboard: 'default' },
    { key: 'occupation' as const, label: 'المهنة', placeholder: 'مهندس، طبيب...', keyboard: 'default' },
    { key: 'city' as const, label: 'المدينة', placeholder: 'بغداد', keyboard: 'default' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تقديم طلب التأشيرة</Text>
      </View>
      {visa && (
        <View style={[styles.visaBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.visaBannerText}>{visa.countryName} — {visa.currency} {visa.price}</Text>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {fields.map(f => (
            <View key={f.key}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>{f.label} *</Text>
              <TextInput
                style={inputStyle}
                placeholder={f.placeholder}
                placeholderTextColor={colors.mutedForeground}
                value={form[f.key]}
                onChangeText={updateField(f.key)}
                keyboardType={f.keyboard as any}
                autoCapitalize="none"
                textAlign="right"
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>إرسال الطلب</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },
  lockText: { fontSize: 16, fontFamily: 'Tajawal_500Medium', textAlign: 'center' },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' },
  visaBanner: { padding: 12, alignItems: 'center' },
  visaBannerText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 6, marginTop: 10 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontFamily: 'Tajawal_400Regular', fontSize: 14, marginBottom: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
});
