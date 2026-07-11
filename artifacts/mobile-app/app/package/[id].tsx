import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetPackage } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

export default function PackageDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pkg, isLoading, isError } = useGetPackage(Number(id));
  const [imageIdx, setImageIdx] = useState(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  if (isLoading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (isError || !pkg) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={[{ fontFamily: 'Tajawal_500Medium', fontSize: 16, color: colors.foreground }]}>لم يتم العثور على الباقة</Text>
      <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCenter, { backgroundColor: colors.primary }]}>
        <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold' }}>رجوع</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Image Gallery */}
        <View style={{ position: 'relative' }}>
          {pkg.images.length > 0 ? (
            <Image source={{ uri: pkg.images[imageIdx] }} style={[styles.hero, { paddingTop }]} contentFit="cover" />
          ) : (
            <View style={[styles.hero, { backgroundColor: colors.muted, paddingTop }]} />
          )}
          <View style={[styles.heroOverlay]} />
          <TouchableOpacity style={[styles.backBtn, { top: paddingTop + 12 }]} onPress={() => router.back()}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
          {(pkg.images ?? []).length > 1 && (
            <View style={styles.imageDots}>
              {(pkg.images ?? []).map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setImageIdx(i)}>
                  <View style={[styles.imageDot, { backgroundColor: i === imageIdx ? colors.primary : '#ffffff80' }, i === imageIdx && { width: 18 }]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{pkg.name}</Text>
            <View style={styles.heroMeta}>
              <Ionicons name="location-outline" size={14} color="#fff" />
              <Text style={styles.heroMetaText}>{pkg.city}، {pkg.country}</Text>
            </View>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {/* Quick Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.stat}><Text style={[styles.statNum, { color: colors.primary }]}>{pkg.days}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>يوم</Text></View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}><Text style={[styles.statNum, { color: colors.primary }]}>{pkg.nights}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>ليلة</Text></View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}><Text style={[styles.statNum, { color: colors.primary }]}>{pkg.hotelStars}★</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>نجوم</Text></View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}><Text style={[styles.statNum, { color: colors.primary }]}>{pkg.currency} {pkg.priceFrom}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>يبدأ من</Text></View>
          </View>

          {/* Description */}
          {pkg.description && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>عن الباقة</Text>
              <Text style={[styles.desc, { color: colors.foreground }]}>{pkg.description}</Text>
            </View>
          )}

          {/* Itinerary */}
          {(pkg.itinerary ?? []).length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>برنامج الرحلة</Text>
              {(pkg.itinerary ?? []).map((day) => (
                <TouchableOpacity key={day.day} onPress={() => setExpandedDay(expandedDay === day.day ? null : day.day)} style={[styles.dayRow, { borderBottomColor: colors.border }]}>
                  <Ionicons name={expandedDay === day.day ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
                  <View style={styles.dayContent}>
                    <Text style={[styles.dayTitle, { color: colors.foreground }]}>{day.title}</Text>
                    <Text style={[styles.dayNum, { color: colors.primary }]}>اليوم {day.day}</Text>
                  </View>
                  {expandedDay === day.day && <Text style={[styles.dayDesc, { color: colors.foreground }]}>{day.description}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Included Services */}
          {(pkg.includedServices ?? []).length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>الخدمات المشمولة</Text>
              {(pkg.includedServices ?? []).map((s, i) => (
                <View key={i} style={styles.serviceRow}>
                  <Text style={[styles.serviceText, { color: colors.foreground }]}>{s}</Text>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                </View>
              ))}
            </View>
          )}

          {/* Excluded */}
          {(pkg.excludedServices ?? []).length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>غير مشمول</Text>
              {(pkg.excludedServices ?? []).map((s, i) => (
                <View key={i} style={styles.serviceRow}>
                  <Text style={[styles.serviceText, { color: colors.foreground }]}>{s}</Text>
                  <Ionicons name="close-circle" size={18} color={colors.destructive} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]}>
        <View>
          <Text style={[styles.footerPrice, { color: colors.primary }]}>{pkg.currency} {pkg.priceFrom}</Text>
          <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>يبدأ السعر من</Text>
        </View>
        <TouchableOpacity style={[styles.bookBtn, { backgroundColor: colors.primary }]} onPress={() => router.push(`/book-package/${pkg.id}` as any)} activeOpacity={0.85}>
          <Text style={styles.bookBtnText}>احجز الآن</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  backBtnCenter: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  hero: { width: '100%', height: 320 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000055' },
  backBtn: { position: 'absolute', right: 16, zIndex: 10, padding: 8, backgroundColor: '#00000055', borderRadius: 20 },
  imageDots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff80' },
  heroContent: { position: 'absolute', bottom: 16, right: 16 },
  heroTitle: { color: '#fff', fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
  heroMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  heroMetaText: { color: '#ffffffcc', fontSize: 13, fontFamily: 'Tajawal_400Regular' },
  statsRow: { flexDirection: 'row-reverse', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14, justifyContent: 'space-between', alignItems: 'center' },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 15, fontFamily: 'Tajawal_800ExtraBold' },
  statLabel: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  divider: { width: 1, height: 30 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right', marginBottom: 12 },
  desc: { fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'right', lineHeight: 24 },
  dayRow: { paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  dayContent: { flex: 1, alignItems: 'flex-end' },
  dayTitle: { fontSize: 14, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },
  dayNum: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  dayDesc: { width: '100%', fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right', lineHeight: 22, paddingTop: 8 },
  serviceRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 8 },
  serviceText: { flex: 1, fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderTopWidth: 1, gap: 14 },
  footerPrice: { fontSize: 20, fontFamily: 'Tajawal_800ExtraBold' },
  footerLabel: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  bookBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
});
