/**
 * Visa Success Screen — Professional application confirmation
 * Shown after successful visa application submission.
 * Back navigation is fully blocked (hardware + gesture).
 */
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetVisaApplication, getGetVisaApplicationQueryKey } from '@workspace/api-client-react';

const GOLD  = '#C9A060';
const GOLD2 = '#E8C07A';

// ─── Visa type Arabic labels ──────────────────────────────────────────────────
const VISA_TYPE_AR: Record<string, string> = {
  tourism:    'سياحية',
  business:   'عمل',
  medical:    'علاجية',
  study:      'دراسة',
  visit:      'زيارة',
  investment: 'استثمار',
  transit:    'عبور',
  work:       'عمل',
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  filling_data:         { label: 'قيد تعبئة البيانات',     color: '#6B7280', icon: 'create-outline'         },
  received:             { label: 'تم استلام الطلب',         color: '#3B82F6', icon: 'checkmark-circle'       },
  reviewing:            { label: 'قيد المراجعة',             color: '#F59E0B', icon: 'time-outline'           },
  awaiting_documents:   { label: 'بانتظار المستندات',       color: '#F97316', icon: 'document-attach-outline' },
  submitted_to_embassy: { label: 'تم التقديم للسفارة',      color: '#8B5CF6', icon: 'send'                   },
  processing:           { label: 'قيد المعالجة',             color: '#06B6D4', icon: 'hourglass-outline'      },
  approved:             { label: 'تمت الموافقة',             color: '#22C55E', icon: 'checkmark-done'         },
  issued:               { label: 'تم إصدار التأشيرة',       color: '#10B981', icon: 'ribbon'                 },
  completed:            { label: 'مكتمل',                   color: '#22C55E', icon: 'trophy'                 },
  rejected:             { label: 'مرفوض',                   color: '#EF4444', icon: 'close-circle'           },
  cancelled:            { label: 'ملغى',                    color: '#6B7280', icon: 'ban'                    },
};

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = d.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    return `${date}  ${time}`;
  } catch {
    return iso;
  }
}

