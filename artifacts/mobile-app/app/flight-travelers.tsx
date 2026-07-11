/**
 * Traveler Details Screen — dynamic form for N passengers.
 * Uses DatePickerField for DOB and passport dates.
 */
import React, { useState } from 'react';
import {
  Alert, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFlightBookingContext } from '@/context/FlightBookingContext';
import DatePickerField from '@/components/DatePickerField';
import type { FlightOffer, PassengerInput } from '@/lib/flightService';

const GOLD = '#C9A060';
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';
const CARD_BG = 'rgba(255,255,255,0.05)';
const INPUT_BG = 'rgba(255,255,255,0.07)';
const ERROR_COLOR = '#EF4444';

const TODAY = new Date().toISOString().slice(0, 10);

// Minimum DOB: 130 years ago
const MIN_DOB = `${new Date().getFullYear() - 130}-01-01`;
// Maximum DOB: today (must be born by today)
const MAX_DOB = TODAY;
// Minimum passport expiry: tomorrow
function minExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
// Max passport expiry: 20 years ahead
const MAX_EXPIRY = `${new Date().getFullYear() + 20}-12-31`;

// Passport issue: 20 years ago to today
const MIN_ISSUE = `${new Date().getFullYear() - 20}-01-01`;

function isFutureDate(d: string): boolean {
  return d > TODAY;
}

const GENDERS = ['ذكر', 'أنثى'];

function emptyPassenger(): PassengerInput {
  return {
    firstName: '', lastName: '', nationality: '', gender: '',
    dob: '', passportNumber: '', passportExpiry: '', passportIssueCountry: '',
  };
}

