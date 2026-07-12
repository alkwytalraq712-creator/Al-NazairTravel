import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreatePackageBooking, useGetPackage } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

export default function BookPackageScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data: pkg } = useGetPackage(Number(id));
  const createMutation = useCreatePackageBooking();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [notes, setNotes] = useState('');
  const [travelersCount, setTravelersCount] = useState(1);
  const [names, setNames] = useState<string[]>(['']);
  const [passports, setPassports] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  function updateCount(n: number) {
    const count = Math.max(1, n);
    setTravelersCount(count);
    setNames(prev => { const a = [...prev]; while (a.length < count) a.push(''); return a.slice(0, count); });
    setPassports(prev => { const a = [...prev]; while (a.length < count) a.push(''); return a.slice(0, count); });
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.mutedForeground} />
        <Text style={[{ fontFamily: 'Tajawal_500Medium', fontSize: 16, color: colors.foreground }]}>يجب تسجيل الدخول أولاً</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => router.push('/auth/login')}>
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleSubmit() {
    if (!phone.trim() || !email.trim() || !travelDate.trim()) {
      Alert.alert('بيانات ناقصة', 'يرجى ملء رقم الهاتف والبريد وتاريخ السفر');
      return;
    }
    setLoading(true);
    try {
      const result = await createMutation.mutateAsync({
        data: {
          packageId: Number(id),
          travelersCount,
          travelerNames: names,
          passportNumbers: passports,
          phone, email, travelDate, notes: notes || undefined,
        },
      });
      Alert.alert('تم الحجز!', `رقم الحجز: ${result.referenceNumber}`, [
        { text: 'حسناً', onPress: () => router.push('/bookings') },
      ]);
    } catch (e: any) {
      const msg = e?.data?.error ?? e?.message ?? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      Alert.alert('تعذر إرسال الطلب', msg, [{ text: 'حسناً' }]);
    } finally { setLoading(false); }
  }

  const inp = [styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-forward" size={24} color={colors.foreground} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{pkg?.name ?? 'حجز الباقة'}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {/* Travelers Count */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>عدد المسافرين</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={() => updateCount(travelersCount - 1)} style={[styles.counterBtn, { borderColor: colors.border }]}><Ionicons name="remove" size={18} color={colors.foreground} /></TouchableOpacity>
            <Text style={[styles.counterVal, { color: colors.foreground }]}>{travelersCount}</Text>
            <TouchableOpacity onPress={() => updateCount(travelersCount + 1)} style={[styles.counterBtn, { borderColor: colors.border }]}><Ionicons name="add" size={18} color={colors.foreground} /></TouchableOpacity>
          </View>
        </View>

        {/* Traveler Details */}
        {Array.from({ length: travelersCount }).map((_, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>المسافر {i + 1}</Text>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>الاسم الكامل</Text>
            <TextInput style={inp} placeholder="الاسم الكامل" placeholderTextColor={colors.mutedForeground} value={names[i]} onChangeText={v => { const a = [...names]; a[i] = v; setNames(a); }} textAlign="right" />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>رقم الجواز</Text>
            <TextInput style={inp} placeholder="رقم الجواز" placeholderTextColor={colors.mutedForeground} value={passports[i]} onChangeText={v => { const a = [...passports]; a[i] = v; setPassports(a); }} textAlign="right" />
          </View>
        ))}

        {/* Contact */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>بيانات التواصل</Text>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>رقم الهاتف *</Text>
          <TextInput style={inp} placeholder="+964 7XX XXXX" placeholderTextColor={colors.mutedForeground} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign="right" />
          <Text style={[styles.label, { color: colors.mutedForeground }]}>البريد الإلكتروني *</Text>
          <TextInput style={inp} placeholder="example@email.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textAlign="right" />
          <Text style={[styles.label, { color: colors.mutedForeground }]}>تاريخ السفر (YYYY-MM-DD) *</Text>
          <TextInput style={inp} placeholder="2025-12-01" placeholderTextColor={colors.mutedForeground} value={travelDate} onChangeText={setTravelDate} textAlign="right" />
          <Text style={[styles.label, { color: colors.mutedForeground }]}>ملاحظات (اختياري)</Text>
          <TextInput style={[inp, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="أي طلبات خاصة..." placeholderTextColor={colors.mutedForeground} value={notes} onChangeText={setNotes} multiline textAlign="right" />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>إرسال طلب الحجز</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },
  btn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 17, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 10 },
  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 6, marginTop: 8 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontFamily: 'Tajawal_400Regular', fontSize: 14, marginBottom: 4 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 8 },
  counterBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  counterVal: { fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', minWidth: 30, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
});
