import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ActivityIndicator, Animated, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

const GOLD = '#C9A060';
const GOLD2 = '#E8C07A';
const NAVY = '#060B18';
const NAVY2 = '#0C1628';
const NAVY3 = '#121F38';

type NotifType = 'all' | 'visa_application' | 'package_booking' | 'flight_booking' | 'general' | 'promotion' | 'payment' | 'system';

function getTypeConfig(type: string, colors: any) {
  const map: Record<string, { icon: string; grad: string[] }> = {
    visa_application:  { icon: 'earth',        grad: [colors.info, colors.info + 'CC'] },
    package_booking:   { icon: 'briefcase',     grad: [colors.primary, colors.primary + 'CC'] },
    flight_booking:    { icon: 'airplane',      grad: [GOLD, GOLD2] },
    general:           { icon: 'notifications', grad: [colors.mutedForeground, colors.mutedForeground + 'CC'] },
    promotion:         { icon: 'pricetag',      grad: [colors.warning, colors.warning + 'CC'] },
    payment:           { icon: 'card',          grad: [colors.success, colors.success + 'CC'] },
    system:            { icon: 'settings',      grad: [colors.secondary, colors.secondary + 'CC'] },
  };
  return map[type] ?? map.general;
}

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

function NotifCard({ item, onRead, onDelete, index }: { item: any; onRead: () => void; onDelete: () => void; index: number }) {
  const colors = useColors();
  const cfg = getTypeConfig(item.type, colors);
  
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, delay: index * 60, useNativeDriver: true })
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  function handleTap() {
    if (!item.isRead) onRead();
    const route = item.data?.route;
    if (route) {
      try { router.push(route as any); } catch {}
    }
  }

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        onPress={handleTap}
        activeOpacity={0.75}
        style={[
          s.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderLeftWidth: item.isRead ? 1 : 4,
            borderLeftColor: item.isRead ? colors.border : GOLD,
          },
        ]}
      >
        <LinearGradient
          colors={cfg.grad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.iconWrap}
        >
          <Ionicons name={cfg.icon as any} size={20} color="#FFFFFF" />
        </LinearGradient>

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

          {item.data?.route && (
            <View style={s.linkRow}>
              <Ionicons name="arrow-back-outline" size={14} color={cfg.grad[0]} />
              <Text style={[s.linkText, { color: cfg.grad[0] }]}>اضغط للعرض</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[s.deleteBtn, { backgroundColor: colors.muted }]}
        >
          <Ionicons name="close" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const colors     = useColors();
  const insets     = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [activeTab, setActiveTab] = useState<NotifType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Notifications.setBadgeCountAsync(0).catch(() => {});
    }
  }, []);

  const { data: notifs, isLoading } = useListMyNotifications({
    query: { queryKey: getListMyNotificationsQueryKey(), enabled: isAuthenticated } as any,
  });

  const markRead      = useMarkNotificationRead();
  const markAllRead   = useMarkAllNotificationsRead();
  const deleteOne     = useDeleteNotification();
  const deleteAll     = useDeleteAllNotifications();

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
            <Text style={s.headerTitle}>الإشعارات</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={s.center}>
          <View style={[s.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[s.emptyMsg, { color: colors.mutedForeground }]}>يجب تسجيل الدخول لعرض الإشعارات</Text>
          <TouchableOpacity
            style={[s.loginBtn, { backgroundColor: GOLD + '1A', borderColor: GOLD + '40' }]}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <Text style={[s.loginBtnText, { color: GOLD }]}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
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
          <View style={s.headerTitleRow}>
            <Text style={s.headerTitle}>الإشعارات</Text>
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
            style={s.headerBtn}
          >
            <Ionicons name={showSearch ? 'close' : 'search'} size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('خيارات', '', [
                { text: 'تحديد الكل كمقروء', onPress: handleMarkAllRead },
                { text: 'حذف جميع الإشعارات', style: 'destructive', onPress: handleDeleteAll },
                { text: 'إلغاء', style: 'cancel' },
              ]);
            }}
            style={s.headerBtn}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {showSearch && (
        <View style={[s.searchWrap, { backgroundColor: colors.background }]}>
          <View style={[
            s.searchInner, 
            { backgroundColor: colors.card, borderColor: isSearchFocused ? GOLD : colors.border }
          ]}>
            <Ionicons name="search-outline" size={18} color={isSearchFocused ? GOLD : colors.mutedForeground} style={{ marginLeft: 8 }} />
            <TextInput
              style={[s.searchInput, { color: colors.foreground }]}
              placeholder="ابحث في الإشعارات..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              textAlign="right"
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

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
                style={s.tabBtnWrap}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.75}
              >
                {active ? (
                  <LinearGradient
                    colors={[GOLD, GOLD2]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.tabBtnActive}
                  >
                    <Ionicons name={t.icon as any} size={16} color="#FFFFFF" />
                    <Text style={s.tabLabelActive}>{t.label}</Text>
                    {count > 0 && (
                      <View style={s.tabCountActive}>
                        <Text style={s.tabCountTextActive}>{count}</Text>
                      </View>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={s.tabBtnInactive}>
                    <Ionicons name={t.icon as any} size={16} color={colors.mutedForeground} />
                    <Text style={[s.tabLabelInactive, { color: colors.mutedForeground }]}>{t.label}</Text>
                    {count > 0 && (
                      <View style={[s.tabCountInactive, { backgroundColor: colors.muted }]}>
                        <Text style={[s.tabCountTextInactive, { color: colors.mutedForeground }]}>{count}</Text>
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
        <View style={s.center}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>جاري تحميل الإشعارات...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <View style={[s.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons
              name={searchQuery ? 'search-outline' : 'notifications-off-outline'}
              size={40}
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
          contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 100 }}
        >
          {unreadCount > 0 && activeTab === 'all' && (
            <TouchableOpacity
              style={[s.unreadBar, { backgroundColor: GOLD + '14', borderColor: GOLD + '40' }]}
              onPress={handleMarkAllRead}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done-outline" size={18} color={GOLD} />
              <Text style={[s.unreadBarText, { color: GOLD }]}>
                تحديد {unreadCount} إشعار{unreadCount > 1 ? 'ات' : ''} غير مقروء كمقروءة
              </Text>
            </TouchableOpacity>
          )}

          {filtered.map((item: any, index) => (
            <NotifCard
              key={item.id}
              item={item}
              index={index}
              onRead={() => handleMarkRead(item.id)}
              onDelete={() => handleDeleteOne(item.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },

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
  headerTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 18, color: '#FFFFFF' },
  unreadBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 11 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.10)', 
    alignItems: 'center', justifyContent: 'center' 
  },

  searchWrap: { padding: 12 },
  searchInner: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, 
    borderRadius: 20, borderWidth: 1, gap: 10,
  },
  searchInput: { flex: 1, fontFamily: 'Tajawal_500Medium', fontSize: 15, paddingVertical: 0 },

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

  unreadBar: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16,
  },
  unreadBarText: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },

  card: {
    flexDirection: 'row-reverse', alignItems: 'flex-start',
    borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 12, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1 },
  cardHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontFamily: 'Tajawal_700Bold', fontSize: 15, flex: 1, textAlign: 'right' },
  cardTime: { fontFamily: 'Tajawal_500Medium', fontSize: 11, flexShrink: 0, marginRight: 10 },
  cardMsg: { fontFamily: 'Tajawal_400Regular', fontSize: 13, textAlign: 'right', lineHeight: 22 },
  linkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 8 },
  linkText: { fontFamily: 'Tajawal_700Bold', fontSize: 12 },
  deleteBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyMsg: { fontFamily: 'Tajawal_500Medium', fontSize: 15, textAlign: 'center', lineHeight: 24, marginTop: 8 },
  loginBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, borderWidth: 1, marginTop: 8 },
  loginBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 15 },
  loadingText: { fontFamily: 'Tajawal_500Medium', fontSize: 14 },
});
