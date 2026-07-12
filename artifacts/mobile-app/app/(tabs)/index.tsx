import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetHomeSummary, getGetHomeSummaryQueryKey } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useServiceSettings } from '@/context/ServiceSettingsContext';
import { BannerSlider } from '@/components/BannerSlider';
import { VisaCard } from '@/components/VisaCard';
import { PackageCard } from '@/components/PackageCard';
import { OfferCard } from '@/components/OfferCard';


export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { data: home, isLoading } = useGetHomeSummary({ query: { queryKey: getGetHomeSummaryQueryKey() } });
  const { flightsEnabled, packagesEnabled, visasEnabled } = useServiceSettings();

  // Filter service shortcuts based on admin toggles
  const ALL_SERVICES = [
    { icon: 'document-text-outline', label: 'التأشيرات', route: '/(tabs)/visas',     enabled: visasEnabled    },
    { icon: 'airplane-outline',      label: 'الطيران',   route: '/(tabs)/flights',   enabled: flightsEnabled  },
    { icon: 'map-outline',           label: 'الباقات',   route: '/(tabs)/packages',  enabled: packagesEnabled },
    { icon: 'headset-outline',       label: 'تواصل معنا', route: null,               enabled: true            },
  ] as const;
  const SERVICES = ALL_SERVICES.filter(s => s.enabled);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 12, bounciness: 4, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.headerWrap, { backgroundColor: colors.background, paddingTop: paddingTop + 12 }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={styles.headerBtn}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
            <View style={[styles.notifDot, { backgroundColor: colors.destructive }]} />
          </Pressable>

          <Image
            source={require('@/assets/images/logo_transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Pressable
            onPress={() => router.push('/(tabs)/visas')}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={styles.headerBtn}
          >
            <Ionicons name="search-outline" size={24} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 120 }}
      >
        {/* Banner */}
        <View style={{ backgroundColor: colors.background, paddingBottom: 40 }}>
          {isLoading ? (
            <View style={[styles.bannerSkeleton, { backgroundColor: colors.card }]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.bannerWrap}>
              <BannerSlider
                banners={home?.banners ?? []}
                renderOverlay={(banner) => (
                  <View style={styles.bannerOverlay} pointerEvents="box-none">
                    {!!banner.title && (
                      <Text style={[styles.bannerTitle, { color: '#fff' }]}>{banner.title}</Text>
                    )}
                    <Text style={[styles.bannerSubtitle, { color: 'rgba(255,255,255,0.9)' }]}>اكتشف وجهات رائعة واحجز بسهولة وأمان</Text>
                    <TouchableOpacity
                      style={[styles.bannerCta, { backgroundColor: colors.primary }]}
                      activeOpacity={0.85}
                      onPress={() => router.push('/(tabs)/packages')}
                    >
                      <Ionicons name="arrow-back" size={16} color={colors.primaryForeground} />
                      <Text style={[styles.bannerCtaText, { color: colors.primaryForeground }]}>احجز الآن</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}
        </View>

        {/* Services */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.servicesGrid}>
            {SERVICES.map((svc) => (
              <TouchableOpacity
                key={svc.label}
                style={styles.serviceItem}
                activeOpacity={0.7}
                onPress={() => svc.route && router.push(svc.route as any)}
              >
                <View style={[styles.serviceIcon, { backgroundColor: colors.accent }]}>
                  <Ionicons name={svc.icon as any} size={24} color={colors.primary} />
                </View>
                <Text style={[styles.serviceLabel, { color: colors.foreground }]}>{svc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Offers */}
        {((home?.offers?.length ?? 0) > 0) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/packages')} style={styles.seeAllRow}>
                <Ionicons name="chevron-back" size={14} color={colors.primary} />
                <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
              </TouchableOpacity>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>العروض المميزة</Text>
            </View>
            <FlatList
              data={home!.offers}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row-reverse', gap: 14 }}
              keyExtractor={(p) => String(p.id)}
              renderItem={({ item }) => (
                <OfferCard
                  pkg={item}
                  onPress={() => router.push(`/package/${item.id}` as any)}
                />
              )}
            />
          </View>
        )}

        {/* Featured Visas */}
        {((home?.featuredVisas?.length ?? 0) > 0) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/visas')} style={styles.seeAllRow}>
                <Ionicons name="chevron-back" size={14} color={colors.primary} />
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
              <TouchableOpacity onPress={() => router.push('/(tabs)/packages')} style={styles.seeAllRow}>
                <Ionicons name="chevron-back" size={14} color={colors.primary} />
                <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
              </TouchableOpacity>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الباقات الشعبية</Text>
            </View>
            {(home?.popularPackages ?? []).map((pkg) => (
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
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerWrap: { paddingBottom: 0 },
  headerBtn: { position: 'relative' },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logo: { width: 120, height: 50 },
  bannerWrap: { marginHorizontal: 16, borderRadius: 20, overflow: 'hidden' },
  bannerSkeleton: { height: 200, margin: 16, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
    padding: 20,
  },
  bannerTitle: {
    fontSize: 24,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'right',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 14,
    fontFamily: 'Tajawal_500Medium',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 16,
  },
  bannerCta: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  bannerCtaText: { fontSize: 14, fontFamily: 'Tajawal_700Bold' },
  section: {
    padding: 20,
    marginTop: -32,
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  servicesGrid: { flexDirection: 'row-reverse', justifyContent: 'space-around' },
  serviceItem: { alignItems: 'center', gap: 10, minWidth: 72 },
  serviceIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  serviceLabel: { fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'center' },
  sectionContainer: { marginTop: 32 },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 18, fontFamily: 'Tajawal_800ExtraBold' },
  seeAllRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  seeAll: { fontSize: 14, fontFamily: 'Tajawal_700Bold' },
  testimonialCard: {
    width: 260,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  stars: { flexDirection: 'row-reverse', gap: 3, marginBottom: 12 },
  testimonialText: { fontSize: 14, fontFamily: 'Tajawal_500Medium', textAlign: 'right', lineHeight: 22, marginBottom: 12 },
  testimonialName: { fontSize: 13, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
});
