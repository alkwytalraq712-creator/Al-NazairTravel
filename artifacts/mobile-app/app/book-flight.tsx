import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateFlightBooking } from '@workspace/api-client-react';
import type { FlightOffer } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

export default function BookFlightScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const params = useLocalSearchParams<{ offer: string }>();
  const offer: FlightOffer | null = params.offer ? JSON.parse(params.offer as string) : null;
  const createMutation = useCreateFlightBooking();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [passportNum, setPassportNum] = useState('');
  const [passportExp, setPassportExp] = useState('');
  const [loading, setLoading] = useState(false);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  if (!offer) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontFamily: 'Tajawal_500Medium', color: colors.foreground }}>بيانات الرحلة غير متاحة</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: colors.primary, fontFamily: 'Tajawal_700Bold' }}>رجوع</Text></TouchableOpacity>
      </View>
    );
  }

  async function handleBook() {
    if (!phone || !email || !firstName || !lastName || !passportNum || !passportExp || !dob || !gender || !nationality) {
      Alert.alert('بيانات ناقصة', 'يرجى ملء جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      const result = await createMutation.mutateAsync({
        data: {
          offer: offer!,
          phone,
          email,
          passengers: [{
            firstName, lastName, nationality, gender, dob,
            passportNumber: passportNum, passportExpiry: passportExp,
          }],
        },
      });
      Alert.alert('تم الحجز!', `رقم الحجز: ${result.referenceNumber}`, [
        { text: 'حسناً', onPress: () => router.push('/bookings') },
      ]);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'حدث خطأ');
    } finally { setLoading(false); }
  }

  const inp = [styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-forward" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{offer.fromAirport} ← {offer.toAirport}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.flightBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.flightBannerText}>{offer.airlineName} • {offer.currency} {offer.price}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>بيانات المسافر</Text>
          {[
            { label: 'الاسم الأول', val: firstName, set: setFirstName, type: 'default' },
            { label: 'اسم العائلة', val: lastName, set: setLastName, type: 'default' },
            { label: 'الجنسية', val: nationality, set: setNationality, type: 'default' },
            { label: 'الجنس (ذكر/أنثى)', val: gender, set: setGender, type: 'default' },
            { label: 'تاريخ الميلاد (YYYY-MM-DD)', val: dob, set: setDob, type: 'numbers-and-punctuation' },
            { label: 'رقم الجواز', val: passportNum, set: setPassportNum, type: 'default' },
            { label: 'تاريخ انتهاء الجواز (YYYY-MM-DD)', val: passportExp, set: setPassportExp, type: 'numbers-and-punctuation' },
          ].map(f => (
            <View key={f.label}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>{f.label} *</Text>
              <TextInput style={inp} placeholder={f.label} placeholderTextColor={colors.mutedForeground} value={f.val} onChangeText={f.set} keyboardType={f.type as any} textAlign="right" autoCapitalize="none" />
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>بيانات التواصل</Text>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>رقم الهاتف *</Text>
          <TextInput style={inp} placeholder="+964 7XX XXXX" placeholderTextColor={colors.mutedForeground} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign="right" />
          <Text style={[styles.label, { color: colors.mutedForeground }]}>البريد الإلكتروني *</Text>
          <TextInput style={inp} placeholder="example@email.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textAlign="right" />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleBook} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>تأكيد الحجز — {offer.currency} {offer.price}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 17, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' },
  flightBanner: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 14 },
  flightBannerText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 10 },
  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 6, marginTop: 8 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontFamily: 'Tajawal_400Regular', fontSize: 14, marginBottom: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
});
