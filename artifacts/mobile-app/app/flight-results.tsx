import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator, FlatList, Platform, StyleSheet,
  Text, TouchableOpacity, View, ScrollView, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { FlightCard } from '@/components/FlightCard';
import { useAuth } from '@/context/AuthContext';
import { useFlightBookingContext } from '@/context/FlightBookingContext';
import { useFlightSearch } from '@/lib/flightService';
import type { FlightOffer, CabinClass } from '@/lib/flightService';

type SortKey = 'price_asc' | 'price_desc' | 'duration' | 'depart';
type StopsFilter = 'any' | 'nonstop' | '1stop';

const SORT_LABELS: Record<SortKey, string> = {
  price_asc: 'الأرخص',
  price_desc: 'الأغلى',
  duration: 'الأقصر',
  depart: 'أبكر مغادرة',
};

const STOPS_LABELS: Record<StopsFilter, string> = {
  any: 'الكل',
  nonstop: 'مباشر',
  '1stop': 'توقف واحد',
};

export default function FlightResultsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const { setOffer } = useFlightBookingContext();

  const params = useLocalSearchParams<{
    from: string; to: string; departDate: string;
    returnDate?: string; adults?: string; children?: string;
    cabinClass?: string; tripType?: string;
  }>();

  const searchParams = {
    from: params.from ?? '',
    to: params.to ?? '',
    departDate: params.departDate ?? '',
    returnDate: params.returnDate,
    adults: params.adults ? Number(params.adults) : 1,
    children: params.children ? Number(params.children) : 0,
    cabinClass: (params.cabinClass ?? 'economy') as CabinClass,
  };

  const enabled = !!(params.from && params.to && params.departDate);
  const { data: flights, isLoading, isError, refetch } = useFlightSearch(searchParams, enabled);

  const [sort, setSort] = useState<SortKey>('price_asc');
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>('any');
  const [showFilters, setShowFilters] = useState(false);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = useMemo(() => {
    if (!flights) return [];
    let res = [...flights];
    if (stopsFilter === 'nonstop') res = res.filter(f => f.stops === 0);
    else if (stopsFilter === '1stop') res = res.filter(f => f.stops === 1);
    switch (sort) {
      case 'price_asc': res.sort((a, b) => a.price - b.price); break;
      case 'price_desc': res.sort((a, b) => b.price - a.price); break;
      case 'duration': res.sort((a, b) => a.durationMinutes - b.durationMinutes); break;
      case 'depart': res.sort((a, b) => new Date(a.departTime).getTime() - new Date(b.departTime).getTime()); break;
    }
    return res;
  }, [flights, sort, stopsFilter]);

  function handleSelect(flight: FlightOffer) {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    setOffer(flight);
    router.push({ pathname: '/flight-details', params: { offer: JSON.stringify(flight), adults: params.adults ?? '1', children: params.children ?? '0' } } as any);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{params.from} ← {params.to}</Text>
          <Text style={styles.headerSub}>{params.departDate} • {params.adults ?? 1} مسافر</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(v => !v)}
          style={[styles.filterBtn, showFilters && { backgroundColor: '#C9A060' }]}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color={showFilters ? '#0B1628' : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.filterTitle, { color: colors.foreground }]}>الفرز</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
              <TouchableOpacity
                key={k}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: sort === k ? '#C9A060' : colors.muted }]}
                onPress={() => setSort(k)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: sort === k ? '#0B1628' : colors.foreground }]}>{SORT_LABELS[k]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={[styles.filterTitle, { color: colors.foreground, marginTop: 8 }]}>التوقفات</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {(Object.keys(STOPS_LABELS) as StopsFilter[]).map(k => (
              <TouchableOpacity
                key={k}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: stopsFilter === k ? '#C9A060' : colors.muted }]}
                onPress={() => setStopsFilter(k)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: stopsFilter === k ? '#0B1628' : colors.foreground }]}>{STOPS_LABELS[k]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>جاري البحث عن رحلات...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="airplane-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>لم يتم العثور على رحلات</Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold' }}>إعادة البحث</Text>
          </TouchableOpacity>
        </View>
      ) : !filtered.length ? (
        <View style={styles.center}>
          <Ionicons name="airplane-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>لا توجد رحلات بهذا الفلتر</Text>
          <TouchableOpacity onPress={() => { setStopsFilter('any'); setSort('price_asc'); }} style={[styles.retryBtn, { borderWidth: 1.5, borderColor: colors.primary }]}>
            <Text style={{ color: colors.primary, fontFamily: 'Tajawal_700Bold' }}>مسح الفلاتر</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.resultsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>{filtered.length} رحلة متاحة</Text>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(f) => f.id}
            contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 34 : 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <FlightCard flight={item} onBook={() => handleSelect(item)} />
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  headerInfo: { flex: 1, alignItems: 'flex-end' },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Tajawal_800ExtraBold' },
  headerSub: { color: '#ffffffaa', fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  filterBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  filterPanel: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  filterTitle: { fontSize: 12, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: 'Tajawal_500Medium', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  loadingText: { fontFamily: 'Tajawal_400Regular', fontSize: 14 },
  emptyText: { fontSize: 18, fontFamily: 'Tajawal_700Bold', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  resultsBar: { padding: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  resultsCount: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
});
