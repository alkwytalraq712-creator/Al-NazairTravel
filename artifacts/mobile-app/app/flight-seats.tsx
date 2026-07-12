/**
 * Seat Selection Screen — deterministic seat map per offer+cabin.
 * One seat per passenger. Selected seats stored in FlightBookingContext.
 */
import React, { useState, useMemo } from 'react';
import {
  Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useFlightBookingContext } from '@/context/FlightBookingContext';
import { generateSeatMap } from '@/lib/flightService';
import type { FlightOffer, SeatSelection, SeatMapSeat } from '@/lib/flightService';

const GOLD = '#C9A060';
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';

const SEAT_COLORS = {
  available: 'rgba(255,255,255,0.10)',
  occupied: 'rgba(255,255,255,0.04)',
  premium: 'rgba(201,160,96,0.20)',
  selected: GOLD,
};
const SEAT_BORDER = {
  available: 'rgba(255,255,255,0.20)',
  occupied: 'rgba(255,255,255,0.08)',
  premium: 'rgba(201,160,96,0.50)',
  selected: GOLD,
};

const AISLE_AFTER: Record<string, string[]> = {
  economy: ['C'],          // 3-3 with aisle between C and D
  premium_economy: ['C'],
  business: ['C'],         // 2-2 with aisle between C and D
  first: ['A', 'C'],       // 1-2-1
};

