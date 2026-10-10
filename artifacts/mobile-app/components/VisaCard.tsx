import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Visa } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const VISA_TYPES: Record<string, string> = { tourism: 'سياحية', business: 'عمل', medical: 'علاجية', study: 'دراسة', visit: 'زيارة', investment: 'استثمار' };
interface Props { visa: Visa; onPress: () => void; compact?: boolean; }

export function VisaCard({ visa, onPress, compact }: Props) {
  const colors = useColors();
  const typeLabel = VISA_TYPES[visa.visaType] ?? visa.visaType;
  if (compact) return (
    <TouchableOpacity onPress={onPress} style={[styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8}>
      <View style={styles.compactImageWrap}><Image source={{ uri: visa.countryImageUrl }} style={styles.compactImage} contentFit="cover" /><LinearGradient colors={['transparent', 'rgba(0,0,0,0.45)']} style={styles.compactGrad} /><View style={[styles.compactBadge, { backgroundColor: colors.primary }]}><Text style={styles.compactBadgeText}>{typeLabel}</Text></View></View>
      <View style={styles.compactBody}><Text style={[styles.compactCountry, { color: colors.foreground }]} numberOfLines={1}>{visa.countryName}</Text><Text style={[styles.compactPrice, { color: colors.primary }]}>{visa.currency} {visa.price}</Text><Text style={[styles.compactMeta, { color: colors.mutedForeground }]}>{visa.processingTime}</Text></View>
    </TouchableOpacity>
  );
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.88}>
      <View style={styles.statusBadge}><Ionicons name="checkmark" size={13} color="#06251D" /><Text style={styles.statusText}>متاح الآن</Text></View>
      <View style={styles.countryRow}>
        <View style={styles.countryInfo}><Image source={{ uri: visa.countryFlagUrl }} style={styles.flag} contentFit="cover" /><Text style={styles.country}>{visa.countryName}</Text><Text style={styles.duration}>{typeLabel} لمدة {visa.stayDuration}</Text></View>
        <View style={styles.passportIcon}><Ionicons name="globe-outline" size={27} color="#E4B35B" /></View>
      </View>
      <View style={styles.detailRow}>
        <View style={styles.detailItem}><Ionicons name="airplane-outline" size={18} color="#D5DFEA" /><Text style={styles.detailLabel}>{typeLabel}</Text></View>
        <View style={styles.detailItem}><Ionicons name="time-outline" size={18} color="#9BAEC3" /><Text style={styles.detailLabel}>مدة المعالجة المتوقعة</Text><Text style={styles.detailValue}>{visa.processingTime}</Text></View>
      </View>
      <TouchableOpacity style={styles.detailsButton} onPress={onPress} activeOpacity={0.8}><Text style={styles.detailsText}>عرض التفاصيل</Text><Ionicons name="arrow-back" size={18} color="#162033" /></TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: '#284461', backgroundColor: '#0D2037', overflow: 'hidden', marginBottom: 14, padding: 16 },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#14B86E', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 18, marginBottom: 8 },
  statusText: { color: '#06251D', fontFamily: 'Tajawal_800ExtraBold', fontSize: 11 },
  countryRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  countryInfo: { alignItems: 'flex-end', flex: 1 },
  flag: { width: 42, height: 30, borderRadius: 5, marginBottom: 4 },
  country: { color: '#FFFFFF', fontSize: 21, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
  duration: { color: '#9BAEC3', fontSize: 13, fontFamily: 'Tajawal_500Medium', marginTop: 3 },
  passportIcon: { width: 58, height: 72, borderRadius: 17, borderWidth: 1, borderColor: '#233E5A', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  detailRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  detailItem: { alignItems: 'center', gap: 4, flex: 1 },
  detailLabel: { color: '#D5DFEA', fontFamily: 'Tajawal_700Bold', fontSize: 12, textAlign: 'center' },
  detailValue: { color: '#FFFFFF', fontFamily: 'Tajawal_800ExtraBold', fontSize: 13 },
  detailsButton: { backgroundColor: '#E4B35B', borderRadius: 24, minHeight: 46, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  detailsText: { color: '#162033', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  compactCard: { width: 148, borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginLeft: 12 },
  compactImageWrap: { position: 'relative' }, compactImage: { width: '100%', height: 96 }, compactGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },
  compactBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16 }, compactBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Tajawal_500Medium' },
  compactBody: { padding: 10 }, compactCountry: { fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 2 }, compactPrice: { fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 2 }, compactMeta: { fontSize: 11, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
});
