import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { FlightOffer } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

interface Props {
  flight: FlightOffer;
  onBook: () => void;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return iso;
  }
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}س ${m}د`;
}

export function FlightCard({ flight, onBook }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBook}
          style={[styles.bookBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.bookText}>احجز</Text>
        </TouchableOpacity>
        <View style={styles.airlineInfo}>
          <Text style={[styles.flightNum, { color: colors.mutedForeground }]}>{flight.flightNumber}</Text>
          <Text style={[styles.airlineName, { color: colors.foreground }]}>{flight.airlineName}</Text>
        </View>
        <Image
          source={{ uri: flight.airlineLogoUrl }}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <View style={styles.route}>
        <View style={styles.airport}>
          <Text style={[styles.airportCode, { color: colors.foreground }]}>{flight.toAirport}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{formatTime(flight.arriveTime)}</Text>
        </View>
        <View style={styles.middle}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.duration, { color: colors.mutedForeground }]}>{formatDuration(flight.durationMinutes)}</Text>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          {flight.stops > 0 && (
            <Text style={[styles.stops, { color: colors.warning }]}>{flight.stops} توقف</Text>
          )}
        </View>
        <View style={styles.airport}>
          <Text style={[styles.airportCode, { color: colors.foreground }]}>{flight.fromAirport}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{formatTime(flight.departTime)}</Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.price, { color: colors.primary }]}>{flight.currency} {flight.price}</Text>
        <View style={styles.classRow}>
          <Ionicons name="airplane" size={14} color={colors.mutedForeground} />
          <Text style={[styles.classText, { color: colors.mutedForeground }]}>
            {flight.stops === 0 ? 'مباشر' : `${flight.stops} توقف`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  airlineInfo: { alignItems: 'flex-end' },
  airlineName: { fontSize: 14, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },
  flightNum: { fontSize: 11, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
  logo: { width: 44, height: 44, borderRadius: 8 },
  bookBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bookText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 13 },
  route: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  airport: { alignItems: 'flex-end' },
  airportCode: { fontSize: 22, fontFamily: 'Tajawal_800ExtraBold' },
  time: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  middle: { flex: 1, alignItems: 'center', paddingHorizontal: 8, position: 'relative' },
  line: { position: 'absolute', left: 8, right: 8, height: 1, top: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  duration: { fontSize: 11, fontFamily: 'Tajawal_400Regular', marginVertical: 4 },
  stops: { fontSize: 11, fontFamily: 'Tajawal_500Medium', position: 'absolute', bottom: -14 },
  footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 12 },
  price: { fontSize: 18, fontFamily: 'Tajawal_800ExtraBold' },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  classText: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
});
