import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useListPackages } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { PackageCard } from '@/components/PackageCard';

export default function PackagesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');

  const { data: packages, isLoading, refetch } = useListPackages(
    country ? { country } : undefined,
  );

  const filtered = (packages ?? []).filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.country.toLowerCase().includes(search.toLowerCase()),
  );

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <Text style={styles.headerTitle}>الباقات السياحية</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="ابحث عن باقة أو دولة..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="map-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد باقات متاحة</Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.primary }]}>
            <Text style={[styles.retryText, { color: colors.primary }]}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PackageCard
              pkg={item}
              onPress={() => router.push(`/package/${item.id}` as any)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, alignItems: 'flex-end' },
  headerTitle: { fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', color: '#fff' },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontFamily: 'Tajawal_400Regular', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Tajawal_400Regular' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, marginTop: 8 },
  retryText: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
});
