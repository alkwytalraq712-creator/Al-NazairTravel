import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetHomeSummary } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { BannerSlider } from '@/components/BannerSlider';
import { VisaCard } from '@/components/VisaCard';
import { PackageCard } from '@/components/PackageCard';

const SERVICES = [
  { icon: 'document-text', label: 'التأشيرات', route: '/(tabs)/visas', color: '#3B82F6' },
  { icon: 'airplane', label: 'الطيران', route: '/(tabs)/flights', color: '#10B981' },
  { icon: 'map', label: 'الباقات', route: '/(tabs)/packages', color: '#F59E0B' },
  { icon: 'call', label: 'تواصل معنا', route: null, color: '#8B5CF6' },
] as const;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { data: home, isLoading } = useGetHomeSummary();

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 120 }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <Image
          source={require('@/assets/images/logo_transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => router.push('/(tabs)/visas')}>
          <Ionicons name="search-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Banner Slider */}
      {isLoading ? (
        <View style={[styles.bannerSkeleton, { backgroundColor: colors.muted }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <BannerSlider banners={home?.banners ?? []} />
      )}

      {/* Services */}
      <View style={[styles.section, { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border }]}>
        <View style={styles.servicesGrid}>
          {SERVICES.map((svc) => (
            <TouchableOpacity
              key={svc.label}
              style={styles.serviceItem}
              activeOpacity={0.7}
              onPress={() => svc.route && router.push(svc.route as any)}
            >
              <View style={[styles.serviceIcon, { backgroundColor: svc.color + '20' }]}>
                <Ionicons name={svc.icon as any} size={26} color={svc.color} />
              </View>
              <Text style={[styles.serviceLabel, { color: colors.foreground }]}>{svc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Featured Visas */}
      {((home?.featuredVisas?.length ?? 0) > 0) && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/visas')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>التأشيرات المميزة</Text>
          </View>
          <FlatList
            data={home!.featuredVisas}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row-reverse' }}
            keyExtractor={(v) => String(v.id)}
            renderItem={({ item }) => (
              <VisaCard
                visa={item}
                compact
                onPress={() => router.push(`/visa/${item.id}` as any)}
              />
            )}
          />
        </View>
      )}

      {/* Popular Packages */}
      {((home?.popularPackages?.length ?? 0) > 0) && (
        <View style={[styles.sectionContainer, { paddingHorizontal: 16 }]}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/packages')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الباقات الشعبية</Text>
          </View>
          {home!.popularPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onPress={() => router.push(`/package/${pkg.id}` as any)}
            />
          ))}
        </View>
      )}

      {/* Testimonials */}
      {((home?.testimonials?.length ?? 0) > 0) && (
        <View style={styles.sectionContainer}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
            <View />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>آراء العملاء</Text>
          </View>
          <FlatList
            data={home!.testimonials}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row-reverse', gap: 12 }}
            keyExtractor={(t) => String(t.id)}
            renderItem={({ item }) => (
              <View style={[styles.testimonialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.stars}>
                  {[1,2,3,4,5].map(s => (
                    <Ionicons key={s} name={s <= item.rating ? 'star' : 'star-outline'} size={14} color={colors.primary} />
                  ))}
                </View>
                <Text style={[styles.testimonialText, { color: colors.foreground }]} numberOfLines={3}>"{item.comment}"</Text>
                <Text style={[styles.testimonialName, { color: colors.primary }]}>— {item.customerName}</Text>
              </View>
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  logo: { width: 120, height: 50 },
  bannerSkeleton: { height: 200, margin: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  section: { padding: 16, marginTop: 16 },
  servicesGrid: { flexDirection: 'row-reverse', justifyContent: 'space-around' },
  serviceItem: { alignItems: 'center', gap: 8, minWidth: 72 },
  serviceIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  serviceLabel: { fontSize: 12, fontFamily: 'Tajawal_500Medium', textAlign: 'center' },
  sectionContainer: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 18, fontFamily: 'Tajawal_800ExtraBold' },
  seeAll: { fontSize: 13, fontFamily: 'Tajawal_500Medium' },
  testimonialCard: {
    width: 240,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  stars: { flexDirection: 'row-reverse', gap: 2, marginBottom: 8 },
  testimonialText: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right', lineHeight: 20, marginBottom: 8 },
  testimonialName: { fontSize: 12, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },
});
