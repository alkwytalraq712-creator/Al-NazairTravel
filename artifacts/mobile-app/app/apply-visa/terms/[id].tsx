import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  useAcceptVisaTerms,
  useCreateVisaApplication,
  useGetProfileCompletion,
  useGetVisaEligibility,
  getListMyVisaApplicationsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

// ─── Terms content ────────────────────────────────────────────────────────────

const TERMS_ITEMS = [
  'أقر بأن جميع البيانات والمعلومات والمستندات التي سأقدمها صحيحة وكاملة، وأتحمل كامل المسؤولية القانونية عن أي معلومات غير صحيحة أو مضللة.',
  'أقر بأن جميع الوثائق المرفقة أصلية وسارية المفعول ولم يتم تعديلها أو تزويرها بأي شكل.',
  'أقر بأن تقديم الطلب لا يعني الموافقة على إصدار التأشيرة، وأن قرار إصدار أو رفض التأشيرة يعود بالكامل للجهة الحكومية أو السفارة المختصة.',
  'أقر بأن شركة قمة النظائر للسفريات والسياحة هي وسيط لتجهيز وإرسال الطلب فقط، ولا تتحمل مسؤولية قرار قبول أو رفض التأشيرة.',
  'أقر بأن الرسوم الحكومية ورسوم السفارات -إن وجدت- قد تكون غير قابلة للاسترداد بعد بدء إجراءات الطلب وفق سياسة الجهة المختصة.',
  'أقر بأنني مسؤول عن متابعة صلاحية جواز السفر وجميع الوثائق المطلوبة قبل التقديم.',
  'أوافق على استخدام بياناتي الشخصية ومستنداتي لغرض معالجة طلب التأشيرة والتواصل معي بشأن الطلب فقط، مع الالتزام بالمحافظة على سريتها وفق الأنظمة المعمول بها.',
  'أتعهد بالرد على أي طلبات إضافية للمستندات إذا طلبتها السفارة أو الجهة المختصة.',
  'أقر بأن أي تأخير ناتج عن السفارات أو الجهات الحكومية أو الظروف الخارجة عن إرادة الشركة لا تتحمل الشركة مسؤوليته.',
  'أتعهد بمراجعة جميع البيانات قبل إرسال الطلب، وأتحمل مسؤولية أي خطأ ناتج عن المعلومات التي قمت بإدخالها.',
  'أقر بأن الشركة تحتفظ بحق طلب أي مستندات إضافية إذا كانت مطلوبة لاستكمال إجراءات التأشيرة.',
  'أوافق على استقبال الإشعارات والرسائل المتعلقة بطلبي عبر التطبيق أو البريد الإلكتروني أو الرسائل النصية أو الهاتف أو الواتساب.',
];

// ─── Gate walls ───────────────────────────────────────────────────────────────

