import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Package } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

interface Props {
  pkg: Package;
  onPress: () => void;
}

export function PackageCard({ pkg, onPress }: Props) {
  const colors = useColors();
  const image = pkg.images[0];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.85}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]} />
      )}
      <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.priceText}>{pkg.currency} {pkg.priceFrom}</Text>
        <Text style={styles.priceSubText}>يبدأ من</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{pkg.name}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.location, { color: colors.mutedForeground }]}>{pkg.city}، {pkg.country}</Text>
        </View>
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: colors.foreground }]}>{pkg.nights}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>ليلة</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: colors.foreground }]}>{pkg.days}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>يوم</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.starRow}>
            {[1,2,3,4,5].map(s => (
              <Ionicons
                key={s}
                name={s <= Math.round(pkg.rating ?? 0) ? 'star' : 'star-outline'}
                size={12}
                color={colors.primary}
              />
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  image: { width: '100%', height: 180 },
  imagePlaceholder: { width: '100%', height: 180 },
  priceBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  priceText: { color: '#fff', fontSize: 13, fontFamily: 'Tajawal_700Bold' },
  priceSubText: { color: '#ffffffcc', fontSize: 10, fontFamily: 'Tajawal_400Regular' },
  body: { padding: 14 },
  name: { fontSize: 16, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 4 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginBottom: 10 },
  location: { fontSize: 13, fontFamily: 'Tajawal_400Regular' },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', borderTopWidth: 1, paddingTop: 10, gap: 12 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 15, fontFamily: 'Tajawal_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  divider: { width: 1, height: 20 },
  starRow: { flexDirection: 'row', gap: 2, marginRight: 'auto' as any },
});
