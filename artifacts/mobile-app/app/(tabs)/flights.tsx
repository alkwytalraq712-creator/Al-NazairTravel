import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { CabinClass } from '@workspace/api-client-react';
import { AIRPORT_DB, AIRPORT_MAP, searchAirports } from '../../lib/airports';
import type { Airport } from '../../lib/airports';
import { useColors } from '@/hooks/useColors';
import { useServiceSettings } from '@/context/ServiceSettingsContext';
import { ServiceUnavailable } from '@/components/ServiceUnavailable';

const GOLD = '#C9A060';
const GOLD2 = '#E8C07A';

const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
const DAYS_SHORT = ['سبت','أحد','اثن','ثلا','أرب','خمي','جمع'];

const CABIN_LABELS: Record<string, string> = {
  economy: 'الدرجة الاقتصادية',
  premium_economy: 'الاقتصادية المميزة',
  business: 'رجال الأعمال',
  first: 'الدرجة الأولى',
};

type TripType = 'one_way' | 'round_trip';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateAr(iso: string): { weekday: string; full: string; iso: string } {
  if (!iso) return { weekday: 'اختر', full: 'التاريخ', iso: '' };
  try {
    const d = new Date(iso + 'T00:00:00');
    return {
      weekday: d.toLocaleDateString('ar-EG', { weekday: 'long' }),
      full: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }),
      iso,
    };
  } catch { return { weekday: '', full: iso, iso }; }
}