function ProfileIncompleteWall({
  pct,
  missing,
  paddingTop,
}: {
  pct: number;
  missing: string[];
  paddingTop: number;
}) {
  const colors = useColors();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: paddingTop + 12, backgroundColor: '#0D1526' },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التقديم على التأشيرة</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={[styles.wallContainer]}>
        <View
          style={[
            styles.wallCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="person-circle-outline"
            size={64}
            color="#f59e0b"
            style={{ alignSelf: 'center' }}
          />
          <Text style={[styles.wallTitle, { color: colors.foreground }]}>
            الملف الشخصي غير مكتمل
          </Text>
          <Text style={[styles.wallSub, { color: colors.mutedForeground }]}>
            يجب إكمال ملفك الشخصي بالكامل ({pct}% مكتمل) قبل تقديم طلب
            التأشيرة.
          </Text>

          {missing.length > 0 && (
            <View
              style={[
                styles.missingBox,
                { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
              ]}
            >
              <Text
                style={{
                  color: '#92400e',
                  fontFamily: 'Tajawal_700Bold',
                  marginBottom: 4,
                  textAlign: 'right',
                }}
              >
                الحقول المطلوبة:
              </Text>
              {missing.slice(0, 8).map((f) => (
                <Text
                  key={f}
                  style={{
                    color: '#78350f',
                    fontSize: 12,
                    fontFamily: 'Tajawal_400Regular',
                    textAlign: 'right',
                  }}
                >
                  • {f}
                </Text>
              ))}
              {missing.length > 8 && (
                <Text
                  style={{
                    color: '#78350f',
                    fontSize: 12,
                    fontFamily: 'Tajawal_400Regular',
                    textAlign: 'right',
                  }}
                >
                  وأيضاً {missing.length - 8} حقول أخرى...
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.wallBtn, { backgroundColor: '#f59e0b' }]}
            onPress={() => router.replace('/profile-edit' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="person-outline" size={16} color="#fff" />
            <Text style={styles.wallBtnText}>إكمال الملف الشخصي</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 12, alignSelf: 'center' }}
          >
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 13,
                fontFamily: 'Tajawal_400Regular',
              }}
            >
              رجوع
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function EligibilityBlockWall({
  blockers,
  paddingTop,
}: {
  blockers: Array<{ type: string; message: string; actionRoute: string | null }>;
  paddingTop: number;
}) {
  const colors = useColors();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: paddingTop + 12, backgroundColor: '#0D1526' },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التقديم على التأشيرة</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.wallContainer}>
        <View
          style={[
            styles.wallCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="ban-outline"
            size={64}
            color="#ef4444"
            style={{ alignSelf: 'center' }}
          />
          <Text style={[styles.wallTitle, { color: colors.foreground }]}>
            غير مؤهل حالياً
          </Text>
          <Text style={[styles.wallSub, { color: colors.mutedForeground }]}>
            لا تستوفي المتطلبات اللازمة للتقديم على هذه التأشيرة في الوقت
            الحالي.
          </Text>

          <View
            style={[
              styles.missingBox,
              { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
            ]}
          >
            {blockers.map((b, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <Ionicons name="close-circle" size={14} color="#ef4444" />
                <Text
                  style={{
                    color: '#7f1d1d',
                    fontSize: 13,
                    fontFamily: 'Tajawal_400Regular',
                    textAlign: 'right',
                    flex: 1,
                  }}
                >
                  {b.message}
                </Text>
              </View>
            ))}
          </View>

          {blockers.some((b) => b.actionRoute) && (
            <TouchableOpacity
              style={[styles.wallBtn, { backgroundColor: '#f59e0b' }]}
              onPress={() => {
                const route =
                  blockers.find((b) => b.actionRoute)?.actionRoute ??
                  '/profile-edit';
                router.push(route as any);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.wallBtnText}>استكمال المتطلبات</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 12, alignSelf: 'center' }}
          >
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 13,
                fontFamily: 'Tajawal_400Regular',
              }}
            >
              رجوع
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VisaTermsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [agreed, setAgreed] = useState(false);

  const visaId = Number(id);

  // ── Preflight checks
  const { data: completion, isLoading: compLoading } = useGetProfileCompletion();
  const { data: eligibility, isLoading: eligLoading } = useGetVisaEligibility(visaId);

  // ── Mutations
  const acceptMutation = useAcceptVisaTerms();
  const createMutation = useCreateVisaApplication();

  const isPending = createMutation.isPending || acceptMutation.isPending;

  // ── Auth gate
  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_700Bold', fontSize: 16, textAlign: 'center' }}>
          يجب تسجيل الدخول أولاً
        </Text>
        <TouchableOpacity
          style={[styles.wallBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/auth/login' as any)}
        >
          <Text style={styles.wallBtnText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Loading preflight
  if (compLoading || eligLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: 'Tajawal_400Regular',
            marginTop: 12,
          }}
        >
          جاري التحقق من أهليتك للتقديم...
        </Text>
      </View>
    );
  }

  // ── Profile incomplete gate
  if (completion && !completion.isComplete) {
    return (
      <ProfileIncompleteWall
        pct={completion.percentage}
        missing={completion.missingFields}
        paddingTop={paddingTop}
      />
    );
  }

  // ── Eligibility gate
  if (eligibility && !eligibility.eligible) {
    return (
      <EligibilityBlockWall
        blockers={eligibility.blockers as any}
        paddingTop={paddingTop}
      />
    );
  }

  // ── Submit handler: accept terms + create application
  const handleContinue = () => {
    if (!agreed || isPending) return;

    // Record consent (best-effort audit log — fire and forget)
    acceptMutation.mutate({ data: { visaId } });

    // Create the visa application
    createMutation.mutate(
      { data: { visaId } },
      {
        onSuccess: (app) => {
          const appId = (app as any).id;
          const refNum = (app as any).referenceNumber ?? '—';
          queryClient.invalidateQueries({ queryKey: getListMyVisaApplicationsQueryKey() });
          // Navigate to tracking page
          router.replace(`/visa-application/${appId}` as any);
          // Brief confirmation toast via alert (fires after navigation)
          setTimeout(() => {
            Alert.alert(
              '✅ تم تقديم الطلب بنجاح',
              `رقم طلبك: ${refNum}\nسيتم التواصل معك قريباً لمتابعة الإجراءات.`,
              [{ text: 'حسناً' }],
            );
          }, 500);
        },
        onError: (e: any) => {
          const code = e?.data?.code ?? '';
          const msg =
            e?.data?.error ?? e?.message ?? 'فشل تقديم الطلب، حاول مجدداً';

          if (code === 'PROFILE_INCOMPLETE') {
            Alert.alert('الملف الشخصي غير مكتمل', msg, [
              { text: 'لاحقاً', style: 'cancel' },
              {
                text: 'أكمل ملفك الآن',
                onPress: () => router.push('/profile-edit' as any),
              },
            ]);
          } else {
            Alert.alert('خطأ في تقديم الطلب', msg, [{ text: 'حسناً' }]);
          }
        },
      },
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: paddingTop + 12, backgroundColor: '#0D1526' },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإقرار والشروط والأحكام</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 160 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={[styles.introCard, { backgroundColor: '#0D1526' }]}>
          <Text style={styles.introTitle}>الإقرار والشروط والأحكام</Text>
          <Text style={styles.introCompany}>قمة النظائر للسفريات والسياحة</Text>
          <Text style={styles.introSub}>
            يرجى قراءة الشروط والأحكام التالية بعناية قبل تقديم طلب التأشيرة،
            حيث إن إرسال الطلب يعني موافقتك الكاملة على جميع البنود التالية.
          </Text>
        </View>

        {/* Terms list */}
        {TERMS_ITEMS.map((item, index) => (
          <View
            key={index}
            style={[
              styles.termItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.termNumber, { color: colors.primary }]}>
              {index + 1}
            </Text>
            <Text style={[styles.termText, { color: colors.foreground }]}>
              {item}
            </Text>
          </View>
        ))}

        {/* Agreement checkbox */}
        <TouchableOpacity
          style={[
            styles.checkboxRow,
            {
              backgroundColor: agreed ? '#f0fdf4' : colors.card,
              borderColor: agreed ? '#22c55e' : colors.border,
            },
          ]}
          onPress={() => setAgreed((v) => !v)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: agreed ? '#22c55e' : 'transparent',
                borderColor: agreed ? '#22c55e' : colors.border,
              },
            ]}
          >
            {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={[styles.checkboxLabel, { color: colors.foreground }]}>
            لقد قرأت جميع الشروط والأحكام وأوافق عليها بالكامل.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 16,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueBtn,
            { backgroundColor: agreed && !isPending ? colors.primary : colors.muted },
          ]}
          onPress={handleContinue}
          disabled={!agreed || isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.continueBtnText, { color: '#fff' }]}>
                جاري تقديم الطلب...
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.continueBtnText,
                { color: agreed ? '#fff' : colors.mutedForeground },
              ]}
            >
              موافق وتقديم الطلب
            </Text>
          )}
        </TouchableOpacity>
        {!agreed && (
          <Text
            style={[styles.disabledHint, { color: colors.mutedForeground }]}
          >
            يجب الموافقة على الشروط أولاً لتقديم الطلب
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Tajawal_700Bold',
    textAlign: 'center',
  },

  content: {
    padding: 16,
    gap: 10,
  },
  introCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 6,
    alignItems: 'flex-end',
  },
  introTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'right',
    marginBottom: 4,
  },
  introCompany: {
    color: '#F08015',
    fontSize: 14,
    fontFamily: 'Tajawal_700Bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  introSub: {
    color: '#ffffffcc',
    fontSize: 13,
    fontFamily: 'Tajawal_400Regular',
    textAlign: 'right',
    lineHeight: 22,
  },
  termItem: {
    flexDirection: 'row-reverse',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  termNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontFamily: 'Tajawal_700Bold',
    backgroundColor: '#0D152615',
    overflow: 'hidden',
  },
  termText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Tajawal_400Regular',
    lineHeight: 22,
    textAlign: 'right',
  },
  checkboxRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Tajawal_700Bold',
    textAlign: 'right',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  continueBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontFamily: 'Tajawal_800ExtraBold',
  },
  disabledHint: {
    fontSize: 12,
    fontFamily: 'Tajawal_400Regular',
    textAlign: 'center',
  },

  // Gate wall styles
  wallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  wallCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  wallTitle: {
    fontSize: 20,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'center',
  },
  wallSub: {
    fontSize: 14,
    fontFamily: 'Tajawal_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  missingBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  wallBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  wallBtnText: {
    color: '#fff',
    fontFamily: 'Tajawal_700Bold',
    fontSize: 15,
  },
});
