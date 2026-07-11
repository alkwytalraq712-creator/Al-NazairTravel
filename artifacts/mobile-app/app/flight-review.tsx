/**
 * Booking Review Screen — final summary before submission.
 * Shows offer, seats, passengers, contact — with edit affordances back
 * to each step. Submits via the flightService booking hook.
 */
import React, { useState } from 'react';
import {
  Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFlightBookingContext } from '@/context/FlightBookingContext';
import { useFlightBooking, formatTime, formatDuration, formatDateAr, CABIN_LABELS_AR } from '@/lib/flightService';
import type { FlightOffer } from '@/lib/flightService';

const GOLD = '#C9A060';
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';

export default function FlightReviewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ offer?: string; adults?: string; children?: string }>();
  const { state, reset } = useFlightBookingContext();
  const bookingMutation = useFlightBooking();
  const [submitting, setSubmitting] = useState(false);

  const offer: FlightOffer | null = params.offer ? JSON.parse(params.offer as string) : state.offer;
  const adults = Number(params.adults ?? 1);
  const children = Number(params.children ?? 0);
  const totalPassengers = adults + children;

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  if (!offer || state.passengers.length !== totalPassengers) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK, gap: 12 }}>
        <Text style={{ color: WHITE, fontFamily: 'Tajawal_500Medium' }}>بيانات الحجز غير مكتملة</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: GOLD, fontFamily: 'Tajawal_700Bold' }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const total = offer.price * totalPassengers;

  async function handleConfirm() {
    if (!offer) return;
    setSubmitting(true);
    try {
      const result = await bookingMutation.mutateAsync({
        data: {
          offer,
          phone: state.phone,
          email: state.email,
          passengers: state.passengers,
        },
      });
      reset();
      router.replace({
        pathname: '/flight-success',
        params: { referenceNumber: result.referenceNumber, total: String(total), currency: offer.currency },
      } as any);
    } catch (e: any) {
      Alert.alert('تعذر إتمام الحجز', e?.message ?? 'حدث خطأ غير متوقع، يرجى المحاولة مجدداً');
    } finally {
      setSubmitting(false);
    }
  }

  function edit(pathname: string) {
    router.push({ pathname, params: { offer: JSON.stringify(offer), adults: String(adults), children: String(children) } } as any);
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مراجعة الحجز</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 140 : 160 }}>
        {/* Flight summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TouchableOpacity onPress={() => edit('/flight-details')} activeOpacity={0.7}>
              <Text style={styles.editText}>تعديل</Text>
            </TouchableOpacity>
            <Text style={styles.cardTitle}>الرحلة</Text>
          </View>
          <View style={styles.airlineRow}>
            <Image source={{ uri: offer.airlineLogoUrl }} style={styles.logo} contentFit="contain" />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.airlineName}>{offer.airlineName}</Text>
              <Text style={styles.sub}>{offer.flightNumber} • {CABIN_LABELS_AR[offer.cabinClass] ?? offer.cabinClass}</Text>
            </View>
          </View>
          <View style={styles.routeRow}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.routeCode}>{offer.toAirport}</Text>
              <Text style={styles.sub}>{formatTime(offer.arriveTime)}</Text>
            </View>
            <Text style={styles.sub}>{formatDuration(offer.durationMinutes)}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.routeCode}>{offer.fromAirport}</Text>
              <Text style={styles.sub}>{formatTime(offer.departTime)}</Text>
            </View>
          </View>
          <Text style={styles.sub}>{formatDateAr(offer.departTime.slice(0, 10))}</Text>
        </View>

        {/* Seats */}
        {state.seatSelections.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TouchableOpacity onPress={() => edit('/flight-seats')} activeOpacity={0.7}>
                <Text style={styles.editText}>تعديل</Text>
              </TouchableOpacity>
              <Text style={styles.cardTitle}>المقاعد</Text>
            </View>
            {state.seatSelections.map(s => (
              <Text key={s.seat} style={[styles.sub, { textAlign: 'right', marginTop: 4 }]}>
                مسافر {s.passengerId + 1}: مقعد {s.seat}
              </Text>
            ))}
          </View>
        )}

        {/* Passengers */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TouchableOpacity onPress={() => edit('/flight-travelers')} activeOpacity={0.7}>
              <Text style={styles.editText}>تعديل</Text>
            </TouchableOpacity>
            <Text style={styles.cardTitle}>المسافرون</Text>
          </View>
          {state.passengers.map((p, i) => (
            <View key={i} style={i > 0 ? { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER } : undefined}>
              <Text style={styles.paxName}>{p.firstName} {p.lastName}</Text>
              <Text style={styles.sub}>جواز {p.passportNumber} • {p.nationality}</Text>
            </View>
          ))}
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER }}>
            <Text style={styles.sub}>{state.phone}</Text>
            <Text style={styles.sub}>{state.email}</Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ملخص السعر</Text>
          <View style={styles.priceRow}>
            <Text style={styles.sub}>{offer.currency} {offer.price} × {totalPassengers} مسافر</Text>
          </View>
          <View style={[styles.priceRow, { marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER }]}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalValue}>{offer.currency} {total.toFixed(0)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleConfirm} activeOpacity={0.88} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={DARK} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={DARK} />
              <Text style={styles.ctaText}>تأكيد الحجز والدفع — {offer.currency} {total.toFixed(0)}</Text>
            </>
          )}
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
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 15, textAlign: 'right' },
  editText: { color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 13 },

  airlineRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 12 },
  logo: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  airlineName: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' },
  sub: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right' },

  routeRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  routeCode: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 18 },

  paxName: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' },

  priceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 15 },
  totalValue: { color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 20 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: DARK2, borderTopWidth: 1, borderTopColor: BORDER, padding: 16,
  },
  ctaBtn: {
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: GOLD, paddingVertical: 17, borderRadius: 16, minHeight: 56,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
});
