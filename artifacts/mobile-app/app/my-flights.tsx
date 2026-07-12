import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator, Platform, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useListMyFlightBookings } from '@workspace/api-client-react';
import type { FlightBooking } from '@workspace/api-client-react';
import { formatDateAr, formatTime, formatDuration, CABIN_LABELS_AR } from '@/lib/flightService';
import { useColors } from '@/hooks/useColors';

const GOLD = '#C9A060';
const GOLD2 = '#E8C07A';
const NAVY = '#060B18';
const NAVY2 = '#0C1628';
const NAVY3 = '#121F38';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  ticketed: 'صدرت التذكرة',
  cancelled: 'ملغى',
  completed: 'مكتمل',
  held: 'حجز مؤقت ⏳',
  expired_hold: 'انتهى الحجز المؤقت',
};

const getStatusColor = (status: string, colors: any) => {
  const map: Record<string, string> = {
    pending: colors.warning,
    confirmed: colors.info,
    ticketed: colors.success,
    cancelled: colors.mutedForeground,
    completed: colors.success,
    held: colors.primary,
    expired_hold: colors.destructive,
  };
  return map[status] ?? colors.mutedForeground;
};

function HoldCountdown({ expiresAt, colors }: { expiresAt?: string | null, colors: any }) {
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
  
  const bg = isExpired ? colors.destructive + '1A' : isWarning ? colors.warning + '1A' : GOLD + '1A';
  const border = isExpired ? colors.destructive + '33' : isWarning ? colors.warning + '33' : GOLD + '33';
  const textColor = isExpired ? colors.destructive : isWarning ? colors.warning : GOLD;

  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: bg, borderWidth: 1, borderColor: border }}>
      <Ionicons name="time-outline" size={16} color={textColor} />
      <Text style={{ color: textColor, fontFamily: 'Tajawal_500Medium', fontSize: 12 }}>الوقت المتبقي للدفع:</Text>
      <Text style={{ color: textColor, fontFamily: 'Tajawal_800ExtraBold', fontSize: 14, fontVariant: ['tabular-nums'] }}>{label}</Text>
    </View>
  );
}

function BookingCard({ booking, index }: { booking: FlightBooking; index: number }) {
  const colors = useColors();
  const offer = booking.offer;
  const color = getStatusColor(booking.status, colors);
  const label = STATUS_LABELS[booking.status] ?? booking.status;

  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  const departStr = typeof offer.departTime === 'string'
    ? offer.departTime
    : (offer.departTime as any)?.toISOString?.() ?? '';
  const arriveStr = typeof offer.arriveTime === 'string'
    ? offer.arriveTime
    : (offer.arriveTime as any)?.toISOString?.() ?? '';

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/e-ticket/${booking.id}` as any)}
        activeOpacity={0.85}
      >
        <View style={styles.airlineRow}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 }}>
            {offer.airlineLogoUrl ? (
              <Image source={{ uri: offer.airlineLogoUrl }} style={styles.logo} contentFit="contain" />
            ) : (
              <View style={[styles.logo, { backgroundColor: colors.muted, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="airplane" size={20} color={colors.primary} />
              </View>
            )}
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold', fontSize: 15, textAlign: 'right' }}>{offer.airlineName}</Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 13, textAlign: 'right' }}>{offer.flightNumber} • {CABIN_LABELS_AR[offer.cabinClass] ?? offer.cabinClass}</Text>
            </View>
          </View>
          
          <View style={[styles.badge, { backgroundColor: color + '1A', borderColor: color + '33' }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={{ alignItems: 'flex-end', flex: 1 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold', fontSize: 24 }}>{offer.toAirport}</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 14, textAlign: 'right' }}>{formatTime(arriveStr)}</Text>
          </View>
          
          <View style={styles.routeMiddle}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <LinearGradient
              colors={[GOLD, GOLD2]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.planeIconWrap}
            >
              <Ionicons name="airplane" size={14} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
            </LinearGradient>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>
          
          <View style={{ alignItems: 'flex-start', flex: 1 }}>
            <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold', fontSize: 24 }}>{offer.fromAirport}</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 14, textAlign: 'left' }}>{formatTime(departStr)}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 13 }}>{formatDuration(offer.durationMinutes)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 13 }}>{formatDateAr(departStr.slice(0, 10))}</Text>
          </View>
        </View>

        {booking.status === 'held' && booking.holdExpiresAt && (
          <HoldCountdown expiresAt={booking.holdExpiresAt} colors={colors} />
        )}

        <View style={[styles.refRow, { borderTopColor: colors.border }]}>
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 11, marginBottom: 2 }}>PNR</Text>
            <Text style={{ color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 14, letterSpacing: 1 }}>{booking.bookingReference ?? '—'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 11, marginBottom: 2 }}>رقم الطلب</Text>
            <Text style={{ color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 14, letterSpacing: 1 }}>{booking.referenceNumber}</Text>
          </View>
        </View>

        <View style={styles.arrowWrap}>
          <Ionicons name="chevron-back" size={16} color={GOLD} />
          <Text style={{ color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 13 }}>عرض التذكرة</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MyFlightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const { data: bookings, isLoading, isError, refetch, isFetching } = useListMyFlightBookings();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[NAVY, NAVY2, NAVY3]}
        style={[styles.header, { paddingTop: paddingTop + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>رحلاتي</Text>
          {bookings && bookings.length > 0 && (
            <Text style={styles.headerSub}>{bookings.length} رحلة مسجلة</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={GOLD}
            colors={[GOLD]}
          />
        }
      >
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={[styles.centerText, { color: colors.mutedForeground }]}>جاري تحميل رحلاتك...</Text>
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.center}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.destructive + '1A' }]}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.destructive} />
            </View>
            <Text style={[styles.centerText, { color: colors.destructive, marginTop: 12 }]}>تعذر تحميل الرحلات</Text>
            <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: GOLD + '1A', borderColor: GOLD + '40', marginTop: 16 }]}>
              <Text style={{ color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 14 }}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && (!bookings || bookings.length === 0) && (
          <View style={styles.center}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Ionicons name="airplane-outline" size={40} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.centerText, { color: colors.mutedForeground, marginTop: 12, marginBottom: 16 }]}>لا توجد رحلات محجوزة بعد</Text>
            <TouchableOpacity onPress={() => router.replace('/(tabs)' as any)} style={[styles.retryBtn, { backgroundColor: GOLD + '1A', borderColor: GOLD + '40' }]}>
              <Text style={{ color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 14 }}>ابحث عن رحلة الآن</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && bookings && bookings.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {bookings.map((b, i) => <BookingCard key={b.id} booking={b} index={i} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16, gap: 12,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.10)', 
    alignItems: 'center', justifyContent: 'center' 
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 18, color: '#FFFFFF' },
  headerSub: { fontFamily: 'Tajawal_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  card: { 
    borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2,
  },
  airlineRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logo: { width: 48, height: 48, borderRadius: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontFamily: 'Tajawal_700Bold', fontSize: 11 },

  routeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 16 },
  routeMiddle: { flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  planeIconWrap: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  metaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  
  refRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1 },

  arrowWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 16, gap: 4 },
  
  center: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  centerText: { fontFamily: 'Tajawal_500Medium', fontSize: 16, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
});
