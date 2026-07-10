import React from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getListMyNotificationsQueryKey,
  useListMyNotifications,
  useMarkNotificationRead,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const NOTIF_ICONS: Record<string, string> = {
  visa_application: 'document-text',
  package_booking: 'map',
  flight_booking: 'airplane',
  general: 'notifications',
  promotion: 'pricetag',
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifs, isLoading } = useListMyNotifications({
    query: { queryKey: getListMyNotificationsQueryKey(), enabled: isAuthenticated } as any,
  });
  const markReadMutation = useMarkNotificationRead();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  async function handleRead(notifId: number) {
    try {
      await markReadMutation.mutateAsync({ id: notifId });
      await queryClient.invalidateQueries({ queryKey: getListMyNotificationsQueryKey() });
    } catch { /* silent */ }
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.lockText, { color: colors.foreground }]}>يجب تسجيل الدخول لعرض الإشعارات</Text>
        <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/auth/login')}>
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-forward" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>الإشعارات</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={notifs ?? []}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: Platform.OS === 'web' ? 34 : 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد إشعارات</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => !item.isRead && handleRead(item.id)}
              style={[styles.notifItem, { backgroundColor: item.isRead ? colors.background : colors.accent, borderBottomColor: colors.border }]}
              activeOpacity={item.isRead ? 1 : 0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={(NOTIF_ICONS[item.type] ?? 'notifications') as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                  <Text style={[styles.notifTitle, { color: colors.foreground }]}>{item.title}</Text>
                </View>
                <Text style={[styles.notifMsg, { color: colors.mutedForeground }]} numberOfLines={2}>{item.message}</Text>
                <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>{new Date(item.createdAt).toLocaleDateString('ar')}</Text>
              </View>
            </TouchableOpacity>
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
  headerTitle: { color: '#fff', fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' },
  notifItem: { flexDirection: 'row-reverse', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  notifContent: { flex: 1, alignItems: 'flex-end' },
  notifHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  notifTitle: { fontSize: 14, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifMsg: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right', lineHeight: 20, marginTop: 4 },
  notifTime: { fontSize: 11, fontFamily: 'Tajawal_400Regular', marginTop: 4 },
  emptyContainer: { alignItems: 'center', gap: 12, paddingTop: 80 },
  emptyText: { fontFamily: 'Tajawal_400Regular', fontSize: 14 },
});
