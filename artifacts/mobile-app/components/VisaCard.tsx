import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Visa } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const VISA_TYPES: Record<string, string> = {
  tourism:    'سياحية',
  business:   'عمل',
  medical:    'علاجية',
  study:      'دراسة',
  visit:      'زيارة',
  investment: 'استثمار',
};

interface Props {
  visa: Visa;
  onPress: () => void;
  compact?: boolean;
}

export function VisaCard({ visa, onPress, compact }: Props) {
  const colors = useColors();
  const typeLabel = VISA_TYPES[visa.visaType] ?? visa.visaType;

  // ── Compact mode (horizontal scroll on home) ─────────────────────────────
  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.8}
      >
        <View style={styles.compactImageWrap}>
          <Image source={{ uri: visa.countryImageUrl }} style={styles.compactImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            style={styles.compactGrad}
            pointerEvents="none"
          />
          <View style={[styles.compactBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.compactBadgeText}>{typeLabel}</Text>
          </View>
        </View>
        <View style={styles.compactBody}>
          <Text style={[styles.compactCountry, { color: colors.foreground }]} numberOfLines={1}>
            {visa.countryName}
          </Text>
          <Text style={[styles.compactPrice, { color: colors.primary }]}>
            {visa.currency} {visa.price}
          </Text>
          <Text style={[styles.compactMeta, { color: colors.mutedForeground }]}>
            {visa.processingTime}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Standard mode (full list) ─────────────────────────────────────────────
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.85}
    >
      {/* Image + gradient */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: visa.countryImageUrl }} style={styles.image} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.52)']}
          style={styles.imageGrad}
          pointerEvents="none"
        />
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.typeBadgeText}>{typeLabel}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Country + flag */}
        <View style={styles.countryRow}>
          <Image source={{ uri: visa.countryFlagUrl }} style={styles.flag} contentFit="cover" />
          <Text style={[styles.country, { color: colors.foreground }]}>{visa.countryName}</Text>
        </View>

        {/* Meta grid */}
        <View style={[styles.metaGrid, { borderTopColor: colors.border }]}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>المدة</Text>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>{visa.processingTime}</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>الإقامة</Text>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>{visa.stayDuration}</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metaItem}>
            <Ionicons name="card-outline" size={13} color={colors.primary} />
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>السعر</Text>
            <Text style={[styles.metaValue, { color: colors.primary }]}>
              {visa.currency} {visa.price}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Standard card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 150 },
  imageGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  typeBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  typeBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Tajawal_500Medium' },

  body: { padding: 14 },
  countryRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  flag: { width: 26, height: 18, borderRadius: 3 },
  country: { fontSize: 16, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },

  metaGrid: {
    flexDirection: 'row-reverse', borderTopWidth: 1, paddingTop: 12, gap: 0,
  },
  metaItem: { flex: 1, alignItems: 'center', gap: 3 },
  metaDivider: { width: 1, marginHorizontal: 4 },
  metaLabel: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  metaValue: { fontSize: 13, fontFamily: 'Tajawal_700Bold' },

  // Compact card
  compactCard: {
    width: 148,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  compactImageWrap: { position: 'relative' },
  compactImage: { width: '100%', height: 96 },
  compactGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },
  compactBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16,
  },
  compactBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Tajawal_500Medium' },
  compactBody: { padding: 10 },
  compactCountry: { fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 2 },
  compactPrice: { fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 2 },
  compactMeta: { fontSize: 11, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
});
