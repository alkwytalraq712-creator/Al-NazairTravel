import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { useAcceptVisaTerms } from '@workspace/api-client-react';

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VisaTermsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [agreed, setAgreed] = useState(false);
  const acceptMutation = useAcceptVisaTerms();

  const visaId = Number(id);

  const handleContinue = () => {
    if (!agreed) return;
    acceptMutation.mutate(
      { data: { visaId } },
      {
        onSuccess: () => {
          router.replace(`/apply-visa/${id}` as any);
        },
        onError: () => {
          // Even if consent recording fails, navigate forward — consent is a best-effort audit log
          router.replace(`/apply-visa/${id}` as any);
        },
      },
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>يجب تسجيل الدخول أولاً</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 12, backgroundColor: '#0D1526' }]}>
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
            يرجى قراءة الشروط والأحكام التالية بعناية قبل تقديم طلب التأشيرة، حيث إن إرسال الطلب يعني موافقتك الكاملة على جميع البنود التالية.
          </Text>
        </View>

        {/* Terms list */}
        {TERMS_ITEMS.map((item, index) => (
          <View
            key={index}
            style={[styles.termItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.termNumber, { color: colors.primary }]}>{index + 1}</Text>
            <Text style={[styles.termText, { color: colors.foreground }]}>{item}</Text>
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
          onPress={() => setAgreed(v => !v)}
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
            { backgroundColor: agreed ? colors.primary : colors.muted },
          ]}
          onPress={handleContinue}
          disabled={!agreed || acceptMutation.isPending}
          activeOpacity={0.85}
        >
          {acceptMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.continueBtnText, { color: agreed ? '#fff' : colors.mutedForeground }]}>
              متابعة تقديم الطلب
            </Text>
          )}
        </TouchableOpacity>
        {!agreed && (
          <Text style={[styles.disabledHint, { color: colors.mutedForeground }]}>
            يجب الموافقة على الشروط أولاً لمتابعة التقديم
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
});
