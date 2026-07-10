import React from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getSearchFlightsQueryKey, useSearchFlights } from '@workspace/api-client-react';
import type { CabinClass, FlightOffer } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { FlightCard } from '@/components/FlightCard';
import { useAuth } from '@/context/AuthContext';

export default function FlightResultsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
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
  const { data: flights, isLoading, isError, refetch } = useSearchFlights(
    searchParams,
    { query: { queryKey: getSearchFlightsQueryKey(searchParams), enabled } as any },
  );

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  function handleBook(flight: FlightOffer) {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    router.push({ pathname: '/book-flight', params: { offer: JSON.stringify(flight) } } as any);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{params.from} ← {params.to}</Text>
          <Text style={styles.headerSub}>{params.departDate} • {params.adults ?? 1} مسافر</Text>
        </View>
      </View>

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
      ) : !flights?.length ? (
        <View style={styles.center}>
          <Ionicons name="airplane-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>لا توجد رحلات متاحة</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.retryBtn, { borderWidth: 1.5, borderColor: colors.primary }]}>
            <Text style={{ color: colors.primary, fontFamily: 'Tajawal_700Bold' }}>تعديل البحث</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.resultsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>{flights.length} رحلة متاحة</Text>
          </View>
          <FlatList
            data={flights}
            keyExtractor={(f) => f.id}
            contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 34 : 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <FlightCard flight={item} onBook={() => handleBook(item)} />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  loadingText: { fontFamily: 'Tajawal_400Regular', fontSize: 14 },
  emptyText: { fontSize: 18, fontFamily: 'Tajawal_700Bold', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  resultsBar: { padding: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  resultsCount: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
});
