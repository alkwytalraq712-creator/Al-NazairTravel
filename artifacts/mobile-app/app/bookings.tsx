import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

type Tab = 'visa' | 'package' | 'flight';

const VISA_STATUS: Record<string, { label: string; color: string }> = {
  received: { label: 'تم الاستلام', color: '#3B82F6' },
  reviewing: { label: 'جاري المراجعة', color: '#F59E0B' },
  awaiting_documents: { label: 'بانتظار مستندات', color: '#EF4444' },
  submitted_to_embassy: { label: 'تم تقديم للسفارة', color: '#8B5CF6' },
  processing: { label: 'جاري المعالجة', color: '#F08015' },
  issued: { label: 'تم إصدار التأشيرة', color: '#10B981' },
  completed: { label: 'مكتمل', color: '#059669' },
  rejected: { label: 'مرفوض', color: '#EF4444' },
};

const PKG_STATUS: Record<string, { label: string; color: string }> = {
  received: { label: 'تم الاستلام', color: '#3B82F6' },
  reviewing: { label: 'جاري المراجعة', color: '#F59E0B' },
  confirmed: { label: 'مؤكد', color: '#10B981' },
  awaiting_payment: { label: 'بانتظار الدفع', color: '#EF4444' },
  paid: { label: 'تم الدفع', color: '#10B981' },
  vouchers_issued: { label: 'تم إصدار القسائم', color: '#059669' },
  completed: { label: 'مكتمل', color: '#059669' },
  cancelled: { label: 'ملغي', color: '#6B7280' },
};

const FLIGHT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: '#3B82F6' },
  confirmed: { label: 'مؤكد', color: '#10B981' },
  ticketed: { label: 'تم إصدار التذكرة', color: '#059669' },
  cancelled: { label: 'ملغي', color: '#6B7280' },
  completed: { label: 'مكتمل', color: '#059669' },
};

function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; color: string }> }) {
  const info = map[status] ?? { label: status, color: '#6B7280' };
  return (
    <View style={{ backgroundColor: info.color + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
      <Text style={{ color: info.color, fontFamily: 'Tajawal_700Bold', fontSize: 12 }}>{info.label}</Text>
    </View>
  );
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('visa');
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const visaOpts = { query: { queryKey: getListMyVisaApplicationsQueryKey(), enabled: isAuthenticated } as any };
  const pkgOpts = { query: { queryKey: getListMyPackageBookingsQueryKey(), enabled: isAuthenticated } as any };
  const flightOpts = { query: { queryKey: getListMyFlightBookingsQueryKey(), enabled: isAuthenticated } as any };

  const { data: visaApps, isLoading: va } = useListMyVisaApplications(visaOpts);
  const { data: pkgBooks, isLoading: pb } = useListMyPackageBookings(pkgOpts);
  const { data: flightBooks, isLoading: fb } = useListMyFlightBookings(flightOpts);

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.lockText, { color: colors.foreground }]}>يجب تسجيل الدخول لعرض طلباتك</Text>
        <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/auth/login')}>
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLoading = va || pb || fb;

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'visa', label: 'التأشيرات', count: visaApps?.length ?? 0 },
    { key: 'package', label: 'الباقات', count: pkgBooks?.length ?? 0 },
    { key: 'flight', label: 'الطيران', count: flightBooks?.length ?? 0 },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-forward" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>طلباتي وحجوزاتي</Text>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && { borderBottomWidth: 2, borderBottomColor: colors.primary }]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabLabel, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
            {t.count > 0 && <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}><Text style={styles.tabBadgeText}>{t.count}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : tab === 'visa' ? (
        <FlatList
          data={visaApps ?? []}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<View style={styles.emptyBox}><Ionicons name="document-outline" size={40} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد طلبات تأشيرة</Text></View>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/visa-application/${item.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <StatusBadge status={item.status} map={VISA_STATUS} />
                <Text style={[styles.refNum, { color: colors.mutedForeground }]}>{item.referenceNumber}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.fullName}</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>جواز: {item.passportNumber}</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{new Date(item.createdAt).toLocaleDateString('ar')}</Text>
              <View style={styles.cardFooter}>
                <Ionicons name="chevron-back" size={14} color={colors.primary} />
                <Text style={[styles.cardTrack, { color: colors.primary }]}>متابعة الطلب</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : tab === 'package' ? (
        <FlatList
          data={pkgBooks ?? []}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<View style={styles.emptyBox}><Ionicons name="map-outline" size={40} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد حجوزات باقات</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <StatusBadge status={item.status} map={PKG_STATUS} />
                <Text style={[styles.refNum, { color: colors.mutedForeground }]}>{item.referenceNumber}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.travelersCount} مسافرين</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>تاريخ السفر: {item.travelDate}</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{new Date(item.createdAt).toLocaleDateString('ar')}</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={flightBooks ?? []}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<View style={styles.emptyBox}><Ionicons name="airplane-outline" size={40} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد حجوزات طيران</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <StatusBadge status={item.status} map={FLIGHT_STATUS} />
                <Text style={[styles.refNum, { color: colors.mutedForeground }]}>{item.referenceNumber}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.offer.fromAirport} → {item.offer.toAirport}</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{item.offer.airlineName} • {item.offer.currency} {item.offer.price}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  lockText: { fontSize: 16, fontFamily: 'Tajawal_500Medium', textAlign: 'center' },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' },
  tabs: { flexDirection: 'row-reverse', borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabLabel: { fontSize: 13, fontFamily: 'Tajawal_700Bold' },
  tabBadge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Tajawal_700Bold' },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  refNum: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  cardTitle: { fontSize: 15, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 4 },
  cardSub: { fontSize: 12, fontFamily: 'Tajawal_400Regular', textAlign: 'right' },
  cardFooter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 10 },
  cardTrack: { fontSize: 12, fontFamily: 'Tajawal_700Bold' },
  emptyBox: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontFamily: 'Tajawal_400Regular', fontSize: 14, textAlign: 'center' },
});
