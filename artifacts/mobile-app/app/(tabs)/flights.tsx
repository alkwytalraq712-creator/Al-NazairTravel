import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { CabinClass } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

type TripType = 'one_way' | 'round_trip';

const CABIN_CLASSES: { key: CabinClass; label: string }[] = [
  { key: 'economy', label: 'اقتصادية' },
  { key: 'premium_economy', label: 'اقتصادية مميزة' },
  { key: 'business', label: 'رجال أعمال' },
  { key: 'first', label: 'الدرجة الأولى' },
];

function FieldLabel({ label, colors }: { label: string; colors: any }) {
  return <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>;
}

export default function FlightsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [tripType, setTripType] = useState<TripType>('round_trip');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cabinClass, setCabinClass] = useState<CabinClass>('economy');
  const [showCabin, setShowCabin] = useState(false);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  function handleSearch() {
    if (!from.trim() || !to.trim() || !departDate.trim()) {
      Alert.alert('بيانات ناقصة', 'يرجى ملء حقول المطار وتاريخ السفر');
      return;
    }
    const params: Record<string, string> = {
      from: from.trim().toUpperCase(),
      to: to.trim().toUpperCase(),
      departDate: departDate.trim(),
      adults: String(adults),
      children: String(children),
      cabinClass,
      tripType,
    };
    if (tripType === 'round_trip' && returnDate.trim()) {
      params.returnDate = returnDate.trim();
    }
    router.push({ pathname: '/flight-results', params } as any);
  }

  function swapAirports() {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  }

  const inputStyle = [styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <Text style={styles.headerTitle}>حجز الطيران</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 34 : 120 }}
      >
        {/* Trip type */}
        <View style={[styles.tripToggle, { backgroundColor: colors.muted, borderRadius: 12 }]}>
          {(['one_way', 'round_trip'] as TripType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tripBtn, tripType === t && { backgroundColor: '#0D1526' }]}
              onPress={() => setTripType(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tripBtnText, { color: tripType === t ? '#fff' : colors.mutedForeground }]}>
                {t === 'one_way' ? 'ذهاب فقط' : 'ذهاب وعودة'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* From / To */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FieldLabel label="مطار المغادرة (IATA)" colors={colors} />
          <TextInput
            style={inputStyle}
            placeholder="مثال: BGW"
            placeholderTextColor={colors.mutedForeground}
            value={from}
            onChangeText={setFrom}
            autoCapitalize="characters"
            maxLength={3}
            textAlign="right"
          />

          <TouchableOpacity style={styles.swapBtn} onPress={swapAirports}>
            <Ionicons name="swap-vertical" size={20} color={colors.primary} />
          </TouchableOpacity>

          <FieldLabel label="مطار الوصول (IATA)" colors={colors} />
          <TextInput
            style={inputStyle}
            placeholder="مثال: DXB"
            placeholderTextColor={colors.mutedForeground}
            value={to}
            onChangeText={setTo}
            autoCapitalize="characters"
            maxLength={3}
            textAlign="right"
          />
        </View>

        {/* Dates */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FieldLabel label="تاريخ المغادرة (YYYY-MM-DD)" colors={colors} />
          <TextInput
            style={inputStyle}
            placeholder="2025-12-01"
            placeholderTextColor={colors.mutedForeground}
            value={departDate}
            onChangeText={setDepartDate}
            keyboardType="numbers-and-punctuation"
            textAlign="right"
          />
          {tripType === 'round_trip' && (
            <>
              <FieldLabel label="تاريخ العودة (YYYY-MM-DD)" colors={colors} />
              <TextInput
                style={inputStyle}
                placeholder="2025-12-08"
                placeholderTextColor={colors.mutedForeground}
                value={returnDate}
                onChangeText={setReturnDate}
                keyboardType="numbers-and-punctuation"
                textAlign="right"
              />
            </>
          )}
        </View>

        {/* Passengers */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.passengerRow}>
            <View style={styles.counter}>
              <TouchableOpacity onPress={() => setAdults(Math.max(1, adults - 1))} style={[styles.counterBtn, { borderColor: colors.border }]}>
                <Ionicons name="remove" size={16} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.counterVal, { color: colors.foreground }]}>{adults}</Text>
              <TouchableOpacity onPress={() => setAdults(adults + 1)} style={[styles.counterBtn, { borderColor: colors.border }]}>
                <Ionicons name="add" size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.passengerLabel, { color: colors.foreground }]}>بالغ</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.passengerRow}>
            <View style={styles.counter}>
              <TouchableOpacity onPress={() => setChildren(Math.max(0, children - 1))} style={[styles.counterBtn, { borderColor: colors.border }]}>
                <Ionicons name="remove" size={16} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.counterVal, { color: colors.foreground }]}>{children}</Text>
              <TouchableOpacity onPress={() => setChildren(children + 1)} style={[styles.counterBtn, { borderColor: colors.border }]}>
                <Ionicons name="add" size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.passengerLabel, { color: colors.foreground }]}>طفل</Text>
          </View>
        </View>

        {/* Cabin Class */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }]}
          onPress={() => setShowCabin(!showCabin)}
          activeOpacity={0.8}
        >
          <Text style={[styles.label, { color: colors.mutedForeground, marginBottom: 0 }]}>درجة السفر</Text>
          <View style={styles.row}>
            <Ionicons name={showCabin ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
            <Text style={[styles.cabinVal, { color: colors.foreground }]}>
              {CABIN_CLASSES.find(c => c.key === cabinClass)?.label}
            </Text>
          </View>
        </TouchableOpacity>

        {showCabin && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {CABIN_CLASSES.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[styles.cabinOption, cabinClass === c.key && { backgroundColor: colors.accent }]}
                onPress={() => { setCabinClass(c.key); setShowCabin(false); }}
              >
                <Ionicons name={cabinClass === c.key ? 'radio-button-on' : 'radio-button-off'} size={18} color={colors.primary} />
                <Text style={[styles.cabinOptionText, { color: colors.foreground }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Button */}
        <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={handleSearch} activeOpacity={0.85}>
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.searchBtnText}>البحث عن رحلات</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, alignItems: 'flex-end' },
  headerTitle: { fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', color: '#fff' },
  tripToggle: { flexDirection: 'row-reverse', padding: 4, marginBottom: 14 },
  tripBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tripBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 8 },
  input: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontFamily: 'Tajawal_400Regular', fontSize: 15, marginBottom: 4 },
  swapBtn: { alignSelf: 'center', padding: 10, marginVertical: 4 },
  passengerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  passengerLabel: { fontSize: 15, fontFamily: 'Tajawal_500Medium' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  counterVal: { fontSize: 18, fontFamily: 'Tajawal_700Bold', minWidth: 24, textAlign: 'center' },
  divider: { height: 1, marginVertical: 4 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  cabinVal: { fontSize: 15, fontFamily: 'Tajawal_700Bold' },
  cabinOption: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8 },
  cabinOptionText: { fontFamily: 'Tajawal_500Medium', fontSize: 14 },
  searchBtn: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 14, gap: 10, marginTop: 8 },
  searchBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
});
