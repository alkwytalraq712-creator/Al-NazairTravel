import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

const MENU_ITEMS = [
  { icon: 'document-text-outline', label: 'طلباتي وحجوزاتي', route: '/bookings' },
  { icon: 'notifications-outline', label: 'الإشعارات', route: '/notifications' },
  { icon: 'id-card-outline', label: 'الملف الشخصي', route: '/my-profile' },
  { icon: 'create-outline', label: 'تعديل الملف الشخصي', route: '/profile-edit' },
  { icon: 'shield-checkmark-outline', label: 'الأمان والخصوصية', route: '/security' },
  { icon: 'call-outline', label: 'اتصل بنا', route: '/contact' },
  { icon: 'help-circle-outline', label: 'المساعدة والدعم', route: '/help' },
] as const;

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // ignore — token is already cleared inside logout()
    } finally {
      setLoggingOut(false);
    }
    router.replace('/auth/login' as any);
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
          <Text style={styles.headerTitle}>حسابي</Text>
        </View>
        <View style={styles.guestContainer}>
          <Image source={require('@/assets/images/logo_transparent.png')} style={styles.guestLogo} resizeMode="contain" />
          <Text style={[styles.guestTitle, { color: colors.foreground }]}>مرحباً بك في قمة النظائر</Text>
          <Text style={[styles.guestSub, { color: colors.mutedForeground }]}>سجل دخولك لمتابعة طلباتك وحجوزاتك</Text>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.registerBtn, { borderColor: colors.primary }]}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.8}
          >
            <Text style={[styles.registerBtnText, { color: colors.primary }]}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <Text style={styles.headerTitle}>حسابي</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 120 }}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: '#0D1526' }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user!.fullName.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user!.fullName}</Text>
            <Text style={styles.profilePhone}>{user!.phone}</Text>
            {user!.email && <Text style={styles.profileEmail}>{user!.email}</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.stat} onPress={() => router.push('/bookings')}>
            <Ionicons name="document-text" size={22} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.foreground }]}>طلباتي</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.stat} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications" size={22} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.foreground }]}>إشعاراتي</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.stat}>
            <Ionicons name="airplane" size={22} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.foreground }]}>رحلاتي</Text>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={colors.mutedForeground} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name={item.icon as any} size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: loggingOut ? colors.border : colors.destructive, opacity: loggingOut ? 0.6 : 1 }]}
          onPress={handleLogout}
          activeOpacity={0.75}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color={colors.destructive} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          )}
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            {loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 16, alignItems: 'flex-end' },
  headerTitle: { fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', color: '#fff' },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  guestLogo: { width: 160, height: 70, marginBottom: 8 },
  guestTitle: { fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  guestSub: { fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'center', lineHeight: 22 },
  loginBtn: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  loginBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  registerBtn: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1.5 },
  registerBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 16 },
  profileCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, padding: 20, marginHorizontal: 16, marginTop: 16, borderRadius: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 26, fontFamily: 'Tajawal_800ExtraBold' },
  profileInfo: { flex: 1, alignItems: 'flex-end' },
  profileName: { color: '#fff', fontSize: 18, fontFamily: 'Tajawal_800ExtraBold' },
  profilePhone: { color: '#ffffffcc', fontSize: 13, fontFamily: 'Tajawal_400Regular' },
  profileEmail: { color: '#ffffffcc', fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  statsRow: { flexDirection: 'row-reverse', marginHorizontal: 16, marginTop: 14, borderRadius: 14, borderWidth: 1, padding: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 12, fontFamily: 'Tajawal_500Medium' },
  statDivider: { width: 1, marginHorizontal: 8 },
  menuCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 16 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Tajawal_500Medium', textAlign: 'right' },
  logoutBtn: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, margin: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  logoutText: { fontFamily: 'Tajawal_700Bold', fontSize: 15 },
});