export default function FlightTravelersScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ offer?: string; adults?: string; children?: string }>();
  const { state, setOffer, setPassengers, setContact } = useFlightBookingContext();

  const offer: FlightOffer | null = params.offer
    ? JSON.parse(params.offer as string)
    : state.offer;

  const adults = Number(params.adults ?? 1);
  const children = Number(params.children ?? 0);
  const totalPassengers = adults + children;

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [passengers, setLocalPassengers] = useState<PassengerInput[]>(() =>
    state.passengers.length === totalPassengers
      ? state.passengers
      : Array.from({ length: totalPassengers }, () => emptyPassenger()),
  );
  const [phone, setPhone] = useState(state.phone);
  const [email, setEmail] = useState(state.email);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updatePassenger(idx: number, key: keyof PassengerInput, val: string) {
    setLocalPassengers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
    const ek = `${idx}.${key}`;
    if (errors[ek]) setErrors(e => { const n = { ...e }; delete n[ek]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const required: (keyof PassengerInput)[] = ['firstName', 'lastName', 'nationality', 'gender', 'dob', 'passportNumber', 'passportExpiry'];
    passengers.forEach((p, i) => {
      required.forEach(k => {
        if (!p[k]?.trim()) errs[`${i}.${k}`] = 'مطلوب';
      });
      if (p.dob && !isFutureDate(p.dob) === false) {
        // dob must be in the past
        if (p.dob >= TODAY) errs[`${i}.dob`] = 'تاريخ الميلاد يجب أن يكون في الماضي';
      }
      if (p.passportExpiry && !isFutureDate(p.passportExpiry)) {
        errs[`${i}.passportExpiry`] = 'جواز السفر منتهي الصلاحية';
      }
    });
    if (!phone.trim()) errs['phone'] = 'مطلوب';
    if (!email.trim()) errs['email'] = 'مطلوب';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinue() {
    if (!validate()) {
      Alert.alert('بيانات ناقصة أو غير صحيحة', 'يرجى مراجعة الحقول المميزة');
      return;
    }
    if (offer) setOffer(offer);
    setPassengers(passengers);
    setContact(phone, email);
    router.push({
      pathname: '/flight-review',
      params: { offer: JSON.stringify(offer), adults: String(adults), children: String(children) },
    } as any);
  }

  if (!offer) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK }}>
        <Text style={{ color: WHITE, fontFamily: 'Tajawal_500Medium' }}>بيانات الرحلة غير متاحة</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: GOLD, fontFamily: 'Tajawal_700Bold' }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>بيانات المسافرين</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 140 : 160 }}
      >
        {passengers.map((pax, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>
              المسافر {i + 1} {i < adults ? '(بالغ)' : '(طفل)'}
            </Text>

            {/* Gender */}
            <Text style={styles.fieldLabel}>الجنس <Text style={{ color: ERROR_COLOR }}>*</Text></Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => {
                const active = pax.gender === g;
                const hasErr = !!errors[`${i}.gender`];
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => updatePassenger(i, 'gender', g)}
                    activeOpacity={0.8}
                    style={[styles.genderBtn, active && styles.genderBtnActive,
                      hasErr && !active && { borderColor: ERROR_COLOR + '80' }]}
                  >
                    <Ionicons name={g === 'ذكر' ? 'male-outline' : 'female-outline'} size={16} color={active ? DARK : MUTED} />
                    <Text style={[styles.genderBtnText, active && { color: DARK }]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors[`${i}.gender`] && <Text style={styles.errorText}>{errors[`${i}.gender`]}</Text>}

            {/* First name */}
            <Text style={styles.fieldLabel}>الاسم الأول <Text style={{ color: ERROR_COLOR }}>*</Text></Text>
            <TextInput
              style={[styles.input, errors[`${i}.firstName`] && styles.inputError]}
              placeholder="كما في جواز السفر" placeholderTextColor={MUTED}
              value={pax.firstName} onChangeText={v => updatePassenger(i, 'firstName', v)}
              textAlign="right" selectionColor={GOLD}
            />
            {errors[`${i}.firstName`] && <Text style={styles.errorText}>{errors[`${i}.firstName`]}</Text>}

            {/* Last name */}
            <Text style={styles.fieldLabel}>اسم العائلة <Text style={{ color: ERROR_COLOR }}>*</Text></Text>
            <TextInput
              style={[styles.input, errors[`${i}.lastName`] && styles.inputError]}
              placeholder="كما في جواز السفر" placeholderTextColor={MUTED}
              value={pax.lastName} onChangeText={v => updatePassenger(i, 'lastName', v)}
              textAlign="right" selectionColor={GOLD}
            />
            {errors[`${i}.lastName`] && <Text style={styles.errorText}>{errors[`${i}.lastName`]}</Text>}

            {/* Nationality */}
            <Text style={styles.fieldLabel}>الجنسية <Text style={{ color: ERROR_COLOR }}>*</Text></Text>
            <TextInput
              style={[styles.input, errors[`${i}.nationality`] && styles.inputError]}
              placeholder="مثال: عراقي" placeholderTextColor={MUTED}
              value={pax.nationality} onChangeText={v => updatePassenger(i, 'nationality', v)}
              textAlign="right" selectionColor={GOLD}
            />
            {errors[`${i}.nationality`] && <Text style={styles.errorText}>{errors[`${i}.nationality`]}</Text>}

            {/* DOB — date picker */}
            <DatePickerField
              label="تاريخ الميلاد"
              value={pax.dob}
              onChange={v => updatePassenger(i, 'dob', v)}
              maxDate={MAX_DOB}
              minDate={MIN_DOB}
              required
              hasError={!!errors[`${i}.dob`]}
              errorText={errors[`${i}.dob`]}
            />

            {/* Passport number */}
            <Text style={styles.fieldLabel}>رقم جواز السفر <Text style={{ color: ERROR_COLOR }}>*</Text></Text>
            <TextInput
              style={[styles.input, errors[`${i}.passportNumber`] && styles.inputError]}
              placeholder="A12345678" placeholderTextColor={MUTED}
              value={pax.passportNumber} onChangeText={v => updatePassenger(i, 'passportNumber', v)}
              autoCapitalize="characters" textAlign="right" selectionColor={GOLD}
            />
            {errors[`${i}.passportNumber`] && <Text style={styles.errorText}>{errors[`${i}.passportNumber`]}</Text>}

            {/* Passport expiry — date picker */}
            <DatePickerField
              label="تاريخ انتهاء الجواز"
              value={pax.passportExpiry}
              onChange={v => updatePassenger(i, 'passportExpiry', v)}
              minDate={minExpiry()}
              maxDate={MAX_EXPIRY}
              required
              hasError={!!errors[`${i}.passportExpiry`]}
              errorText={errors[`${i}.passportExpiry`]}
            />

            {/* Passport issue country (optional) */}
            <Text style={styles.fieldLabel}>دولة الإصدار (اختياري)</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: العراق" placeholderTextColor={MUTED}
              value={pax.passportIssueCountry ?? ''} onChangeText={v => updatePassenger(i, 'passportIssueCountry', v)}
              textAlign="right" selectionColor={GOLD}
            />
          </View>
        ))}

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>بيانات التواصل</Text>
          <Text style={styles.fieldLabel}>رقم الهاتف <Text style={{ color: ERROR_COLOR }}>*</Text></Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="+964 7XX XXXX" placeholderTextColor={MUTED}
            value={phone}
            onChangeText={v => { setPhone(v); if (errors.phone) setErrors(e => { const n = { ...e }; delete n.phone; return n; }); }}
            keyboardType="phone-pad" textAlign="right" selectionColor={GOLD}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          <Text style={styles.fieldLabel}>البريد الإلكتروني <Text style={{ color: ERROR_COLOR }}>*</Text></Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="example@email.com" placeholderTextColor={MUTED}
            value={email}
            onChangeText={v => { setEmail(v); if (errors.email) setErrors(e => { const n = { ...e }; delete n.email; return n; }); }}
            keyboardType="email-address" autoCapitalize="none" textAlign="right" selectionColor={GOLD}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleContinue} activeOpacity={0.88}>
          <Ionicons name="chevron-back" size={20} color={DARK} />
          <Text style={styles.ctaText}>مراجعة وتأكيد</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DARK },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 16, backgroundColor: DARK2,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTitle: { flex: 1, color: WHITE, fontSize: 17, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },

  card: {
    backgroundColor: DARK2, borderRadius: 18, borderWidth: 1,
    borderColor: BORDER, padding: 18, marginBottom: 12,
  },
  cardTitle: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 15, textAlign: 'right', marginBottom: 14 },

  fieldLabel: { color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 13, textAlign: 'right', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 14,
  },
  inputError: { borderColor: ERROR_COLOR + '80' },
  errorText: { color: ERROR_COLOR, fontFamily: 'Tajawal_400Regular', fontSize: 11, textAlign: 'right', marginTop: 3 },

  genderRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 4 },
  genderBtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: INPUT_BG,
  },
  genderBtnActive: { backgroundColor: GOLD, borderColor: GOLD },
  genderBtnText: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: DARK2, borderTopWidth: 1, borderTopColor: BORDER, padding: 16,
  },
  ctaBtn: {
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: GOLD, paddingVertical: 17, borderRadius: 16,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 17 },
});
