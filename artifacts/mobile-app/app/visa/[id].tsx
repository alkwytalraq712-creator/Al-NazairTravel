import React from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetVisa } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const VISA_TYPES: Record<string, string> = {
  tourism: 'سياحية', business: 'عمل', medical: 'علاجية',
  study: 'دراسة', visit: 'زيارة', investment: 'استثمار',
};

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[rowStyles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[rowStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}
const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  label: { fontSize: 13, fontFamily: 'Tajawal_400Regular' },
  value: { fontSize: 14, fontFamily: 'Tajawal_700Bold', textAlign: 'right', flex: 1, marginRight: 8 },
});

export default function VisaDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: visa, isLoading, isError } = useGetVisa(Number(id));

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Hero */}
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: visa.countryImageUrl }} style={[styles.hero, { paddingTop }]} contentFit="cover" />
          <View style={[styles.heroOverlay, { paddingTop }]} />
          <TouchableOpacity style={[styles.backBtn, { top: paddingTop + 12 }]} onPress={() => router.back()}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <View style={styles.flagRow}>
              <Image source={{ uri: visa.countryFlagUrl }} style={styles.flag} contentFit="cover" />
              <Text style={styles.heroCountry}>{visa.countryName}</Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{VISA_TYPES[visa.visaType] ?? visa.visaType}</Text>
            </View>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {/* Details Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>تفاصيل التأشيرة</Text>
            <InfoRow label="مدة الإنجاز" value={visa.processingTime} colors={colors} />
            <InfoRow label="مدة الإقامة" value={visa.stayDuration} colors={colors} />
            <InfoRow label="الصلاحية" value={visa.validity} colors={colors} />
            <InfoRow label="عدد مرات الدخول" value={visa.entriesAllowed} colors={colors} />
            <View style={[rowStyles.row, { borderBottomWidth: 0 }]}>
              <Text style={[{ fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', color: colors.primary }]}>{visa.currency} {visa.price}</Text>
              <Text style={[rowStyles.label, { color: colors.mutedForeground }]}>السعر</Text>
            </View>
          </View>

          {/* Description */}
          {visa.description && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>عن التأشيرة</Text>
              <Text style={[styles.description, { color: colors.foreground }]}>{visa.description}</Text>
            </View>
          )}

          {/* Required Documents */}
          {visa.requiredDocuments.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>المستندات المطلوبة</Text>
              {visa.requiredDocuments.map((doc, i) => (
                <View key={i} style={styles.docRow}>
                  <Text style={[styles.docText, { color: colors.foreground }]}>{doc}</Text>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]}>
        <View style={styles.priceFooter}>
          <Text style={[styles.footerPrice, { color: colors.primary }]}>{visa.currency} {visa.price}</Text>
          <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>رسوم التأشيرة</Text>
        </View>
        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/apply-visa/terms/${visa.id}` as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.applyBtnText}>قدّم طلبك الآن</Text>
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
  hero: { width: '100%', height: 300 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000066' },
  backBtn: { position: 'absolute', right: 16, zIndex: 10, padding: 8, backgroundColor: '#00000055', borderRadius: 20 },
  heroContent: { position: 'absolute', bottom: 20, right: 16 },
  flagRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  flag: { width: 30, height: 20, borderRadius: 2 },
  heroCountry: { color: '#fff', fontSize: 24, fontFamily: 'Tajawal_800ExtraBold', textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  typeBadge: { backgroundColor: '#F08015', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-end' },
  typeText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 13 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right', marginBottom: 12 },
  description: { fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'right', lineHeight: 24 },
  docRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#00000010' },
  docText: { flex: 1, fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderTopWidth: 1, gap: 12 },
  priceFooter: { alignItems: 'flex-end' },
  footerPrice: { fontSize: 20, fontFamily: 'Tajawal_800ExtraBold' },
  footerLabel: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  applyBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
});
