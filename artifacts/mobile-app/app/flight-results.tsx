import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator, FlatList, Platform, StyleSheet,
  Text, TouchableOpacity, View, ScrollView, Switch,
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

type SortKey = 'price_asc' | 'price_desc' | 'duration' | 'depart' | 'arrive';
type StopsFilter = 'any' | 'nonstop' | '1stop';
type TimeWindow = 'any' | 'morning' | 'afternoon' | 'evening' | 'night';

const SORT_LABELS: Record<SortKey, string> = {
  price_asc: 'الأرخص',
  price_desc: 'الأغلى',
  duration: 'الأقصر',
  depart: 'أبكر مغادرة',
  arrive: 'أبكر وصول',
};

const STOPS_LABELS: Record<StopsFilter, string> = {
  any: 'الكل',
  nonstop: 'مباشر',
  '1stop': 'توقف واحد',
};

const TIME_LABELS: Record<TimeWindow, string> = {
  any: 'أي وقت',
  morning: 'صباحاً (06-12)',
  afternoon: 'ظهراً (12-18)',
  evening: 'مساءً (18-24)',
  night: 'ليلاً (00-06)',
};

function hourOf(iso: string): number {
  try { return new Date(iso).getUTCHours(); } catch { return 0; }
}

function inWindow(hour: number, w: TimeWindow): boolean {
  if (w === 'any') return true;
  if (w === 'morning') return hour >= 6 && hour < 12;
  if (w === 'afternoon') return hour >= 12 && hour < 18;
  if (w === 'evening') return hour >= 18 && hour < 24;
  return hour >= 0 && hour < 6;
}

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
  const [departWindow, setDepartWindow] = useState<TimeWindow>('any');
  const [arriveWindow, setArriveWindow] = useState<TimeWindow>('any');
  const [airlineFilter, setAirlineFilter] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const airlines = useMemo(() => {
    if (!flights) return [];
    return Array.from(new Set(flights.map(f => f.airlineName)));
  }, [flights]);

  const priceBounds = useMemo(() => {
    if (!flights || !flights.length) return { min: 0, max: 0 };
    const prices = flights.map(f => f.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [flights]);

  const filtered = useMemo(() => {
    if (!flights) return [];
    let res = [...flights];
    if (stopsFilter === 'nonstop') res = res.filter(f => f.stops === 0);
    else if (stopsFilter === '1stop') res = res.filter(f => f.stops === 1);
    if (airlineFilter.size > 0) res = res.filter(f => airlineFilter.has(f.airlineName));
    if (maxPrice != null) res = res.filter(f => f.price <= maxPrice);
    if (departWindow !== 'any') res = res.filter(f => inWindow(hourOf(f.departTime), departWindow));
    if (arriveWindow !== 'any') res = res.filter(f => inWindow(hourOf(f.arriveTime), arriveWindow));
    switch (sort) {
      case 'price_asc': res.sort((a, b) => a.price - b.price); break;
      case 'price_desc': res.sort((a, b) => b.price - a.price); break;
      case 'duration': res.sort((a, b) => a.durationMinutes - b.durationMinutes); break;
      case 'depart': res.sort((a, b) => new Date(a.departTime).getTime() - new Date(b.departTime).getTime()); break;
      case 'arrive': res.sort((a, b) => new Date(a.arriveTime).getTime() - new Date(b.arriveTime).getTime()); break;
    }
    return res;
  }, [flights, sort, stopsFilter, airlineFilter, maxPrice, departWindow, arriveWindow]);

  const activeFilterCount =
    (stopsFilter !== 'any' ? 1 : 0) +
    airlineFilter.size +
    (maxPrice != null ? 1 : 0) +
    (departWindow !== 'any' ? 1 : 0) +
    (arriveWindow !== 'any' ? 1 : 0);

  function clearFilters() {
    setStopsFilter('any');
    setAirlineFilter(new Set());
    setMaxPrice(null);
    setDepartWindow('any');
    setArriveWindow('any');
  }

  function toggleAirline(name: string) {
    setAirlineFilter(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

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
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{params.from} ← {params.to}</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{params.departDate} • {params.adults ?? 1} مسافر</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(v => !v)}
          style={[styles.filterBtn, { borderColor: colors.border, backgroundColor: showFilters ? '#C9A060' : colors.muted }, showFilters && { backgroundColor: '#C9A060' }]}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color={showFilters ? '#0B1628' : colors.foreground} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <ScrollView style={[styles.filterPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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

          <Text style={[styles.filterTitle, { color: colors.foreground, marginTop: 12 }]}>التوقفات</Text>
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

          {airlines.length > 1 && (
            <>
              <Text style={[styles.filterTitle, { color: colors.foreground, marginTop: 12 }]}>شركات الطيران</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {airlines.map(name => (
                  <TouchableOpacity
                    key={name}
                    style={[styles.chip, { borderColor: colors.border, backgroundColor: airlineFilter.has(name) ? '#C9A060' : colors.muted }]}
                    onPress={() => toggleAirline(name)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, { color: airlineFilter.has(name) ? '#0B1628' : colors.foreground }]}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[styles.filterTitle, { color: colors.foreground, marginTop: 12 }]}>وقت المغادرة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {(Object.keys(TIME_LABELS) as TimeWindow[]).map(k => (
              <TouchableOpacity
                key={k}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: departWindow === k ? '#C9A060' : colors.muted }]}
                onPress={() => setDepartWindow(k)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: departWindow === k ? '#0B1628' : colors.foreground }]}>{TIME_LABELS[k]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filterTitle, { color: colors.foreground, marginTop: 12 }]}>وقت الوصول</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {(Object.keys(TIME_LABELS) as TimeWindow[]).map(k => (
              <TouchableOpacity
                key={k}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: arriveWindow === k ? '#C9A060' : colors.muted }]}
                onPress={() => setArriveWindow(k)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: arriveWindow === k ? '#0B1628' : colors.foreground }]}>{TIME_LABELS[k]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {priceBounds.max > priceBounds.min && (
            <>
              <Text style={[styles.filterTitle, { color: colors.foreground, marginTop: 12 }]}>
                الحد الأقصى للسعر: {maxPrice != null ? `$${maxPrice}` : 'بلا حد'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {[0.25, 0.5, 0.75, 1].map(pct => {
                  const val = Math.round(priceBounds.min + (priceBounds.max - priceBounds.min) * pct);
                  const active = maxPrice === val;
                  return (
                    <TouchableOpacity
                      key={pct}
                      style={[styles.chip, { borderColor: colors.border, backgroundColor: active ? '#C9A060' : colors.muted }]}
                      onPress={() => setMaxPrice(active ? null : val)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, { color: active ? '#0B1628' : colors.foreground }]}>حتى ${val}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearBtn} activeOpacity={0.8}>
              <Text style={[styles.clearBtnText, { color: colors.primary }]}>مسح كل الفلاتر</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
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
          <TouchableOpacity onPress={clearFilters} style={[styles.retryBtn, { borderWidth: 1.5, borderColor: colors.primary }]}>
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
  filterBadge: { position: 'absolute', top: -4, left: -4, backgroundColor: '#EF4444', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  filterBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Tajawal_700Bold' },
  filterPanel: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, maxHeight: 340 },
  filterTitle: { fontSize: 12, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: 'Tajawal_500Medium', fontSize: 13 },
  clearBtn: { alignItems: 'center', paddingVertical: 10, marginTop: 8, marginBottom: 4 },
  clearBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  loadingText: { fontFamily: 'Tajawal_400Regular', fontSize: 14 },
  emptyText: { fontSize: 18, fontFamily: 'Tajawal_700Bold', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  resultsBar: { padding: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  resultsCount: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
});
