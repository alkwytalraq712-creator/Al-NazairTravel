import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator, Animated, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
const GOLD2 = '#E8C07A';
const NAVY = '#060B18';
const NAVY2 = '#0C1628';
const NAVY3 = '#121F38';

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

function getStatusInfo(type: Tab | 'all', status: string, colors: any) {
  if (type === 'flight') {
    if (status === 'pending') return { label: 'قيد الانتظار', color: colors.warning };
    if (status === 'confirmed') return { label: 'مؤكد', color: colors.info };
    if (status === 'ticketed') return { label: 'صدرت التذكرة', color: colors.success };
    if (status === 'cancelled') return { label: 'ملغي', color: colors.mutedForeground };
    if (status === 'completed') return { label: 'مكتمل', color: colors.success };
    if (status === 'held') return { label: 'حجز مؤقت', color: colors.primary };
    if (status === 'expired_hold') return { label: 'انتهى الحجز المؤقت', color: colors.destructive };
  }
  if (type === 'visa') {
    if (status === 'received') return { label: 'تم الاستلام', color: colors.info };
    if (status === 'reviewing') return { label: 'جاري المراجعة', color: colors.warning };
    if (status === 'awaiting_documents') return { label: 'بانتظار مستندات', color: colors.destructive };
    if (status === 'submitted_to_embassy') return { label: 'مقدّمة للسفارة', color: colors.primary };
    if (status === 'processing') return { label: 'جاري المعالجة', color: colors.primary };
    if (status === 'issued') return { label: 'صدرت التأشيرة', color: colors.success };
    if (status === 'completed') return { label: 'مكتمل', color: colors.success };
    if (status === 'rejected') return { label: 'مرفوض', color: colors.destructive };
  }
  if (type === 'package') {
    if (status === 'received') return { label: 'تم الاستلام', color: colors.info };
    if (status === 'reviewing') return { label: 'جاري المراجعة', color: colors.warning };
    if (status === 'confirmed') return { label: 'مؤكد', color: colors.success };
    if (status === 'awaiting_payment') return { label: 'بانتظار الدفع', color: colors.destructive };
    if (status === 'paid') return { label: 'تم الدفع', color: colors.success };
    if (status === 'vouchers_issued') return { label: 'تم إصدار القسائم', color: colors.success };
    if (status === 'completed') return { label: 'مكتمل', color: colors.success };
    if (status === 'cancelled') return { label: 'ملغي', color: colors.mutedForeground };
  }
  return { label: status, color: colors.mutedForeground };
}

