/**
 * ServiceUnavailable — shown when an admin has disabled a service.
 * Reusable screen guard for flights / visas / packages tabs.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const NAVY  = '#060B18';
const NAVY2 = '#0C1628';

interface Props {
  serviceName: string;
  icon: string;
}

export function ServiceUnavailable({ serviceName, icon }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[NAVY, NAVY2, colors.background]}
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={icon as any} size={44} color="rgba(255,255,255,0.25)" />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="pause-circle-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>الخدمة موقوفة مؤقتاً</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>{serviceName}</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          هذه الخدمة غير متاحة حالياً.{'\n'}يرجى التواصل معنا أو المحاولة لاحقاً.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
            سيتم إعادة تشغيل الخدمة قريباً. شكراً لتفهمك.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: { alignItems: 'center', paddingBottom: 40 },
  iconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20,
  },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 32, alignItems: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, marginBottom: 20,
  },
  badgeText: { fontFamily: 'Tajawal_500Medium', fontSize: 12 },
  title: {
    fontFamily: 'Tajawal_800ExtraBold', fontSize: 26,
    textAlign: 'center', marginBottom: 12,
  },
  sub: {
    fontFamily: 'Tajawal_400Regular', fontSize: 15,
    textAlign: 'center', lineHeight: 24, marginBottom: 32,
  },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 16, borderRadius: 16, borderWidth: 1,
    width: '100%',
  },
  cardText: {
    fontFamily: 'Tajawal_400Regular', fontSize: 13,
    lineHeight: 20, flex: 1, textAlign: 'right',
  },
});
