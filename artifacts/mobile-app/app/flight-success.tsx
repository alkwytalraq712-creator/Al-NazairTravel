/**
 * Booking Success Screen — redesigned.
 * Shows real PNR + booking reference + flight info.
 * Single CTA: back to home. Blocks Android back-navigation.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDateAr } from '@/lib/flightService';

const GOLD = '#C9A060';
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';
const GREEN = '#10B981';

export default function FlightSuccessScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    referenceNumber?: string;
    bookingReference?: string;
    airline?: string;
    fromAirport?: string;
    toAirport?: string;
    departDate?: string;
    bookingId?: string;
    total?: string;
    currency?: string;
  }>();

  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.timing(slideUp, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  // Block Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const hasPNR = !!params.bookingReference;
  const hasRoute = !!(params.fromAirport && params.toAirport);

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: paddingTop + 32 }]}>

        {/* Animated check */}
        <Animated.View style={{ transform: [{ scale }], opacity, marginBottom: 24 }}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={52} color={WHITE} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity, transform: [{ translateY: slideUp }], width: '100%' }}>
          <Text style={styles.title}>تم حجز رحلتك بنجاح!</Text>
          <Text style={styles.subtitle}>
            {hasPNR
              ? 'حجزك مؤكد لدى الناقل الجوي — تفاصيل رحلتك أدناه'
              : 'سيتم مراجعة طلبك وإصدار التذكرة في أقرب وقت'}
          </Text>

          {/* Info Card */}
          <View style={styles.card}>
            {/* Request number */}
            <View style={styles.cardRow}>
              <Text style={styles.cardValue}>{params.referenceNumber ?? '—'}</Text>
              <Text style={styles.cardLabel}>رقم طلب الحجز</Text>
            </View>

            {/* PNR */}
            {hasPNR && (
              <>
                <View style={styles.divider} />
                <View style={styles.cardRow}>
                  <Text style={[styles.cardValue, { color: GOLD, fontSize: 22, letterSpacing: 2 }]}>
                    {params.bookingReference}
                  </Text>
                  <Text style={styles.cardLabel}>رقم المرجع (PNR)</Text>
                </View>
              </>
            )}

            {/* Airline */}
            {params.airline && (
              <>
                <View style={styles.divider} />
                <View style={styles.cardRow}>
                  <Text style={styles.cardValue}>{params.airline}</Text>
                  <Text style={styles.cardLabel}>الناقل الجوي</Text>
                </View>
              </>
            )}

            {/* Route */}
            {hasRoute && (
              <>
                <View style={styles.divider} />
                <View style={styles.cardRow}>
                  <View style={styles.routeValue}>
                    <Text style={styles.airportCode}>{params.toAirport}</Text>
                    <Ionicons name="arrow-forward-outline" size={16} color={MUTED} style={{ transform: [{ rotate: '180deg' }] }} />
                    <Text style={styles.airportCode}>{params.fromAirport}</Text>
                  </View>
                  <Text style={styles.cardLabel}>المسار</Text>
                </View>
              </>
            )}

            {/* Date */}
            {params.departDate && (
              <>
                <View style={styles.divider} />
                <View style={styles.cardRow}>
                  <Text style={styles.cardValue}>{formatDateAr(params.departDate)}</Text>
                  <Text style={styles.cardLabel}>تاريخ الإقلاع</Text>
                </View>
              </>
            )}

            {/* Total */}
            {params.total && (
              <>
                <View style={styles.divider} />
                <View style={styles.cardRow}>
                  <Text style={[styles.cardValue, { color: GREEN }]}>
                    {params.currency} {params.total}
                  </Text>
                  <Text style={styles.cardLabel}>المبلغ الإجمالي</Text>
                </View>
              </>
            )}
          </View>

          {/* E-ticket note */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={GOLD} />
            <Text style={styles.infoText}>
              {hasPNR
                ? 'بإمكانك الاطلاع على تذكرتك الإلكترونية من صفحة "رحلاتي"'
                : 'سيتم إصدار التذكرة الإلكترونية بعد مراجعة الحجز وإبلاغك عبر البريد والرسائل'}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* CTAs */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16, gap: 10 }]}>
        {/* View ticket — primary */}
        {params.bookingId && (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.replace(`/e-ticket/${params.bookingId}` as any)}
            activeOpacity={0.88}
          >
            <Ionicons name="document-text-outline" size={20} color={DARK} />
            <Text style={styles.ctaText}>عرض التذكرة الإلكترونية</Text>
          </TouchableOpacity>
        )}
        {/* Back home — secondary */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace('/(tabs)' as any)}
          activeOpacity={0.88}
        >
          <Ionicons name="home-outline" size={18} color={GREEN} />
          <Text style={styles.secondaryText}>العودة إلى الصفحة الرئيسية</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DARK },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },

  checkCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },

  title: {
    color: WHITE, fontSize: 22, fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    color: MUTED, fontSize: 13, fontFamily: 'Tajawal_400Regular',
    textAlign: 'center', marginBottom: 22, lineHeight: 20,
  },

  card: {
    width: '100%', backgroundColor: DARK2, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER, padding: 20, marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6,
  },
  cardLabel: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12 },
  cardValue: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 4 },
  routeValue: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  airportCode: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },

  infoBox: {
    flexDirection: 'row-reverse', gap: 10, width: '100%',
    backgroundColor: 'rgba(201,160,96,0.10)', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: 'rgba(201,160,96,0.25)',
  },
  infoText: {
    flex: 1, color: WHITE, fontFamily: 'Tajawal_400Regular',
    fontSize: 12, textAlign: 'right', lineHeight: 19,
  },

  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: DARK2,
  },
  ctaBtn: {
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: GOLD, paddingVertical: 17, borderRadius: 16,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  secondaryBtn: {
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: GREEN + '55', paddingVertical: 14, borderRadius: 16,
    backgroundColor: GREEN + '11',
  },
  secondaryText: { color: GREEN, fontFamily: 'Tajawal_700Bold', fontSize: 15 },
});
