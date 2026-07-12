/**
 * Booking Review Screen — final summary before submission.
 * Shows offer, seats, passengers, contact — with edit affordances back
 * to each step. Submits via the flightService booking hook.
 */
import React, { useState } from 'react';
import {
  Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFlightBookingContext } from '@/context/FlightBookingContext';
import { useFlightBooking, formatTime, formatDuration, formatDateAr, CABIN_LABELS_AR } from '@/lib/flightService';
import { useGetHoldSettings, useCreateHoldBooking } from '@workspace/api-client-react';
import { codeToEnglishName } from '@/lib/countriesEn';
import type { FlightOffer } from '@/lib/flightService';
import { useColors } from '@/hooks/useColors';

const GOLD = '#C9A060';
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';

export default function FlightReviewScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const params = useLocalSearchParams<{ offer?: string; adults?: string; children?: string }>();
  const { state, reset } = useFlightBookingContext();
  const bookingMutation = useFlightBooking();
  const holdMutation = useCreateHoldBooking();
  const { data: holdSettings } = useGetHoldSettings();
  const [submitting, setSubmitting] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdSubmitting, setHoldSubmitting] = useState(false);

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
        params: {
          referenceNumber: result.referenceNumber,
          bookingReference: result.bookingReference ?? '',
          airline: offer.airlineName,
          fromAirport: offer.fromAirport,
          toAirport: offer.toAirport,
          departDate: String(offer.departTime).slice(0, 10),
          bookingId: String(result.id),
          total: String(total),
          currency: offer.currency,
        },
      } as any);
    } catch (e: any) {
      // Extract the real error message from the API response shape
      const rawMsg: string =
        e?.data?.error ??
        e?.response?.data?.error ??
        e?.message ??
        'حدث خطأ غير متوقع';

      // Check whether the offer expired / is no longer available
      const isExpired =
        e?.status === 409 ||
        /انتهت صلاحية|expire|no longer|not available|unavailable|sold out|another offer/i.test(rawMsg);

      if (isExpired) {
        Alert.alert(
          '❌ انتهت صلاحية الرحلة',
          'انتهت صلاحية عرض هذه الرحلة أو لم تعد متاحة. يرجى إعادة البحث واختيار رحلة جديدة.',
          [
            {
              text: 'إعادة البحث',
              onPress: () => {
                reset();
                router.replace('/(tabs)/flights' as any);
              },
              style: 'default',
            },
            { text: 'إلغاء', style: 'cancel' },
          ],
        );
      } else {
        Alert.alert(
          'تعذر إتمام الحجز',
          rawMsg,
          [{ text: 'حسناً' }],
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHoldConfirm() {
    if (!offer) return;
    setHoldSubmitting(true);
    try {
      const result = await holdMutation.mutateAsync({
        data: {
          offer,
          phone: state.phone,
          email: state.email,
          passengers: state.passengers,
        },
      });
      reset();
      setShowHoldModal(false);
      // fromBooking=1 hides the back button so the user can't return to
      // the review screen and accidentally place a duplicate hold.
      router.replace(`/e-ticket/${result.id}?fromBooking=1` as any);
    } catch (e: any) {
      const rawMsg = e?.data?.error ?? e?.message ?? 'حدث خطأ غير متوقع';
      Alert.alert('تعذر إنشاء الحجز المؤقت', rawMsg, [{ text: 'حسناً' }]);
    } finally {
      setHoldSubmitting(false);
    }
  }

  function edit(pathname: string) {
    router.push({ pathname, params: { offer: JSON.stringify(offer), adults: String(adults), children: String(children) } } as any);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>مراجعة الحجز</Text>
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
              <Text style={styles.sub}>
                جواز {p.passportNumber} • {codeToEnglishName(p.nationality)}
              </Text>
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

        {/* Offer validity notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="time-outline" size={16} color={GOLD} />
          <Text style={styles.noticeText}>
            تنبيه: تكون أسعار الطيران متاحة لفترة محدودة، يُنصح بإتمام الحجز فور الاطلاع عليها لضمان توفر المقعد.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        {/* Confirm & Pay */}
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

        {/* Hold booking — shown only when feature is enabled */}
        {holdSettings?.holdEnabled !== false && (
          <TouchableOpacity
            style={styles.holdBtn}
            onPress={() => setShowHoldModal(true)}
            activeOpacity={0.85}
            disabled={submitting}
          >
            <Ionicons name="time-outline" size={18} color="#8B5CF6" />
            <Text style={styles.holdBtnText}>
              حجز مؤقت لمدة {holdSettings?.holdDurationHours ?? 24} ساعة
              {holdSettings?.holdFeeAmount ? ` — ${holdSettings.holdFeeAmount} ${offer.currency}` : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hold Booking Modal */}
      <Modal
        visible={showHoldModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHoldModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Ionicons name="time" size={24} color="#8B5CF6" />
              <Text style={styles.modalTitle}>تأكيد الحجز المؤقت</Text>
            </View>

            <Text style={styles.modalBody}>
              سيتم حجز هذه الرحلة بشكل مؤقت لمدة {holdSettings?.holdDurationHours ?? 24} ساعة،
              خلالها يمكنك إتمام الدفع الكامل وتأكيد التذكرة.
            </Text>

            <View style={styles.modalRow}>
              <Text style={styles.modalValue}>{offer.fromAirport} → {offer.toAirport}</Text>
              <Text style={styles.modalLabel}>الرحلة</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalValue}>{offer.airlineName}</Text>
              <Text style={styles.modalLabel}>شركة الطيران</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={[styles.modalValue, { color: '#10B981' }]}>
                {holdSettings?.holdFeeAmount ?? 25} {offer.currency}
              </Text>
              <Text style={styles.modalLabel}>رسوم الحجز المؤقت (غير مستردة)</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalValue}>{total.toFixed(0)} {offer.currency}</Text>
              <Text style={styles.modalLabel}>المبلغ الكامل للتذكرة</Text>
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 }} />

            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, holdSubmitting && { opacity: 0.6 }]}
                onPress={handleHoldConfirm}
                disabled={holdSubmitting}
                activeOpacity={0.85}
              >
                {holdSubmitting
                  ? <ActivityIndicator color={WHITE} size="small" />
                  : <Text style={styles.modalConfirmText}>دفع رسوم الحجز المؤقت</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowHoldModal(false)}
                disabled={holdSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  noticeCard: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(201,160,96,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(201,160,96,0.2)',
    padding: 12, marginBottom: 12,
  },
  noticeText: {
    flex: 1, color: 'rgba(201,160,96,0.85)', fontFamily: 'Tajawal_400Regular',
    fontSize: 11, textAlign: 'right', lineHeight: 18,
  },

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

  holdBtn: {
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#8B5CF6', borderRadius: 16, paddingVertical: 14, marginTop: 10,
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  holdBtnText: { color: '#8B5CF6', fontFamily: 'Tajawal_700Bold', fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center',
    alignItems: 'center', padding: 20,
  },
  modalCard: {
    backgroundColor: '#0F1E36', borderRadius: 24, padding: 24, width: '100%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 16,
  },
  modalTitle: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 18, flex: 1, textAlign: 'right' },
  modalBody: {
    color: 'rgba(255,255,255,0.6)', fontFamily: 'Tajawal_400Regular', fontSize: 13,
    textAlign: 'right', lineHeight: 20, marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  modalLabel: { color: 'rgba(255,255,255,0.45)', fontFamily: 'Tajawal_400Regular', fontSize: 12 },
  modalValue: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  modalConfirmBtn: {
    flex: 1, backgroundColor: '#8B5CF6', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  modalConfirmText: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 14 },
  modalCancelBtn: {
    paddingHorizontal: 20, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  modalCancelText: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal_700Bold', fontSize: 14 },
});
