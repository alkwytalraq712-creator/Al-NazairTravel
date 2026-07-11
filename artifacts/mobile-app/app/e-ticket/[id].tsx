/**
 * E-Ticket Screen — professional airline-style e-ticket with QR code and PDF export.
 */
import React, { useRef } from 'react';
import {
  ActivityIndicator, Alert, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useGetFlightBooking, getGetFlightBookingQueryKey } from '@workspace/api-client-react';
import { formatDateAr, formatTime, formatDuration, CABIN_LABELS_AR } from '@/lib/flightService';

const GOLD = '#C9A060';
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const DARK3 = '#162035';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  ticketed: 'صدرت التذكرة ✓',
  cancelled: 'ملغى',
  completed: 'مكتمل',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  ticketed: '#10B981',
  cancelled: '#EF4444',
  completed: '#6B7280',
};

function InfoRow({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoValue, highlight && { color: GOLD }]}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

export default function ETicketScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;
  const [exporting, setExporting] = React.useState(false);

  const bookingId = Number(id);
  const { data: booking, isLoading, isError } = useGetFlightBooking(bookingId, {
    query: {
      enabled: !!bookingId && !isNaN(bookingId),
      queryKey: getGetFlightBookingQueryKey(bookingId),
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={{ color: MUTED, fontFamily: 'Tajawal_500Medium', marginTop: 12 }}>جاري التحميل...</Text>
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center', gap: 16 }]}>
        <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
        <Text style={{ color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 15 }}>تعذر تحميل التذكرة</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnFallback}>
          <Text style={{ color: GOLD, fontFamily: 'Tajawal_700Bold' }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const offer = booking.offer;
  const pax0 = booking.passengers?.[0];
  const qrValue = booking.bookingReference ?? booking.referenceNumber ?? String(booking.id);

  const departStr = typeof offer.departTime === 'string'
    ? offer.departTime
    : (offer.departTime as any)?.toISOString?.() ?? '';
  const arriveStr = typeof offer.arriveTime === 'string'
    ? offer.arriveTime
    : (offer.arriveTime as any)?.toISOString?.() ?? '';

  // Prefer real segment data if available
  const seg = booking.segments?.[0];
  const fromAirport = seg?.fromAirport ?? offer.fromAirport;
  const toAirport = seg?.toAirport ?? offer.toAirport;
  const fromCity = seg?.fromCity ?? '';
  const toCity = seg?.toCity ?? '';
  const duration = seg?.durationMinutes ?? offer.durationMinutes;
  const aircraft = seg?.aircraft ?? '';
  const statusColor = STATUS_COLORS[booking.status] ?? MUTED;
  const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;

  async function handleExportPDF() {
    if (Platform.OS === 'web') {
      // Web: open print dialog
      try {
        await Print.printAsync({ html: buildTicketHtml() });
      } catch { /* user cancelled */ }
      return;
    }
    setExporting(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: buildTicketHtml(), base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `تذكرة رحلة ${offer.fromAirport}–${offer.toAirport}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('تم الحفظ', `تم حفظ التذكرة في:\n${uri}`);
      }
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'تعذر تصدير التذكرة');
    } finally {
      setExporting(false);
    }
  }

  function buildTicketHtml(): string {
    const passengerRows = booking!.passengers.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.firstName} ${p.lastName}</td>
        <td>${p.passportNumber}</td>
        <td>${p.nationality}</td>
        <td>${p.eTicketNumber ?? (booking!.eticketNumbers?.[i] ?? '—')}</td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width"/>
<title>تذكرة إلكترونية — ${qrValue}</title>
<style>
  body { font-family: Arial, sans-serif; background: #fff; color: #111; margin: 0; padding: 24px; direction: rtl; }
  h1 { font-size: 22px; color: #C9A060; margin: 0 0 4px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #C9A060; padding-bottom: 12px; margin-bottom: 20px; }
  .logo-text { font-size: 26px; font-weight: 900; color: #C9A060; }
  .airline-name { font-size: 14px; color: #555; }
  .section { margin-bottom: 20px; }
  .section h2 { font-size: 14px; color: #C9A060; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 10px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .field label { font-size: 11px; color: #888; display: block; }
  .field span { font-size: 14px; font-weight: 700; }
  .route { text-align: center; background: #f9f6f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .route .airports { display: flex; justify-content: space-between; align-items: center; font-size: 28px; font-weight: 900; }
  .route .times { display: flex; justify-content: space-between; font-size: 14px; color: #555; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f0e8d0; padding: 8px; text-align: right; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background: #e8f5e9; color: #10B981; }
  .ref { font-size: 22px; font-weight: 900; color: #C9A060; letter-spacing: 2px; }
  .footer { font-size: 11px; color: #999; text-align: center; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo-text">قمة للسفر والسياحة</div>
    <div class="airline-name">QEMA Travel & Tourism</div>
  </div>
  <div style="text-align:left;">
    <h1>تذكرة إلكترونية</h1>
    <div class="badge">${statusLabel}</div>
  </div>
</div>

<div class="route">
  <div class="airports">
    <div>${fromAirport}<br/><small style="font-size:14px;font-weight:400;color:#888">${fromCity}</small></div>
    <div style="font-size:18px;color:#C9A060;">✈</div>
    <div>${toAirport}<br/><small style="font-size:14px;font-weight:400;color:#888">${toCity}</small></div>
  </div>
  <div class="times">
    <span>${formatTime(departStr)}</span>
    <span style="color:#C9A060">${formatDuration(duration)}</span>
    <span>${formatTime(arriveStr)}</span>
  </div>
  <div style="margin-top:8px;font-size:13px;color:#555">${formatDateAr(departStr.slice(0, 10))} — ${offer.flightNumber} — ${CABIN_LABELS_AR[offer.cabinClass] ?? offer.cabinClass}</div>
</div>

<div class="section">
  <h2>بيانات الحجز</h2>
  <div class="grid">
    <div class="field"><label>رقم الطلب</label><span>${booking!.referenceNumber}</span></div>
    <div class="field"><label>رقم المرجع (PNR)</label><span class="ref">${booking!.bookingReference ?? '—'}</span></div>
    <div class="field"><label>الإفصاح</label><span>${offer.airlineName}</span></div>
    <div class="field"><label>تاريخ الإقلاع</label><span>${formatDateAr(departStr.slice(0, 10))}</span></div>
    <div class="field"><label>وقت الإقلاع</label><span>${formatTime(departStr)}</span></div>
    <div class="field"><label>وقت الوصول</label><span>${formatTime(arriveStr)}</span></div>
    ${aircraft ? `<div class="field"><label>طراز الطائرة</label><span>${aircraft}</span></div>` : ''}
    ${booking!.baggage ? `<div class="field"><label>الأمتعة</label><span>${booking!.baggage}</span></div>` : ''}
  </div>
</div>

<div class="section">
  <h2>المسافرون</h2>
  <table>
    <tr><th>#</th><th>الاسم</th><th>رقم الجواز</th><th>الجنسية</th><th>رقم التذكرة</th></tr>
    ${passengerRows}
  </table>
</div>

<div class="footer">
  صدرت هذه التذكرة بواسطة قمة للسفر والسياحة — الرجاء إحضار هذه التذكرة معك إلى المطار<br/>
  This e-ticket was issued by Qema Travel & Tourism — Please carry this ticket to the airport
</div>
</body>
</html>`;
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التذكرة الإلكترونية</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 100 }}
      >
        {/* Ticket Card */}
        <View style={styles.ticketCard}>
          {/* Top strip — airline + status */}
          <View style={styles.ticketHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
              {offer.airlineLogoUrl ? (
                <Image source={{ uri: offer.airlineLogoUrl }} style={styles.airlineLogo} contentFit="contain" />
              ) : (
                <View style={[styles.airlineLogo, { backgroundColor: DARK3, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="airplane" size={20} color={GOLD} />
                </View>
              )}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.airlineName}>{offer.airlineName}</Text>
                <Text style={styles.flightNum}>{offer.flightNumber}</Text>
              </View>
            </View>
          </View>

          {/* Perforation */}
          <View style={styles.perforation}>
            <View style={[styles.halfCircle, { left: -16 }]} />
            <View style={styles.dashedLine} />
            <View style={[styles.halfCircle, { right: -16, transform: [{ rotate: '180deg' }] }]} />
          </View>

          {/* Route */}
          <View style={styles.routeSection}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.airportCode}>{toAirport}</Text>
              {toCity ? <Text style={styles.cityName}>{toCity}</Text> : null}
              <Text style={styles.timeText}>{formatTime(arriveStr)}</Text>
            </View>
            <View style={styles.routeMid}>
              <View style={styles.routeDot} />
              <View style={styles.routeTube}>
                <Ionicons name="airplane" size={20} color={GOLD} style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
              <View style={styles.routeDot} />
              <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.airportCode}>{fromAirport}</Text>
              {fromCity ? <Text style={styles.cityName}>{fromCity}</Text> : null}
              <Text style={styles.timeText}>{formatTime(departStr)}</Text>
            </View>
          </View>

          {/* Date + Class + Baggage */}
          <View style={[styles.metaStrip, { marginTop: 4 }]}>
            {booking.baggage && (
              <View style={styles.metaItem}>
                <Ionicons name="bag-handle-outline" size={14} color={GOLD} />
                <Text style={styles.metaText}>{booking.baggage}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="ribbon-outline" size={14} color={GOLD} />
              <Text style={styles.metaText}>{CABIN_LABELS_AR[offer.cabinClass] ?? offer.cabinClass}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={GOLD} />
              <Text style={styles.metaText}>{formatDateAr(departStr.slice(0, 10))}</Text>
            </View>
          </View>
        </View>

        {/* References card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>بيانات الحجز</Text>
          <InfoRow label="رقم طلب الحجز" value={booking.referenceNumber} />
          <InfoRow label="رقم المرجع (PNR)" value={booking.bookingReference} highlight />
          {booking.eticketNumbers && booking.eticketNumbers.length > 0 && (
            <InfoRow label="رقم التذكرة الإلكترونية" value={booking.eticketNumbers.join(' / ')} highlight />
          )}
          {aircraft && <InfoRow label="طراز الطائرة" value={aircraft} />}
        </View>

        {/* Passengers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>المسافرون</Text>
          {booking.passengers.map((p, i) => {
            const eTicket = p.eTicketNumber ?? booking.eticketNumbers?.[i];
            return (
              <View key={i} style={[i > 0 && styles.passengerDivider]}>
                <Text style={styles.paxName}>{p.firstName} {p.lastName}</Text>
                <View style={styles.paxMeta}>
                  <Text style={styles.paxDetail}>جواز: {p.passportNumber}</Text>
                  <Text style={styles.paxDetail}>{p.nationality}</Text>
                  {eTicket && <Text style={[styles.paxDetail, { color: GOLD }]}>تذكرة: {eTicket}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* QR Code */}
        <View style={styles.qrCard}>
          <Text style={styles.qrLabel}>امسح الرمز عند المطار</Text>
          <View style={styles.qrBox}>
            <QRCode
              value={qrValue}
              size={160}
              color={DARK}
              backgroundColor={WHITE}
            />
          </View>
          <Text style={styles.qrRef}>{qrValue}</Text>
        </View>
      </ScrollView>

      {/* PDF export button */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.pdfBtn, exporting && { opacity: 0.7 }]}
          onPress={handleExportPDF}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting ? (
            <ActivityIndicator color={DARK} size="small" />
          ) : (
            <Ionicons name="download-outline" size={20} color={DARK} />
          )}
          <Text style={styles.pdfBtnText}>
            {exporting ? 'جاري التصدير...' : 'تحميل التذكرة (PDF)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DARK },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16, backgroundColor: DARK2,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTitle: {
    flex: 1, color: WHITE, fontSize: 17,
    fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center',
  },
  backBtnFallback: {
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: 'rgba(201,160,96,0.12)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(201,160,96,0.3)',
  },

  // Ticket card
  ticketCard: {
    backgroundColor: DARK2, borderRadius: 20, borderWidth: 1,
    borderColor: BORDER, marginBottom: 14, overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingBottom: 12,
  },
  airlineLogo: { width: 44, height: 44, borderRadius: 10 },
  airlineName: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' },
  flightNum: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusText: { fontFamily: 'Tajawal_700Bold', fontSize: 11 },

  perforation: {
    height: 16, marginHorizontal: 0, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  halfCircle: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: DARK, position: 'absolute', top: -2,
  },
  dashedLine: {
    flex: 1, height: 1, marginHorizontal: 20,
    borderStyle: 'dashed', borderWidth: 1, borderColor: BORDER,
  },

  routeSection: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 8,
  },
  airportCode: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 28 },
  cityName: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 11, textAlign: 'right' },
  timeText: { color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right', marginTop: 2 },
  routeMid: { flex: 1, alignItems: 'center', gap: 4 },
  routeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: GOLD },
  routeTube: {
    flex: 1, borderTopWidth: 1, borderTopColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4,
  },
  durationText: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 11, marginTop: 4 },

  metaStrip: {
    flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  metaItem: { flexDirection: 'row-reverse', gap: 5, alignItems: 'center' },
  metaText: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12 },

  // Cards
  card: {
    backgroundColor: DARK2, borderRadius: 18, borderWidth: 1,
    borderColor: BORDER, padding: 16, marginBottom: 14,
  },
  cardTitle: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 14, textAlign: 'right', marginBottom: 12 },

  infoRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  infoLabel: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12 },
  infoValue: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'left' },

  paxName: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right', marginBottom: 4 },
  paxMeta: { flexDirection: 'row-reverse', gap: 12, flexWrap: 'wrap' },
  paxDetail: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12 },
  passengerDivider: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER },

  // QR
  qrCard: {
    backgroundColor: DARK2, borderRadius: 18, borderWidth: 1,
    borderColor: BORDER, padding: 20, marginBottom: 14, alignItems: 'center',
  },
  qrLabel: { color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 13, marginBottom: 16 },
  qrBox: {
    backgroundColor: WHITE, borderRadius: 16, padding: 12,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  qrRef: { color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 18, marginTop: 14, letterSpacing: 2 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: DARK2, borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 16, paddingTop: 12,
  },
  pdfBtn: {
    flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: GOLD, paddingVertical: 16, borderRadius: 16, minHeight: 52,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  pdfBtnText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
});
