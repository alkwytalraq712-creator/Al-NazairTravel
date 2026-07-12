/**
 * CountryPickerFlight — searchable country picker for flight booking forms.
 * Displays English names sorted A-Z, stores ISO 3166-1 alpha-2 code (uppercase).
 */
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES_EN, flagUrl as flagUrlFn } from '@/lib/countriesEn';

const GOLD = '#C9A060';
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const DARK3 = '#182540';
const BORDER = 'rgba(255,255,255,0.10)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';
const INPUT_BG = 'rgba(255,255,255,0.07)';
const ERROR_COLOR = '#EF4444';

// Already sorted A-Z in the source file
const SORTED_COUNTRIES = COUNTRIES_EN;

interface Props {
  value: string;           // ISO 2-letter code (uppercase), e.g. "IQ"
  onChange: (code: string, nameEn: string) => void;
  label: string;
  required?: boolean;
  hasError?: boolean;
  errorText?: string;
  optional?: boolean;
}

export default function CountryPickerFlight({
  value, onChange, label, required, hasError, errorText, optional,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => SORTED_COUNTRIES.find(c => c.code.toUpperCase() === value?.toUpperCase()),
    [value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SORTED_COUNTRIES;
    return SORTED_COUNTRIES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase() === q,
    );
  }, [query]);

  return (
    <>
      {/* Trigger button */}
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>
          {label}{' '}
          {required && <Text style={{ color: ERROR_COLOR }}>*</Text>}
          {optional && <Text style={{ color: MUTED }}> (اختياري)</Text>}
        </Text>
        <TouchableOpacity
          style={[styles.pickerBtn, hasError && styles.pickerBtnError]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          {selected ? (
            <View style={styles.pickerSelected}>
              <Image
                source={{ uri: flagUrlFn(selected.code) }}
                style={styles.flag}
                contentFit="cover"
              />
              <Text style={styles.pickerSelectedText}>{selected.name}</Text>
              <Ionicons name="chevron-down" size={14} color={MUTED} />
            </View>
          ) : (
            <View style={styles.pickerSelected}>
              <Ionicons name="earth-outline" size={18} color={MUTED} />
              <Text style={styles.pickerPlaceholder}>اختر الدولة...</Text>
              <Ionicons name="chevron-down" size={14} color={MUTED} />
            </View>
          )}
        </TouchableOpacity>
        {hasError && errorText && (
          <Text style={styles.errorText}>{errorText}</Text>
        )}
      </View>

      {/* Picker modal */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => { setOpen(false); setQuery(''); }} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={MUTED} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{label}</Text>
              <View style={{ width: 22 }} />
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={MUTED} style={{ marginLeft: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country..."
                placeholderTextColor={MUTED}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={Platform.OS !== 'web'}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 8 }}>
                  <Ionicons name="close-circle" size={16} color={MUTED} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={item => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.code.toUpperCase() === value?.toUpperCase();
                return (
                  <TouchableOpacity
                    style={[styles.countryRow, isSelected && styles.countryRowSelected]}
                    onPress={() => {
                      onChange(item.code.toUpperCase(), item.name);
                      setOpen(false);
                      setQuery('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.countryLeft}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={GOLD} />
                      )}
                    </View>
                    <Image
                      source={{ uri: flagUrlFn(item.code) }}
                      style={styles.flagLg}
                      contentFit="cover"
                    />
                    <Text style={[styles.countryName, isSelected && { color: GOLD }]}>
                      {item.name}
                    </Text>
                    <Text style={styles.countryCode}>{item.code.toUpperCase()}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No results for "{query}"</Text>
              }
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldBlock: { marginTop: 10 },
  fieldLabel: {
    color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 13,
    textAlign: 'right', marginBottom: 6,
  },
  pickerBtn: {
    backgroundColor: INPUT_BG, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  pickerBtnError: { borderColor: ERROR_COLOR + '80' },
  pickerSelected: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  flag: { width: 28, height: 20, borderRadius: 4 },
  pickerSelectedText: {
    flex: 1, color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 14, textAlign: 'right',
  },
  pickerPlaceholder: {
    flex: 1, color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 14, textAlign: 'right',
  },
  errorText: {
    color: ERROR_COLOR, fontFamily: 'Tajawal_400Regular', fontSize: 11,
    textAlign: 'right', marginTop: 3,
  },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: DARK2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: BORDER,
    height: '80%',
  },
  sheetHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  sheetTitle: {
    color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 16, textAlign: 'center',
  },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, backgroundColor: DARK3,
  },
  searchInput: {
    flex: 1, color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 14,
    paddingVertical: 12, paddingHorizontal: 8,
  },

  countryRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  countryRowSelected: { backgroundColor: 'rgba(201,160,96,0.08)' },
  countryLeft: { width: 20, alignItems: 'center' },
  flagLg: { width: 30, height: 22, borderRadius: 4 },
  countryName: {
    flex: 1, color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 14, textAlign: 'right',
  },
  countryCode: {
    color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12, minWidth: 28,
    textAlign: 'left',
  },

  emptyText: {
    color: MUTED, textAlign: 'center', marginTop: 40, fontFamily: 'Tajawal_400Regular', fontSize: 14,
  },
});
