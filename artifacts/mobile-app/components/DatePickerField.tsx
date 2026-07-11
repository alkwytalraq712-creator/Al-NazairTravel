/**
 * DatePickerField — Arabic date picker (modal, three-step: year → month → day)
 * Returns value as YYYY-MM-DD. No native dependencies.
 */
import React, { useState } from 'react';
import {
  FlatList, Modal, Pressable, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#C9A060';
const DARK2 = '#0F1E36';
const DARK3 = '#162035';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';
const ERROR_COLOR = '#EF4444';

const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

function formatDisplayAr(iso: string): string {
  if (!iso) return '';
  try {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS_AR[m - 1]} ${y}`;
  } catch { return iso; }
}

const CURRENT_YEAR = new Date().getFullYear();

interface Props {
  label: string;
  value: string;           // YYYY-MM-DD or ''
  onChange: (v: string) => void;
  minDate?: string;        // YYYY-MM-DD inclusive
  maxDate?: string;        // YYYY-MM-DD inclusive
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
  errorText?: string;
}

export default function DatePickerField({
  label, value, onChange,
  minDate, maxDate,
  placeholder = 'اختر التاريخ',
  required, hasError, errorText,
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'year' | 'month' | 'day'>('year');
  const [selYear, setSelYear] = useState<number | null>(null);
  const [selMonth, setSelMonth] = useState<number | null>(null);

  const minYear = minDate ? Number(minDate.split('-')[0]) : 1940;
  const maxYear = maxDate ? Number(maxDate.split('-')[0]) : CURRENT_YEAR + 20;

  const parsed = value
    ? { y: Number(value.split('-')[0]), m: Number(value.split('-')[1]), d: Number(value.split('-')[2]) }
    : null;

  function openModal() {
    setStep('year');
    setSelYear(parsed?.y ?? null);
    setSelMonth(parsed?.m ?? null);
    setOpen(true);
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  function pickYear(y: number) { setSelYear(y); setStep('month'); }
  function pickMonth(m: number) { setSelMonth(m); setStep('day'); }
  function pickDay(d: number) {
    const iso = `${selYear}-${pad(selMonth!)}-${pad(d)}`;
    if (minDate && iso < minDate) return;
    if (maxDate && iso > maxDate) return;
    onChange(iso);
    setOpen(false);
  }

  function monthEnabled(m: number): boolean {
    if (!selYear) return true;
    const ms = `${selYear}-${pad(m)}-01`;
    const me = `${selYear}-${pad(m)}-31`;
    if (maxDate && ms > maxDate) return false;
    if (minDate && me < minDate) return false;
    return true;
  }

  function dayEnabled(d: number): boolean {
    if (!selYear || !selMonth) return true;
    const iso = `${selYear}-${pad(selMonth)}-${pad(d)}`;
    if (minDate && iso < minDate) return false;
    if (maxDate && iso > maxDate) return false;
    return true;
  }

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const numDays = selYear && selMonth ? daysInMonth(selYear, selMonth) : 31;
  const dayRows = chunk(Array.from({ length: numDays }, (_, i) => i + 1), 7);

  const stepTitle =
    step === 'year' ? 'اختر السنة' :
    step === 'month' ? `اختر الشهر — ${selYear}` :
    `${MONTHS_AR[(selMonth ?? 1) - 1]} ${selYear}`;

  return (
    <View>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: ERROR_COLOR }}> *</Text>}
      </Text>
      <TouchableOpacity
        onPress={openModal}
        activeOpacity={0.8}
        style={[styles.field, hasError && styles.fieldError]}
      >
        <Ionicons name="calendar-outline" size={18} color={value ? GOLD : MUTED} />
        <Text style={[styles.fieldText, !value && { color: MUTED }]}>
          {value ? formatDisplayAr(value) : placeholder}
        </Text>
      </TouchableOpacity>
      {hasError && errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            {step !== 'year' ? (
              <TouchableOpacity onPress={() => setStep(step === 'day' ? 'month' : 'year')}>
                <Ionicons name="chevron-forward" size={22} color={GOLD} />
              </TouchableOpacity>
            ) : <View style={{ width: 22 }} />}
            <Text style={styles.sheetTitle}>{stepTitle}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={22} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* Year list */}
          {step === 'year' && (
            <FlatList
              data={years}
              keyExtractor={y => String(y)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item: y }) => {
                const active = y === parsed?.y;
                return (
                  <TouchableOpacity
                    onPress={() => pickYear(y)}
                    style={[styles.yearItem, active && styles.yearItemActive]}
                  >
                    <Text style={[styles.yearText, active && { color: DARK2 }]}>{y}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Month grid */}
          {step === 'month' && (
            <View style={styles.monthGrid}>
              {MONTHS_AR.map((name, idx) => {
                const m = idx + 1;
                const enabled = monthEnabled(m);
                const active = m === selMonth;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => enabled && pickMonth(m)}
                    disabled={!enabled}
                    style={[styles.monthCell, active && styles.monthCellActive, !enabled && { opacity: 0.3 }]}
                  >
                    <Text style={[styles.monthText, active && { color: DARK2 }]}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Day grid */}
          {step === 'day' && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }}>
              {dayRows.map((row, ri) => (
                <View key={ri} style={styles.dayRow}>
                  {row.map(d => {
                    const enabled = dayEnabled(d);
                    const active = parsed?.y === selYear && parsed?.m === selMonth && parsed?.d === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => enabled && pickDay(d)}
                        disabled={!enabled}
                        style={[styles.dayCell, active && styles.dayCellActive, !enabled && { opacity: 0.25 }]}
                      >
                        <Text style={[styles.dayText, active && { color: DARK2 }]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {/* Pad last row */}
                  {row.length < 7 &&
                    Array.from({ length: 7 - row.length }).map((_, i) => (
                      <View key={`pad-${i}`} style={styles.dayCell} />
                    ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 13,
    textAlign: 'right', marginBottom: 6, marginTop: 10,
  },
  field: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  fieldError: { borderColor: ERROR_COLOR + '80' },
  fieldText: {
    flex: 1, color: WHITE, fontFamily: 'Tajawal_400Regular',
    fontSize: 14, textAlign: 'right',
  },
  errorText: {
    color: ERROR_COLOR, fontFamily: 'Tajawal_400Regular',
    fontSize: 11, textAlign: 'right', marginTop: 3,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    backgroundColor: DARK2, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: BORDER, maxHeight: '72%',
  },
  sheetHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  sheetTitle: {
    color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 15,
    textAlign: 'center', flex: 1,
  },
  yearItem: {
    paddingVertical: 15, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  yearItemActive: { backgroundColor: GOLD },
  yearText: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 16, textAlign: 'center' },

  monthGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 10,
  },
  monthCell: {
    width: '30%', paddingVertical: 15, borderRadius: 14,
    backgroundColor: DARK3, borderWidth: 1, borderColor: BORDER, alignItems: 'center',
  },
  monthCellActive: { backgroundColor: GOLD, borderColor: GOLD },
  monthText: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 13 },

  dayRow: { flexDirection: 'row-reverse', gap: 6, marginBottom: 6 },
  dayCell: {
    flex: 1, aspectRatio: 1, borderRadius: 10,
    backgroundColor: DARK3, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellActive: { backgroundColor: GOLD, borderColor: GOLD },
  dayText: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 13 },
});
