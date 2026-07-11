import React from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetVisaApplication } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  received:              { label: 'تم الاستلام',          color: '#3B82F6', icon: 'checkmark-circle-outline' },
  reviewing:             { label: 'جاري المراجعة',        color: '#F59E0B', icon: 'time-outline' },
  awaiting_documents:    { label: 'بانتظار مستندات',      color: '#EF4444', icon: 'document-outline' },
  submitted_to_embassy:  { label: 'تم تقديم للسفارة',    color: '#8B5CF6', icon: 'send-outline' },
  processing:            { label: 'جاري المعالجة',         color: '#F08015', icon: 'cog-outline' },
  issued:                { label: 'تم إصدار التأشيرة',   color: '#10B981', icon: 'ribbon-outline' },
  completed:             { label: 'مكتمل',                color: '#059669', icon: 'checkmark-done-circle' },
  rejected:              { label: 'مرفوض',                color: '#EF4444', icon: 'close-circle-outline' },
};

const VISA_TYPE_AR: Record<string, string> = {
  tourism: 'سياحية', business: 'عمل', medical: 'علاجية',
  study: 'دراسة', visit: 'زيارة', investment: 'استثمار',
};

function getStatus(key: string) {
  return STATUS_MAP[key] ?? { label: key, color: '#6B7280', icon: 'ellipse-outline' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VisaApplicationTrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const appId = Number(id);
  const { data: app, isLoading, isError } = useGetVisaApplication({ id: appId });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !app) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="document-outline" size={56} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>لم يتم العثور على الطلب</Text>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.actionBtnText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = getStatus(app.status);
  const visa = (app as any).visa;
  const history: Array<{ status: string; timestamp: string; note?: string }> =
    (app as any).statusHistory ?? [];

  // Ensure at least the current status shows if history is empty
  const timeline =
    history.length > 0
      ? [...history].reverse()
      : [{ status: app.status, timestamp: app.createdAt }];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#0D1526', paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>متابعة الطلب</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Status Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: '#0D1526' }]}>
          {visa?.countryFlagUrl ? (
            <Image source={{ uri: visa.countryFlagUrl }} style={styles.flag} contentFit="cover" />
          ) : (
            <View style={[styles.flagPlaceholder, { backgroundColor: colors.primary }]}>
              <Ionicons name="flag-outline" size={22} color="#fff" />
            </View>
          )}
          <View style={styles.heroInfo}>
            <Text style={styles.heroCountry}>{visa?.countryName ?? '—'}</Text>
            <Text style={styles.heroType}>
              {VISA_TYPE_AR[visa?.visaType] ?? visa?.visaType ?? '—'} · {visa?.processingTime ?? '?'} أيام
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: status.color + '25', borderColor: status.color }]}>
            <Ionicons name={status.icon as any} size={14} color={status.color} />
            <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Reference & Date */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold' }]}>
              {app.referenceNumber}
            </Text>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>رقم الطلب</Text>
          </View>
          <InfoRow
            label="تاريخ التقديم"
            value={new Date(app.createdAt).toLocaleDateString('ar-SA', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          />
          <InfoRow label="الاسم" value={app.fullName} />
          <InfoRow label="رقم الجواز" value={app.passportNumber} />
          <InfoRow label="الجنسية" value={app.nationality} />
        </View>

        {/* Status Timeline */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>سجل مراحل الطلب</Text>

          {timeline.map((entry, index) => {
            const s = getStatus(entry.status);
            const isFirst = index === 0;
            return (
              <View key={index} style={styles.timelineRow}>
                {/* Connector line */}
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    {
                      backgroundColor: isFirst ? s.color : colors.border,
                      borderColor: isFirst ? s.color : colors.border,
                      width: isFirst ? 16 : 12,
                      height: isFirst ? 16 : 12,
                    }
                  ]} />
                  {index < timeline.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                  )}
                </View>

                {/* Entry content */}
                <View style={[
                  styles.timelineContent,
                  {
                    backgroundColor: isFirst ? s.color + '15' : colors.card,
                    borderColor: isFirst ? s.color + '40' : colors.border,
                  }
                ]}>
                  <View style={styles.timelineHeader}>
                    <Text style={[styles.timelineDate, { color: colors.mutedForeground }]}>
                      {new Date(entry.timestamp).toLocaleDateString('ar-SA', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </Text>
                    <Text style={[styles.timelineStatus, { color: isFirst ? s.color : colors.foreground }]}>
                      {s.label}
                    </Text>
                  </View>
                  {entry.note ? (
                    <Text style={[styles.timelineNote, { color: colors.mutedForeground }]}>{entry.note}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {/* Help text */}
        <View style={[styles.helpCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.mutedForeground} />
          <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
            سيتم إشعارك بأي تحديث على حالة طلبك عبر التطبيق والرسائل النصية.
          </Text>
        </View>

        {/* Back to bookings */}
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.primary }]}
          onPress={() => router.push('/bookings')}
          activeOpacity={0.8}
        >
          <Ionicons name="list-outline" size={18} color={colors.primary} />
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>جميع طلباتي</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  errorText: { fontSize: 16, fontFamily: 'Tajawal_700Bold', textAlign: 'center' },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { width: 32, alignItems: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },

  heroCard: {
    margin: 16,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
  },
  flag: { width: 44, height: 32, borderRadius: 6 },
  flagPlaceholder: { width: 44, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  heroInfo: { flex: 1, alignItems: 'flex-end', gap: 4 },
  heroCountry: { color: '#fff', fontSize: 17, fontFamily: 'Tajawal_800ExtraBold' },
  heroType: { color: '#ffffff99', fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  statusPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 11, fontFamily: 'Tajawal_700Bold' },

  card: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  infoValue: { fontSize: 14, fontFamily: 'Tajawal_500Medium' },

  sectionTitle: { fontSize: 16, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right', marginBottom: 16 },

  timelineRow: { flexDirection: 'row-reverse', gap: 14, marginBottom: 12 },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineDot: { borderRadius: 10, borderWidth: 2 },
  timelineLine: { flex: 1, width: 2, marginTop: 4, minHeight: 20 },
  timelineContent: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 4,
  },
  timelineHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  timelineStatus: { fontSize: 13, fontFamily: 'Tajawal_700Bold' },
  timelineDate: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  timelineNote: { fontSize: 12, fontFamily: 'Tajawal_400Regular', textAlign: 'right', marginTop: 4, lineHeight: 18 },

  helpCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  helpText: { flex: 1, fontSize: 12, fontFamily: 'Tajawal_400Regular', textAlign: 'right', lineHeight: 20 },

  actionBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 },

  secondaryBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  secondaryBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 15 },
});
