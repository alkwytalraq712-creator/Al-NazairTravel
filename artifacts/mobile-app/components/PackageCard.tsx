import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Package } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

interface Props {
  pkg: Package;
  onPress: () => void;
}

export function PackageCard({ pkg, onPress }: Props) {
  const colors = useColors();
  const image  = pkg.images?.[0];
  const rating = Math.round(pkg.rating ?? 0);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.88}
    >
      {/* ── Image with gradient overlay ── */}
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, { backgroundColor: colors.muted }]} />
        )}

        {/* Bottom gradient for depth */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.42)']}
          style={styles.imageGrad}
          pointerEvents="none"
        />

        {/* Price badge — top-left (RTL) */}
        <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.priceSub}>يبدأ من</Text>
          <Text style={styles.priceMain}>{pkg.currency} {pkg.priceFrom}</Text>
        </View>

        {/* Days/nights badge — top-right (RTL) */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{pkg.nights}ن / {pkg.days}ي</Text>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {pkg.name}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.location, { color: colors.mutedForeground }]}>
            {pkg.city}، {pkg.country}
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name={s <= rating ? 'star' : 'star-outline'}
                size={13}
                color={colors.primary}
              />
            ))}
          </View>

          {/* Hotel stars badge */}
          {pkg.hotelStars > 0 && (
            <View style={[styles.hotelBadge, { backgroundColor: colors.muted }]}>
              <Ionicons name="business-outline" size={11} color={colors.mutedForeground} />
              <Text style={[styles.hotelText, { color: colors.mutedForeground }]}>
                {pkg.hotelStars}★
              </Text>
            </View>
          )}

          {/* Meals */}
          {!!pkg.meals && (
            <View style={[styles.mealsBadge, { backgroundColor: colors.accent }]}>
              <Ionicons name="restaurant-outline" size={11} color={colors.primary} />
              <Text style={[styles.mealsText, { color: colors.primary }]}>{pkg.meals}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },

  // Image
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 195 },
  imageGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 70,
  },

  // Price badge — sits over image top-left
  priceBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 22, alignItems: 'center',
  },
  priceSub:  { color: 'rgba(255,255,255,0.82)', fontSize: 9,  fontFamily: 'Tajawal_400Regular' },
  priceMain: { color: '#fff',                  fontSize: 14, fontFamily: 'Tajawal_700Bold' },

  // Duration badge — top-right
  durationBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.48)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  durationText: { color: '#fff', fontSize: 11, fontFamily: 'Tajawal_500Medium' },

  // Body
  body: { padding: 14 },
  name: { fontSize: 16, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 5 },
  locationRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginBottom: 12 },
  location: { fontSize: 13, fontFamily: 'Tajawal_400Regular' },

  // Footer
  footer: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    borderTopWidth: 1, paddingTop: 10,
  },
  starsRow: { flexDirection: 'row', gap: 2, flex: 1, justifyContent: 'flex-end' },
  hotelBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  hotelText: { fontSize: 11, fontFamily: 'Tajawal_500Medium' },
  mealsBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  mealsText: { fontSize: 11, fontFamily: 'Tajawal_500Medium' },
});
