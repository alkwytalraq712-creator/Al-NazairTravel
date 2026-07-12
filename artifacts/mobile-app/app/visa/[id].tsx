import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetVisa } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const NAVY = '#060B18';
const NAVY2 = '#0C1628';
const NAVY3 = '#121F38';
const GOLD = '#C9A060';
const GOLD2 = '#E8C07A';

const VISA_TYPES: Record<string, string> = {
  tourism: 'سياحية', business: 'عمل', medical: 'علاجية',
  study: 'دراسة', visit: 'زيارة', investment: 'استثمار',
};

const StatPill = ({ icon, label, value, gradient, anim, colorsHook }: any) => {
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: colorsHook.card,
      borderRadius: 24,
      padding: 6,
      paddingLeft: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: colorsHook.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <LinearGradient colors={gradient} style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color="#fff" />
      </LinearGradient>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: colorsHook.mutedForeground, fontSize: 11, fontFamily: 'Tajawal_400Regular' }}>{label}</Text>
        <Text style={{ color: colorsHook.foreground, fontSize: 14, fontFamily: 'Tajawal_700Bold' }}>{value}</Text>
      </View>
    </Animated.View>
  );
};

export default function VisaDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: visa, isLoading, isError } = useGetVisa(Number(id));

  const staggers = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visa) {
      Animated.stagger(80, staggers.map(anim =>
        Animated.spring(anim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true })
      )).start();
    }
  }, [visa, staggers]);

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

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (isError || !visa) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="warning-outline" size={48} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>لم يتم العثور على التأشيرة</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCenter, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold' }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
        <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Tajawal_800ExtraBold' }}>{visa.countryName}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Hero Image */}
        <Animated.View style={[{ marginTop: -40, zIndex: 1 }, animatedStyle(0)]}>
          <View style={{ width: '100%', height: 280 }}>
            <Image source={{ uri: visa.countryImageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            
            <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
                <Image source={{ uri: visa.countryFlagUrl }} style={{ width: 48, height: 32, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} contentFit="cover" />
                <View>
                  <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Tajawal_800ExtraBold' }}>{visa.countryName}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, fontFamily: 'Tajawal_500Medium', textAlign: 'right' }}>{VISA_TYPES[visa.visaType] ?? visa.visaType}</Text>
                </View>
              </View>

              <LinearGradient colors={[GOLD, GOLD2]} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 }}>
                <Text style={{ color: '#060B18', fontSize: 12, fontFamily: 'Tajawal_500Medium', textAlign: 'center' }}>السعر</Text>
                <Text style={{ color: '#060B18', fontSize: 16, fontFamily: 'Tajawal_800ExtraBold' }}>{visa.currency} {visa.price}</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View style={animatedStyle(1)}>
          <ScrollView horizontal inverted showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, marginTop: 20, paddingBottom: 10 }}>
            <StatPill icon="time" label="مدة الإنجاز" value={visa.processingTime} gradient={['#4facfe', '#00f2fe']} anim={staggers[1]} colorsHook={colors} />
            <StatPill icon="calendar" label="مدة الإقامة" value={visa.stayDuration} gradient={['#fa709a', '#fee140']} anim={staggers[2]} colorsHook={colors} />
            <StatPill icon="shield-checkmark" label="الصلاحية" value={visa.validity} gradient={['#43e97b', '#38f9d7']} anim={staggers[3]} colorsHook={colors} />
            <StatPill icon="repeat" label="عدد الدخول" value={visa.entriesAllowed.toString()} gradient={['#a18cd1', '#fbc2eb']} anim={staggers[4]} colorsHook={colors} />
          </ScrollView>
        </Animated.View>

        {/* Description */}
        {visa.description && (
          <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 10 }, animatedStyle(2)]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>عن التأشيرة</Text>
            <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>{visa.description}</Text>
          </Animated.View>
        )}

        {/* Required Documents */}
        {(visa.requiredDocuments ?? []).length > 0 && (
          <Animated.View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, animatedStyle(3)]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>المستندات المطلوبة</Text>
            {(visa.requiredDocuments ?? []).map((doc, i) => (
              <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: i === (visa.requiredDocuments?.length ?? 0) - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                <LinearGradient colors={['#11998E', '#38EF7D']} style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: -2 }}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </LinearGradient>
                <Text style={[styles.sectionText, { flex: 1, color: colors.foreground }]}>{doc}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 16 }]}>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Tajawal_500Medium' }}>رسوم التأشيرة</Text>
          <Text style={{ color: GOLD, fontSize: 22, fontFamily: 'Tajawal_800ExtraBold' }}>{visa.currency} {visa.price}</Text>
        </View>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => router.push(`/apply-visa/terms/${visa.id}` as any)}
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
            <Text style={{ color: '#060B18', fontFamily: 'Tajawal_800ExtraBold', fontSize: 18 }}>قدّم طلبك الآن</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, fontFamily: 'Tajawal_500Medium' },
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
