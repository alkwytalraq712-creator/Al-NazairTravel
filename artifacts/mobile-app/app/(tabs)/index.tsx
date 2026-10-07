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
import { useGetHomeSummary, getGetHomeSummaryQueryKey, useGetProfileCompletion } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useServiceSettings } from '@/context/ServiceSettingsContext';
import { BannerSlider } from '@/components/BannerSlider';
import { VisaCard } from '@/components/VisaCard';
import { PackageCard } from '@/components/PackageCard';
import { OfferCard } from '@/components/OfferCard';


export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { data: home, isLoading } = useGetHomeSummary({ query: { queryKey: getGetHomeSummaryQueryKey() } });
  const { data: completion } = useGetProfileCompletion();
  const { user } = useAuth();
  const { flightsEnabled, packagesEnabled, visasEnabled } = useServiceSettings();

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const destinations = [
    { name: 'السعودية', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=500&q=80' },
    { name: 'فرنسا', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80' },
    { name: 'الإمارات', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&q=80' },
    { name: 'تركيا', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=500&q=80' },
  ];

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
            onPress={() => router.push('/(tabs)/account')}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={styles.headerBtn}
          >
            <Ionicons name="menu-outline" size={28} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.welcome, { backgroundColor: colors.background }]}>
        <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>مرحباً بك في <Text style={{ color: colors.primary }}>قمة النظائر</Text></Text>
        <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>وجهتك الأولى للسفر والسياحة</Text>
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

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/visas')} style={styles.seeAllRow}>
              <Ionicons name="chevron-back" size={14} color={colors.primary} />
              <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
            </TouchableOpacity>
            <View style={styles.titleWithIcon}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>أبرز الوجهات</Text>
              <Ionicons name="compass-outline" size={22} color={colors.primary} />
            </View>
          </View>
          <FlatList
            data={destinations}
            horizontal
            inverted
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            keyExtractor={item => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.destinationCard} activeOpacity={0.85} onPress={() => router.push('/(tabs)/visas')}>
                <Image source={{ uri: item.image }} style={styles.destinationImage} />
                <View style={styles.destinationShade} />
                <View style={styles.destinationLabel}>
                  <Text style={styles.destinationText}>{item.name}</Text>
                  <Ionicons name="location" size={14} color={colors.primary} />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        <TouchableOpacity style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(tabs)/account')} activeOpacity={0.85}>
          <View style={[styles.profileCircle, { borderColor: colors.primary }]}>
            <Ionicons name="person" size={25} color={colors.primary} />
            <Text style={[styles.profilePercent, { color: colors.primary }]}>{completion?.percentage ?? 0}%</Text>
          </View>
          <View style={styles.profileBody}>
            <Text style={[styles.profileTitle, { color: colors.foreground }]}>أكمل ملفك الشخصي</Text>
            <Text style={[styles.profileSub, { color: colors.mutedForeground }]}>للحصول على تجربة أفضل وخدمات أسرع</Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.input }]}><View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${completion?.percentage ?? 0}%` as any }]} /></View>
          </View>
          <View style={[styles.arrowCircle, { backgroundColor: colors.primary }]}><Ionicons name="arrow-forward" size={19} color={colors.primaryForeground} /></View>
        </TouchableOpacity>

        <View style={styles.benefitsRow}>
          {[
            { icon: 'headset-outline', title: 'دعم مستمر', sub: 'على مدار الساعة' },
            { icon: 'shield-checkmark-outline', title: 'أمان وموثوقية', sub: 'في كل خطوة' },
            { icon: 'globe-outline', title: 'خبرة عالمية', sub: 'وأسعار مميزة' },
            { icon: 'airplane-outline', title: 'وجهات متنوعة', sub: 'حول العالم' },
          ].map(item => <View key={item.title} style={styles.benefit}><View style={[styles.benefitIcon, { borderColor: colors.primary }]}><Ionicons name={item.icon as any} size={21} color={colors.primary} /></View><Text style={[styles.benefitTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.benefitSub, { color: colors.mutedForeground }]}>{item.sub}</Text></View>)}
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
  welcome: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 2, paddingBottom: 16 },
  welcomeTitle: { fontSize: 26, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  welcomeSub: { fontSize: 15, fontFamily: 'Tajawal_500Medium', marginTop: 6, textAlign: 'center' },
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
  titleWithIcon: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  destinationCard: { width: 112, height: 160, borderRadius: 18, overflow: 'hidden', backgroundColor: '#15243B' },
  destinationImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  destinationShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,12,27,0.28)' },
  destinationLabel: { position: 'absolute', bottom: 12, left: 8, right: 8, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 3 },
  destinationText: { color: '#fff', fontSize: 14, fontFamily: 'Tajawal_800ExtraBold', textShadowColor: '#000', textShadowRadius: 4 },
  profileCard: { marginHorizontal: 16, marginTop: 28, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  profileCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  profilePercent: { fontSize: 12, fontFamily: 'Tajawal_800ExtraBold', marginTop: -2 },
  profileBody: { flex: 1, alignItems: 'flex-end' },
  profileTitle: { fontSize: 17, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
  profileSub: { fontSize: 12, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginTop: 4 },
  progressTrack: { width: '100%', height: 7, borderRadius: 5, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  arrowCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  benefitsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 30, marginBottom: 4 },
  benefit: { alignItems: 'center', flex: 1 },
  benefitIcon: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  benefitTitle: { fontSize: 11, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  benefitSub: { fontSize: 9, fontFamily: 'Tajawal_500Medium', textAlign: 'center', marginTop: 2 },
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
