import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useTheme, type ThemePreference } from '@/context/ThemeContext';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  getBiometricLabel,
  authenticateBiometric,
} from '@/lib/biometric';

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return '';
}

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: string }[] = [
  { key: 'light', label: 'نهاري', icon: 'sunny-outline' },
  { key: 'dark',  label: 'ليلي',  icon: 'moon-outline' },
  { key: 'system',label: 'تلقائي',icon: 'settings-outline' },
];

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('البصمة البيومترية');
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        const enabled = await isBiometricEnabled();
        setBiometricEnabledState(enabled);
        const label = await getBiometricLabel();
        setBiometricLabel(label);
      }
    })();
  }, []);

  async function handleBiometricToggle(value: boolean) {
    if (biometricLoading) return;
    setBiometricLoading(true);
    try {
      if (value) {
        // Require biometric auth to enable
        const ok = await authenticateBiometric('تفعيل تسجيل الدخول بالبصمة');
        if (!ok) return;
        await setBiometricEnabled(true);
        setBiometricEnabledState(true);
        Alert.alert('تم التفعيل', `يمكنك الآن استخدام ${biometricLabel} لتسجيل الدخول.`);
      } else {
        await setBiometricEnabled(false);
        setBiometricEnabledState(false);
      }
    } finally {
      setBiometricLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const { getAuthToken } = await import('../context/AuthContext');
      const token = await getAuthToken();
      const res = await fetch(`${getApiBase()}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال' })) as { error?: string };
        throw new Error(err.error ?? 'فشل تغيير كلمة المرور');
      }
      Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مجدداً.', [
        { text: 'حسناً', onPress: () => logout() },
      ]);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'حذف الحساب',
      'هل أنت متأكد من حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => Alert.alert('تواصل معنا', 'لحذف حسابك، يرجى التواصل مع خدمة العملاء عبر واتساب.'),
        },
      ],
    );
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>الأمان والخصوصية</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

        {/* ── Theme Mode ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="contrast-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>مظهر التطبيق</Text>
          </View>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.themePill,
                    { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + '22' : colors.muted },
                  ]}
                  onPress={() => setTheme(opt.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={opt.icon as any} size={18} color={active ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.themePillText, { color: active ? colors.primary : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Biometric Auth ── */}
        {biometricAvailable && Platform.OS !== 'web' && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="finger-print" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>تسجيل الدخول البيومتري</Text>
            </View>
            <View style={styles.biometricRow}>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={biometricLoading}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.biometricLabel, { color: colors.foreground }]}>{biometricLabel}</Text>
                <Text style={[styles.biometricSub, { color: colors.mutedForeground }]}>
                  {biometricEnabled ? 'مفعّل — يمكنك تسجيل الدخول بدون كلمة مرور' : 'غير مفعّل'}
                </Text>
              </View>
              {biometricLoading && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
          </View>
        )}

        {/* ── Change Password ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="key-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>تغيير كلمة المرور</Text>
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>كلمة المرور الحالية</Text>
          <View style={[styles.passRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TextInput style={[styles.passInput, { color: colors.foreground }]} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showCurrent} placeholder="••••••••" placeholderTextColor={colors.mutedForeground} textAlign="right" />
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>كلمة المرور الجديدة</Text>
          <View style={[styles.passRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TextInput style={[styles.passInput, { color: colors.foreground }]} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNew} placeholder="6 أحرف على الأقل" placeholderTextColor={colors.mutedForeground} textAlign="right" />
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>تأكيد كلمة المرور الجديدة</Text>
          <TextInput
            style={inputStyle}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="أعد إدخال كلمة المرور"
            placeholderTextColor={colors.mutedForeground}
            textAlign="right"
          />

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>تغيير كلمة المرور</Text>}
          </TouchableOpacity>
        </View>

        {/* ── Privacy ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الخصوصية</Text>
          </View>
          {[
            { icon: 'document-text-outline', label: 'سياسة الخصوصية', route: '/legal/privacy' },
            { icon: 'newspaper-outline', label: 'الشروط والأحكام', route: '/legal/terms' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.row, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons name="chevron-back" size={18} color={colors.mutedForeground} />
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Ionicons name={item.icon as any} size={20} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Danger Zone ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={20} color={colors.destructive} />
            <Text style={[styles.sectionTitle, { color: colors.destructive }]}>منطقة الخطر</Text>
          </View>
          <TouchableOpacity
            style={[styles.dangerBtn, { borderColor: colors.destructive }]}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            <Text style={[styles.dangerBtnText, { color: colors.destructive }]}>حذف الحساب نهائياً</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' },
  section: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Tajawal_700Bold' },

  // Theme selector
  themeRow: { flexDirection: 'row-reverse', gap: 10 },
  themePill: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
  },
  themePillText: { fontFamily: 'Tajawal_700Bold', fontSize: 13 },

  // Biometric
  biometricRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  biometricLabel: { fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' },
  biometricSub: { fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right', marginTop: 2 },

  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 8, marginTop: 4 },
  input: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1, fontFamily: 'Tajawal_400Regular', fontSize: 15, marginBottom: 4 },
  passRow: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, marginBottom: 4 },
  passInput: { flex: 1, paddingVertical: 14, fontFamily: 'Tajawal_400Regular', fontSize: 15 },
  actionBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  actionBtnText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: 'Tajawal_500Medium', textAlign: 'right' },
  dangerBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  dangerBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 15 },
});
