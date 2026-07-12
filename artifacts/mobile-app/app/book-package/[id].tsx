/**
 * Book Package Screen — Premium redesign with profile auto-fill.
 * Brand: قمة النظائر للسفريات والسياحة
 * Auto-fills traveler name, passport, phone and email from user profile.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreatePackageBooking, useGetPackage } from '@workspace/api-client-react';
import DatePickerField from '@/components/DatePickerField';
import { useAuth } from '@/context/AuthContext';

// ─── Brand palette ────────────────────────────────────────────────────────────
const NAVY   = '#060B18';
const NAVY2  = '#0B1628';
const NAVY3  = '#0F1E36';
const NAVY4  = '#162035';
const GOLD   = '#C9A060';
const GOLD2  = '#E8C07A';
const ORANGE = '#F97316';
const WHITE  = '#FFFFFF';
const MUTED  = 'rgba(255,255,255,0.48)';
const BORDER = 'rgba(255,255,255,0.08)';
const INPUT  = 'rgba(255,255,255,0.06)';
const ERROR  = '#EF4444';

const TODAY = new Date().toISOString().slice(0, 10);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <View style={sh.row}>
      <View style={sh.iconWrap}>
        <Ionicons name={icon as any} size={15} color={GOLD} />
      </View>
      <Text style={sh.title}>{title}</Text>
      {badge ? (
        <View style={sh.badge}>
          <Ionicons name="checkmark-circle" size={11} color={GOLD} />
          <Text style={sh.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}
const sh = StyleSheet.create({
  row:      { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: GOLD + '18', alignItems: 'center', justifyContent: 'center' },
  title:    { fontFamily: 'Tajawal_800ExtraBold', fontSize: 14, color: WHITE, flex: 1, textAlign: 'right' },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GOLD + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:{ fontFamily: 'Tajawal_500Medium', fontSize: 10, color: GOLD },
});

// ─── Field Component ──────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, keyboardType, autoCapitalize,
  multiline, editable = true, icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; autoCapitalize?: any;
  multiline?: boolean; editable?: boolean; icon?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={fld.label}>{label}</Text>
      <View style={[fld.wrap, focused && fld.wrapFocused, multiline && { minHeight: 90, alignItems: 'flex-start' }]}>
        {icon && (
          <Ionicons name={icon as any} size={16} color={focused ? GOLD : MUTED} style={{ marginTop: multiline ? 2 : 0 }} />
        )}
        <TextInput
          style={[fld.input, multiline && { textAlignVertical: 'top', paddingTop: 4 }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={MUTED}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoCorrect={false}
          multiline={multiline}
          editable={editable}
          selectionColor={GOLD}
          textAlign="right"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}
const fld = StyleSheet.create({
  label:       { fontFamily: 'Tajawal_500Medium', fontSize: 12, color: MUTED, textAlign: 'right', marginBottom: 6 },
  wrap:        { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: INPUT, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  wrapFocused: { borderColor: GOLD + '60', backgroundColor: GOLD + '06' },
  input:       { flex: 1, fontFamily: 'Tajawal_400Regular', fontSize: 14, color: WHITE },
});

// ─── Traveler Card ────────────────────────────────────────────────────────────
function TravelerCard({ index, name, passport, onName, onPassport, autoFilled }: {
  index: number; name: string; passport: string;
  onName: (v: string) => void; onPassport: (v: string) => void;
  autoFilled?: boolean;
}) {
  return (
    <View style={tc.card}>
      <View style={tc.header}>
        <View style={tc.avatar}>
          <Text style={tc.avatarText}>{index + 1}</Text>
        </View>
        <Text style={tc.title}>المسافر {index + 1}</Text>
        {autoFilled && (
          <View style={tc.pill}>
            <Ionicons name="person-circle-outline" size={11} color={GOLD} />
            <Text style={tc.pillText}>من ملفك</Text>
          </View>
        )}
      </View>
      <Field
        label="الاسم الكامل"
        value={name}
        onChange={onName}
        placeholder="الاسم الكامل"
        icon="person-outline"
      />
      <Field
        label="رقم جواز السفر"
        value={passport}
        onChange={onPassport}
        placeholder="رقم الجواز"
        icon="card-outline"
        autoCapitalize="characters"
      />
    </View>
  );
}
const tc = StyleSheet.create({
  card:      { backgroundColor: NAVY3, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 12 },
  header:    { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatar:    { width: 28, height: 28, borderRadius: 14, backgroundColor: GOLD + '22', borderWidth: 1, borderColor: GOLD + '44', alignItems: 'center', justifyContent: 'center' },
  avatarText:{ fontFamily: 'Tajawal_800ExtraBold', fontSize: 13, color: GOLD },
  title:     { fontFamily: 'Tajawal_700Bold', fontSize: 14, color: WHITE, flex: 1, textAlign: 'right' },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GOLD + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  pillText:  { fontFamily: 'Tajawal_500Medium', fontSize: 10, color: GOLD },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BookPackageScreen() {
  const insets    = useSafeAreaInsets();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { data: pkg } = useGetPackage(Number(id));
  const createMutation = useCreatePackageBooking();

  const [travelersCount, setTravelersCount] = useState(1);
  const [names,     setNames]     = useState<string[]>(['']);
  const [passports, setPassports] = useState<string[]>(['']);
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [travelDate,setTravelDate]= useState('');
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ── Auto-fill from profile ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setNames(prev => {
      const a = [...prev];
      if (!a[0]) a[0] = user.fullName ?? '';
      return a;
    });
    setPassports(prev => {
      const a = [...prev];
      if (!a[0]) a[0] = (user as any).passportNumber ?? '';
      return a;
    });
    if (!phone) setPhone((user as any).phone ?? user.phone ?? '');
    if (!email) setEmail((user as any).email ?? user.email ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Entry animation ────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  // ── Travelers count ────────────────────────────────────────────────────────
  function updateCount(n: number) {
    const count = Math.max(1, n);
    setTravelersCount(count);
    setNames(prev => {
      const a = [...prev];
      while (a.length < count) a.push('');
      return a.slice(0, count);
    });
    setPassports(prev => {
      const a = [...prev];
      while (a.length < count) a.push('');
      return a.slice(0, count);
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!travelDate.trim()) {
      Alert.alert('بيانات ناقصة', 'يرجى اختيار تاريخ السفر');
      return;
    }
    if (!phone.trim() || !email.trim()) {
      Alert.alert('بيانات ناقصة', 'يرجى ملء رقم الهاتف والبريد الإلكتروني');
      return;
    }
    const emptyName = names.findIndex(n => !n.trim());
    if (emptyName !== -1) {
      Alert.alert('بيانات ناقصة', `يرجى إدخال اسم المسافر ${emptyName + 1}`);
      return;
    }
    setLoading(true);
    try {
      const result = await createMutation.mutateAsync({
        data: {
          packageId: Number(id),
          travelersCount,
          travelerNames: names,
          passportNumbers: passports,
          phone, email, travelDate, notes: notes || undefined,
        },
      });
      Alert.alert(
        '✅ تم إرسال طلب الحجز',
        `رقم طلبك: ${result.referenceNumber}\nسيتواصل معك فريقنا قريباً لتأكيد الحجز.`,
        [{ text: 'عرض حجوزاتي', onPress: () => router.replace('/bookings' as any) }],
      );
    } catch (e: any) {
      const msg = e?.data?.error ?? e?.message ?? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      Alert.alert('تعذر إرسال الطلب', msg, [{ text: 'حسناً' }]);
    } finally {
      setLoading(false);
    }
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: NAVY3, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="lock-closed-outline" size={32} color={GOLD} />
        </View>
        <Text style={{ fontFamily: 'Tajawal_700Bold', fontSize: 17, color: WHITE, textAlign: 'center' }}>يجب تسجيل الدخول أولاً</Text>
        <Text style={{ fontFamily: 'Tajawal_400Regular', fontSize: 14, color: MUTED, textAlign: 'center' }}>سجّل دخولك لحجز هذه الباقة</Text>
        <TouchableOpacity
          style={{ backgroundColor: GOLD, paddingHorizontal: 36, paddingVertical: 13, borderRadius: 14, marginTop: 4 }}
          onPress={() => router.push('/auth/login' as any)}
        >
          <Text style={{ fontFamily: 'Tajawal_800ExtraBold', fontSize: 15, color: NAVY }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profileFilled = !!(user?.fullName || (user as any)?.passportNumber);

  return (
    <View style={{ flex: 1, backgroundColor: NAVY }}>

      {/* ── Header ── */}
      <LinearGradient colors={[NAVY2, NAVY]} style={[styles.header, { paddingTop: paddingTop + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{pkg?.name ?? 'حجز الباقة'}</Text>
          <Text style={styles.headerSub}>تفاصيل الحجز والمسافرين</Text>
        </View>
        <View style={styles.headerBtn} />
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      >

        {/* ── Auto-fill Banner ── */}
        {profileFilled && (
          <View style={styles.autofillBanner}>
            <Ionicons name="person-circle-outline" size={18} color={GOLD} />
            <Text style={styles.autofillText}>
              تم ملء بياناتك تلقائياً من ملفك الشخصي — يمكنك تعديلها إذا لزم
            </Text>
          </View>
        )}

        {/* ── Package Summary ── */}
        {pkg && (
          <View style={styles.packageCard}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: GOLD + '18', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="briefcase-outline" size={18} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pkgName} numberOfLines={1}>{pkg.name}</Text>
                {(pkg as any).destination && <Text style={styles.pkgDest}>{(pkg as any).destination}</Text>}
              </View>
              {(pkg as any).price != null && (
                <View style={styles.pkgPriceBadge}>
                  <Text style={styles.pkgPrice}>${(pkg as any).price}</Text>
                </View>
              )}
            </View>
            {((pkg as any).durationDays || (pkg as any).maxGroupSize) && (
              <View style={styles.pkgMeta}>
                {(pkg as any).durationDays ? (
                  <View style={styles.pkgMetaItem}>
                    <Ionicons name="time-outline" size={13} color={MUTED} />
                    <Text style={styles.pkgMetaText}>{(pkg as any).durationDays} أيام</Text>
                  </View>
                ) : null}
                {(pkg as any).maxGroupSize ? (
                  <View style={styles.pkgMetaItem}>
                    <Ionicons name="people-outline" size={13} color={MUTED} />
                    <Text style={styles.pkgMetaText}>حتى {(pkg as any).maxGroupSize} مسافر</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* ── Travelers Count ── */}
        <View style={styles.section}>
          <SectionHeader icon="people-outline" title="عدد المسافرين" />
          <View style={styles.counterRow}>
            <TouchableOpacity
              onPress={() => updateCount(travelersCount - 1)}
              style={[styles.counterBtn, travelersCount <= 1 && { opacity: 0.35 }]}
              disabled={travelersCount <= 1}
            >
              <Ionicons name="remove" size={20} color={GOLD} />
            </TouchableOpacity>
            <View style={styles.counterDisplay}>
              <Text style={styles.counterVal}>{travelersCount}</Text>
              <Text style={styles.counterLabel}>مسافر</Text>
            </View>
            <TouchableOpacity onPress={() => updateCount(travelersCount + 1)} style={styles.counterBtn}>
              <Ionicons name="add" size={20} color={GOLD} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Traveler Cards ── */}
        <View style={styles.section}>
          <SectionHeader icon="id-card-outline" title="بيانات المسافرين" />
          {Array.from({ length: travelersCount }).map((_, i) => (
            <TravelerCard
              key={i}
              index={i}
              name={names[i] ?? ''}
              passport={passports[i] ?? ''}
              onName={v => { const a = [...names]; a[i] = v; setNames(a); }}
              onPassport={v => { const a = [...passports]; a[i] = v; setPassports(a); }}
              autoFilled={i === 0 && profileFilled}
            />
          ))}
        </View>

        {/* ── Contact Info ── */}
        <View style={styles.section}>
          <SectionHeader
            icon="call-outline"
            title="بيانات التواصل"
            badge={profileFilled ? 'من ملفك الشخصي' : undefined}
          />
          <View style={[styles.sectionCard]}>
            <Field
              label="رقم الهاتف *"
              value={phone}
              onChange={setPhone}
              placeholder="+964 7XX XXX XXXX"
              keyboardType="phone-pad"
              autoCapitalize="none"
              icon="call-outline"
            />
            <Field
              label="البريد الإلكتروني *"
              value={email}
              onChange={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
            />
          </View>
        </View>

        {/* ── Travel Date ── */}
        <View style={styles.section}>
          <SectionHeader icon="calendar-outline" title="تفاصيل الرحلة" />
          <View style={styles.sectionCard}>
            <DatePickerField
              label="تاريخ السفر *"
              value={travelDate}
              onChange={setTravelDate}
              minDate={TODAY}
              required
              placeholder="اختر تاريخ السفر"
            />
            <Field
              label="ملاحظات أو طلبات خاصة (اختياري)"
              value={notes}
              onChange={setNotes}
              placeholder="أي طلبات خاصة أو تفضيلات تريد إضافتها..."
              multiline
              icon="chatbubble-ellipses-outline"
            />
          </View>
        </View>

      </Animated.ScrollView>

      {/* ── Footer CTA ── */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
          style={{ borderRadius: 16, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={loading ? [NAVY3, NAVY3] : [ORANGE, '#E8620D']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color={WHITE} />
                <Text style={styles.submitBtnText}>إرسال طلب الحجز</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16, color: WHITE, textAlign: 'center' },
  headerSub:     { fontFamily: 'Tajawal_400Regular', fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 2 },

  // Auto-fill banner
  autofillBanner:{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: GOLD + '12', borderWidth: 1, borderColor: GOLD + '30', borderRadius: 12, padding: 12, marginBottom: 14 },
  autofillText:  { fontFamily: 'Tajawal_500Medium', fontSize: 12, color: GOLD + 'CC', flex: 1, textAlign: 'right', lineHeight: 18 },

  // Package summary card
  packageCard:   { backgroundColor: NAVY3, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 16 },
  pkgName:       { fontFamily: 'Tajawal_700Bold', fontSize: 14, color: WHITE, textAlign: 'right' },
  pkgDest:       { fontFamily: 'Tajawal_400Regular', fontSize: 12, color: MUTED, textAlign: 'right', marginTop: 2 },
  pkgPriceBadge: { backgroundColor: GOLD + '18', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: GOLD + '30' },
  pkgPrice:      { fontFamily: 'Tajawal_800ExtraBold', fontSize: 13, color: GOLD },
  pkgMeta:       { flexDirection: 'row-reverse', gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  pkgMetaItem:   { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  pkgMetaText:   { fontFamily: 'Tajawal_500Medium', fontSize: 12, color: MUTED },

  // Sections
  section:       { marginBottom: 8 },
  sectionCard:   { backgroundColor: NAVY3, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 12 },

  // Counter
  counterRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: NAVY3, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 20, marginBottom: 12 },
  counterBtn:    { width: 44, height: 44, borderRadius: 12, backgroundColor: GOLD + '18', borderWidth: 1, borderColor: GOLD + '30', alignItems: 'center', justifyContent: 'center' },
  counterDisplay:{ alignItems: 'center', minWidth: 60 },
  counterVal:    { fontFamily: 'Tajawal_800ExtraBold', fontSize: 32, color: WHITE },
  counterLabel:  { fontFamily: 'Tajawal_500Medium', fontSize: 12, color: MUTED, marginTop: -2 },

  // Footer
  footer:        { backgroundColor: NAVY2, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12, paddingHorizontal: 16 },
  submitBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 16 },
  submitBtnText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16, color: WHITE },
});
