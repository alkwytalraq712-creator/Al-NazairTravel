import React, { useEffect, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GOLD  = '#C9A060';
const NAVY  = '#060B18';
const NAVY2 = '#0C1628';
const NAVY3 = '#121F38';

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

function FaqItem({ faq, isExpanded, onPress, index }: { faq: any; isExpanded: boolean; onPress: () => void; index: number }) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 100,
      useNativeDriver: true,
      bounciness: 10,
    }).start();
  }, [anim, index]);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <Animated.View style={[
      styles.faqItemWrap,
      { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground },
      {
        opacity: anim,
        transform: [{
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }
    ]}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onPress();
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.faqQ, { color: colors.foreground }]}>{faq.q}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={20} color={GOLD} />
        </Animated.View>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.faqBody}>
          <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{faq.a}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function SectionCard({
  title, icon, gradientColors, children, index,
}: { title: string; icon: string; gradientColors: readonly [string, string]; children: React.ReactNode; index: number }) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 100,
      useNativeDriver: true,
      bounciness: 10,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View style={[
      styles.section,
      { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground },
      {
        opacity: anim,
        transform: [{
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }
    ]}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <LinearGradient colors={gradientColors} style={styles.sectionIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name={icon as any} size={20} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </Animated.View>
  );
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  function openWhatsApp() {
    Linking.openURL('https://wa.me/9647700000000?text=مرحباً، أحتاج مساعدة').catch(() => {});
  }

  function openEmail() {
    Linking.openURL('mailto:support@qema.iq?subject=طلب دعم').catch(() => {});
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[NAVY, NAVY2, NAVY3]} style={[styles.headerGradient, { paddingTop: paddingTop + 12 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>المساعدة والدعم</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <SectionCard title="تواصل معنا" icon="chatbubbles" gradientColors={['#3B82F6', '#2563EB']} index={0}>
          <TouchableOpacity onPress={openWhatsApp} activeOpacity={0.85} style={{ marginBottom: 12 }}>
            <LinearGradient colors={['#25D366', '#128C7E']} style={styles.contactBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
              <Text style={styles.contactBtnText}>واتساب</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={openEmail} activeOpacity={0.85}>
            <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.contactBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="mail" size={24} color="#FFFFFF" />
              <Text style={styles.contactBtnText}>البريد الإلكتروني</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="ساعات العمل" icon="time" gradientColors={['#F59E0B', '#D97706']} index={1}>
          {[
            { day: 'الأحد - الخميس', hours: '9:00 ص - 6:00 م' },
            { day: 'الجمعة', hours: '9:00 ص - 1:00 م' },
            { day: 'السبت', hours: 'مغلق' },
          ].map((item, i, arr) => (
            <View key={item.day} style={[styles.hoursRow, i !== arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[styles.hoursDay, { color: colors.mutedForeground }]}>{item.day}</Text>
              <Text style={[styles.hoursTime, { color: colors.foreground }]}>{item.hours}</Text>
            </View>
          ))}
        </SectionCard>

        <Text style={[styles.faqSectionTitle, { color: colors.foreground }]}>الأسئلة الشائعة</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, i) => (
            <FaqItem
              key={i}
              faq={faq}
              isExpanded={expandedFaq === i}
              onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
              index={i + 2}
            />
          ))}
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>قمة النظائر للسفريات · الإصدار 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
    marginBottom: 16,
  },
  headerInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'center',
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Tajawal_800ExtraBold' },
  sectionBody: { padding: 16 },

  contactBtnGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
  },
  contactBtnText: { color: '#FFFFFF', fontFamily: 'Tajawal_700Bold', fontSize: 16 },

  hoursRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  hoursDay: { fontSize: 15, fontFamily: 'Tajawal_500Medium' },
  hoursTime: { fontSize: 15, fontFamily: 'Tajawal_700Bold' },

  faqSectionTitle: {
    fontSize: 18,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'right',
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  faqList: { gap: 12 },
  faqItemWrap: {
    borderRadius: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    gap: 16,
  },
  faqQ: {
    fontSize: 15,
    fontFamily: 'Tajawal_700Bold',
    textAlign: 'right',
    flex: 1,
    lineHeight: 22,
  },
  faqBody: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  faqA: {
    fontSize: 14,
    fontFamily: 'Tajawal_500Medium',
    textAlign: 'right',
    lineHeight: 24,
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Tajawal_500Medium',
    marginTop: 32,
  },
});
