/**
 * Booking Success Screen — shown after a flight booking is created.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#C9A060';
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';

export default function FlightSuccessScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ referenceNumber?: string; total?: string; currency?: string }>();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: paddingTop + 40 }]}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale }], opacity }]}>
          <Ionicons name="checkmark-circle" size={96} color="#10B981" />
        </Animated.View>

        <Animated.View style={{ opacity }}>
          <Text style={styles.title}>تم تأكيد حجزك بنجاح!</Text>
          <Text style={styles.subtitle}>سيصلك تأكيد الحجز عبر البريد الإلكتروني والرسائل النصية</Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>رقم الحجز المرجعي</Text>
            <Text style={styles.refNumber}>{params.referenceNumber ?? '—'}</Text>
            {params.total ? (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.totalValue}>{params.currency} {params.total}</Text>
                  <Text style={styles.cardLabel}>المبلغ الإجمالي</Text>
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={GOLD} />
            <Text style={styles.infoText}>حالة الحجز الحالية: قيد الانتظار — سيتم إصدار التذكرة الإلكترونية بعد المراجعة</Text>
          </View>
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.replace('/bookings')} activeOpacity={0.88}>
          <Ionicons name="document-text-outline" size={20} color={DARK} />
          <Text style={styles.ctaText}>عرض رحلاتي</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.8}>
          <Text style={styles.secondaryText}>العودة للرئيسية</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DARK },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  iconWrap: { marginBottom: 24 },
  title: { color: WHITE, fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: MUTED, fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'center', marginBottom: 24, lineHeight: 20 },

  card: {
    backgroundColor: DARK2, borderRadius: 18, borderWidth: 1,
    borderColor: BORDER, padding: 20, width: '100%', alignItems: 'center', marginBottom: 20,
  },
  cardLabel: { color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 12 },
  refNumber: { color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 26, letterSpacing: 1, marginTop: 6 },
  divider: { height: 1, backgroundColor: BORDER, width: '100%', marginVertical: 14 },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  totalValue: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },

  infoBox: {
    flexDirection: 'row-reverse', gap: 10, backgroundColor: 'rgba(201,160,96,0.10)',
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(201,160,96,0.25)',
  },
  infoText: { flex: 1, color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right', lineHeight: 18 },

  footer: {
    paddingHorizontal: 16, paddingTop: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: DARK2,
  },
  ctaBtn: {
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: GOLD, paddingVertical: 16, borderRadius: 16,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 8 },
  secondaryText: { color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 13 },
});
