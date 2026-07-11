import React, { useState, useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { CabinClass } from '@workspace/api-client-react';
import { AIRPORT_MAP } from '../../lib/airports';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const CARD_BG = 'rgba(255,255,255,0.06)';
const GOLD = '#C9A060';
const GOLD_LIGHT = '#E0BC80';
const WHITE = '#FFFFFF';
const MUTED = 'rgba(255,255,255,0.50)';
const BORDER = 'rgba(255,255,255,0.09)';
const GOLD_BG = 'rgba(201,160,96,0.15)';


const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
// Saturday-first (Arabian standard)
const DAYS_SHORT = ['سبت','أحد','اثن','ثلا','أرب','خمي','جمع'];

const CABIN_LABELS: Record<string, string> = {
  economy: 'الدرجة الاقتصادية',
  premium_economy: 'الاقتصادية المميزة',
  business: 'رجال الأعمال',
  first: 'الدرجة الأولى',
};

type TripType = 'one_way' | 'round_trip';

// ─── Helpers ────────────────────────────────────────────────────────────────────
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

// ─── Calendar ───────────────────────────────────────────────────────────────────
function Calendar({
  selected, onSelect, minDate,
}: { selected: string; onSelect: (d: string) => void; minDate?: string }) {
  const initialDate = selected || todayISO();
  const [yr, setYr] = useState(() => parseInt(initialDate.split('-')[0]));
  const [mo, setMo] = useState(() => parseInt(initialDate.split('-')[1]) - 1);

  function prevMonth() { if (mo === 0) { setMo(11); setYr(y => y-1); } else setMo(m => m-1); }
  function nextMonth() { if (mo === 11) { setMo(0); setYr(y => y+1); } else setMo(m => m+1); }

  const grid = useMemo(() => {
    const first = new Date(yr, mo, 1);
    const dow = first.getDay(); // 0=Sun..6=Sat
    // convert to Saturday-first: Sat(6)→0, Sun(0)→1, Mon(1)→2 …
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
      {/* Month nav */}
      <View style={CAL.header}>
        <TouchableOpacity onPress={nextMonth} style={CAL.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={GOLD} />
        </TouchableOpacity>
        <Text style={CAL.monthLabel}>{MONTHS_AR[mo]} {yr}</Text>
        <TouchableOpacity onPress={prevMonth} style={CAL.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={GOLD} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={CAL.row}>
        {DAYS_SHORT.map(d => (
          <Text key={d} style={CAL.dayHdr}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
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
              style={[CAL.cell, isSel && CAL.selCell]}
              onPress={() => !isPast && onSelect(iso)}
              activeOpacity={isPast ? 1 : 0.75}
              disabled={isPast}
            >
              <Text style={[
                CAL.dayNum,
                isSel && CAL.selNum,
                isToday && !isSel && CAL.todayNum,
                isPast && CAL.pastNum,
              ]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const CAL = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  navBtn: { padding: 8 },
  monthLabel: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 15 },
  row: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  dayHdr: { width: `${100/7}%`, textAlign: 'center', color: MUTED, fontSize: 11, fontFamily: 'Tajawal_400Regular', paddingVertical: 4 },
  cell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  selCell: { backgroundColor: GOLD, borderRadius: 50 },
  dayNum: { color: WHITE, fontFamily: 'Tajawal_500Medium', fontSize: 14 },
  selNum: { color: DARK, fontFamily: 'Tajawal_800ExtraBold' },
  todayNum: { color: GOLD_LIGHT, fontFamily: 'Tajawal_700Bold' },
  pastNum: { color: 'rgba(255,255,255,0.2)' },
});

// ─── Airport card (TextInput-based, no hooks) ────────────────────────────────────
function AirportCard({
  label, code, iconName, onChange,
}: { label: string; code: string; iconName: string; onChange: (v: string) => void }) {
  const airport = AIRPORT_MAP.get(code.toUpperCase());
  const name = airport ? `${airport.city} — ${airport.arabic}` : (code.length === 3 ? '—' : '');
  return (
    <View style={AP.row}>
      <View style={AP.iconWrap}>
        <Ionicons name={iconName as any} size={22} color={GOLD} />
      </View>
      <View style={AP.body}>
        <Text style={AP.label}>{label}</Text>
        <TextInput
          style={AP.code}
          value={code}
          onChangeText={v => onChange(v.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
          placeholder="---"
          placeholderTextColor={MUTED}
          autoCapitalize="characters"
          maxLength={3}
          selectionColor={GOLD}
        />
        {name ? <Text style={AP.name} numberOfLines={1}>{name}</Text> : null}
        {airport && <Text style={AP.country}>{airport.country}</Text>}
      </View>
      <Ionicons name="chevron-down" size={16} color={MUTED} />
    </View>
  );
}
const AP = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: GOLD_BG, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, alignItems: 'flex-end' },
  label: { color: MUTED, fontSize: 11, fontFamily: 'Tajawal_400Regular', marginBottom: 1 },
  code: { color: WHITE, fontSize: 28, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right', padding: 0, margin: 0 },
  name: { color: GOLD, fontSize: 11, fontFamily: 'Tajawal_500Medium', marginTop: 1 },
  country: { color: MUTED, fontSize: 10, fontFamily: 'Tajawal_400Regular', marginTop: 1 },
});

// ─── Date card ──────────────────────────────────────────────────────────────────
function DateCard({
  label, iso, active, onPress,
}: { label: string; iso: string; active: boolean; onPress: () => void }) {
  const { weekday, full } = formatDateAr(iso);
  return (
    <TouchableOpacity
      style={[DC.card, active && DC.activeCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={DC.iconRow}>
        <Ionicons name="calendar-outline" size={14} color={active ? GOLD : MUTED} />
        <Text style={[DC.label, active && { color: GOLD }]}>{label}</Text>
      </View>
      <Text style={[DC.weekday, active && { color: WHITE }]}>{weekday}</Text>
      {full && full !== 'التاريخ' ? (
        <Text style={[DC.full, active && { color: GOLD_LIGHT }]} numberOfLines={1}>{full}</Text>
      ) : (
        <Text style={DC.placeholder}>اختر التاريخ</Text>
      )}
      {iso && <Text style={DC.isoTag}>{iso}</Text>}
    </TouchableOpacity>
  );
}
const DC = StyleSheet.create({
  card: { flex: 1, backgroundColor: CARD_BG, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 3 },
  activeCard: { borderColor: GOLD + '60', backgroundColor: 'rgba(201,160,96,0.08)' },
  iconRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginBottom: 2 },
  label: { color: MUTED, fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  weekday: { color: MUTED, fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },
  full: { color: MUTED, fontSize: 12, fontFamily: 'Tajawal_500Medium', textAlign: 'right' },
  isoTag: { color: MUTED, fontSize: 10, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginTop: 2 },
  placeholder: { color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
});

// ─── Main screen ────────────────────────────────────────────────────────────────
type ActiveDate = 'depart' | 'return' | null;

export default function FlightsScreen() {
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

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
    if (!from.trim() || !to.trim() || !departDate) {
      // shake or alert
      return;
    }
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

  const totalPassengers = adults + children + infants;

  return (
    <View style={S.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 40 : 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <View style={[S.hero, { paddingTop: paddingTop + 8 }]}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&q=80' }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={S.heroOverlay} />
          <Text style={S.heroTitle}>حجز الطيران</Text>
          <Text style={S.heroSub}>احجز رحلتك بسهولة وأمان</Text>

          {/* Trip type toggle */}
          <View style={S.toggle}>
            {([['round_trip', '↔ ذهاب وعودة'], ['one_way', '✈ ذهاب فقط']] as [TripType, string][]).map(([t, label]) => (
              <TouchableOpacity
                key={t}
                style={[S.toggleBtn, tripType === t && S.toggleActive]}
                onPress={() => { setTripType(t); if (t === 'one_way') setReturnDate(''); setActiveDate(null); }}
                activeOpacity={0.8}
              >
                <Text style={[S.toggleText, tripType === t && S.toggleTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: -20, gap: 12 }}>

          {/* ── Airport card ── */}
          <View style={S.card}>
            <AirportCard label="من (المغادرة)" code={from} iconName="airplane" onChange={setFrom} />
            <View style={[S.divider, { backgroundColor: BORDER }]} />
            {/* Swap button */}
            <TouchableOpacity style={S.swapBtn} onPress={swapAirports} activeOpacity={0.8}>
              <Ionicons name="swap-vertical" size={20} color={DARK} />
            </TouchableOpacity>
            <AirportCard label="إلى (الوصول)" code={to} iconName="airplane-outline" onChange={setTo} />
          </View>

          {/* ── Dates ── */}
          <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
            <DateCard
              label="تاريخ المغادرة"
              iso={departDate}
              active={activeDate === 'depart'}
              onPress={() => toggleDate('depart')}
            />
            {tripType === 'round_trip' && (
              <DateCard
                label="تاريخ العودة"
                iso={returnDate}
                active={activeDate === 'return'}
                onPress={() => toggleDate('return')}
              />
            )}
          </View>

          {/* ── Calendar ── */}
          {activeDate && (
            <View style={S.card}>
              <Calendar
                selected={activeDate === 'depart' ? departDate : returnDate}
                onSelect={handleDateSelect}
                minDate={activeDate === 'return' ? (departDate || todayISO()) : todayISO()}
              />
              <TouchableOpacity
                style={S.confirmDateBtn}
                onPress={() => setActiveDate(null)}
                activeOpacity={0.85}
              >
                <Text style={S.confirmDateText}>تأكيد</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Passengers & Cabin ── */}
          <View style={S.card}>
            {/* Passengers row */}
            <View style={S.passRow}>
              <Ionicons name="person-outline" size={18} color={MUTED} />
              <Text style={S.passLabel}>الركاب ودرجة السفر</Text>
            </View>

            <View style={S.passCounters}>
              {([
                ['بالغ', adults, setAdults, 1] as const,
                ['طفل', children, setChildren, 0] as const,
                ['رضيع', infants, setInfants, 0] as const,
              ]).map(([label, count, setCount, min]) => (
                <View key={label} style={S.counter}>
                  <TouchableOpacity
                    style={S.counterBtn}
                    onPress={() => setCount(Math.max(min, count - 1))}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={16} color={WHITE} />
                  </TouchableOpacity>
                  <View style={{ alignItems: 'center', width: 40 }}>
                    <Text style={S.counterNum}>{count}</Text>
                    <Text style={S.counterLabel}>{label}</Text>
                  </View>
                  <TouchableOpacity
                    style={S.counterBtn}
                    onPress={() => setCount(count + 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={16} color={WHITE} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Divider */}
            <View style={[S.divider, { backgroundColor: BORDER, marginHorizontal: 0 }]} />

            {/* Cabin class */}
            <TouchableOpacity
              style={S.cabinRow}
              onPress={() => setShowCabin(v => !v)}
              activeOpacity={0.8}
            >
              <Ionicons name={showCabin ? 'chevron-up' : 'chevron-down'} size={16} color={MUTED} />
              <Text style={S.cabinValue}>{CABIN_LABELS[cabinClass]}</Text>
              <Text style={S.cabinLabel}>درجة السفر</Text>
            </TouchableOpacity>

            {showCabin && (
              <View style={{ gap: 4, marginTop: 4 }}>
                {(Object.entries(CABIN_LABELS) as [CabinClass, string][]).map(([k, label]) => (
                  <TouchableOpacity
                    key={k}
                    style={[S.cabinOption, cabinClass === k && S.cabinOptionActive]}
                    onPress={() => { setCabinClass(k); setShowCabin(false); }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cabinClass === k ? 'radio-button-on' : 'radio-button-off'}
                      size={17}
                      color={cabinClass === k ? DARK : MUTED}
                    />
                    <Text style={[S.cabinOptionText, cabinClass === k && { color: DARK }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Search button ── */}
          <TouchableOpacity
            style={[S.searchBtn, (!from || !to || !departDate) && S.searchBtnDisabled]}
            onPress={handleSearch}
            activeOpacity={0.88}
          >
            <Ionicons name="search" size={20} color={DARK} />
            <Text style={S.searchText}>البحث عن رحلات</Text>
          </TouchableOpacity>

          {/* Missing fields hint */}
          {(!from || !to || !departDate) && (
            <Text style={S.hint}>
              {!from || !to ? 'أدخل مطار المغادرة والوصول' : 'اختر تاريخ المغادرة للمتابعة'}
            </Text>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DARK },

  // Hero
  hero: {
    minHeight: 220,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 52,
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,22,40,0.65)',
  },
  heroTitle: { color: WHITE, fontSize: 26, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
  heroSub: { color: MUTED, fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginTop: 2 },

  // Trip toggle
  toggle: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
    padding: 4,
    marginTop: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: GOLD },
  toggleText: { color: MUTED, fontFamily: 'Tajawal_700Bold', fontSize: 13 },
  toggleTextActive: { color: DARK, fontFamily: 'Tajawal_800ExtraBold' },

  // Card
  card: {
    backgroundColor: DARK2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  divider: { height: 1, marginHorizontal: 16 },

  // Swap button
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  // Calendar confirm
  confirmDateBtn: {
    margin: 14,
    marginTop: 8,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmDateText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },

  // Passengers
  passRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  passLabel: { color: MUTED, fontSize: 12, fontFamily: 'Tajawal_500Medium' },

  passCounters: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingBottom: 14,
  },
  counter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  counterBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  counterNum: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 18 },
  counterLabel: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 11 },

  // Cabin
  cabinRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  cabinLabel: { color: MUTED, fontSize: 12, fontFamily: 'Tajawal_400Regular', marginRight: 'auto' },
  cabinValue: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  cabinOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  cabinOptionActive: { backgroundColor: GOLD },
  cabinOptionText: { color: WHITE, fontFamily: 'Tajawal_500Medium', fontSize: 14 },

  // Search
  searchBtn: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GOLD,
    paddingVertical: 17,
    borderRadius: 16,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  searchBtnDisabled: { opacity: 0.65 },
  searchText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 17 },

  hint: {
    color: MUTED,
    fontSize: 12,
    fontFamily: 'Tajawal_400Regular',
    textAlign: 'center',
    marginTop: -4,
  },
});
