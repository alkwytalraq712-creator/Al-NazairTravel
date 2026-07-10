import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import type { Visa } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const VISA_TYPES: Record<string, string> = {
  tourism: 'سياحية',
  business: 'عمل',
  medical: 'علاجية',
  study: 'دراسة',
  visit: 'زيارة',
  investment: 'استثمار',
};

interface Props {
  visa: Visa;
  onPress: () => void;
  compact?: boolean;
}

export function VisaCard({ visa, onPress, compact }: Props) {
  const colors = useColors();

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.8}
      >
        <Image source={{ uri: visa.countryImageUrl }} style={styles.compactImage} contentFit="cover" />
        <View style={styles.compactBody}>
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{VISA_TYPES[visa.visaType] ?? visa.visaType}</Text>
          </View>
          <Text style={[styles.compactCountry, { color: colors.foreground }]} numberOfLines={1}>{visa.countryName}</Text>
          <Text style={[styles.compactPrice, { color: colors.primary }]}>{visa.currency} {visa.price}</Text>
          <Text style={[styles.compactMeta, { color: colors.mutedForeground }]}>{visa.processingTime}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.85}
    >
      <Image source={{ uri: visa.countryImageUrl }} style={styles.image} contentFit="cover" />
      <View style={styles.overlay}>
        <View style={[styles.badge, { backgroundColor: '#000000aa' }]}>
          <Text style={[styles.badgeText, { color: '#fff' }]}>{VISA_TYPES[visa.visaType] ?? visa.visaType}</Text>
        </View>
      </View>
      <View style={[styles.body, { borderColor: colors.border }]}>
        <View style={styles.row}>
          <Image source={{ uri: visa.countryFlagUrl }} style={styles.flag} contentFit="cover" />
          <Text style={[styles.country, { color: colors.foreground }]}>{visa.countryName}</Text>
        </View>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>المدة</Text>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>{visa.processingTime}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>الإقامة</Text>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>{visa.stayDuration}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>السعر</Text>
            <Text style={[styles.metaValue, { color: colors.primary }]}>{visa.currency} {visa.price}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  image: { width: '100%', height: 140 },
  overlay: { position: 'absolute', top: 10, left: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: 'Tajawal_500Medium' },
  body: { padding: 14 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 },
  flag: { width: 24, height: 16, borderRadius: 2 },
  country: { fontSize: 16, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },
  meta: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  metaItem: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 11, fontFamily: 'Tajawal_400Regular', marginBottom: 2 },
  metaValue: { fontSize: 13, fontFamily: 'Tajawal_700Bold' },
  // Compact
  compactCard: {
    width: 150,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  compactImage: { width: '100%', height: 90 },
  compactBody: { padding: 10 },
  compactCountry: { fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginTop: 4 },
  compactPrice: { fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginTop: 2 },
  compactMeta: { fontSize: 11, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
});
