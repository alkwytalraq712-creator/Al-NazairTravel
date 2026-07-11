/**
 * Flight Details Screen — full itinerary breakdown for a selected offer.
 * CTA: "اختيار المقاعد" → flight-seats
 */
import React from 'react';
import {
  Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useFlightBookingContext } from '@/context/FlightBookingContext';
import { formatTime, formatDuration, formatDateAr, CABIN_LABELS_AR } from '@/lib/flightService';
import type { FlightOffer } from '@/lib/flightService';

const GOLD = '#C9A060';
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';
const GOLD_BG = 'rgba(201,160,96,0.15)';

const BAGGAGE_POLICY: Record<string, string> = {
  economy: 'حقيبة مقصورة 7 كغ + حقيبة مسجّلة 23 كغ',
  premium_economy: 'حقيبة مقصورة 10 كغ + حقيبتان مسجّلتان 23 كغ',
  business: 'حقيبة مقصورة 14 كغ + حقيبتان مسجّلتان 32 كغ',
  first: 'حقيبة مقصورة 18 كغ + ثلاث حقائب مسجّلة 32 كغ',
};

export default function FlightDetailsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const params = useLocalSearchParams<{ offer?: string; adults?: string; children?: string }>();
  const { state, setOffer } = useFlightBookingContext();

  const offer: FlightOffer | null = params.offer
    ? JSON.parse(params.offer as string)
    : state.offer;

  const adults = Number(params.adults ?? 1);
  const children = Number(params.children ?? 0);
  const totalPassengers = adults + children;

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  if (!offer) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }, { backgroundColor: DARK }]}>
        <Text style={{ color: WHITE, fontFamily: 'Tajawal_500Medium' }}>بيانات الرحلة غير متاحة</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: GOLD, fontFamily: 'Tajawal_700Bold' }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleContinue() {
    if (offer) setOffer(offer);
    router.push({ pathname: '/flight-seats', params: { offer: JSON.stringify(offer), adults: String(adults), children: String(children) } } as any);
  }

  const departDate = offer.departTime.slice(0, 10);
  const arriveDate = offer.arriveTime.slice(0, 10);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الرحلة</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 120 : 140 }}
      >
        {/* Airline card */}
        <View style={styles.card}>
          <View style={styles.airlineRow}>
            <Image source={{ uri: offer.airlineLogoUrl }} style={styles.logo} contentFit="contain" />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.airlineName}>{offer.airlineName}</Text>
              <Text style={styles.flightNum}>{offer.flightNumber}</Text>
            </View>
            <View style={[styles.cabinBadge]}>
              <Text style={styles.cabinBadgeText}>{CABIN_LABELS_AR[offer.cabinClass] ?? offer.cabinClass}</Text>
            </View>
          </View>
        </View>

        {/* Route + timing */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>مسار الرحلة</Text>

          <View style={styles.routeRow}>
            {/* Arrival (right side in RTL = destination, shown left visually) */}
            <View style={styles.routeAirport}>
              <Text style={styles.routeCode}>{offer.toAirport}</Text>
              <Text style={styles.routeTime}>{formatTime(offer.arriveTime)}</Text>
              <Text style={styles.routeDate}>{formatDateAr(arriveDate)}</Text>
            </View>

            {/* Center timeline */}
            <View style={styles.routeMiddle}>
              <View style={[styles.routeLine, { backgroundColor: GOLD + '44' }]} />
              <View style={styles.planeIconWrap}>
                <Ionicons name="airplane" size={18} color={GOLD} style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
              <View style={[styles.routeLine, { backgroundColor: GOLD + '44' }]} />
              <Text style={styles.routeDuration}>{formatDuration(offer.durationMinutes)}</Text>
              {offer.stops > 0 ? (
                <Text style={styles.routeStops}>{offer.stops} توقف</Text>
              ) : (
                <Text style={[styles.routeStops, { color: '#10B981' }]}>مباشر</Text>
              )}
            </View>

            {/* Departure (left side in RTL) */}
            <View style={styles.routeAirport}>
              <Text style={styles.routeCode}>{offer.fromAirport}</Text>
              <Text style={styles.routeTime}>{formatTime(offer.departTime)}</Text>
              <Text style={styles.routeDate}>{formatDateAr(departDate)}</Text>
            </View>
          </View>
        </View>

        {/* Segments (simulated since no real GDS) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>تفاصيل المقاطع</Text>
          <View style={styles.segmentRow}>
            <View style={styles.segmentDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.segLabel}>{offer.fromAirport} ← {offer.toAirport}</Text>
              <Text style={styles.segSub}>{formatTime(offer.departTime)} — {formatTime(offer.arriveTime)} ({formatDuration(offer.durationMinutes)})</Text>
              <Text style={styles.segSub}>{offer.airlineName} • {offer.flightNumber}</Text>
            </View>
          </View>
          {offer.stops > 0 && (
            <View style={[styles.segmentRow, { marginTop: 8 }]}>
              <View style={[styles.segmentDot, { backgroundColor: GOLD + '66' }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.segLabel, { color: MUTED }]}>توقف ({offer.stops === 1 ? 'توقف واحد' : `${offer.stops} توقفات`})</Text>
                <Text style={styles.segSub}>مدة التوقف حوالي ساعتين</Text>
              </View>
            </View>
          )}
        </View>

        {/* Baggage */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>سياسة الأمتعة</Text>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={18} color={GOLD} />
            <Text style={styles.infoText}>{BAGGAGE_POLICY[offer.cabinClass] ?? BAGGAGE_POLICY.economy}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <Ionicons name="information-circle-outline" size={18} color={MUTED} />
            <Text style={[styles.infoText, { color: MUTED }]}>الرسوم الإضافية لكل كغ زائد تطبّق عند المطار</Text>
          </View>
        </View>

        {/* Price summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ملخص السعر</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceTotal}>{offer.currency} {(offer.price * totalPassengers).toFixed(0)}</Text>
            <Text style={styles.priceSub}>إجمالي لـ {totalPassengers} مسافر</Text>
          </View>
          <Text style={[styles.priceSub, { textAlign: 'right', marginTop: 4 }]}>
            {offer.currency} {offer.price} × {totalPassengers} مسافر
          </Text>
        </View>
      </ScrollView>

      {/* CTA Footer */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleContinue} activeOpacity={0.88}>
          <Ionicons name="chevron-back" size={20} color={DARK} />
          <Text style={styles.ctaText}>اختيار المقاعد</Text>
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
  sectionTitle: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 15, textAlign: 'right', marginBottom: 14 },

  airlineRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)' },
  airlineName: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 16, textAlign: 'right' },
  flightNum: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right' },
  cabinBadge: { backgroundColor: GOLD_BG, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: GOLD + '30' },
  cabinBadgeText: { color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 11 },

  routeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  routeAirport: { flex: 1, alignItems: 'flex-end' },
  routeCode: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 28 },
  routeTime: { color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 15, marginTop: 2 },
  routeDate: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 11, marginTop: 2, textAlign: 'right' },
  routeMiddle: { flex: 1.2, alignItems: 'center', gap: 4 },
  routeLine: { flex: 1, height: 1, width: '80%' },
  planeIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: GOLD_BG, alignItems: 'center', justifyContent: 'center' },
  routeDuration: { color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 11, marginTop: 4 },
  routeStops: { color: '#F59E0B', fontFamily: 'Tajawal_500Medium', fontSize: 11 },

  segmentRow: { flexDirection: 'row-reverse', gap: 12, alignItems: 'flex-start' },
  segmentDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD, marginTop: 4 },
  segLabel: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 13, textAlign: 'right' },
  segSub: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right', marginTop: 2 },

  infoRow: { flexDirection: 'row-reverse', gap: 10, alignItems: 'flex-start' },
  infoText: { flex: 1, color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 13, textAlign: 'right' },

  priceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  priceTotal: { color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 24 },
  priceSub: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12 },

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
