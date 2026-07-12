import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetPackage } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const NAVY = '#060B18';
const NAVY2 = '#0C1628';
const NAVY3 = '#121F38';
const GOLD = '#C9A060';
const GOLD2 = '#E8C07A';

const StatCol = ({ icon, label, value, colors: gradColors, colorsHook }: any) => (
  <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
    <LinearGradient colors={gradColors} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={20} color="#fff" />
    </LinearGradient>
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colorsHook.foreground, fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'center' }} numberOfLines={1}>{value}</Text>
      <Text style={{ color: colorsHook.mutedForeground, fontSize: 11, fontFamily: 'Tajawal_500Medium' }}>{label}</Text>
    </View>
  </View>
);

export default function PackageDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pkg, isLoading, isError } = useGetPackage(Number(id));
  const [imageIdx, setImageIdx] = useState(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const staggers = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (pkg) {
      Animated.stagger(80, staggers.map(anim =>
        Animated.spring(anim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true })
      )).start();
    }
  }, [pkg, staggers]);

  const animatedStyle = (index: number) => ({
    opacity: staggers[index],
    transform: [{
      translateY: staggers[index].interpolate({
        inputRange: [0, 1],
        outputRange: [30, 0]
      })
    }]
  });

  const paddingTop = Platform.OS === 'web' ? 20 : insets.top + 12;

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
      {/* Header */}
      <LinearGradient
        colors={[NAVY, NAVY2, NAVY3]}
        style={{
          paddingTop,
          paddingBottom: 20,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          paddingHorizontal: 20,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' }} numberOfLines={1}>
          {pkg.name}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', marginLeft: 16 }}
        >
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Image Gallery */}
        <Animated.View style={[{ height: 320, marginTop: -40, zIndex: 1 }, animatedStyle(0)]}>
          {pkg.images && pkg.images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                 const x = e.nativeEvent.contentOffset.x;
                 const idx = Math.round(x / width);
                 setImageIdx(idx);
              }}
              scrollEventThrottle={16}
            >
              {pkg.images.map((img, i) => (
                <View key={i} style={{ width }}>
                  <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ width, height: '100%', backgroundColor: colors.muted }} />
          )}
          
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          
          <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20, alignItems: 'flex-end' }}>
            <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right', marginBottom: 8 }}>{pkg.name}</Text>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location" size={16} color={GOLD} />
              <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Tajawal_500Medium' }}>{pkg.city}، {pkg.country}</Text>
            </View>
          </View>
          
          {pkg.images && pkg.images.length > 1 && (
            <View style={{ position: 'absolute', bottom: 20, left: 20, flexDirection: 'row-reverse', gap: 6 }}>
              {pkg.images.map((_, i) => (
                <View key={i} style={{ width: i === imageIdx ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === imageIdx ? GOLD : 'rgba(255,255,255,0.5)' }} />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View style={[{
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
          backgroundColor: colors.card,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          marginHorizontal: 20,
          marginTop: -30,
          zIndex: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
        }, animatedStyle(1)]}>
          <StatCol icon="moon" label="ليلة" value={pkg.nights.toString()} colors={['#4facfe', '#00f2fe']} colorsHook={colors} />
          <StatCol icon="sunny" label="يوم" value={pkg.days.toString()} colors={['#fa709a', '#fee140']} colorsHook={colors} />
          <StatCol icon="star" label="نجوم" value={pkg.hotelStars.toString()} colors={['#f83600', '#f9d423']} colorsHook={colors} />
          <StatCol icon="cash" label="يبدأ من" value={`${pkg.currency} ${pkg.priceFrom}`} colors={['#11998E', '#38EF7D']} colorsHook={colors} />
        </Animated.View>

        {/* Description */}
        {pkg.description && (
          <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }, animatedStyle(2)]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>عن الباقة</Text>
            <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>{pkg.description}</Text>
          </Animated.View>
        )}

        {/* Itinerary */}
        {(pkg.itinerary ?? []).length > 0 && (
          <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, animatedStyle(3)]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>برنامج الرحلة</Text>
            {(pkg.itinerary ?? []).map((day, i) => (
              <TouchableOpacity key={day.day} onPress={() => setExpandedDay(expandedDay === day.day ? null : day.day)} activeOpacity={0.8}>
                <View style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'flex-start',
                  paddingVertical: 16,
                  borderBottomWidth: i === (pkg.itinerary?.length ?? 0) - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                  gap: 12
                }}>
                  <LinearGradient colors={[NAVY, NAVY2]} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: -4 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Tajawal_800ExtraBold' }}>{day.day}</Text>
                  </LinearGradient>
                  
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Text style={{ color: colors.foreground, fontSize: 16, fontFamily: 'Tajawal_700Bold', flex: 1, textAlign: 'right', paddingRight: 8 }}>{day.title}</Text>
                      <Ionicons name={expandedDay === day.day ? "chevron-up" : "chevron-down"} size={20} color={colors.mutedForeground} />
                    </View>
                    
                    {expandedDay === day.day && (
                      <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginTop: 12, lineHeight: 24 }}>
                        {day.description}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Included Services */}
        {(pkg.includedServices ?? []).length > 0 && (
          <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, animatedStyle(4)]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الخدمات المشمولة</Text>
            {(pkg.includedServices ?? []).map((service, i) => (
              <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: i === (pkg.includedServices?.length ?? 0) - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                <LinearGradient colors={['#11998E', '#38EF7D']} style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: -2 }}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </LinearGradient>
                <Text style={[styles.sectionText, { flex: 1, color: colors.foreground }]}>{service}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Excluded Services */}
        {(pkg.excludedServices ?? []).length > 0 && (
          <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, animatedStyle(5)]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>غير مشمول</Text>
            {(pkg.excludedServices ?? []).map((service, i) => (
              <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: i === (pkg.excludedServices?.length ?? 0) - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                <LinearGradient colors={['#FF5F6D', '#FFC371']} style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: -2 }}>
                  <Ionicons name="close" size={18} color="#fff" />
                </LinearGradient>
                <Text style={[styles.sectionText, { flex: 1, color: colors.foreground }]}>{service}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Book CTA */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 16 }]}>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Tajawal_500Medium' }}>يبدأ السعر من</Text>
          <Text style={{ color: GOLD, fontSize: 22, fontFamily: 'Tajawal_800ExtraBold' }}>{pkg.currency} {pkg.priceFrom}</Text>
        </View>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => router.push(`/book-package/${pkg.id}` as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[GOLD, GOLD2]}
            style={{
              paddingVertical: 16,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ color: '#060B18', fontFamily: 'Tajawal_800ExtraBold', fontSize: 18 }}>احجز الباقة الآن</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  backBtnCenter: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'right',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 15,
    fontFamily: 'Tajawal_500Medium',
    textAlign: 'right',
    lineHeight: 26,
  },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 20,
    borderTopWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  }
});