function formatDateAr(iso: string) {
  try { return new Date(iso).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + '1A', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: color + '33' }}>
      <Text style={{ color, fontFamily: 'Tajawal_700Bold', fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function TypeBadge({ type, colors }: { type: 'flight' | 'visa' | 'package', colors: any }) {
  const cfg = {
    flight:  { icon: 'airplane',  grad: [GOLD, GOLD2] },
    visa:    { icon: 'earth',     grad: [colors.info, colors.info + 'CC'] },
    package: { icon: 'briefcase', grad: [colors.primary, colors.primary + 'CC'] },
  }[type];
  return (
    <LinearGradient
      colors={cfg.grad}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={cfg.icon as any} size={20} color="#FFFFFF" />
    </LinearGradient>
  );
}

function OrderCard({ order, showType = false, index }: { order: UnifiedOrder; showType?: boolean; index: number }) {
  const colors = useColors();
  const statusInfo = getStatusInfo(order.type, order.status, colors);
  const canViewTicket = order.type === 'flight' && ['ticketed', 'confirmed', 'held'].includes(order.status);
  const canViewDetail = order.type === 'visa';

  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.cardHead}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flexShrink: 1 }}>
            {showType && <TypeBadge type={order.type} colors={colors} />}
            <StatusBadge label={statusInfo.label} color={statusInfo.color} />
          </View>
          <Text style={[s.cardRef, { color: colors.mutedForeground }]} numberOfLines={1}>{order.refNumber}</Text>
        </View>

        <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{order.title}</Text>
        {order.subtitle ? <Text style={[s.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>{order.subtitle}</Text> : null}

        <View style={s.cardMeta}>
          <View style={s.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
            <Text style={[s.metaText, { color: colors.mutedForeground }]}>{formatDateAr(order.date)}</Text>
          </View>
          {order.updatedAt && order.updatedAt !== order.date && (
            <View style={s.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
              <Text style={[s.metaText, { color: colors.mutedForeground }]}>آخر تحديث: {formatDateAr(order.updatedAt)}</Text>
            </View>
          )}
        </View>

        <View style={[s.cardActions, { borderTopColor: colors.border }]}>
          {canViewTicket && (
            <>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: GOLD + '1A', borderColor: GOLD + '40' }]}
                onPress={() => router.push(`/e-ticket/${order.id}` as any)}
                activeOpacity={0.75}
              >
                <Ionicons name="ticket-outline" size={16} color={GOLD} />
                <Text style={[s.actionText, { color: GOLD }]}>عرض التذكرة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: colors.success + '1A', borderColor: colors.success + '40' }]}
                onPress={() => router.push(`/e-ticket/${order.id}` as any)}
                activeOpacity={0.75}
              >
                <Ionicons name="download-outline" size={16} color={colors.success} />
                <Text style={[s.actionText, { color: colors.success }]}>تحميل PDF</Text>
              </TouchableOpacity>
            </>
          )}
          {canViewDetail && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: colors.info + '1A', borderColor: colors.info + '40' }]}
              onPress={() => router.push(`/visa-application/${order.id}` as any)}
              activeOpacity={0.75}
            >
              <Ionicons name="eye-outline" size={16} color={colors.info} />
              <Text style={[s.actionText, { color: colors.info }]}>متابعة الطلب</Text>
            </TouchableOpacity>
          )}
          {!canViewTicket && !canViewDetail && (
            <View style={s.metaItem}>
              <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
              <Text style={[s.metaText, { color: colors.mutedForeground }]}>سيتم التواصل معك قريباً</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function EmptyState({ icon, message, cta, onCta }: { icon: string; message: string; cta?: string; onCta?: () => void }) {
  const colors = useColors();
  return (
    <View style={s.emptyWrap}>
      <View style={[s.emptyIcon, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon as any} size={40} color={colors.mutedForeground} />
      </View>
      <Text style={[s.emptyMsg, { color: colors.mutedForeground }]}>{message}</Text>
      {cta && onCta && (
        <TouchableOpacity style={[s.emptyBtn, { backgroundColor: GOLD + '1A', borderColor: GOLD + '40' }]} onPress={onCta} activeOpacity={0.8}>
          <Text style={[s.emptyBtnText, { color: GOLD }]}>{cta}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

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

  const TABS: { key: Tab; label: string; count: number; icon: string }[] = [
    { key: 'all',     label: 'الكل',      count: allOrders.length,   icon: 'apps' },
    { key: 'flight',  label: 'الطيران',   count: allFlights.length,  icon: 'airplane' },
    { key: 'visa',    label: 'التأشيرات', count: allVisas.length,    icon: 'earth' },
    { key: 'package', label: 'الباقات',   count: allPackages.length, icon: 'briefcase' },
  ];

  if (!isAuthenticated) {
    return (
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[NAVY, NAVY2, NAVY3]}
          style={[s.header, { paddingTop: paddingTop + 12 }]}
        >
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>طلباتي وحجوزاتي</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
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
      <LinearGradient
        colors={[NAVY, NAVY2, NAVY3]}
        style={[s.header, { paddingTop: paddingTop + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>طلباتي وحجوزاتي</Text>
          {allOrders.length > 0 && (
            <Text style={s.headerSub}>{allOrders.length} طلب / حجز</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Premium Segmented Control */}
      <View style={[s.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                activeOpacity={0.8}
                style={s.tabBtnWrap}
              >
                {active ? (
                  <LinearGradient
                    colors={[GOLD, GOLD2]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.tabBtnActive}
                  >
                    <Ionicons name={t.icon as any} size={16} color="#FFFFFF" />
                    <Text style={s.tabLabelActive}>{t.label}</Text>
                    {t.count > 0 && (
                      <View style={s.tabCountActive}>
                        <Text style={s.tabCountTextActive}>{t.count}</Text>
                      </View>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={s.tabBtnInactive}>
                    <Ionicons name={t.icon as any} size={16} color={colors.mutedForeground} />
                    <Text style={[s.tabLabelInactive, { color: colors.mutedForeground }]}>{t.label}</Text>
                    {t.count > 0 && (
                      <View style={[s.tabCountInactive, { backgroundColor: colors.muted }]}>
                        <Text style={[s.tabCountTextInactive, { color: colors.mutedForeground }]}>{t.count}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
          contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 100 }}
        >
          {tab === 'all' && (
            <View style={[s.comingSoonBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
              <Text style={[s.comingSoonText, { color: colors.mutedForeground }]}>
                قريباً: الفنادق، النقل، والمزيد من الخدمات
              </Text>
            </View>
          )}

          {displayList.map((order, index) => (
            <OrderCard key={`${order.type}-${order.id}`} order={order} showType={tab === 'all'} index={index} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16, gap: 12,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.10)', 
    alignItems: 'center', justifyContent: 'center' 
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 18, color: '#FFFFFF' },
  headerSub: { fontFamily: 'Tajawal_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  tabBar: { borderBottomWidth: 1, paddingVertical: 12 },
  tabScroll: { flexDirection: 'row-reverse', paddingHorizontal: 16, gap: 8 },
  tabBtnWrap: { borderRadius: 16, overflow: 'hidden' },
  tabBtnActive: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16,
  },
  tabLabelActive: { fontFamily: 'Tajawal_700Bold', fontSize: 13, color: '#FFFFFF' },
  tabCountActive: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  tabCountTextActive: { fontFamily: 'Tajawal_700Bold', fontSize: 11, color: '#FFFFFF' },
  
  tabBtnInactive: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16,
    backgroundColor: 'transparent',
  },
  tabLabelInactive: { fontFamily: 'Tajawal_500Medium', fontSize: 13 },
  tabCountInactive: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  tabCountTextInactive: { fontFamily: 'Tajawal_700Bold', fontSize: 11 },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontFamily: 'Tajawal_500Medium', fontSize: 14 },

  comingSoonBar: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  comingSoonText: { fontFamily: 'Tajawal_500Medium', fontSize: 13 },

  card: {
    borderRadius: 22, borderWidth: 1, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2,
  },
  cardHead: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingBottom: 12,
  },
  cardRef: { fontFamily: 'Tajawal_500Medium', fontSize: 12, letterSpacing: 0.5 },
  cardTitle: {
    fontFamily: 'Tajawal_700Bold', fontSize: 16,
    textAlign: 'right', paddingHorizontal: 16, marginBottom: 6,
  },
  cardSub: {
    fontFamily: 'Tajawal_400Regular', fontSize: 13,
    textAlign: 'right', paddingHorizontal: 16, marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, paddingBottom: 16,
  },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: 'Tajawal_500Medium', fontSize: 12 },

  cardActions: {
    flexDirection: 'row-reverse', gap: 10, flexWrap: 'wrap',
    padding: 16, borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1,
  },
  actionText: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyMsg: { fontFamily: 'Tajawal_500Medium', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  emptyBtn: {
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, borderWidth: 1, marginTop: 8,
  },
  emptyBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 15 },
});
