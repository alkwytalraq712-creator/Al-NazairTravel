/**
 * Visa Application Tracking Screen
 * Shows status timeline + handles additional document upload requests.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import * as ImagePicker from 'expo-image-picker';
import { useGetVisaApplication, useRequestUploadUrl, useFinalizeUpload, getGetVisaApplicationQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { getAuthToken } from '@/context/AuthContext';

// ─── helpers ──────────────────────────────────────────────────────────────────
function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return '';
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  filling_data:          { label: 'قيد تعبئة البيانات',  color: '#6B7280', icon: 'create-outline' },
  received:              { label: 'تم الاستلام',          color: '#3B82F6', icon: 'checkmark-circle-outline' },
  reviewing:             { label: 'جاري المراجعة',        color: '#F59E0B', icon: 'time-outline' },
  awaiting_documents:    { label: 'بانتظار مستندات',      color: '#EF4444', icon: 'document-text-outline' },
  submitted_to_embassy:  { label: 'تم تقديم للسفارة',    color: '#8B5CF6', icon: 'send-outline' },
  processing:            { label: 'جاري المعالجة',        color: '#F08015', icon: 'cog-outline' },
  approved:              { label: 'تمت الموافقة',          color: '#10B981', icon: 'checkmark-done-outline' },
  issued:                { label: 'تم إصدار التأشيرة',   color: '#059669', icon: 'ribbon-outline' },
  completed:             { label: 'مكتمل',                color: '#059669', icon: 'checkmark-done-circle' },
  rejected:              { label: 'مرفوض',                color: '#EF4444', icon: 'close-circle-outline' },
  cancelled:             { label: 'ملغى',                  color: '#9CA3AF', icon: 'ban-outline' },
};

const VISA_TYPE_AR: Record<string, string> = {
  tourism: 'سياحية', business: 'عمل', medical: 'علاجية',
  study: 'دراسة', visit: 'زيارة', investment: 'استثمار',
};

function getStatus(key: string) {
  return STATUS_MAP[key] ?? { label: key, color: '#6B7280', icon: 'ellipse-outline' };
}

// ─── InfoRow ───────────────────────────────────────────────────────────────────
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

// ─── Document Upload Item ──────────────────────────────────────────────────────
function DocumentUploadItem({
  appId,
  docName,
  uploadedUrl,
  onUploaded,
}: {
  appId: number;
  docName: string;
  uploadedUrl?: string;
  onUploaded: (name: string, url: string) => void;
}) {
  const colors = useColors();
  const [uploading, setUploading] = useState(false);
  const requestUploadMutation = useRequestUploadUrl();
  const finalizeMutation = useFinalizeUpload();

  const isUploaded = !!uploadedUrl;

  async function handleUpload() {
    // Pick image
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول إلى مكتبة الصور');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    setUploading(true);
    try {
      // 1. Request presigned upload URL
      const fileName = `additional_doc_${appId}_${Date.now()}.jpg`;
      const uploadInfo = await new Promise<{ uploadURL: string; objectPath: string }>((resolve, reject) => {
        requestUploadMutation.mutate(
          {
            data: {
              name: fileName,
              size: asset.fileSize ?? 500_000,
              contentType: 'image/jpeg',
            },
          },
          {
            onSuccess: (data: any) => resolve(data),
            onError: reject,
          },
        );
      });

      // 2. Upload to presigned URL
      const blob = await (await fetch(asset.uri)).blob();
      const uploadRes = await fetch(uploadInfo.uploadURL, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
      });
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

      // 3. Finalize to set ACL (public so admin can see it)
      const finalizeData = await new Promise<{ objectPath: string; publicUrl?: string }>((resolve, reject) => {
        finalizeMutation.mutate(
          { data: { objectPath: uploadInfo.objectPath, isPublic: true } },
          { onSuccess: (d: any) => resolve(d), onError: reject },
        );
      });

      const publicUrl = finalizeData.publicUrl ?? `${getApiBase()}/api/storage/objects/${uploadInfo.objectPath}`;

      // 4. Save to visa application
      const token = await getAuthToken();
      const saveRes = await fetch(
        `${getApiBase()}/api/visa-applications/${appId}/additional-documents`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            documents: [{ name: docName, url: publicUrl }],
          }),
        },
      );
      if (!saveRes.ok) throw new Error('فشل حفظ المستند');

      onUploaded(docName, publicUrl);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل رفع الملف، يرجى المحاولة مجدداً');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View
      style={[
        docStyles.item,
        {
          backgroundColor: isUploaded
            ? 'rgba(16,185,129,0.08)'
            : 'rgba(239,68,68,0.06)',
          borderColor: isUploaded ? '#10B981' + '40' : '#EF4444' + '40',
        },
      ]}
    >
      <View style={docStyles.left}>
        <Ionicons
          name={isUploaded ? 'checkmark-circle' : 'document-text-outline'}
          size={20}
          color={isUploaded ? '#10B981' : '#EF4444'}
        />
      </View>
      <Text style={[docStyles.docName, { color: colors.foreground }]} numberOfLines={2}>
        {docName}
      </Text>
      {isUploaded ? (
        <TouchableOpacity
          style={docStyles.viewBtn}
          onPress={() => Linking.openURL(uploadedUrl!)}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={14} color="#10B981" />
          <Text style={docStyles.viewBtnText}>عرض</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={docStyles.uploadBtn}
          onPress={handleUpload}
          disabled={uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={14} color="#fff" />
              <Text style={docStyles.uploadBtnText}>رفع</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VisaApplicationTrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const queryClient = useQueryClient();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const appId = Number(id);
  const { data: app, isLoading, isError } = useGetVisaApplication(appId) as any;
  const queryKey = getGetVisaApplicationQueryKey(appId);

  // Local state for optimistic uploaded docs updates
  const [localUploads, setLocalUploads] = useState<Record<string, string>>({});

  function handleDocumentUploaded(name: string, url: string) {
    setLocalUploads(prev => ({ ...prev, [name]: url }));
    // Invalidate to refetch fresh data
    if (queryKey) queryClient.invalidateQueries({ queryKey });
  }

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

  type HistoryEntry = { status: string; timestamp: string; note?: string };
  const timeline: HistoryEntry[] =
    history.length > 0
      ? [...history].reverse()
      : [{ status: app.status, timestamp: app.createdAt }];

  // Additional documents
  const requestedDocs: Array<{ name: string }> = (app as any).requestedDocuments ?? [];
  const serverUploads: Array<{ name: string; url: string }> = (app as any).additionalDocumentUrls ?? [];

  // Merge server uploads with local (optimistic) uploads
  function getUploadedUrl(name: string): string | undefined {
    return localUploads[name] ?? serverUploads.find(u => u.name === name)?.url;
  }

  const pendingCount = requestedDocs.filter(d => !getUploadedUrl(d.name)).length;

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

        {/* ── Awaiting Documents Alert ─────────────────────────────────────── */}
        {app.status === 'awaiting_documents' && requestedDocs.length > 0 && (
          <View style={[styles.docsAlert, { borderColor: '#EF4444' + '40', backgroundColor: '#EF444410' }]}>
            <View style={styles.docsAlertHeader}>
              <View style={{ flex: 1, alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.docsAlertTitle}>مطلوب منك رفع مستندات</Text>
                <Text style={styles.docsAlertSub}>
                  {pendingCount > 0
                    ? `يوجد ${pendingCount} مستند لم يُرفع بعد`
                    : 'تم رفع جميع المستندات المطلوبة ✓'}
                </Text>
              </View>
              <View style={[styles.docsAlertIcon, { backgroundColor: '#EF444420' }]}>
                <Ionicons name="document-text" size={22} color="#EF4444" />
              </View>
            </View>

            <View style={styles.docsList}>
              {requestedDocs.map((doc, i) => (
                <DocumentUploadItem
                  key={i}
                  appId={appId}
                  docName={doc.name}
                  uploadedUrl={getUploadedUrl(doc.name)}
                  onUploaded={handleDocumentUploaded}
                />
              ))}
            </View>
          </View>
        )}

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

        {/* Documents & Photos */}
        {(app.passportImageUrl || app.personalPhotoUrl) && (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الصور والمستندات</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
              {app.passportImageUrl && (
                <TouchableOpacity
                  style={[styles.photoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => Linking.openURL(app.passportImageUrl!)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: app.passportImageUrl }} style={styles.photoThumb} contentFit="cover" />
                  <Text style={[styles.photoLabel, { color: colors.mutedForeground }]}>صورة الجواز</Text>
                </TouchableOpacity>
              )}
              {app.personalPhotoUrl && (
                <TouchableOpacity
                  style={[styles.photoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => Linking.openURL(app.personalPhotoUrl!)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: app.personalPhotoUrl }} style={styles.photoThumb} contentFit="cover" />
                  <Text style={[styles.photoLabel, { color: colors.mutedForeground }]}>الصورة الشخصية</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Help text */}
        <View style={[styles.helpCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.mutedForeground} />
          <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
            سيتم إشعارك بأي تحديث على حالة طلبك عبر التطبيق والرسائل النصية.
          </Text>
        </View>

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

// ─── Document item styles ──────────────────────────────────────────────────────
const docStyles = StyleSheet.create({
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  left: { flexShrink: 0 },
  docName: {
    flex: 1,
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
    textAlign: 'right',
  },
  uploadBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 58,
    justifyContent: 'center',
  },
  uploadBtnText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 12 },
  viewBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981' + '60',
  },
  viewBtnText: { color: '#10B981', fontFamily: 'Tajawal_500Medium', fontSize: 12 },
});

// ─── Screen styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  errorText: { fontSize: 16, fontFamily: 'Tajawal_700Bold', textAlign: 'center' },

  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16, gap: 12,
  },
  backBtn: { width: 32, alignItems: 'center' },
  headerTitle: {
    flex: 1, color: '#fff', fontSize: 18,
    fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center',
  },

  heroCard: {
    margin: 16, borderRadius: 16, padding: 18,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 14,
  },
  flag: { width: 44, height: 32, borderRadius: 6 },
  flagPlaceholder: { width: 44, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  heroInfo: { flex: 1, alignItems: 'flex-end', gap: 4 },
  heroCountry: { color: '#fff', fontSize: 17, fontFamily: 'Tajawal_800ExtraBold' },
  heroType: { color: '#ffffff99', fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  statusPill: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  statusPillText: { fontSize: 11, fontFamily: 'Tajawal_700Bold' },

  // Awaiting documents section
  docsAlert: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, borderWidth: 1.5, padding: 16,
  },
  docsAlertHeader: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12, marginBottom: 16,
  },
  docsAlertIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  docsAlertTitle: {
    color: '#EF4444', fontSize: 15, fontFamily: 'Tajawal_800ExtraBold',
  },
  docsAlertSub: {
    color: 'rgba(239,68,68,0.7)', fontSize: 12, fontFamily: 'Tajawal_400Regular',
  },
  docsList: {},

  card: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 12, fontFamily: 'Tajawal_400Regular' },
  infoValue: { fontSize: 14, fontFamily: 'Tajawal_500Medium' },

  sectionTitle: {
    fontSize: 16, fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'right', marginBottom: 16,
  },

  timelineRow: { flexDirection: 'row-reverse', gap: 14, marginBottom: 12 },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineDot: { borderRadius: 10, borderWidth: 2 },
  timelineLine: { flex: 1, width: 2, marginTop: 4, minHeight: 20 },
  timelineContent: {
    flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4,
  },
  timelineHeader: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
  },
  timelineStatus: { fontSize: 13, fontFamily: 'Tajawal_700Bold' },
  timelineDate: { fontSize: 11, fontFamily: 'Tajawal_400Regular' },
  timelineNote: {
    fontSize: 12, fontFamily: 'Tajawal_400Regular',
    textAlign: 'right', marginTop: 4, lineHeight: 18,
  },

  helpCard: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    margin: 16, padding: 14, borderRadius: 12, borderWidth: 1,
  },
  helpText: {
    flex: 1, fontSize: 12, fontFamily: 'Tajawal_400Regular',
    textAlign: 'right', lineHeight: 20,
  },

  actionBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 15 },

  secondaryBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginBottom: 16, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5,
  },
  secondaryBtnText: { fontFamily: 'Tajawal_700Bold', fontSize: 15 },

  photoCard: { flex: 1, borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  photoThumb: { width: '100%', height: 120 },
  photoLabel: { fontSize: 11, fontFamily: 'Tajawal_500Medium', textAlign: 'center', paddingVertical: 8 },
});