// ─── Info row component ───────────────────────────────────────────────────────
function InfoRow({
  icon, label, value, accentColor,
}: {
  icon: string;
  label: string;
  value: string;
  accentColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      {/* Label side (right in RTL) */}
      <View style={styles.infoLabelSide}>
        <Ionicons name={icon as any} size={14} color="rgba(255,255,255,0.35)" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      {/* Value side (left in RTL) */}
      <Text style={[styles.infoValue, accentColor ? { color: accentColor, fontFamily: 'Tajawal_800ExtraBold' } : {}]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VisaSuccessScreen() {
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  // ── Animations ──────────────────────────────────────────────────────────────
  const checkScale   = useRef(new Animated.Value(0.3)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide    = useRef(new Animated.Value(60)).current;
  const cardOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale,   { toValue: 1, tension: 55, friction: 6, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardSlide,   { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // ── Block hardware back (Android) ────────────────────────────────────────────
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // ── Fetch full application data ──────────────────────────────────────────────
  const numericId = Number(appId);
  const { data: application, isLoading } = useGetVisaApplication(numericId, {
    query: {
      queryKey: getGetVisaApplicationQueryKey(numericId),
      enabled: !!appId && !isNaN(numericId),
    },
  });

  const visa     = application?.visa;
  const status   = STATUS_CONFIG[application?.status ?? 'received'] ?? STATUS_CONFIG['received'];

  // ── Navigate home — removes entire stack ────────────────────────────────────
  function goHome() {
    router.replace('/(tabs)' as any);
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <LinearGradient colors={['#080C18', '#0D1A30', '#080C18']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop }}>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Tajawal_400Regular', marginTop: 16, fontSize: 14 }}>
          جاري تحميل تفاصيل طلبك...
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#080C18', '#0D1A30', '#0A1520']} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: paddingTop + 24, paddingHorizontal: 18, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Animated success check ─────────────────────────────────── */}
        <Animated.View style={{ alignItems: 'center', marginBottom: 26, transform: [{ scale: checkScale }], opacity: checkOpacity }}>
          <View style={styles.checkRing2}>
            <View style={styles.checkRing1}>
              <Ionicons name="checkmark" size={52} color="#fff" />
            </View>
          </View>
        </Animated.View>

        {/* ── Title & subtitle ───────────────────────────────────────── */}
        <Animated.View style={{ alignItems: 'center', marginBottom: 24, opacity: cardOpacity }}>
          <Text style={styles.successTitle}>تم إرسال طلب التأشيرة بنجاح</Text>
          <Text style={styles.successSub}>
            تم استلام طلبك وسيتم مراجعته من قبل فريق قمة النظائر للسفريات والسياحة،
            وسيتم إشعارك فور حدوث أي تحديث.
          </Text>
        </Animated.View>

        {/* ── Professional application card ──────────────────────────── */}
        <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardSlide }], marginBottom: 22 }}>
          <View style={styles.card}>

            {/* Card header: company logo + flag */}
            <LinearGradient
              colors={['#0D1A30', '#112030']}
              style={styles.cardHeader}
            >
              <Image
                source={require('@/assets/images/logo_transparent.png')}
                style={styles.companyLogo}
                contentFit="contain"
              />
              {visa?.countryFlagUrl ? (
                <Image
                  source={{ uri: visa.countryFlagUrl }}
                  style={styles.flag}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.flag, styles.flagPlaceholder]}>
                  <Ionicons name="flag-outline" size={22} color={GOLD} />
                </View>
              )}
            </LinearGradient>

            {/* Country + visa type + status pill */}
            <View style={styles.cardTitleRow}>
              <View style={{ alignItems: 'flex-end', flex: 1 }}>
                <Text style={styles.countryName}>{visa?.countryName ?? '—'}</Text>
                <Text style={styles.visaTypeName}>
                  تأشيرة {VISA_TYPE_AR[visa?.visaType ?? ''] ?? visa?.visaType ?? '—'}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: status.color + '22', borderColor: status.color }]}>
                <Ionicons name={status.icon as any} size={12} color={status.color} />
                <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Info rows */}
            <InfoRow
              icon="barcode-outline"
              label="رقم الطلب"
              value={application?.referenceNumber ?? '—'}
              accentColor={GOLD}
            />
            <InfoRow
              icon="person-outline"
              label="اسم مقدم الطلب"
              value={application?.fullName ?? '—'}
            />
            <InfoRow
              icon="card-outline"
              label="رقم الجواز"
              value={application?.passportNumber ?? '—'}
            />
            <InfoRow
              icon="earth-outline"
              label="الجنسية"
              value={application?.nationality ?? '—'}
            />
            <InfoRow
              icon="calendar-outline"
              label="مدة التأشيرة"
              value={visa?.validity ?? '—'}
            />
            <InfoRow
              icon="time-outline"
              label="مدة الإقامة"
              value={visa?.stayDuration ?? '—'}
            />
            <InfoRow
              icon="repeat-outline"
              label="مرات الدخول"
              value={visa?.entriesAllowed ?? '—'}
            />
            <InfoRow
              icon="hourglass-outline"
              label="مدة المعالجة"
              value={visa?.processingTime ?? '—'}
            />
            <InfoRow
              icon="cash-outline"
              label="الرسوم المطلوبة"
              value={visa?.price != null ? `${visa.price} ${visa.currency ?? 'USD'}` : '—'}
              accentColor={GOLD2}
            />
            <InfoRow
              icon="time-outline"
              label="تاريخ التقديم"
              value={application?.createdAt ? formatDateTime(application.createdAt) : '—'}
            />
            <InfoRow
              icon={status.icon}
              label="الحالة الحالية"
              value={status.label}
              accentColor={status.color}
            />

            {/* Card footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterCompany}>قمة النظائر للسفريات والسياحة</Text>
              <Text style={styles.cardFooterHint}>
                يمكنك متابعة حالة طلبك من قسم "طلباتي وحجوزاتي"
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Single CTA ─────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardOpacity }}>
          <TouchableOpacity onPress={goHome} activeOpacity={0.85} style={styles.homeBtnWrap}>
            <LinearGradient
              colors={[GOLD, GOLD2, GOLD]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.homeBtn}
            >
              <Ionicons name="home" size={20} color="#0B1628" />
              <Text style={styles.homeBtnText}>العودة إلى الصفحة الرئيسية</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Checkmark
  checkRing2: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(34,197,94,0.22)',
  },
  checkRing1: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 18, elevation: 12,
  },

  // Title
  successTitle: {
    color: '#fff', fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 22, textAlign: 'center', marginBottom: 10,
  },
  successSub: {
    color: 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal_400Regular',
    fontSize: 14, textAlign: 'center', lineHeight: 23,
    paddingHorizontal: 8,
  },

  // Card
  card: {
    backgroundColor: '#0F1E36',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,160,96,0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 14,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,160,96,0.12)',
  },
  companyLogo: { width: 80, height: 44 },
  flag: {
    width: 58, height: 40, borderRadius: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  flagPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  cardTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  countryName: {
    color: '#fff', fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 20, textAlign: 'right',
  },
  visaTypeName: {
    color: 'rgba(255,255,255,0.45)', fontFamily: 'Tajawal_400Regular',
    fontSize: 13, textAlign: 'right', marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  statusPillText: { fontFamily: 'Tajawal_700Bold', fontSize: 11 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },

  // Info rows
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  infoLabelSide: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.38)',
    fontFamily: 'Tajawal_400Regular',
    fontSize: 12,
    textAlign: 'right',
  },
  infoValue: {
    color: '#fff',
    fontFamily: 'Tajawal_700Bold',
    fontSize: 14,
    textAlign: 'left',
    flex: 1,
    paddingRight: 14,
  },

  // Card footer
  cardFooter: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,160,96,0.12)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  cardFooterCompany: {
    color: GOLD,
    fontFamily: 'Tajawal_700Bold',
    fontSize: 13,
  },
  cardFooterHint: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Tajawal_400Regular',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  // CTA
  homeBtnWrap: {
    borderRadius: 16,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  homeBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  homeBtnText: {
    color: '#0B1628',
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 17,
  },
});
