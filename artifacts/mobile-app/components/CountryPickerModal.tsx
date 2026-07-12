/**
 * CountryPickerModal — searchable modal for selecting a country.
 * Shows flag, Arabic name, and dial code.
 */
import React, { useState, useMemo } from 'react';
import {
  FlatList, Modal, Platform, Pressable,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COUNTRIES, type Country } from '@/lib/countries';

const GOLD   = '#C9A060';
const DARK2  = '#0F1E36';
const DARK3  = '#162035';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED  = 'rgba(255,255,255,0.50)';
const WHITE  = '#FFFFFF';

interface Props {
  visible: boolean;
  onSelect: (country: Country) => void;
  onClose: () => void;
  selected?: Country | null;
}

export default function CountryPickerModal({ visible, onSelect, onClose, selected }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return COUNTRIES;
    const q = query.trim().toLowerCase();
    return COUNTRIES.filter(
      c =>
        c.name.includes(query.trim()) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query]);

  function handleSelect(country: Country) {
    onSelect(country);
    setQuery('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={MUTED} />
          </TouchableOpacity>
          <Text style={styles.title}>اختر الدولة</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={MUTED} style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث باسم الدولة أو رمز الاتصال..."
            placeholderTextColor={MUTED}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={{ paddingHorizontal: 8 }}>
              <Ionicons name="close-circle" size={16} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.code}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.item,
                selected?.code === item.code && styles.itemActive,
              ]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.itemDial}>{item.dial}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemFlag}>{item.flag}</Text>
              {selected?.code === item.code && (
                <Ionicons name="checkmark" size={16} color={GOLD} style={{ marginRight: 4 }} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Ionicons name="search" size={36} color={MUTED} />
              <Text style={{ color: MUTED, fontFamily: 'Tajawal_400Regular', marginTop: 10, fontSize: 14 }}>
                لا توجد نتائج
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: DARK2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: BORDER,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    flex: 1, textAlign: 'center', color: WHITE,
    fontFamily: 'Tajawal_700Bold', fontSize: 16,
  },
  searchWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: DARK3, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    margin: 12,
  },
  searchInput: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 10,
    color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 14,
  },
  item: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 10,
  },
  itemActive: { backgroundColor: 'rgba(201,160,96,0.08)' },
  itemFlag: { fontSize: 22 },
  itemName: {
    flex: 1, color: WHITE, fontFamily: 'Tajawal_500Medium',
    fontSize: 14, textAlign: 'right',
  },
  itemDial: {
    color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 13,
    minWidth: 50, textAlign: 'left', direction: 'ltr',
  },
});
