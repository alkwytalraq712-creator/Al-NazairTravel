/**
 * Terms of Use — شروط الاستخدام
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
const DARK3 = '#162035';
const BORDER = 'rgba(201,160,96,0.14)';
const MUTED  = 'rgba(255,255,255,0.52)';
const WHITE  = '#FFFFFF';

const LAST_UPDATED = '١ يوليو ٢٠٢٦';

interface Section {
  num: string;
  title: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    num: '١',
    title: 'القبول والموافقة',
    body: [
      'باستخدامك تطبيق قمة النظائر للسفريات والسياحة ("التطبيق") أو إنشائك حساباً فيه، فإنك تُقرّ بأنك قرأت هذه الشروط وفهمتها ووافقت على الالتزام بها بالكامل.',
      'إذا كنت لا توافق على أي بند من هذه الشروط، فيُرجى عدم استخدام التطبيق أو إنشاء حساب فيه.',
      'تحتفظ الشركة بحق تعديل هذه الشروط في أي وقت، وسيُعلَن عن أي تعديل جوهري عبر التطبيق. استمرارك في استخدام التطبيق بعد نشر التعديلات يُعدّ قبولاً ضمنياً لها.',
    ],
  },
  {
    num: '٢',
    title: 'مسؤولية المستخدم عن صحة البيانات والمستندات',
    body: [
      'تقع على عاتقك مسؤولية التأكد من أن جميع البيانات التي تُدخلها عبر التطبيق — بما فيها الاسم وتاريخ الميلاد ورقم جواز السفر وبيانات التواصل — دقيقة وصحيحة وكاملة.',
      'يلتزم المستخدم برفع مستندات أصلية وسارية المفعول ومطابقة للواقع؛ ويُحظر رفع مستندات مزوّرة أو منتهية الصلاحية أو تخصّ شخصاً آخر.',
      'تتحمل وحدك كافة التبعات القانونية والمالية الناجمة عن تقديم بيانات غير صحيحة أو مستندات مزوّرة، ولا تتحمل الشركة أي مسؤولية في هذا الشأن.',
    ],
  },
  {
    num: '٣',
    title: 'سرية الحساب والأمان',
    body: [
      'أنت المسؤول الوحيد عن الحفاظ على سرية كلمة مرور حسابك وعدم مشاركتها مع أي طرف آخر.',
      'يُعدّ أي نشاط يجري من خلال حسابك نشاطاً صادراً منك شخصياً، سواء أذنت به أم لا.',
      'في حال الاشتباه في اختراق حسابك أو استخدامه دون إذنك، يجب إخطار الشركة فوراً عبر قنوات الدعم المتاحة في التطبيق.',
    ],
  },
  {
    num: '٤',
    title: 'الاستخدام المشروع للتطبيق',
    body: [
      'يُوافق المستخدم على استخدام التطبيق لأغراض قانونية مشروعة فحسب، وبما يتوافق مع القوانين والأنظمة المعمول بها في بلده وفي الدول التي يسعى إلى السفر إليها.',
      'يُحظر استخدام التطبيق لأي غرض احتيالي أو مخالف للقانون، بما يشمل على سبيل المثال لا الحصر: الاحتيال في الحجوزات، أو استغلال المنصة للحصول على تأشيرات بطرق غير مشروعة.',
      'يُحظر أيضاً محاولة اختراق أنظمة التطبيق أو انتزاع بيانات مستخدمين آخرين أو التدخل في أداء التطبيق بأي شكل.',
    ],
  },
  {
    num: '٥',
    title: 'إيقاف الحساب أو حذفه',
    body: [
      'تحتفظ الشركة بحق إيقاف حسابك مؤقتاً أو حذفه نهائياً في حال مخالفة هذه الشروط أو ثبوت إساءة الاستخدام، دون الحاجة إلى إخطار مسبق.',
      'قد يترتب على الإيقاف أو الحذف ضياع البيانات المخزّنة في التطبيق، ولا تتحمل الشركة أي مسؤولية عن ذلك.',
      'يحق للمستخدم الطعن في قرار الإيقاف عبر التواصل مع فريق الدعم، وتتعهد الشركة بمراجعة كل حالة على حدة.',
    ],
  },
  {
    num: '٦',
    title: 'أسعار الخدمات',
    body: [
      'تُعرض أسعار خدمات التأشيرات والرحلات والباقات السياحية في التطبيق بصورة تقريبية وقد تخضع للتغيير وفقاً لتسعيرة الجهات الرسمية كالسفارات وشركات الطيران والفنادق.',
      'تسعى الشركة إلى تحديث الأسعار بصورة دورية، غير أنها لا تضمن دقة الأسعار المعروضة في جميع الأوقات.',
      'يحق للشركة إلغاء طلب الحجز أو تعديله في حال وجود تباين جوهري بين السعر المعروض وسعر الجهة المزوّدة للخدمة، مع إخطار العميل فوراً وإعادة أي مبالغ مدفوعة.',
    ],
  },
  {
    num: '٧',
    title: 'الموافقة على التأشيرات والخدمات الحكومية',
    body: [
      'يمثّل التطبيق وسيطاً بين المستخدم والجهات المختصة (سفارات، إدارات الهجرة، شركات الطيران). لا يملك التطبيق أي صلاحية لضمان الحصول على التأشيرة أو الموافقة على أي طلب.',
      'قرارات منح التأشيرات وتصاريح الإقامة حق حصري للجهات الحكومية والسفارات المعنية، وتخضع لمعاييرها الداخلية المستقلة.',
      'في حال رفض طلبك، تلتزم الشركة بإعادة رسوم خدماتها فقط وفق سياسة الاسترداد المعمول بها، ولا تتحمل الشركة رسوم السفارات أو الجهات الحكومية المدفوعة.',
    ],
  },
  {
    num: '٨',
    title: 'الرسوم وسياسة الاسترداد',
    body: [
      'تُوضَّح رسوم الخدمة بشفافية قبل إتمام أي عملية دفع؛ ويُعدّ إتمام الدفع قبولاً صريحاً بهذه الرسوم.',
      'رسوم الخدمة المدفوعة للشركة غير قابلة للاسترداد بعد بدء تقديم الخدمة، إلا في الحالات التي تكون فيها الشركة هي السبب في عدم إتمامها.',
      'رسوم الجهات الخارجية كشركات الطيران والفنادق تخضع لسياسة الاسترداد الخاصة بكل جهة على حدة.',
    ],
  },
  {
    num: '٩',
    title: 'حقوق الملكية الفكرية',
    body: [
      'جميع محتويات التطبيق من تصاميم وشعارات ونصوص وكود برمجي هي ملكية خالصة لشركة قمة النظائر للسفريات والسياحة، ومحمية بقوانين حقوق الملكية الفكرية المعمول بها.',
      'يُحظر نسخ أي جزء من التطبيق أو إعادة توزيعه أو إجراء هندسة عكسية عليه أو استخدامه لأي غرض تجاري دون الحصول على إذن كتابي مسبق من الشركة.',
    ],
  },
  {
    num: '١٠',
    title: 'تحديث الشروط والإشعارات',
    body: [
      'تحتفظ الشركة بحق تعديل هذه الشروط في أي وقت؛ وستُرسَل إشعارات للمستخدمين المسجَّلين عبر التطبيق أو البريد الإلكتروني عند إجراء تعديلات جوهرية.',
      'تاريخ آخر تحديث لهذه الشروط مُدرَج في أعلى الصفحة. يُوصى بمراجعة الشروط دورياً للاطلاع على أي تغييرات.',
    ],
  },
];

export default function TermsScreen() {
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
          <Text style={styles.headerTitle}>شروط الاستخدام</Text>
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
            <LinearGradient colors={[GOLD, '#E8C07A']} style={styles.heroIconBg}>
              <Ionicons name="document-text" size={28} color={DARK} />
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>شروط الاستخدام</Text>
          <Text style={styles.heroSubtitle}>قمة النظائر للسفريات والسياحة</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroDate}>آخر تحديث: {LAST_UPDATED}</Text>
          <Text style={styles.heroIntro}>
            تُحدّد هذه الشروط حقوق والتزامات كل من الشركة والمستخدم عند استخدام تطبيق قمة النظائر. يرجى قراءتها بعناية قبل المتابعة.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((sec) => (
          <View key={sec.num} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumBadge}>
                <Text style={styles.sectionNum}>{sec.num}</Text>
              </View>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
            </View>
            {sec.body.map((para, i) => (
              <View key={i} style={styles.paraRow}>
                <View style={styles.paraDot} />
                <Text style={styles.paraText}>{para}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Footer note */}
        <View style={styles.footerCard}>
          <Ionicons name="information-circle-outline" size={20} color={GOLD} />
          <Text style={styles.footerText}>
            للاستفسار عن هذه الشروط أو أي بند فيها، تواصل معنا عبر قسم "الدعم" داخل التطبيق.
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
    shadowColor: GOLD, shadowOffset: { width: 0, height: 6 },
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
    width: 50, height: 2, backgroundColor: GOLD,
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

  sectionCard: {
    backgroundColor: 'rgba(15,30,54,0.85)',
    borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  sectionNumBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(201,160,96,0.15)',
    borderWidth: 1, borderColor: 'rgba(201,160,96,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionNum: {
    color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 13,
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
