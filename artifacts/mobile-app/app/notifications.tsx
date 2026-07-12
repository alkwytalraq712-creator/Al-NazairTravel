/**
 * Notifications Screen — Professional redesign
 * Tabs: all / offers / flights / visas / packages / payments / system
 * Features: search, mark-all-read, delete, deep-link on tap
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ActivityIndicator, Animated, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getListMyNotificationsQueryKey,
  useListMyNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

// ─── Notification type config ────────────────────────────────────────────────
type NotifType = 'all' | 'visa_application' | 'package_booking' | 'flight_booking' | 'general' | 'promotion' | 'payment' | 'system';

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  visa_application:  { icon: 'earth',              color: '#3B82F6', label: 'التأشيرات'   },
  package_booking:   { icon: 'briefcase',           color: '#8B5CF6', label: 'الباقات'     },
  flight_booking:    { icon: 'airplane',            color: '#C9A060', label: 'الرحلات'     },
  general:           { icon: 'notifications',       color: '#6366F1', label: 'عام'          },
  promotion:         { icon: 'pricetag',            color: '#F59E0B', label: 'العروض'      },
  payment:           { icon: 'card',                color: '#10B981', label: 'المدفوعات'   },
  system:            { icon: 'settings',            color: '#6B7280', label: 'النظام'      },
};

const TABS: { key: NotifType; label: string; icon: string }[] = [
  { key: 'all',              label: 'الكل',       icon: 'apps-outline'         },
  { key: 'promotion',        label: 'العروض',     icon: 'pricetag-outline'     },
  { key: 'flight_booking',   label: 'الرحلات',    icon: 'airplane-outline'     },
  { key: 'visa_application', label: 'التأشيرات',  icon: 'earth-outline'        },
  { key: 'package_booking',  label: 'الباقات',    icon: 'briefcase-outline'    },
  { key: 'payment',          label: 'المدفوعات',  icon: 'card-outline'         },
  { key: 'system',           label: 'النظام',     icon: 'settings-outline'     },
];

function timeAgo(dateIso: Date | string): string {
  const now = Date.now();
  const then = new Date(dateIso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60)    return 'الآن';
  if (diff < 3600)  return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  if (diff < 604800)return `منذ ${Math.floor(diff / 86400)} يوم`;
  return new Date(dateIso).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
}

// ─── Notification Card ────────────────────────────────────────────────────────
function NotifCard({
  item,
  onRead,
  onDelete,
}: {
  item: any;
  onRead: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.general;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  function handleTap() {
    if (!item.isRead) onRead();
    // Deep link: data.route from notification data
    const route = item.data?.route;
    if (route) {
      try { router.push(route as any); } catch {}
    }
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        onPress={handleTap}
        activeOpacity={0.75}
        style={[
          s.card,
          {
            backgroundColor: item.isRead ? colors.card : colors.card,
            borderColor: item.isRead ? colors.border : cfg.color + '40',
            borderLeftWidth: item.isRead ? 1 : 3,
          },
        ]}
      >
        {/* Unread dot */}
        {!item.isRead && (
          <View style={[s.unreadDot, { backgroundColor: cfg.color }]} />
        )}

        {/* Icon */}
        <View style={[s.iconWrap, { backgroundColor: cfg.color + '18' }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>

        {/* Content */}
        <View style={s.cardBody}>
          <View style={s.cardHead}>
            <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[s.cardTime, { color: colors.mutedForeground }]}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
          <Text style={[s.cardMsg, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.message}
          </Text>

          {/* Deep link indicator */}
          {item.data?.route && (
            <View style={s.linkRow}>
              <Ionicons name="arrow-back-outline" size={11} color={cfg.color} />
              <Text style={[s.linkText, { color: cfg.color }]}>اضغط للعرض</Text>
            </View>
          )}
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[s.deleteBtn, { backgroundColor: colors.muted }]}
        >
          <Ionicons name="close" size={13} color={colors.mutedForeground} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const colors     = useColors();
  const insets     = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [activeTab, setActiveTab] = useState<NotifType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: notifs, isLoading, refetch } = useListMyNotifications({
    query: { queryKey: getListMyNotificationsQueryKey(), enabled: isAuthenticated } as any,
  });

  const markRead      = useMarkNotificationRead();
  const markAllRead   = useMarkAllNotificationsRead();
  const deleteOne     = useDeleteNotification();
  const deleteAll     = useDeleteAllNotifications();

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = Array.isArray(notifs) ? [...notifs] : [];
    if (activeTab !== 'all') {
      list = list.filter((n) => {
        if (activeTab === 'system') return n.type === 'system' || n.type === 'general';
        return n.type === activeTab;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q),
      );
    }
    return list;
  }, [notifs, activeTab, searchQuery]);

  const unreadCount = Array.isArray(notifs) ? notifs.filter((n) => !n.isRead).length : 0;

  async function handleMarkRead(id: number) {
    try {
      await markRead.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListMyNotificationsQueryKey() });
    } catch {}
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead.mutateAsync();
    } catch {}
  }

  function handleDeleteOne(id: number) {
    deleteOne.mutate(id);
  }

  function handleDeleteAll() {
    Alert.alert(
      'حذف جميع الإشعارات',
      'هل أنت متأكد أنك تريد حذف جميع إشعاراتك الشخصية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف الكل', style: 'destructive', onPress: () => deleteAll.mutate() },
      ],
    );
  }

  // ── Not authenticated ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: paddingTop + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-forward" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>الإشعارات</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <View style={[s.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="lock-closed-outline" size={36} color={colors.mutedForeground} />
          </View>
          <Text style={[s.emptyMsg, { color: colors.mutedForeground }]}>يجب تسجيل الدخول لعرض الإشعارات</Text>
          <TouchableOpacity
            style={[s.loginBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <Text style={[s.loginBtnText, { color: colors.primary }]}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
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
          <View style={s.headerTitleRow}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>الإشعارات</Text>
            {unreadCount > 0 && (
              <View style={[s.unreadBadge, { backgroundColor: '#EF4444' }]}>
                <Text style={s.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.headerActions}>
          <TouchableOpacity
            onPress={() => setShowSearch((v) => !v)}
            style={[s.headerBtn, { backgroundColor: colors.muted }]}
          >
            <Ionicons name={showSearch ? 'close' : 'search'} size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('خيارات', '', [
                { text: 'تحديد الكل كمقروء', onPress: handleMarkAllRead },
                { text: 'حذف جميع الإشعارات', style: 'destructive', onPress: handleDeleteAll },
                { text: 'إلغاء', style: 'cancel' },
              ]);
            }}
            style={[s.headerBtn, { backgroundColor: colors.muted }]}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search bar ── */}
      {showSearch && (
        <View style={[s.searchWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
          <TextInput
            style={[s.searchInput, { color: colors.foreground }]}
            placeholder="ابحث في الإشعارات..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* ── Tabs ── */}
      <View style={[s.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const count = t.key === 'all'
              ? (notifs?.length ?? 0)
              : (notifs?.filter((n: any) => {
                  if (t.key === 'system') return n.type === 'system' || n.type === 'general';
                  return n.type === t.key;
                }).length ?? 0);
            return (
              <TouchableOpacity
                key={t.key}
                style={[s.tab, active && { borderBottomWidth: 2.5, borderBottomColor: colors.primary }]}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.75}
              >
                <Ionicons name={t.icon as any} size={14} color={active ? colors.primary : colors.mutedForeground} />
                <Text style={[s.tabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
                {count > 0 && (
                  <View style={[s.tabCount, { backgroundColor: active ? colors.primary : colors.muted }]}>
                    <Text style={[s.tabCountText, { color: active ? '#fff' : colors.mutedForeground }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>جاري تحميل الإشعارات...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <View style={[s.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons
              name={searchQuery ? 'search-outline' : 'notifications-off-outline'}
              size={36}
              color={colors.mutedForeground}
            />
          </View>
          <Text style={[s.emptyMsg, { color: colors.mutedForeground }]}>
            {searchQuery ? `لا توجد نتائج لـ "${searchQuery}"` : 'لا توجد إشعارات في هذا القسم'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 100 }}
        >
          {/* Unread summary bar */}
          {unreadCount > 0 && activeTab === 'all' && (
            <TouchableOpacity
              style={[s.unreadBar, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}
              onPress={handleMarkAllRead}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done-outline" size={14} color={colors.primary} />
              <Text style={[s.unreadBarText, { color: colors.primary }]}>
                لديك {unreadCount} إشعار{unreadCount > 1 ? 'ات' : ''} غير مقروء — اضغط للتحديد كمقروء
              </Text>
            </TouchableOpacity>
          )}

          {filtered.map((item: any) => (
            <NotifCard
              key={item.id}
              item={item}
              onRead={() => handleMarkRead(item.id)}
              onDelete={() => handleDeleteOne(item.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },

  // Header
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 14, gap: 8, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  headerTitle: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 18 },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 10 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Search
  searchWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontFamily: 'Tajawal_400Regular', fontSize: 14, paddingVertical: 4 },

  // Tabs
  tabBar: { borderBottomWidth: 1 },
  tabScroll: { flexDirection: 'row', paddingHorizontal: 8, gap: 2 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 12 },
  tabLabel: { fontFamily: 'Tajawal_700Bold', fontSize: 12 },
  tabCount: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabCountText: { fontFamily: 'Tajawal_700Bold', fontSize: 9 },

  // Unread bar
  unreadBar: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 10,
  },
  unreadBarText: { fontFamily: 'Tajawal_500Medium', fontSize: 12 },

  // Notification card
  card: {
    flexDirection: 'row-reverse', alignItems: 'flex-start',
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 8, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  unreadDot: { position: 'absolute', top: 10, left: 10, width: 8, height: 8, borderRadius: 4 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1 },
  cardHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontFamily: 'Tajawal_700Bold', fontSize: 14, flex: 1, textAlign: 'right' },
  cardTime: { fontFamily: 'Tajawal_400Regular', fontSize: 10, flexShrink: 0, marginRight: 8 },
  cardMsg: { fontFamily: 'Tajawal_400Regular', fontSize: 13, textAlign: 'right', lineHeight: 20 },
  linkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 6 },
  linkText: { fontFamily: 'Tajawal_500Medium', fontSize: 11 },
  deleteBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Empty
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emptyMsg: { fontFamily: 'Tajawal_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  loginBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  loginBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  loadingText: { fontFamily: 'Tajawal_400Regular', fontSize: 13 },
});
