/**
 * My Flights Screen — lists all user flight bookings as rich cards.
 * Tap a card to view the e-ticket.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useListMyFlightBookings } from '@workspace/api-client-react';
import type { FlightBooking } from '@workspace/api-client-react';
import { formatDateAr, formatTime, formatDuration, CABIN_LABELS_AR } from '@/lib/flightService';
import { useColors } from '@/hooks/useColors';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  ticketed: 'صدرت التذكرة',
  cancelled: 'ملغى',
  completed: 'مكتمل',
  held: 'حجز مؤقت ⏳',
  expired_hold: 'انتهى الحجز المؤقت',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  ticketed: '#10B981',
  cancelled: '#EF4444',
  completed: '#6B7280',
  held: '#8B5CF6',
  expired_hold: '#F97316',
};

function HoldCountdown({ expiresAt }: { expiresAt?: string | null }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!expiresAt) return;
    function update() {
      const diff = new Date(expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setLabel('انتهت المدة'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setLabel(`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  if (!expiresAt) return null;
  const isExpired = new Date(expiresAt).getTime() < Date.now();
  const isWarning = !isExpired && new Date(expiresAt).getTime() - Date.now() < 2 * 3_600_000;
  const bg = isExpired ? 'rgba(239,68,68,0.1)' : isWarning ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)';
  const border = isExpired ? 'rgba(239,68,68,0.3)' : isWarning ? 'rgba(245,158,11,0.3)' : 'rgba(139,92,246,0.3)';
  const textColor = isExpired ? '#EF4444' : isWarning ? '#F59E0B' : '#8B5CF6';
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 8, padding: 8, borderRadius: 10, backgroundColor: bg, borderWidth: 1, borderColor: border }}>
      <Text style={{ color: textColor, fontFamily: 'Tajawal_400Regular', fontSize: 11 }}>الوقت المتبقي للدفع الكامل:</Text>
      <Text style={{ color: textColor, fontFamily: 'Tajawal_800ExtraBold', fontSize: 13, fontVariant: ['tabular-nums'] }}>{label}</Text>
    </View>
  );
}

function BookingCard({ booking }: { booking: FlightBooking }) {
  const colors = useColors();
  const offer = booking.offer;
  const color = STATUS_COLORS[booking.status] ?? colors.mutedForeground;
  const label = STATUS_LABELS[booking.status] ?? booking.status;

  const departStr = typeof offer.departTime === 'string'
    ? offer.departTime
    : (offer.departTime as any)?.toISOString?.() ?? '';
  const arriveStr = typeof offer.arriveTime === 'string'
    ? offer.arriveTime
    : (offer.arriveTime as any)?.toISOString?.() ?? '';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/e-ticket/${booking.id}` as any)}
      activeOpacity={0.85}
    >
      {/* Airline row */}
      <View style={styles.airlineRow}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1 }}>
          {offer.airlineLogoUrl ? (
            <Image source={{ uri: offer.airlineLogoUrl }} style={styles.logo} contentFit="contain" />
          ) : (
            <View style={[styles.logo, { backgroundColor: colors.muted, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="airplane" size={18} color={colors.primary} />
            </View>
          )}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' }}>{offer.airlineName}</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right' }}>{offer.flightNumber} • {CABIN_LABELS_AR[offer.cabinClass] ?? offer.cabinClass}</Text>
          </View>
        </View>
        {/* Status badge */}
        <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '66' }]}>
          <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeRow}>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold', fontSize: 20 }}>{offer.toAirport}</Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right' }}>{formatTime(arriveStr)}</Text>
        </View>
        <View style={styles.routeMiddle}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Ionicons name="airplane" size={16} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold', fontSize: 20 }}>{offer.fromAirport}</Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right' }}>{formatTime(departStr)}</Text>
        </View>
      </View>

      {/* Date & duration */}
      <View style={styles.metaRow}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular', fontSize: 12 }}>{formatDuration(offer.durationMinutes)}</Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular', fontSize: 12 }}>{formatDateAr(departStr.slice(0, 10))}</Text>
      </View>

      {/* Hold countdown */}
      {booking.status === 'held' && booking.holdExpiresAt && (
        <HoldCountdown expiresAt={booking.holdExpiresAt} />
      )}

      {/* References */}
      <View style={[styles.metaRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }]}>
        <View style={{ alignItems: 'flex-start' }}>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular', fontSize: 11 }}>PNR</Text>
          <Text style={{ color: colors.primary, fontFamily: 'Tajawal_800ExtraBold', fontSize: 13, letterSpacing: 0.5 }}>{booking.bookingReference ?? '—'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular', fontSize: 11 }}>رقم الطلب</Text>
          <Text style={{ color: colors.primary, fontFamily: 'Tajawal_800ExtraBold', fontSize: 13, letterSpacing: 0.5 }}>{booking.referenceNumber}</Text>
        </View>
      </View>

      {/* Arrow */}
      <View style={styles.arrowWrap}>
        <Ionicons name="chevron-back" size={16} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: 'Tajawal_700Bold', fontSize: 12 }}>عرض التذكرة</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MyFlightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const { data: bookings, isLoading, isError, refetch, isFetching } = useListMyFlightBookings();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: paddingTop + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>رحلاتي</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.centerText, { color: colors.mutedForeground }]}>جاري التحميل...</Text>
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={[styles.centerText, { color: '#EF4444' }]}>تعذر تحميل الرحلات</Text>
            <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
              <Text style={{ color: colors.primary, fontFamily: 'Tajawal_700Bold', fontSize: 14 }}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && (!bookings || bookings.length === 0) && (
          <View style={styles.center}>
            <Ionicons name="airplane-outline" size={60} color={colors.mutedForeground} />
            <Text style={[styles.centerText, { color: colors.mutedForeground }]}>لا توجد رحلات محجوزة بعد</Text>
            <TouchableOpacity onPress={() => router.replace('/(tabs)' as any)} style={[styles.retryBtn, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
              <Text style={{ color: colors.primary, fontFamily: 'Tajawal_700Bold', fontSize: 14 }}>ابحث عن رحلة</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && bookings && bookings.length > 0 && (
          <>
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>{bookings.length} رحلة</Text>
            {bookings.map(b => <BookingCard key={b.id} booking={b} />)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1, fontSize: 17,
    fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center',
  },
  logo: { width: 44, height: 44, borderRadius: 10 },
  airlineRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontFamily: 'Tajawal_700Bold', fontSize: 11 },
  routeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  routeMiddle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  arrowWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10, gap: 4 },
  center: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  centerText: { fontFamily: 'Tajawal_500Medium', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  countText: { fontFamily: 'Tajawal_400Regular', fontSize: 13, textAlign: 'right', marginBottom: 12 },
});