function Calendar({
  selected, onSelect, minDate,
}: { selected: string; onSelect: (d: string) => void; minDate?: string }) {
  const colors = useColors();
  const initialDate = selected || todayISO();
  const [yr, setYr] = useState(() => parseInt(initialDate.split('-')[0]));
  const [mo, setMo] = useState(() => parseInt(initialDate.split('-')[1]) - 1);

  function prevMonth() { if (mo === 0) { setMo(11); setYr(y => y-1); } else setMo(m => m-1); }
  function nextMonth() { if (mo === 11) { setMo(0); setYr(y => y+1); } else setMo(m => m+1); }

  const grid = useMemo(() => {
    const first = new Date(yr, mo, 1);
    const dow = first.getDay();
    const offset = (dow + 1) % 7;
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const cells: (number|null)[] = Array(offset).fill(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [yr, mo]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const toISO = (d: number) => `${yr}-${pad(mo+1)}-${pad(d)}`;
  const todayStr = todayISO();
  const min = minDate || todayStr;

  return (
    <View style={CAL.wrap}>
      <View style={CAL.header}>
        <TouchableOpacity onPress={nextMonth} style={CAL.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[CAL.monthLabel, { color: colors.foreground }]}>{MONTHS_AR[mo]} {yr}</Text>
        <TouchableOpacity onPress={prevMonth} style={CAL.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={CAL.row}>
        {DAYS_SHORT.map(d => (
          <Text key={d} style={[CAL.dayHdr, { color: colors.mutedForeground }]}>{d}</Text>
        ))}
      </View>

      <View style={CAL.row}>
        {grid.map((d: number | null, i: number) => {
          if (!d) return <View key={`_${i}`} style={CAL.cell} />;
          const iso = toISO(d);
          const isSel = iso === selected;
          const isPast = iso < min;
          const isToday = iso === todayStr;
          return (
            <TouchableOpacity
              key={iso}
              style={[
                CAL.cell,
                isSel && { backgroundColor: colors.primary, borderRadius: 20 },
              ]}
              onPress={() => !isPast && onSelect(iso)}
              activeOpacity={isPast ? 1 : 0.75}
              disabled={isPast}
            >
              <Text style={[
                CAL.dayNum,
                { color: isSel ? colors.primaryForeground : isPast ? colors.mutedForeground + '60' : isToday ? colors.primary : colors.foreground },
                isSel && CAL.selNum,
                isToday && !isSel && CAL.todayNum,
              ]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const CAL = StyleSheet.create({
  wrap: { paddingVertical: 12 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { padding: 8 },
  monthLabel: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  row: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  dayHdr: { width: `${100/7}%`, textAlign: 'center', fontSize: 12, fontFamily: 'Tajawal_500Medium', paddingVertical: 6 },
  cell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontFamily: 'Tajawal_500Medium', fontSize: 15 },
  selNum: { fontFamily: 'Tajawal_800ExtraBold' },
  todayNum: { fontFamily: 'Tajawal_800ExtraBold' },
});

function AirportPickerModal({
  visible, title, onClose, onSelect,
}: { visible: boolean; title: string; onClose: () => void; onSelect: (iata: string) => void; }) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const grouped = useMemo<[string, Airport[]][]>(() => {
    const list = query.trim() ? searchAirports(query, 120) : AIRPORT_DB;
    const map = new Map<string, Airport[]>();
    for (const a of list) {
      if (!map.has(a.country)) map.set(a.country, []);
      map.get(a.country)!.push(a);
    }
    return Array.from(map.entries());
  }, [query]);

  type Row =
    | { kind: 'header'; key: string; country: string; countryEn: string }
    | { kind: 'airport'; key: string; airport: Airport };

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const [country, airports] of grouped) {
      out.push({ kind: 'header', key: `h_${country}`, country, countryEn: airports[0]?.countryEn ?? '' });
      for (const a of airports) {
        out.push({ kind: 'airport', key: a.iata, airport: a });
      }
    }
    return out;
  }, [grouped]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[PM.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={[PM.closeBtn, { backgroundColor: colors.input, borderColor: colors.border }]} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[PM.headerTitle, { color: colors.foreground }]}>{title}</Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={PM.searchWrap}>
          <View style={[PM.searchBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
            <TextInput
              ref={inputRef}
              style={[PM.searchInput, { color: colors.foreground }]}
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث بالدولة أو المدينة أو رمز IATA"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="search"
              selectionColor={colors.primary}
              textAlign="right"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {rows.length === 0 ? (
          <View style={PM.empty}>
            <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
            <Text style={[PM.emptyText, { color: colors.foreground }]}>لا توجد نتائج</Text>
            <Text style={[PM.emptyHint, { color: colors.mutedForeground }]}>جرّب البحث بالدولة، المدينة، أو رمز IATA</Text>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={r => r.key}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            renderItem={({ item: row }) => {
              if (row.kind === 'header') {
                return (
                  <View style={PM.countryHeader}>
                    <Text style={[PM.countryEn, { color: colors.mutedForeground }]}>{row.countryEn}</Text>
                    <Text style={[PM.countryAr, { color: colors.primary }]}>{row.country}</Text>
                  </View>
                );
              }
              const { airport } = row;
              return (
                <TouchableOpacity
                  style={[PM.airportRow, { borderBottomColor: colors.border }]}
                  onPress={() => { onSelect(airport.iata); onClose(); }}
                  activeOpacity={0.7}
                >
                  <View style={[PM.iataBadge, { backgroundColor: colors.accent, borderColor: colors.primary + '40' }]}>
                    <Text style={[PM.iataText, { color: colors.primary }]}>{airport.iata}</Text>
                  </View>
                  <View style={PM.airportInfo}>
                    <Text style={[PM.airportName, { color: colors.foreground }]} numberOfLines={1}>{airport.arabic}</Text>
                    <Text style={[PM.airportMeta, { color: colors.mutedForeground }]}>{airport.city} · {airport.country}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const PM = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  closeBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Tajawal_800ExtraBold' },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 16 },
  searchBox: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchInput: { flex: 1, fontFamily: 'Tajawal_500Medium', fontSize: 16, padding: 0, margin: 0 },
  countryHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  countryAr: { fontSize: 15, fontFamily: 'Tajawal_800ExtraBold' },
  countryEn: { fontSize: 12, fontFamily: 'Tajawal_500Medium' },
  airportRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 16, borderBottomWidth: 1 },
  iataBadge: { width: 56, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iataText: { fontSize: 14, fontFamily: 'Tajawal_800ExtraBold', letterSpacing: 0.5 },
  airportInfo: { flex: 1, alignItems: 'flex-end', gap: 4 },
  airportName: { fontSize: 15, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
  airportMeta: { fontSize: 12, fontFamily: 'Tajawal_500Medium' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 100 },
  emptyText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 18 },
  emptyHint: { fontFamily: 'Tajawal_500Medium', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});

function AirportCard({
  label, code, iconName, onPress,
}: { label: string; code: string; iconName: string; onPress: () => void }) {
  const colors = useColors();
  const airport = AIRPORT_MAP.get(code.toUpperCase());
  return (
    <TouchableOpacity style={AP.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[AP.iconWrap, { backgroundColor: colors.accent }]}>
        <Ionicons name={iconName as any} size={24} color={colors.primary} />
      </View>
      <View style={AP.body}>
        <Text style={[AP.label, { color: colors.mutedForeground }]}>{label}</Text>
        {airport ? (
          <>
            <Text style={[AP.code, { color: colors.foreground }]}>{airport.iata}</Text>
            <Text style={[AP.name, { color: colors.primary }]} numberOfLines={1}>{airport.city} — {airport.arabic}</Text>
            <Text style={[AP.country, { color: colors.mutedForeground }]}>{airport.country}</Text>
          </>
        ) : (
          <Text style={[AP.placeholder, { color: colors.mutedForeground }]}>اضغط لاختيار المطار</Text>
        )}
      </View>
      <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}
const AP = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, alignItems: 'flex-end' },
  label: { fontSize: 12, fontFamily: 'Tajawal_500Medium', marginBottom: 2 },
  code: { fontSize: 32, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right', lineHeight: 38 },
  name: { fontSize: 13, fontFamily: 'Tajawal_700Bold', marginTop: 2 },
  country: { fontSize: 11, fontFamily: 'Tajawal_500Medium', marginTop: 2 },
  placeholder: { fontSize: 15, fontFamily: 'Tajawal_700Bold', marginTop: 4 },
});

function DateCard({
  label, iso, active, onPress, variant = 'depart',
}: { label: string; iso: string; active: boolean; onPress: () => void; variant?: 'depart' | 'return' }) {
  const colors = useColors();
  const { weekday, full } = formatDateAr(iso);
  const hasDate = !!iso;
  const accent = variant === 'return' ? colors.info : colors.primary;

  return (
    <TouchableOpacity
      style={[
        DC.card,
        { backgroundColor: colors.input, borderColor: colors.border },
        active && { borderColor: accent, backgroundColor: colors.accent },
        !active && hasDate && { borderColor: accent + '80' },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={DC.iconRow}>
        <Ionicons name="calendar-outline" size={16} color={hasDate || active ? accent : colors.mutedForeground} />
        <Text style={[DC.label, { color: (hasDate || active) ? accent : colors.mutedForeground }]}>{label}</Text>
      </View>

      {hasDate ? (
        <>
          <Text style={[DC.weekday, { color: colors.foreground }]}>{weekday}</Text>
          <Text style={[DC.full, { color: accent }]} numberOfLines={1}>{full}</Text>
          <Text style={[DC.isoTag, { color: colors.mutedForeground }]}>{iso}</Text>
        </>
      ) : (
        <>
          <Text style={[DC.weekdayEmpty, { color: active ? colors.foreground : colors.mutedForeground }]}>اضغط لتحديد</Text>
          <Text style={[DC.placeholderMain, { color: active ? accent : colors.mutedForeground }]}>التاريخ</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
const DC = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 4 },
  iconRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 12, fontFamily: 'Tajawal_500Medium' },
  weekday: { fontSize: 14, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
  weekdayEmpty: { fontSize: 14, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },
  full: { fontSize: 15, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
  isoTag: { fontSize: 11, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginTop: 4 },
  placeholderMain: { fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
});

type ActiveDate = 'depart' | 'return' | null;
type ActiveAirport = 'from' | 'to' | null;

export default function FlightsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { flightsEnabled } = useServiceSettings();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [tripType, setTripType] = useState<TripType>('round_trip');
  const [from, setFrom] = useState('BGW');
  const [to, setTo] = useState('DXB');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<CabinClass>('economy');
  const [showCabin, setShowCabin] = useState(false);
  const [activeDate, setActiveDate] = useState<ActiveDate>(null);
  const [activeAirport, setActiveAirport] = useState<ActiveAirport>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  if (!flightsEnabled) return <ServiceUnavailable serviceName="حجوزات الطيران" icon="paper-plane-outline" />;

  function swapAirports() { const t = from; setFrom(to); setTo(t); }

  function handleDateSelect(iso: string) {
    if (activeDate === 'depart') {
      setDepartDate(iso);
      if (tripType === 'round_trip') setActiveDate('return');
      else setActiveDate(null);
    } else if (activeDate === 'return') {
      setReturnDate(iso);
      setActiveDate(null);
    }
  }

  function toggleDate(which: ActiveDate) {
    setActiveDate(prev => prev === which ? null : which);
  }

  function handleSearch() {
    if (!from.trim() || !to.trim() || !departDate) return;
    const params: Record<string, string> = {
      from: from.trim().toUpperCase(),
      to: to.trim().toUpperCase(),
      departDate,
      adults: String(adults),
      children: String(children),
      cabinClass,
      tripType,
    };
    if (tripType === 'round_trip' && returnDate) params.returnDate = returnDate;
    router.push({ pathname: '/flight-results', params } as any);
  }

  return (
    <View style={[S.screen, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 40 : 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <View style={[S.hero, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: paddingTop + 16 }]}>
          <Text style={[S.heroTitle, { color: colors.foreground }]}>حجز الطيران</Text>
          <Text style={[S.heroSub, { color: colors.mutedForeground }]}>اكتشف وجهات العالم برفاهية</Text>

          {/* Trip type toggle */}
          <View style={[S.toggle, { backgroundColor: colors.input, borderColor: colors.border }]}>
            {([['round_trip', 'ذهاب وعودة', 'swap-horizontal'], ['one_way', 'ذهاب فقط', 'arrow-forward']] as const).map(([t, label, icon]) => (
              <TouchableOpacity
                key={t}
                style={[S.toggleBtn, tripType === t && { backgroundColor: colors.primary }]}
                onPress={() => { setTripType(t); if (t === 'one_way') setReturnDate(''); setActiveDate(null); }}
                activeOpacity={0.8}
              >
                <Ionicons name={icon as any} size={18} color={tripType === t ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[S.toggleText, { color: tripType === t ? colors.primaryForeground : colors.mutedForeground }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: -20, gap: 14 }}>
          {/* ── Airport card ── */}
          <View style={[S.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AirportCard
              label="من (المغادرة)"
              code={from}
              iconName="airplane"
              onPress={() => { setActiveDate(null); setActiveAirport('from'); }}
            />
            <View style={[S.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[S.swapBtn, { backgroundColor: colors.accent, borderColor: colors.primary }]} onPress={swapAirports} activeOpacity={0.8}>
              <Ionicons name="swap-vertical" size={22} color={colors.primary} />
            </TouchableOpacity>
            <AirportCard
              label="إلى (الوصول)"
              code={to}
              iconName="airplane-outline"
              onPress={() => { setActiveDate(null); setActiveAirport('to'); }}
            />
          </View>

          {/* ── Dates ── */}
          <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
            <DateCard
              label="تاريخ المغادرة"
              iso={departDate}
              active={activeDate === 'depart'}
              onPress={() => toggleDate('depart')}
              variant="depart"
            />
            {tripType === 'round_trip' && (
              <DateCard
                label="تاريخ العودة"
                iso={returnDate}
                active={activeDate === 'return'}
                onPress={() => toggleDate('return')}
                variant="return"
              />
            )}
          </View>

          {/* ── Calendar ── */}
          {activeDate && (
            <View style={[S.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 16 }]}>
              <Calendar
                selected={activeDate === 'depart' ? departDate : returnDate}
                onSelect={handleDateSelect}
                minDate={activeDate === 'return' ? (departDate || todayISO()) : todayISO()}
              />
              <TouchableOpacity
                style={[S.confirmDateBtn, { backgroundColor: colors.primary }]}
                onPress={() => setActiveDate(null)}
                activeOpacity={0.85}
              >
                <Text style={[S.confirmDateText, { color: colors.primaryForeground }]}>تأكيد</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Passengers & Cabin ── */}
          <View style={[S.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={S.passRow}>
              <Ionicons name="people-outline" size={20} color={colors.mutedForeground} />
              <Text style={[S.passLabel, { color: colors.foreground }]}>الركاب ودرجة السفر</Text>
            </View>

            <View style={S.passCounters}>
              {([
                ['بالغ', adults, setAdults, 1] as const,
                ['طفل', children, setChildren, 0] as const,
                ['رضيع', infants, setInfants, 0] as const,
              ]).map(([label, count, setCount, min]) => (
                <View key={label} style={S.counter}>
                  <TouchableOpacity
                    style={[S.counterBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
                    onPress={() => setCount(Math.max(min, count - 1))}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                  <View style={{ alignItems: 'center', width: 44 }}>
                    <Text style={[S.counterNum, { color: colors.foreground }]}>{count}</Text>
                    <Text style={[S.counterLabel, { color: colors.mutedForeground }]}>{label}</Text>
                  </View>
                  <TouchableOpacity
                    style={[S.counterBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
                    onPress={() => setCount(count + 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={[S.divider, { backgroundColor: colors.border, marginHorizontal: 0 }]} />

            <TouchableOpacity
              style={S.cabinRow}
              onPress={() => setShowCabin(v => !v)}
              activeOpacity={0.8}
            >
              <Ionicons name={showCabin ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
              <Text style={[S.cabinValue, { color: colors.foreground }]}>{CABIN_LABELS[cabinClass]}</Text>
              <Text style={[S.cabinLabel, { color: colors.mutedForeground }]}>درجة السفر</Text>
            </TouchableOpacity>

            {showCabin && (
              <View style={S.cabinDropdown}>
                {(Object.entries(CABIN_LABELS) as [CabinClass, string][]).map(([k, label]) => (
                  <TouchableOpacity
                    key={k}
                    style={[S.cabinOption, cabinClass === k && { backgroundColor: colors.accent }]}
                    onPress={() => { setCabinClass(k); setShowCabin(false); }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cabinClass === k ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={cabinClass === k ? colors.primary : colors.mutedForeground}
                    />
                    <Text style={[S.cabinOptionText, { color: cabinClass === k ? colors.primary : colors.foreground }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Search button ── */}
          <TouchableOpacity
            style={[S.searchBtnWrap, (!from || !to || !departDate) && { opacity: 0.5 }]}
            onPress={handleSearch}
            activeOpacity={0.88}
          >
            <LinearGradient colors={[GOLD, GOLD2]} style={S.searchBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="search" size={22} color="#0B1628" />
              <Text style={S.searchText}>البحث عن رحلات</Text>
            </LinearGradient>
          </TouchableOpacity>

          {(!from || !to || !departDate) && (
            <Text style={[S.hint, { color: colors.mutedForeground }]}>
              {!from || !to ? 'أدخل مطار المغادرة والوصول للمتابعة' : 'اختر تاريخ المغادرة للمتابعة'}
            </Text>
          )}
        </View>
      </Animated.ScrollView>

      <AirportPickerModal
        visible={activeAirport !== null}
        title={activeAirport === 'from' ? 'اختر مطار المغادرة' : 'اختر مطار الوصول'}
        onClose={() => setActiveAirport(null)}
        onSelect={(iata) => {
          if (activeAirport === 'from') setFrom(iata);
          else setTo(iata);
          setActiveAirport(null);
        }}
      />
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },
  hero: { alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 32, borderBottomWidth: 1 },
  heroTitle: { fontSize: 26, fontFamily: 'Tajawal_800ExtraBold', marginBottom: 6, textAlign: 'right' },
  heroSub: { fontSize: 15, fontFamily: 'Tajawal_500Medium', marginBottom: 24, textAlign: 'right' },
  toggle: { flexDirection: 'row-reverse', borderRadius: 16, borderWidth: 1, padding: 6, alignSelf: 'stretch' },
  toggleBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  toggleText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 14 },
  card: { borderRadius: 20, borderWidth: 1, paddingVertical: 4, marginBottom: 8 },
  divider: { height: 1, marginHorizontal: 20 },
  swapBtn: { position: 'absolute', right: 38, top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 1 },
  confirmDateBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  confirmDateText: { fontSize: 16, fontFamily: 'Tajawal_800ExtraBold' },
  passRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  passLabel: { fontSize: 15, fontFamily: 'Tajawal_800ExtraBold' },
  passCounters: { flexDirection: 'row-reverse', justifyContent: 'space-around', paddingHorizontal: 10, paddingBottom: 16 },
  counter: { alignItems: 'center' },
  counterBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  counterNum: { fontSize: 16, fontFamily: 'Tajawal_800ExtraBold' },
  counterLabel: { fontSize: 12, fontFamily: 'Tajawal_500Medium', marginTop: 2 },
  cabinRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  cabinLabel: { fontSize: 14, fontFamily: 'Tajawal_700Bold' },
  cabinValue: { flex: 1, textAlign: 'right', marginRight: 12, fontSize: 15, fontFamily: 'Tajawal_800ExtraBold' },
  cabinDropdown: { paddingHorizontal: 12, paddingBottom: 12, gap: 4 },
  cabinOption: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 },
  cabinOptionText: { fontSize: 14, fontFamily: 'Tajawal_700Bold' },
  searchBtnWrap: { borderRadius: 18, overflow: 'hidden', marginTop: 8 },
  searchBtnGrad: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  searchText: { color: '#0B1628', fontFamily: 'Tajawal_800ExtraBold', fontSize: 18 },
  hint: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'center', marginTop: 16, paddingHorizontal: 20 },
});
