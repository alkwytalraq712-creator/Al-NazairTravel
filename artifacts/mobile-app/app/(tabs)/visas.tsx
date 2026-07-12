import React, { useState, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useListVisas } from '@workspace/api-client-react';
import type { VisaType } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { VisaCard } from '@/components/VisaCard';
import { useServiceSettings } from '@/context/ServiceSettingsContext';
import { ServiceUnavailable } from '@/components/ServiceUnavailable';


type Filter = VisaType | 'all';

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: 'all',        label: 'الكل',      icon: 'apps'              },
  { key: 'tourism',    label: 'سياحية',    icon: 'sunny'             },
  { key: 'business',   label: 'عمل',       icon: 'briefcase'         },
  { key: 'medical',    label: 'علاجية',    icon: 'medical'           },
  { key: 'study',      label: 'دراسة',     icon: 'school'            },
  { key: 'visit',      label: 'زيارة',     icon: 'person-add'        },
  { key: 'investment', label: 'استثمار',   icon: 'trending-up'       },
];

export default function VisasScreen() {
  const insets   = useSafeAreaInsets();
  const colors   = useColors();
  const inputRef = useRef<TextInput>(null);
  const { visasEnabled } = useServiceSettings();

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  if (!visasEnabled) return <ServiceUnavailable serviceName="التأشيرات" icon="document-text-outline" />;

  const { data: visas, isLoading } = useListVisas(
    filter === 'all' ? undefined : { visaType: filter },
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visas ?? [];
    return (visas ?? []).filter(v =>
      v.countryName.toLowerCase().includes(q) ||
      (v.countryName ?? '').includes(search.trim()),
    );
  }, [visas, search]);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <LinearGradient
        colors={['#0B1628', '#132039']}
        style={[s.header, { paddingTop: paddingTop + 10 }]}
      >
        <Text style={s.headerTitle}>التأشيرات</Text>
        <Text style={s.headerSub}>اختر وجهتك واستكشف تأشيراتها</Text>

        {/* Search bar */}
        <Pressable
          style={s.searchWrap}
          onPress={() => inputRef.current?.focus()}
        >
          <Ionicons name="search" size={17} color="rgba(255,255,255,0.45)" style={{ marginLeft: 8 }} />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="ابحث عن دولة..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearch(''); inputRef.current?.focus(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={s.clearBtn}
            >
              <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>
          )}
        </Pressable>
      </LinearGradient>

      {/* ── Type filter chips ── */}
      <View style={[s.chipsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <FlatList
          data={FILTERS}
          horizontal
          inverted           // RTL: show rightmost first
          showsHorizontalScrollIndicator={false}
          keyExtractor={f => f.key}
          contentContainerStyle={s.chipsContent}
          renderItem={({ item: f }) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.75}
                style={[
                  s.chip,
                  active
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.muted, borderColor: 'transparent' },
                ]}
              >
                <Ionicons
                  name={`${f.icon}-outline` as any}
                  size={14}
                  color={active ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text style={[s.chipLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── Results count ── */}
      {!isLoading && (
        <View style={s.countBar}>
          <Text style={[s.countText, { color: colors.mutedForeground }]}>
            {search
              ? `نتائج البحث عن "${search}" — ${filtered.length} تأشيرة`
              : `${filtered.length} تأشيرة متاحة`}
          </Text>
        </View>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>جاري التحميل...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <View style={[s.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons
              name={search ? 'search-outline' : 'earth-outline'}
              size={36}
              color={colors.mutedForeground}
            />
          </View>
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>
            {search ? `لا نتائج لـ "${search}"` : 'لا توجد تأشيرات'}
          </Text>
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
            {search ? 'جرّب دولة أخرى أو امسح البحث' : 'جرّب تغيير نوع التأشيرة'}
          </Text>
          {search ? (
            <TouchableOpacity
              style={[s.clearAllBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
              onPress={() => setSearch('')}
            >
              <Text style={[s.clearAllText, { color: colors.primary }]}>مسح البحث</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 100 }}
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

const s = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  headerTitle: {
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 26,
    color: '#fff',
    textAlign: 'right',
  },
  headerSub: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.50)',
    textAlign: 'right',
    marginTop: 2,
    marginBottom: 14,
  },

  // Search
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Tajawal_400Regular',
    fontSize: 14,
    color: '#fff',
    paddingVertical: 0,
  },
  clearBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter chips row
  chipsContainer: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipLabel: {
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
  },

  // Count bar
  countBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  countText: {
    fontFamily: 'Tajawal_400Regular',
    fontSize: 12,
    textAlign: 'right',
  },

  // Empty state
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: 'Tajawal_700Bold', fontSize: 16, textAlign: 'center' },
  emptyText: { fontFamily: 'Tajawal_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  clearAllBtn: { marginTop: 6, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  clearAllText: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },
});
