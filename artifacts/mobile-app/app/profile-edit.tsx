import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
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
import { useUpdateProfile, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateProfile();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('خطأ', 'الاسم الكامل مطلوب');
      return;
    }
    updateMutation.mutate(
      { data: { fullName: fullName.trim(), email: email.trim() || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          Alert.alert('تم', 'تم تحديث الملف الشخصي بنجاح', [
            { text: 'حسناً', onPress: () => router.back() },
          ]);
        },
        onError: (e: any) => {
          Alert.alert('خطأ', e?.error ?? 'فشل التحديث، حاول مجدداً');
        },
      },
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Avatar Placeholder */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{(user?.fullName ?? 'U').charAt(0)}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>الاسم الكامل *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="الاسم الكامل"
            placeholderTextColor={colors.mutedForeground}
            textAlign="right"
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>رقم الهاتف</Text>
          <View style={[styles.disabledInput, { backgroundColor: colors.muted + '80', borderColor: colors.border }]}>
            <Text style={[styles.disabledText, { color: colors.mutedForeground }]}>{user?.phone}</Text>
            <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>رقم الهاتف لا يمكن تغييره</Text>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>البريد الإلكتروني (اختياري)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
          activeOpacity={0.85}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 34, fontFamily: 'Tajawal_800ExtraBold' },
  card: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  label: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 8, marginTop: 8 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: 'Tajawal_400Regular',
    fontSize: 15,
  },
  disabledInput: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  disabledText: { flex: 1, fontFamily: 'Tajawal_400Regular', fontSize: 15, textAlign: 'right' },
  hint: { fontSize: 11, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginTop: 4, marginBottom: 4 },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
});
