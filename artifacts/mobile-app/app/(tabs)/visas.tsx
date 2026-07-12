import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useListVisas } from '@workspace/api-client-react';
import type { VisaType } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { VisaCard } from '@/components/VisaCard';

type Filter = VisaType | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'tourism', label: 'سياحية' },
  { key: 'business', label: 'عمل' },
  { key: 'medical', label: 'علاجية' },
  { key: 'study', label: 'دراسة' },
  { key: 'visit', label: 'زيارة' },
  { key: 'investment', label: 'استثمار' },
];

export default function VisasScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const { data: visas, isLoading } = useListVisas(
    filter === 'all' ? undefined : { visaType: filter },
  );

  const filtered = (visas ?? []).filter(v =>
    !search || v.countryName.toLowerCase().includes(search.toLowerCase()),
  );

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: paddingTop + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>التأشيرات</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="ابحث عن دولة..."
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

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row-reverse', gap: 8, paddingVertical: 10 }}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.key ? colors.primary : colors.card,
                borderColor: filter === f.key ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterLabel, { color: filter === f.key ? '#fff' : colors.foreground }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد تأشيرات متاحة</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <VisaCard
              visa={item}
              onPress={() => router.push(`/visa/${item.id}` as any)}
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
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: { fontSize: 13, fontFamily: 'Tajawal_500Medium' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Tajawal_400Regular' },
});
