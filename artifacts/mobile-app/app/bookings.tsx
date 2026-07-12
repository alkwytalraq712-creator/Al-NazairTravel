/**
 * My Orders & Bookings — طلباتي وحجوزاتي
 * Professional unified orders page with tabs for all service types.
 * Standard: Booking.com / Almosafer / Wego level.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator, Animated, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getListMyFlightBookingsQueryKey,
  getListMyPackageBookingsQueryKey,
  getListMyVisaApplicationsQueryKey,
  useListMyFlightBookings,
  useListMyPackageBookings,
  useListMyVisaApplications,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

const GOLD = '#C9A060';

// ─── Status maps ──────────────────────────────────────────────────────────────
const VISA_STATUS: Record<string, { label: string; color: string }> = {
  received:             { label: 'تم الاستلام',         color: '#3B82F6' },
  reviewing:            { label: 'جاري المراجعة',       color: '#F59E0B' },
  awaiting_documents:   { label: 'بانتظار مستندات',     color: '#EF4444' },
  submitted_to_embassy: { label: 'مقدّمة للسفارة',       color: '#8B5CF6' },
  processing:           { label: 'جاري المعالجة',       color: '#F08015' },
  issued:               { label: 'صدرت التأشيرة',       color: '#10B981' },
  completed:            { label: 'مكتمل',                color: '#059669' },
  rejected:             { label: 'مرفوض',               color: '#EF4444' },
};
const PKG_STATUS: Record<string, { label: string; color: string }> = {
  received:         { label: 'تم الاستلام',     color: '#3B82F6' },
  reviewing:        { label: 'جاري المراجعة',   color: '#F59E0B' },
  confirmed:        { label: 'مؤكد',            color: '#10B981' },
  awaiting_payment: { label: 'بانتظار الدفع',   color: '#EF4444' },
  paid:             { label: 'تم الدفع',         color: '#10B981' },
  vouchers_issued:  { label: 'تم إصدار القسائم',color: '#059669' },
  completed:        { label: 'مكتمل',            color: '#059669' },
  cancelled:        { label: 'ملغي',             color: '#6B7280' },
};
const FLIGHT_STATUS: Record<string, { label: string; color: string }> = {
  pending:      { label: 'قيد الانتظار',     color: '#F59E0B' },
  confirmed:    { label: 'مؤكد',             color: '#3B82F6' },
  ticketed:     { label: 'صدرت التذكرة',     color: '#10B981' },
  cancelled:    { label: 'ملغي',             color: '#6B7280' },
  completed:    { label: 'مكتمل',            color: '#059669' },
  held:         { label: 'حجز مؤقت',        color: '#F97316' },
  expired_hold: { label: 'انتهى الحجز المؤقت', color: '#EF4444' },
};

type Tab = 'all' | 'flight' | 'visa' | 'package';

interface UnifiedOrder {
  id: number;
  type: 'flight' | 'visa' | 'package';
  refNumber: string;
  status: string;
  title: string;
  subtitle: string;
  date: string;
  updatedAt?: string;
  raw: any;
}

function getStatusInfo(type: Tab | 'all', status: string) {
  if (type === 'flight') return FLIGHT_STATUS[status] ?? { label: status, color: '#6B7280' };
  if (type === 'visa')   return VISA_STATUS[status]   ?? { label: status, color: '#6B7280' };
  if (type === 'package')return PKG_STATUS[status]    ?? { label: status, color: '#6B7280' };
  return { label: status, color: '#6B7280' };
}

function formatDateAr(iso: string) {
  try { return new Date(iso).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + '18', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: color + '35' }}>
      <Text style={{ color, fontFamily: 'Tajawal_700Bold', fontSize: 11 }}>{label}</Text>
    </View>
  );
}

// ─── Type Icon Badge ──────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: 'flight' | 'visa' | 'package' }) {
  const cfg = {
    flight:  { icon: 'airplane',        color: GOLD,      label: 'طيران' },
    visa:    { icon: 'earth',           color: '#3B82F6', label: 'تأشيرة' },
    package: { icon: 'briefcase',       color: '#8B5CF6', label: 'باقة' },
  }[type];
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: cfg.color + '14', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
      <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
      <Text style={{ color: cfg.color, fontFamily: 'Tajawal_500Medium', fontSize: 10 }}>{cfg.label}</Text>
    </View>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, showType = false }: { order: UnifiedOrder; showType?: boolean }) {
  const colors = useColors();
  const statusInfo = getStatusInfo(order.type, order.status);
  const canViewTicket = order.type === 'flight' && ['ticketed', 'confirmed', 'held'].includes(order.status);
  const canViewDetail = order.type === 'visa';

  // Slide-in animation
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

        {/* Card header */}
        <View style={s.cardHead}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexShrink: 1 }}>
            {showType && <TypeBadge type={order.type} />}
            <StatusBadge label={statusInfo.label} color={statusInfo.color} />
          </View>
          <Text style={[s.cardRef, { color: colors.mutedForeground }]} numberOfLines={1}>{order.refNumber}</Text>
        </View>

        {/* Title */}
        <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{order.title}</Text>
        {order.subtitle ? <Text style={[s.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>{order.subtitle}</Text> : null}

        {/* Meta row */}
        <View style={s.cardMeta}>
          <View style={s.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
            <Text style={[s.metaText, { color: colors.mutedForeground }]}>{formatDateAr(order.date)}</Text>
          </View>
          {order.updatedAt && order.updatedAt !== order.date && (
            <View style={s.metaItem}>
              <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
              <Text style={[s.metaText, { color: colors.mutedForeground }]}>آخر تحديث: {formatDateAr(order.updatedAt)}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={[s.cardActions, { borderTopColor: colors.border }]}>
          {canViewTicket && (
            <>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: GOLD + '14', borderColor: GOLD + '35' }]}
                onPress={() => router.push(`/e-ticket/${order.id}` as any)}
                activeOpacity={0.75}
              >
                <Ionicons name="ticket-outline" size={14} color={GOLD} />
                <Text style={[s.actionText, { color: GOLD }]}>عرض التذكرة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: '#10B98114', borderColor: '#10B98135' }]}
                onPress={() => router.push(`/e-ticket/${order.id}` as any)}
                activeOpacity={0.75}
              >
                <Ionicons name="download-outline" size={14} color="#10B981" />
                <Text style={[s.actionText, { color: '#10B981' }]}>تحميل PDF</Text>
              </TouchableOpacity>
            </>
          )}
          {canViewDetail && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#3B82F614', borderColor: '#3B82F635' }]}
              onPress={() => router.push(`/visa-application/${order.id}` as any)}
              activeOpacity={0.75}
            >
              <Ionicons name="eye-outline" size={14} color="#3B82F6" />
              <Text style={[s.actionText, { color: '#3B82F6' }]}>متابعة الطلب</Text>
            </TouchableOpacity>
          )}
          {!canViewTicket && !canViewDetail && (
            <View style={s.metaItem}>
              <Ionicons name="information-circle-outline" size={13} color={colors.mutedForeground} />
              <Text style={[s.metaText, { color: colors.mutedForeground }]}>سيتم التواصل معك قريباً</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon, message, cta, onCta }: { icon: string; message: string; cta?: string; onCta?: () => void }) {
  const colors = useColors();
  return (
    <View style={s.emptyWrap}>
      <View style={[s.emptyIcon, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon as any} size={36} color={colors.mutedForeground} />
      </View>
      <Text style={[s.emptyMsg, { color: colors.mutedForeground }]}>{message}</Text>
      {cta && onCta && (
        <TouchableOpacity style={[s.emptyBtn, { backgroundColor: GOLD + '18', borderColor: GOLD + '35' }]} onPress={onCta} activeOpacity={0.8}>
          <Text style={[s.emptyBtnText, { color: GOLD }]}>{cta}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BookingsScreen() {
  const colors     = useColors();
  const insets     = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('all');
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const visaOpts   = { query: { queryKey: getListMyVisaApplicationsQueryKey(),  enabled: isAuthenticated } as any };
  const pkgOpts    = { query: { queryKey: getListMyPackageBookingsQueryKey(),    enabled: isAuthenticated } as any };
  const flightOpts = { query: { queryKey: getListMyFlightBookingsQueryKey(),     enabled: isAuthenticated } as any };

  const { data: visaApps,    isLoading: vl } = useListMyVisaApplications(visaOpts);
  const { data: pkgBooks,    isLoading: pl } = useListMyPackageBookings(pkgOpts);
  const { data: flightBooks, isLoading: fl } = useListMyFlightBookings(flightOpts);

  const isLoading = vl || pl || fl;

  // ─── Normalize all orders ───────────────────────────────────────────────────
  const allFlights: UnifiedOrder[] = (flightBooks ?? []).map((f: any) => ({
    id:        f.id,
    type:      'flight',
    refNumber: f.referenceNumber ?? f.bookingReference ?? `#${f.id}`,
    status:    f.status,
    title:     `${f.offer?.fromAirport ?? '—'} → ${f.offer?.toAirport ?? '—'}`,
    subtitle:  [f.offer?.airlineName, f.offer?.flightNumber].filter(Boolean).join(' · '),
    date:      f.createdAt,
    updatedAt: f.updatedAt ?? f.createdAt,
    raw:       f,
  }));

  const allVisas: UnifiedOrder[] = (visaApps ?? []).map((v: any) => ({
    id:        v.id,
    type:      'visa',
    refNumber: v.referenceNumber ?? `#${v.id}`,
    status:    v.status,
    title:     v.fullName ?? 'طلب تأشيرة',
    subtitle:  v.passportNumber ? `جواز: ${v.passportNumber}` : '',
    date:      v.createdAt,
    updatedAt: v.updatedAt ?? v.createdAt,
    raw:       v,
  }));

  const allPackages: UnifiedOrder[] = (pkgBooks ?? []).map((p: any) => ({
    id:        p.id,
    type:      'package',
    refNumber: p.referenceNumber ?? `#${p.id}`,
    status:    p.status,
    title:     p.package?.title ?? `باقة سياحية #${p.id}`,
    subtitle:  p.travelersCount ? `${p.travelersCount} مسافرين · ${p.travelDate ?? ''}`.trim() : '',
    date:      p.createdAt,
    updatedAt: p.updatedAt ?? p.createdAt,
    raw:       p,
  }));

  const allOrders = [...allFlights, ...allVisas, ...allPackages]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayList: UnifiedOrder[] =
    tab === 'all'     ? allOrders    :
    tab === 'flight'  ? allFlights   :
    tab === 'visa'    ? allVisas     :
                        allPackages;

  const TABS: { key: Tab; label: string; count: number; icon: string; color: string }[] = [
    { key: 'all',     label: 'الكل',      count: allOrders.length,   icon: 'apps',       color: '#6366F1' },
    { key: 'flight',  label: 'الطيران',   count: allFlights.length,  icon: 'airplane',   color: GOLD      },
    { key: 'visa',    label: 'التأشيرات', count: allVisas.length,    icon: 'earth',      color: '#3B82F6' },
    { key: 'package', label: 'الباقات',   count: allPackages.length, icon: 'briefcase',  color: '#8B5CF6' },
  ];

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: paddingTop + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-forward" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>طلباتي وحجوزاتي</Text>
          <View style={{ width: 36 }} />
        </View>
        <EmptyState
          icon="lock-closed-outline"
          message="يجب تسجيل الدخول لعرض طلباتك وحجوزاتك"
          cta="تسجيل الدخول"
          onCta={() => router.push('/auth/login')}
        />
      </View>
    );
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: paddingTop + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>طلباتي وحجوزاتي</Text>
          {allOrders.length > 0 && (
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>{allOrders.length} طلب / حجز</Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Tabs ── */}
      <View style={[s.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[s.tabBtn, active && { borderBottomWidth: 2.5, borderBottomColor: t.color }]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.75}
              >
                <Ionicons name={t.icon as any} size={15} color={active ? t.color : colors.mutedForeground} />
                <Text style={[s.tabLabel, { color: active ? t.color : colors.mutedForeground }]}>{t.label}</Text>
                {t.count > 0 && (
                  <View style={[s.tabCount, { backgroundColor: active ? t.color : colors.muted }]}>
                    <Text style={[s.tabCountText, { color: active ? '#fff' : colors.mutedForeground }]}>{t.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>جاري تحميل طلباتك...</Text>
        </View>
      ) : displayList.length === 0 ? (
        <EmptyState
          icon={
            tab === 'flight'  ? 'airplane-outline' :
            tab === 'visa'    ? 'earth-outline'    :
            tab === 'package' ? 'briefcase-outline' :
            'document-outline'
          }
          message={
            tab === 'flight'  ? 'لا توجد حجوزات طيران بعد' :
            tab === 'visa'    ? 'لا توجد طلبات تأشيرة بعد' :
            tab === 'package' ? 'لا توجد حجوزات باقات بعد' :
            'لا توجد طلبات أو حجوزات بعد'
          }
          cta={
            tab === 'flight'  ? 'ابحث عن رحلة'   :
            tab === 'visa'    ? 'تقدم بطلب تأشيرة' :
            tab === 'package' ? 'استكشف الباقات'   :
            'ابدأ رحلتك الآن'
          }
          onCta={() => router.push('/' as any)}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 14, paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 100 }}
        >
          {/* Future services placeholder (coming soon tabs) */}
          {tab === 'all' && (
            <View style={[s.comingSoonBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
              <Text style={[s.comingSoonText, { color: colors.mutedForeground }]}>
                قريباً: الفنادق، النقل، والمزيد من الخدمات
              </Text>
            </View>
          )}

          {displayList.map(order => (
            <OrderCard key={`${order.type}-${order.id}`} order={order} showType={tab === 'all'} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 14, gap: 8, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 17 },
  headerSub: { fontFamily: 'Tajawal_400Regular', fontSize: 11, marginTop: 1 },

  // Tabs
  tabBar: { borderBottomWidth: 1 },
  tabScroll: { flexDirection: 'row', paddingHorizontal: 10, gap: 4 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 13,
  },
  tabLabel: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },
  tabCount: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  tabCountText: { fontFamily: 'Tajawal_700Bold', fontSize: 10 },

  // Loading
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { fontFamily: 'Tajawal_400Regular', fontSize: 14 },

  // Coming soon bar
  comingSoonBar: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 12,
  },
  comingSoonText: { fontFamily: 'Tajawal_400Regular', fontSize: 12 },

  // Order card
  card: {
    borderRadius: 18, borderWidth: 1, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHead: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, paddingBottom: 10,
  },
  cardRef: { fontFamily: 'Tajawal_400Regular', fontSize: 11, letterSpacing: 0.5 },
  cardTitle: {
    fontFamily: 'Tajawal_700Bold', fontSize: 15,
    textAlign: 'right', paddingHorizontal: 14, marginBottom: 4,
  },
  cardSub: {
    fontFamily: 'Tajawal_400Regular', fontSize: 12,
    textAlign: 'right', paddingHorizontal: 14, marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 14, paddingBottom: 12,
  },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: 'Tajawal_400Regular', fontSize: 11 },

  cardActions: {
    flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap',
    padding: 12, borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  actionText: { fontFamily: 'Tajawal_700Bold', fontSize: 12 },

  // Empty state
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyMsg: { fontFamily: 'Tajawal_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginTop: 4,
  },
  emptyBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
});
