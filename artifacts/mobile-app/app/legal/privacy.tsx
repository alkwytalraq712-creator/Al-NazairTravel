/**
 * Privacy Policy — سياسة الخصوصية
 * Full Arabic content, app-design compliant.
 */
import React from 'react';
import {
  Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const GOLD  = '#C9A060';
const DARK  = '#0B1628';
const DARK2 = '#0F1E36';
const BORDER = 'rgba(201,160,96,0.14)';
const MUTED  = 'rgba(255,255,255,0.52)';
const WHITE  = '#FFFFFF';
const BLUE   = '#3B82F6';

const LAST_UPDATED = '١ يوليو ٢٠٢٦';

interface Section {
  num: string;
  title: string;
  icon: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    num: '١',
    title: 'البيانات التي نجمعها',
    icon: 'layers-outline',
    body: [
      'البيانات الشخصية: الاسم الكامل، تاريخ الميلاد، الجنسية، رقم الهاتف، البريد الإلكتروني.',
      'وثائق السفر: صور جواز السفر، الإقامة، بطاقات الهوية الوطنية، وأي مستندات تُرفع لأغراض التأشيرة أو الحجز.',
      'بيانات الحجز: معلومات الرحلات والفنادق والباقات السياحية التي تطلبها.',
      'بيانات الجهاز: نوع الجهاز ونظام التشغيل ورقم IP لأغراض الأمان وتحسين الأداء.',
      'بيانات الاستخدام: الصفحات التي تزورها وأنماط تصفّحك داخل التطبيق لأغراض إحصائية مجهولة الهوية.',
    ],
  },
  {
    num: '٢',
    title: 'كيف نستخدم بياناتك',
    icon: 'settings-outline',
    body: [
      'تُستخدم بياناتك حصراً لتقديم الخدمات المطلوبة منك وتنفيذها، بما يشمل: معالجة طلبات التأشيرة، حجز الرحلات، إصدار التذاكر، والتواصل معك بشأن طلباتك.',
      'نستخدم بياناتك للتحقق من هويتك وضمان سلامة حسابك وحماية حقوقك.',
      'قد نستخدم بيانات إحصائية مجهولة الهوية (لا تُحدّد هويتك) لتحليل أنماط الاستخدام وتحسين التطبيق وتطوير خدماته.',
    ],
  },
  {
    num: '٣',
    title: 'حماية بياناتك وعدم بيعها',
    icon: 'shield-checkmark-outline',
    body: [
      'نلتزم التزاماً قاطعاً بعدم بيع بياناتك الشخصية أو مشاركتها لأطراف ثالثة لأغراض تسويقية أو إعلانية.',
      'لا تُباع قواعد بياناتنا ولا يُتاح الوصول إليها لأي جهة خارجية لأغراض تجارية.',
      'نطبّق معايير أمان صناعية متقدمة للحفاظ على سرية بياناتك، وتُشفَّر البيانات الحساسة أثناء النقل والتخزين.',
    ],
  },
  {
    num: '٤',
    title: 'مشاركة البيانات مع جهات خارجية',
    icon: 'share-social-outline',
    body: [
      'قد نُشارك بياناتك مع جهات خارجية وذلك حصراً لأغراض تنفيذ طلباتك، وتشمل: السفارات وقنصليات الدول لمعالجة طلبات التأشيرة.',
      'شركات الطيران ومنصات الحجز (مثل Duffel) لإصدار تذاكر السفر.',
      'الفنادق وشركات السياحة لتنفيذ حجوزات الباقات.',
      'الجهات الحكومية المختصة عند الطلب القانوني أو ضرورة الامتثال.',
      'تخضع هذه الجهات لاتفاقيات سرية صارمة تمنعها من استخدام بياناتك لأي غرض آخر غير تنفيذ الخدمة.',
    ],
  },
  {
    num: '٥',
    title: 'إجراءات حماية البيانات',
    icon: 'lock-closed-outline',
    body: [
      'نستخدم بروتوكولات تشفير SSL/TLS لحماية البيانات أثناء نقلها بين التطبيق والخوادم.',
      'تُخزَّن البيانات الحساسة مشفّرةً على خوادم آمنة مع تقييد صلاحيات الوصول على أساس الحاجة.',
      'نُجري مراجعات أمنية دورية ونُطبّق أحدث معايير حماية البيانات.',
      'في حال اكتشاف اختراق أمني، نتعهد بإخطار المستخدمين المتأثرين في أقرب وقت ممكن واتخاذ الإجراءات التصحيحية اللازمة.',
    ],
  },
  {
    num: '٦',
    title: 'الإشعارات والتواصل',
    icon: 'notifications-outline',
    body: [
      'نرسل إشعارات تتعلق بحالة طلباتك وخدماتك (تأشيرات، رحلات، باقات) وهي إشعارات تشغيلية ضرورية لا يمكن إيقافها.',
      'قد نُرسل إشعارات إعلامية حول مميزات التطبيق وعروضه؛ ويمكنك إدارة هذه الإشعارات من إعدادات التطبيق أو جهازك.',
      'لن نُرسل بريداً إلكترونياً تسويقياً دون الحصول على موافقتك الصريحة.',
    ],
  },
  {
    num: '٧',
    title: 'حقوقك على بياناتك',
    icon: 'person-outline',
    body: [
      'يحق لك الاطلاع على البيانات الشخصية التي نحتفظ بها عنك وطلب نسخة منها في أي وقت.',
      'يحق لك تعديل بياناتك الشخصية مباشرةً من خلال ملفك الشخصي في التطبيق.',
      'يحق لك طلب حذف حسابك وبياناتك وفق الأنظمة المعمول بها، مع مراعاة أن الشركة قد تحتفظ ببعض السجلات الضرورية للامتثال القانوني.',
      'لممارسة أيٍّ من هذه الحقوق، تواصل مع فريق الدعم عبر التطبيق.',
    ],
  },
  {
    num: '٨',
    title: 'الاحتفاظ بالبيانات',
    icon: 'time-outline',
    body: [
      'نحتفظ ببياناتك طوال فترة نشاط حسابك وخمس سنوات إضافية بعد إغلاقه، وذلك للامتثال للمتطلبات القانونية والمحاسبية.',
      'تُحذف وثائق جواز السفر والمستندات الحساسة من خوادمنا فور إتمام الطلب المرتبط بها، ما لم يُطلب الاحتفاظ بها لأغراض الفحص.',
      'البيانات الإحصائية المجهولة قد تُحتفظ بها لفترة غير محددة لأغراض التطوير.',
    ],
  },
  {
    num: '٩',
    title: 'تحديث سياسة الخصوصية',
    icon: 'refresh-outline',
    body: [
      'تحتفظ الشركة بحق تحديث سياسة الخصوصية هذه في أي وقت لمواكبة التغييرات التشريعية أو التطويرات في الخدمات.',
      'سيُبلَّغ المستخدمون المسجّلون بأي تعديلات جوهرية عبر إشعار داخل التطبيق أو البريد الإلكتروني المسجّل.',
      'تاريخ آخر تحديث لهذه السياسة مُدرَج في أعلى هذه الصفحة.',
    ],
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <LinearGradient colors={[DARK, DARK2, '#111E35']} style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>سياسة الخصوصية</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <LinearGradient colors={[BLUE, '#60A5FA']} style={styles.heroIconBg}>
              <Ionicons name="shield-checkmark" size={28} color={WHITE} />
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>سياسة الخصوصية</Text>
          <Text style={styles.heroSubtitle}>قمة النظائر للسفريات والسياحة</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroDate}>آخر تحديث: {LAST_UPDATED}</Text>
          <Text style={styles.heroIntro}>
            خصوصيتك أمانة في عنقنا. توضّح هذه السياسة البيانات التي نجمعها، وكيف نستخدمها، وكيف نحميها. نلتزم بعدم بيع بياناتك أو مشاركتها لأغراض تسويقية في أي حال.
          </Text>
        </View>

        {/* Commitment banner */}
        <View style={styles.commitBanner}>
          <Ionicons name="checkmark-circle" size={18} color={GOLD} />
          <Text style={styles.commitText}>
            نلتزم بمعايير أمان وخصوصية متوافقة مع متطلبات Google Play وApp Store والأنظمة الدولية لحماية البيانات.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((sec) => (
          <View key={sec.num} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name={sec.icon as any} size={16} color={GOLD} />
              </View>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <View style={styles.sectionNumBadge}>
                <Text style={styles.sectionNum}>{sec.num}</Text>
              </View>
            </View>
            {sec.body.map((para, i) => (
              <View key={i} style={styles.paraRow}>
                <View style={styles.paraDot} />
                <Text style={styles.paraText}>{para}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Contact footer */}
        <View style={styles.footerCard}>
          <Ionicons name="mail-outline" size={20} color={GOLD} />
          <Text style={styles.footerText}>
            لأي استفسار متعلق بخصوصيتك أو للتواصل بشأن بياناتك، يُرجى التواصل مع فريق الدعم عبر قسم "الدعم والمساعدة" في التطبيق.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(11,22,40,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 17,
  },

  scroll: { padding: 16, gap: 12 },

  heroCard: {
    backgroundColor: 'rgba(15,30,54,0.90)',
    borderRadius: 20, borderWidth: 1, borderColor: BORDER,
    padding: 22, alignItems: 'center', marginBottom: 4,
  },
  heroIconWrap: { marginBottom: 14 },
  heroIconBg: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  heroTitle: {
    color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 20,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: GOLD, fontFamily: 'Tajawal_500Medium', fontSize: 13,
    textAlign: 'center', marginTop: 4,
  },
  heroDivider: {
    width: 50, height: 2, backgroundColor: BLUE,
    borderRadius: 1, marginVertical: 14, opacity: 0.5,
  },
  heroDate: {
    color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12,
    textAlign: 'center', marginBottom: 12,
  },
  heroIntro: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Tajawal_400Regular',
    fontSize: 13, textAlign: 'center', lineHeight: 22,
  },

  commitBanner: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(201,160,96,0.08)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(201,160,96,0.2)',
    padding: 12,
  },
  commitText: {
    flex: 1, color: 'rgba(201,160,96,0.85)',
    fontFamily: 'Tajawal_500Medium', fontSize: 12.5,
    textAlign: 'right', lineHeight: 20,
  },

  sectionCard: {
    backgroundColor: 'rgba(15,30,54,0.85)',
    borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  sectionNumBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(201,160,96,0.15)',
    borderWidth: 1, borderColor: 'rgba(201,160,96,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionNum: {
    color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 12,
  },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(201,160,96,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1, color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 15,
    textAlign: 'right',
  },
  paraRow: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, marginBottom: 10,
  },
  paraDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: GOLD, opacity: 0.6, marginTop: 9, flexShrink: 0,
  },
  paraText: {
    flex: 1, color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Tajawal_400Regular', fontSize: 13.5,
    textAlign: 'right', lineHeight: 23,
  },

  footerCard: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(201,160,96,0.08)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(201,160,96,0.2)',
    padding: 14,
  },
  footerText: {
    flex: 1, color: 'rgba(201,160,96,0.85)',
    fontFamily: 'Tajawal_400Regular', fontSize: 12.5,
    textAlign: 'right', lineHeight: 21,
  },
});