export default function FlightSeatsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ offer?: string; adults?: string; children?: string }>();
  const { state, setOffer, setSeatSelections } = useFlightBookingContext();

  const offer: FlightOffer | null = params.offer
    ? JSON.parse(params.offer as string)
    : state.offer;

  const adults = Number(params.adults ?? 1);
  const children = Number(params.children ?? 0);
  const totalPassengers = adults + children;

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  // Current passenger index being seated (0-indexed)
  const colors = useColors();
  const [currentPax, setCurrentPax] = useState(0);
  // selections: passengerId → seat string
  const [selections, setSelections] = useState<Record<number, SeatMapSeat>>({});

  const seatMap = useMemo(() => {
    if (!offer) return [];
    return generateSeatMap(offer.id, offer.cabinClass);
  }, [offer]);

  const aisleAfter = AISLE_AFTER[offer?.cabinClass ?? 'economy'] ?? ['C'];

  function handleSeatPress(seat: SeatMapSeat) {
    if (seat.status === 'occupied') return;
    // Remove from any other passenger if already selected
    const newSel = { ...selections };
    // If already selected by someone else, deselect them
    for (const [pid, s] of Object.entries(newSel)) {
      if (s.id === seat.id) delete newSel[Number(pid)];
    }
    // Assign to current passenger
    newSel[currentPax] = seat;
    setSelections(newSel);
    // Auto-advance to next unassigned passenger
    const nextUnassigned = Array.from({ length: totalPassengers }, (_, i) => i)
      .find(i => i !== currentPax && !newSel[i]);
    if (nextUnassigned !== undefined) setCurrentPax(nextUnassigned);
  }

  function getSeatStatus(seat: SeatMapSeat): SeatMapSeat['status'] | 'selected' {
    for (const s of Object.values(selections)) {
      if (s.id === seat.id) return 'selected';
    }
    return seat.status;
  }

  function handleContinue() {
    if (!offer) return;
    setOffer(offer);
    const seatSels: SeatSelection[] = Object.entries(selections).map(([pid, s]) => ({
      passengerId: Number(pid),
      seat: s.id,
      row: s.row,
      col: s.col,
    }));
    setSeatSelections(seatSels);
    router.push({
      pathname: '/flight-travelers',
      params: { offer: JSON.stringify(offer), adults: String(adults), children: String(children) },
    } as any);
  }

  const allSeated = Object.keys(selections).length >= totalPassengers;

  if (!offer) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, { backgroundColor: DARK }]}>
        <Text style={{ color: WHITE, fontFamily: 'Tajawal_500Medium' }}>بيانات الرحلة غير متاحة</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: GOLD, fontFamily: 'Tajawal_700Bold' }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>اختيار المقاعد</Text>
      </View>

      {/* Passenger switcher */}
      <View style={styles.paxRow}>
        {Array.from({ length: totalPassengers }, (_, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.paxBtn, currentPax === i && styles.paxBtnActive,
              selections[i] && !Object.is(currentPax, i) && styles.paxBtnDone]}
            onPress={() => setCurrentPax(i)}
            activeOpacity={0.8}
          >
            <Text style={[styles.paxBtnText, currentPax === i && { color: DARK }]}>
              {selections[i] ? `مقعد ${selections[i].id}` : `مسافر ${i + 1}`}
            </Text>
            {selections[i] && <Ionicons name="checkmark-circle" size={14} color={currentPax === i ? DARK : '#10B981'} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {([
          ['available', 'متاح'],
          ['premium', 'مميز'],
          ['occupied', 'محجوز'],
          ['selected', 'مختار'],
        ] as const).map(([st, label]) => (
          <View key={st} style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: SEAT_COLORS[st], borderColor: SEAT_BORDER[st] }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140, paddingTop: 8 }}>
        {/* Plane front indicator */}
        <View style={styles.planeNose}>
          <Ionicons name="airplane" size={22} color={GOLD} />
          <Text style={styles.planeNoseText}>مقدمة الطائرة</Text>
        </View>

        {seatMap.map(row => (
          <View key={row.row}>
            {row.isExit && (
              <View style={styles.exitRow}>
                <Ionicons name="warning-outline" size={13} color={GOLD} />
                <Text style={styles.exitText}>مخرج طوارئ</Text>
              </View>
            )}
            <View style={styles.seatRow}>
              {/* Row number (RTL: right side) */}
              <Text style={styles.rowNum}>{row.row}</Text>
              {row.seats.map((seat, si) => {
                const status = getSeatStatus(seat);
                const isAisle = aisleAfter.includes(seat.col);
                return (
                  <React.Fragment key={seat.id}>
                    <TouchableOpacity
                      style={[
                        styles.seat,
                        { backgroundColor: SEAT_COLORS[status], borderColor: SEAT_BORDER[status] },
                      ]}
                      onPress={() => handleSeatPress(seat)}
                      disabled={seat.status === 'occupied'}
                      activeOpacity={0.75}
                    >
                      <Text style={[
                        styles.seatLabel,
                        status === 'selected' && { color: DARK, fontFamily: 'Tajawal_800ExtraBold' },
                        seat.status === 'occupied' && { color: 'rgba(255,255,255,0.2)' },
                      ]}>
                        {status === 'selected' ? '✓' : seat.col}
                      </Text>
                    </TouchableOpacity>
                    {isAisle && <View style={styles.aisle} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerSummaryText}>
            {Object.keys(selections).length} / {totalPassengers} مقاعد مختارة
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.ctaBtn, !allSeated && styles.ctaBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.88}
          disabled={!allSeated}
        >
          <Ionicons name="chevron-back" size={20} color={DARK} />
          <Text style={styles.ctaText}>بيانات المسافرين</Text>
        </TouchableOpacity>
        {!allSeated && (
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.8} style={styles.skipBtn}>
            <Text style={styles.skipText}>تخطي اختيار المقاعد</Text>
          </TouchableOpacity>
        )}
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

  paxRow: { flexDirection: 'row-reverse', gap: 8, padding: 12, paddingHorizontal: 14 },
  paxBtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: BORDER,
  },
  paxBtnActive: { backgroundColor: GOLD, borderColor: GOLD },
  paxBtnDone: { borderColor: '#10B98144' },
  paxBtnText: { color: WHITE, fontFamily: 'Tajawal_500Medium', fontSize: 12 },

  legend: { flexDirection: 'row-reverse', gap: 12, paddingHorizontal: 14, paddingBottom: 8, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  legendBox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5 },
  legendText: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 11 },

  planeNose: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  planeNoseText: { color: GOLD, fontFamily: 'Tajawal_500Medium', fontSize: 12 },

  exitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6 },
  exitText: { color: GOLD, fontFamily: 'Tajawal_500Medium', fontSize: 11 },

  seatRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 3, gap: 4 },
  rowNum: { width: 24, textAlign: 'center', color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 10 },
  seat: { width: 34, height: 34, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  seatLabel: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Tajawal_500Medium', fontSize: 11 },
  aisle: { width: 16 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: DARK2, borderTopWidth: 1, borderTopColor: BORDER, padding: 16, gap: 8,
  },
  footerSummary: { alignItems: 'center' },
  footerSummaryText: { color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 13 },
  ctaBtn: {
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: GOLD, paddingVertical: 16, borderRadius: 16,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  skipBtn: { alignItems: 'center', paddingVertical: 4 },
  skipText: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 13 },
});
