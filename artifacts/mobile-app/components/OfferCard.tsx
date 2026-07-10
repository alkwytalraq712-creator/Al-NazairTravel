import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import type { Package } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

interface Props {
  pkg: Package;
  onPress: () => void;
}

export function OfferCard({ pkg, onPress }: Props) {
  const colors = useColors();
  const image = pkg.images[0];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.85}
    >
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, { backgroundColor: colors.muted }]} />
        )}
      </View>
      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{pkg.city}</Text>
      <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
        {pkg.days} أيام / {pkg.nights} ليالي
      </Text>
      <Text style={[styles.price, { color: colors.primary }]}>
        {pkg.currency}{pkg.priceFrom} <Text style={styles.priceSuffix}>بدأ من</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: 130 },
  imageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: { width: 130, height: 100 },
  name: { fontSize: 14, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 2 },
  meta: { fontSize: 11, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginBottom: 4 },
  price: { fontSize: 13, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
  priceSuffix: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
});
