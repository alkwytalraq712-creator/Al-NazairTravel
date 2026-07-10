import React from 'react';
import {
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

const FAQS = [
  {
    q: 'كم يستغرق استخراج التأشيرة؟',
    a: 'يختلف وقت المعالجة حسب الدولة، وعادةً يتراوح بين 3 إلى 15 يوم عمل. يمكنك متابعة حالة طلبك من شاشة "طلباتي".',
  },
  {
    q: 'ما هي المستندات المطلوبة لطلب التأشيرة؟',
    a: 'تختلف المستندات حسب كل دولة. عند اختيار التأشيرة ستجد قائمة المستندات المطلوبة بالتفصيل.',
  },
  {
    q: 'هل يمكنني إلغاء حجز الباقة السياحية؟',
    a: 'نعم، يمكنك التواصل مع فريقنا عبر واتساب لإلغاء الحجز. تطبق سياسة الإلغاء المحددة في تفاصيل الباقة.',
  },
  {
    q: 'كيف أتابع حالة طلبي؟',
    a: 'انتقل إلى "طلباتي وحجوزاتي" من شاشة الحساب لمتابعة حالة جميع طلباتك وحجوزاتك.',
  },
  {
    q: 'هل يمكنني الدفع بالتقسيط؟',
    a: 'نعم، نوفر خيارات دفع مرنة. تواصل مع فريق المبيعات لمزيد من التفاصيل حول خطط الدفع المتاحة.',
  },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  function openWhatsApp() {
    Linking.openURL('https://wa.me/9647700000000?text=مرحباً، أحتاج مساعدة').catch(() => {});
  }

  function openEmail() {
    Linking.openURL('mailto:support@qema.iq?subject=طلب دعم').catch(() => {});
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المساعدة والدعم</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Contact Methods */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>تواصل معنا</Text>
          </View>

          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={openWhatsApp} activeOpacity={0.85}>
            <Text style={styles.contactBtnText}>واتساب</Text>
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.primary, marginTop: 10 }]} onPress={openEmail} activeOpacity={0.85}>
            <Text style={styles.contactBtnText}>البريد الإلكتروني</Text>
            <Ionicons name="mail-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Working Hours */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ساعات العمل</Text>
          </View>
          {[
            { day: 'الأحد — الخميس', hours: '9:00 ص — 6:00 م' },
            { day: 'الجمعة', hours: '9:00 ص — 1:00 م' },
            { day: 'السبت', hours: 'مغلق' },
          ].map((item) => (
            <View key={item.day} style={[styles.hoursRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.hoursTime, { color: colors.foreground }]}>{item.hours}</Text>
              <Text style={[styles.hoursDay, { color: colors.mutedForeground }]}>{item.day}</Text>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الأسئلة الشائعة</Text>
          </View>
          {FAQS.map((faq, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.faqItem, { borderBottomColor: colors.border }]}
              onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={expandedFaq === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.faqQ, { color: colors.foreground }]}>{faq.q}</Text>
                {expandedFaq === i && (
                  <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{faq.a}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>قمة النظائر للسفريات · الإصدار 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Tajawal_800ExtraBold', flex: 1, textAlign: 'right' },
  section: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Tajawal_700Bold' },
  contactBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12 },
  contactBtnText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 },
  hoursRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  hoursDay: { fontSize: 14, fontFamily: 'Tajawal_500Medium' },
  hoursTime: { fontSize: 14, fontFamily: 'Tajawal_400Regular' },
  faqItem: { flexDirection: 'row-reverse', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  faqQ: { fontSize: 14, fontFamily: 'Tajawal_700Bold', textAlign: 'right', flex: 1 },
  faqA: { fontSize: 13, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginTop: 8, lineHeight: 22 },
  version: { textAlign: 'center', fontSize: 12, fontFamily: 'Tajawal_400Regular', marginTop: 8 },
});
