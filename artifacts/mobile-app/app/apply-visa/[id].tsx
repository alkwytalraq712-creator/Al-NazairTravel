import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import {
  useGetVisa,
  useCreateVisaApplication,
  useGetProfileCompletion,
  useGetVisaEligibility,
  getListMyVisaApplicationsQueryKey,
} from '@workspace/api-client-react';
import type { Visa } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RequirementBadge({ label, met }: { label: string; met: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.badge, { backgroundColor: met ? '#f0fdf4' : '#fff7ed', borderColor: met ? '#22c55e' : '#f59e0b' }]}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'alert-circle-outline'}
        size={14}
        color={met ? '#16a34a' : '#d97706'}
      />
      <Text style={{ color: met ? '#15803d' : '#b45309', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

// ─── Profile Incomplete Wall ─────────────────────────────────────────────────

function ProfileIncompleteWall({ pct, missing }: { pct: number; missing: string[] }) {
  const colors = useColors();
  return (
    <View style={[styles.wallContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.wallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="person-circle-outline" size={64} color="#f59e0b" style={{ alignSelf: 'center' }} />
        <Text style={[styles.wallTitle, { color: colors.foreground }]}>
          الملف الشخصي غير مكتمل
        </Text>
        <Text style={[styles.wallSub, { color: colors.mutedForeground }]}>
          يجب إكمال ملفك الشخصي بالكامل ({pct}% مكتمل) قبل تقديم طلب التأشيرة.
        </Text>

        {missing.length > 0 && (
          <View style={[styles.missingBox, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
            <Text style={{ color: '#92400e', fontWeight: '700', marginBottom: 4, textAlign: 'right' }}>
              الحقول المطلوبة:
            </Text>
            {missing.slice(0, 8).map(f => (
              <Text key={f} style={{ color: '#78350f', fontSize: 12, textAlign: 'right' }}>• {f}</Text>
            ))}
            {missing.length > 8 && (
              <Text style={{ color: '#78350f', fontSize: 12, textAlign: 'right' }}>
                وأيضاً {missing.length - 8} حقول أخرى...
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.goProfileBtn, { backgroundColor: '#f59e0b' }]}
          onPress={() => router.replace('/profile-edit')}
          activeOpacity={0.85}
        >
          <Ionicons name="person-outline" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', marginRight: 6 }}>إكمال الملف الشخصي</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12, alignSelf: 'center' }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Eligibility Blocked Wall ─────────────────────────────────────────────────

function EligibilityBlockWall({ blockers }: { blockers: Array<{ type: string; message: string; actionRoute: string | null }> }) {
  const colors = useColors();
  return (
    <View style={[styles.wallContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.wallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="ban-outline" size={64} color="#ef4444" style={{ alignSelf: 'center' }} />
        <Text style={[styles.wallTitle, { color: colors.foreground }]}>غير مؤهل حالياً</Text>
        <Text style={[styles.wallSub, { color: colors.mutedForeground }]}>
          لا تستوفي المتطلبات اللازمة للتقديم على هذه التأشيرة في الوقت الحالي.
        </Text>

        <View style={[styles.missingBox, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
          {blockers.map((b, i) => (
            <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="close-circle" size={14} color="#ef4444" />
              <Text style={{ color: '#7f1d1d', fontSize: 13, textAlign: 'right', flex: 1 }}>{b.message}</Text>
            </View>
          ))}
        </View>

        {/* استكمال المتطلبات button — goes to profile if any blocker has actionRoute */}
        {blockers.some(b => b.actionRoute) && (
          <TouchableOpacity
            style={[styles.goProfileBtn, { backgroundColor: '#f59e0b' }]}
            onPress={() => {
              const route = blockers.find(b => b.actionRoute)?.actionRoute ?? '/profile-edit';
              router.push(route as any);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', marginRight: 6 }}>استكمال المتطلبات</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12, alignSelf: 'center' }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ApplyVisaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const visaId = Number(id);
  const { data: visa, isLoading: visaLoading } = useGetVisa({ id: visaId });
  const { data: completion, isLoading: compLoading } = useGetProfileCompletion();
  const { data: eligibility, isLoading: eligLoading } = useGetVisaEligibility({ id: visaId });
  const submitMutation = useCreateVisaApplication();

  // ── Auth gate
  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, marginBottom: 16 }}>يجب تسجيل الدخول أولاً</Text>
        <TouchableOpacity style={[styles.goProfileBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/auth/login')}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Loading
  if (visaLoading || compLoading || eligLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!visa) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>لم يتم العثور على التأشيرة</Text>
      </View>
    );
  }

  // ── Profile gate
  if (completion && !completion.isComplete) {
    return (
      <>
        <View style={[{ backgroundColor: '#0D1526', paddingTop: paddingTop + 12, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row-reverse', alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>التقديم على التأشيرة</Text>
          <View style={{ width: 24 }} />
        </View>
        <ProfileIncompleteWall pct={completion.percentage} missing={completion.missingFields} />
      </>
    );
  }

  const v = visa as Visa & {
    requiresGulfResidence?: boolean;
    requiresPersonalPhoto?: boolean;
    requiresPassportImage?: boolean;
    requiresBankStatement?: boolean;
    requiresFlightBooking?: boolean;
    requiresHotelBooking?: boolean;
    requiresTravelInsurance?: boolean;
    requiresAdditionalDocs?: boolean;
    requiresInvitationLetter?: boolean;
  };

  // ── Eligibility gate
  if (eligibility && !eligibility.eligible) {
    return (
      <>
        <View style={[{ backgroundColor: '#0D1526', paddingTop: paddingTop + 12, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row-reverse', alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>التقديم على التأشيرة</Text>
          <View style={{ width: 24 }} />
        </View>
        <EligibilityBlockWall blockers={eligibility.blockers as any} />
      </>
    );
  }

  function handleSubmit() {
    Alert.alert(
      'تأكيد الطلب',
      `هل تريد تقديم طلب تأشيرة ${visa!.countryName}؟ سيتم استخدام بيانات ملفك الشخصي تلقائياً.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تقديم الطلب',
          onPress: () => {
            submitMutation.mutate(
              { data: { visaId } },
              {
                onSuccess: (app) => {
                  queryClient.invalidateQueries({ queryKey: getListMyVisaApplicationsQueryKey() });
                  const appId = (app as any).id;
                  Alert.alert(
                    '✅ تم تقديم الطلب',
                    `رقم الطلب: ${(app as any).referenceNumber ?? '—'}\nسيتم التواصل معك قريباً.`,
                    [
                      { text: 'حسناً', onPress: () => router.replace('/(tabs)/bookings') },
                      {
                        text: 'متابعة طلبك الآن',
                        onPress: () => router.replace(`/visa-application/${appId}` as any),
                      },
                    ],
                  );
                },
                onError: (e: any) => {
                  const msg = e?.data?.error ?? e?.message ?? 'فشل تقديم الطلب، حاول مجدداً';
                  Alert.alert('خطأ', msg);
                },
              },
            );
          },
        },
      ],
    );
  }

  const u = user as any;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[{ backgroundColor: '#0D1526', paddingTop: paddingTop + 12, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 32, alignItems: 'center' }}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          تأشيرة {visa.countryName}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Visa Hero */}
        <Image source={{ uri: visa.countryImageUrl }} style={styles.heroImage} />
        <View style={styles.heroOverlay}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
            {visa.countryFlagUrl ? (
              <Image source={{ uri: visa.countryFlagUrl }} style={styles.flag} />
            ) : null}
            <Text style={styles.heroTitle}>{visa.countryName}</Text>
          </View>
          <Text style={styles.heroSub}>{visa.visaType} · {visa.processingTime} أيام معالجة</Text>
        </View>

        <View style={{ padding: 16 }}>
          {/* Requirements preview */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>متطلبات التأشيرة</Text>
          <View style={styles.badgeRow}>
            {v.requiresGulfResidence && <RequirementBadge label="إقامة خليجية" met={!!u?.hasGulfResidence} />}
            {v.requiresPersonalPhoto && <RequirementBadge label="صورة شخصية" met={!!u?.avatarUrl} />}
            {v.requiresPassportImage && <RequirementBadge label="صورة الجواز" met={!!u?.passportImageUrl} />}
            {v.requiresBankStatement && <RequirementBadge label="كشف حساب" met={false} />}
            {v.requiresFlightBooking && <RequirementBadge label="حجز طيران" met={false} />}
            {v.requiresHotelBooking && <RequirementBadge label="حجز فندق" met={false} />}
            {v.requiresTravelInsurance && <RequirementBadge label="تأمين سفر" met={false} />}
          </View>

          {/* Auto-filled data preview */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>بياناتك المسجلة (مملوءة تلقائياً)</Text>
          <View style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoRow label="الاسم الرباعي" value={u?.fullName} />
            <InfoRow label="الاسم بالإنجليزية" value={u?.englishName} />
            <InfoRow label="الجنسية" value={u?.nationality} />
            <InfoRow label="تاريخ الميلاد" value={u?.dob} />
            <InfoRow label="الجنس" value={u?.gender} />
            <InfoRow label="المهنة" value={u?.occupation} />
            <InfoRow label="رقم الجوال" value={u?.phone} />
            <InfoRow label="البريد الإلكتروني" value={u?.email} />
            <InfoRow label="رقم الجواز" value={u?.passportNumber} />
            <InfoRow label="تاريخ انتهاء الجواز" value={u?.passportExpiry} />
            <InfoRow label="دولة إصدار الجواز" value={u?.passportIssuingCountry} />
            {u?.hasGulfResidence && <InfoRow label="الإقامة الخليجية" value={`${u.gulfResidenceCountry ?? ''} – ${u.gulfResidenceNumber ?? ''}`} />}
          </View>

          {/* Price */}
          <View style={[styles.priceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>رسوم التأشيرة</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
              {visa.price} {visa.currency}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit CTA */}
      <View style={[styles.ctaBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitMutation.isPending ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
          activeOpacity={0.85}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>تقديم الطلب الآن</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  heroImage: { width: '100%', height: 200 },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 200,
    backgroundColor: 'rgba(13,21,38,0.55)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  flag: { width: 28, height: 20, borderRadius: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10, textAlign: 'right' },
  badgeRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  dataCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  priceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  priceLabel: { fontSize: 14 },
  priceValue: { fontSize: 22, fontWeight: '800' },
  ctaBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  wallContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  wallCard: { borderRadius: 16, borderWidth: 1, padding: 24, gap: 12 },
  wallTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  wallSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  missingBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 2 },
  goProfileBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
});
