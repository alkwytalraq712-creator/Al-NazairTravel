import React from 'react';
import {
  Image,
  Linking,
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
import { useGetProfileCompletion } from '@workspace/api-client-react';

const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];

function formatDateAr(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS_AR[m - 1]} ${y}`;
  } catch {
    return iso;
  }
}

const RESIDENCE_LABELS: Record<string, string> = {
  none:      '—',
  gcc:       'دول مجلس التعاون الخليجي',
  schengen:  'دول شنغن',
  uk:        'المملكة المتحدة',
  usa:       'الولايات المتحدة الأمريكية',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Tajawal_400Regular' }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: 'Tajawal_500Medium', flex: 1, textAlign: 'right', marginRight: 12 }}>{value || '—'}</Text>
    </View>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 16, backgroundColor: colors.accent }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon as any} size={17} color={colors.primary} />
        </View>
        <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>{title}</Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
        {children}
      </View>
    </View>
  );
}

function DocumentImage({ uri, label }: { uri: string; label: string }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginBottom: 6 }}>{label}</Text>
      <Image
        source={{ uri }}
        style={{ width: '100%', height: 180, borderRadius: 10, backgroundColor: colors.muted }}
        resizeMode="cover"
      />
    </View>
  );
}

export default function MyProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const { data: completion } = useGetProfileCompletion();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const pct = completion?.percentage ?? 0;
  const isComplete = completion?.isComplete ?? false;

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_500Medium', fontSize: 15 }}>يجب تسجيل الدخول أولاً</Text>
        <TouchableOpacity
          onPress={() => router.push('/auth/login' as any)}
          style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const u = user as any;
  const residenceType = u?.residenceType ?? 'none';
  const hasResidencePhotos = residenceType !== 'none' && (u?.gulfResidenceFrontUrl || u?.gulfResidenceBackUrl);

  const barColor = isComplete ? '#22c55e' : pct >= 60 ? '#f59e0b' : colors.primary;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop }}>
      {/* Header */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
          <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Tajawal_700Bold', color: colors.foreground }}>الملف الشخصي</Text>
        <TouchableOpacity onPress={() => router.push('/profile-edit' as any)}>
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ backgroundColor: colors.card, paddingTop: 28, paddingBottom: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 }}>
          {/* Avatar */}
          <View style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.primary, overflow: 'hidden', backgroundColor: colors.muted, marginBottom: 14 }}>
            {u?.avatarUrl ? (
              <Image source={{ uri: u.avatarUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
                <Text style={{ color: '#fff', fontSize: 32, fontFamily: 'Tajawal_700Bold' }}>
                  {u?.fullName?.charAt(0) ?? 'م'}
                </Text>
              </View>
            )}
          </View>

          <Text style={{ fontSize: 20, fontFamily: 'Tajawal_700Bold', color: colors.foreground }}>{u?.fullName ?? '—'}</Text>
          {u?.phone && <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: 'Tajawal_400Regular', marginTop: 2 }}>{u.phone}</Text>}
          {u?.email && <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: 'Tajawal_400Regular' }}>{u.email}</Text>}

          {/* Completion bar */}
          <View style={{ width: '80%', marginTop: 18 }}>
            {isComplete ? (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={{ color: '#22c55e', fontFamily: 'Tajawal_700Bold', fontSize: 14 }}>تم إكمال الملف الشخصي</Text>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Tajawal_400Regular' }}>اكتمال الملف</Text>
                  <Text style={{ color: barColor, fontSize: 13, fontFamily: 'Tajawal_700Bold' }}>{pct}%</Text>
                </View>
                <View style={{ height: 7, backgroundColor: colors.muted, borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: 4 }} />
                </View>
              </>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Edit button */}
          <TouchableOpacity
            onPress={() => router.push('/profile-edit' as any)}
            style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, marginBottom: 20 }}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 }}>تعديل الملف الشخصي</Text>
          </TouchableOpacity>

          {/* Personal info */}
          <Section title="المعلومات الشخصية" icon="person-outline">
            <InfoRow label="الاسم الكامل" value={u?.fullName ?? ''} />
            <InfoRow label="تاريخ الميلاد" value={formatDateAr(u?.dob)} />
          </Section>

          {/* Passport */}
          <Section title="جواز السفر" icon="card-outline">
            <InfoRow label="رقم الجواز" value={u?.passportNumber ?? ''} />
            <InfoRow label="تاريخ الإصدار" value={formatDateAr(u?.passportIssueDate)} />
            <InfoRow label="تاريخ الانتهاء" value={formatDateAr(u?.passportExpiry)} />
            {u?.passportImageUrl && (
              <View style={{ paddingVertical: 12 }}>
                <DocumentImage uri={u.passportImageUrl} label="صورة جواز السفر" />
              </View>
            )}
          </Section>

          {/* Residence */}
          <Section title="الإقامة" icon="home-outline">
            <InfoRow label="حالة الإقامة" value={RESIDENCE_LABELS[residenceType] ?? '—'} />
            {hasResidencePhotos && (
              <View style={{ paddingTop: 8 }}>
                {u?.gulfResidenceFrontUrl && (
                  <DocumentImage uri={u.gulfResidenceFrontUrl} label="صورة الإقامة/التأشيرة (الوجه الأمامي)" />
                )}
                {u?.gulfResidenceBackUrl && (
                  <DocumentImage uri={u.gulfResidenceBackUrl} label="صورة الإقامة/التأشيرة (الوجه الخلفي)" />
                )}
              </View>
            )}
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}
