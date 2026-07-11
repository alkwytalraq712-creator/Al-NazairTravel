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
    const pax0Name = booking!.passengers[0]
      ? `${booking!.passengers[0].firstName} ${booking!.passengers[0].lastName}`
      : '—';
    const paxCount = booking!.passengers.length;

    const passengerRows = booking!.passengers.map((p, i) => {
      const eTicket = (p as any).eTicketNumber ?? booking!.eticketNumbers?.[i] ?? '—';
      return `
      <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td style="font-weight:700;color:#C9A060">${i + 1}</td>
        <td>
          <div style="font-weight:700;font-size:14px">${p.firstName} ${p.lastName}</div>
          <div style="font-size:11px;color:#888;margin-top:2px">${p.nationality ?? ''}</div>
        </td>
        <td style="font-family:monospace;letter-spacing:1px">${p.passportNumber ?? '—'}</td>
        <td style="color:#C9A060;font-weight:700;font-family:monospace;letter-spacing:2px">${eTicket}</td>
      </tr>`;
    }).join('');

    const issueDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>تذكرة إلكترونية — ${qrValue}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Cairo', Arial, sans-serif;
    background: #f4f4f6;
    color: #1a1a2e;
    direction: rtl;
    padding: 20px;
    font-size: 13px;
  }

  /* ── Ticket wrapper ─────────────────────── */
  .ticket {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.12);
    max-width: 800px;
    margin: 0 auto 20px;
  }

  /* ── Top band: company + status ──────────── */
  .top-band {
    background: linear-gradient(135deg, #0B1628 0%, #162035 60%, #0F1E36 100%);
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .company-name { font-size: 22px; font-weight: 900; color: #C9A060; line-height: 1.2; }
  .company-en   { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 400; }
  .etkt-label   { font-size: 11px; color: rgba(255,255,255,0.5); text-align: left; }
  .etkt-title   { font-size: 18px; font-weight: 900; color: #fff; text-align: left; }
  .status-badge {
    display: inline-block; margin-top: 6px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
    background: rgba(16,185,129,0.2); color: #10B981;
    border: 1px solid rgba(16,185,129,0.4);
  }

  /* ── Route section ──────────────────────── */
  .route-section {
    background: linear-gradient(135deg, #0F1E36 0%, #162035 100%);
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .airport-block { text-align: center; }
  .airport-code {
    font-size: 48px; font-weight: 900; color: #fff; line-height: 1;
    letter-spacing: 2px;
  }
  .airport-city { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px; }
  .flight-mid { flex: 1; text-align: center; }
  .flight-line {
    position: relative; height: 2px;
    background: linear-gradient(90deg, rgba(201,160,96,0.3), #C9A060, rgba(201,160,96,0.3));
    margin: 16px 0;
  }
  .flight-plane {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #C9A060; color: #fff;
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; margin-top: -14px; margin-left: -14px;
  }
  .flight-duration { font-size: 13px; color: #C9A060; font-weight: 700; }
  .flight-number   { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 4px; }
  .time-row {
    display: flex; justify-content: space-between; align-items: flex-end;
    padding: 0 8px; margin-top: 8px;
  }
  .time-block { text-align: center; }
  .time-val  { font-size: 26px; font-weight: 900; color: #fff; }
  .time-date { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; }

  /* ── Perforated divider ─────────────────── */
  .perforated {
    display: flex; align-items: center;
    background: #f4f4f6;
  }
  .perf-circle-l, .perf-circle-r {
    width: 28px; height: 28px; border-radius: 50%;
    background: #f4f4f6; flex-shrink: 0;
  }
  .perf-line {
    flex: 1; height: 0; margin: 0 4px;
    border-top: 2px dashed #ddd;
  }

  /* ── Info grid ──────────────────────────── */
  .info-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border-bottom: 1px solid #f0f0f0;
  }
  .info-cell {
    padding: 16px 20px;
    border-left: 1px solid #f0f0f0;
  }
  .info-cell:last-child { border-left: none; }
  .info-cell label { display: block; font-size: 10px; color: #999; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; }
  .info-cell span  { font-size: 14px; font-weight: 700; color: #1a1a2e; }
  .pnr-val { font-size: 20px !important; color: #C9A060 !important; letter-spacing: 3px; font-family: monospace !important; }
  .cabin-val { color: #7c3aed !important; }

  /* ── Passengers table ───────────────────── */
  .section-title {
    padding: 14px 20px 10px;
    font-size: 12px; font-weight: 700; color: #C9A060;
    letter-spacing: 1px; border-bottom: 1px solid #f0f0f0;
    background: #fffbf4;
  }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    background: #f9f6f0; padding: 10px 16px;
    font-size: 11px; font-weight: 700; color: #888;
    text-align: right; border-bottom: 2px solid #edd9a3;
  }
  .row-even { background: #fff; }
  .row-odd  { background: #fafafa; }
  tbody td { padding: 12px 16px; font-size: 13px; vertical-align: top; border-bottom: 1px solid #f0f0f0; }

  /* ── Baggage strip ──────────────────────── */
  .baggage-strip {
    background: #f0faf4; border-top: 1px solid #d1fae5;
    padding: 12px 20px; display: flex; align-items: center; gap: 10px;
    direction: rtl;
  }
  .baggage-icon { font-size: 18px; }
  .baggage-label { font-size: 12px; color: #065f46; font-weight: 700; }
  .baggage-val   { font-size: 13px; color: #047857; font-weight: 900; }

  /* ── Footer ─────────────────────────────── */
  .ticket-footer {
    background: #0B1628; padding: 16px 24px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .footer-ar { font-size: 11px; color: rgba(255,255,255,0.5); }
  .footer-en { font-size: 10px; color: rgba(255,255,255,0.3); direction: ltr; text-align: left; }

  /* ── Conditions ──────────────────────────── */
  .conditions {
    background: #fff; border-radius: 16px;
    padding: 20px 24px; max-width: 800px; margin: 0 auto;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .conditions h3 { font-size: 13px; font-weight: 700; color: #C9A060; margin-bottom: 10px; }
  .conditions ul { padding-right: 18px; }
  .conditions li { font-size: 11px; color: #666; line-height: 1.8; }
</style>
</head>
<body>

<!-- ═══════════════════════════════════ TICKET ═══════════════════════════════════ -->
<div class="ticket">

  <!-- Top Band -->
  <div class="top-band">
    <div>
      <div class="company-name">قمة للسفر والسياحة</div>
      <div class="company-en">QEMA TRAVEL &amp; TOURISM</div>
    </div>
    <div style="text-align:left">
      <div class="etkt-label">E-TICKET / تذكرة إلكترونية</div>
      <div class="etkt-title">${offer.airlineName}</div>
      <div class="status-badge">${statusLabel}</div>
    </div>
  </div>

  <!-- Route -->
  <div class="route-section">
    <div class="airport-block">
      <div class="airport-code">${fromAirport}</div>
      <div class="airport-city">${fromCity || fromAirport}</div>
    </div>

    <div class="flight-mid">
      <div class="flight-duration">${formatDuration(duration)}</div>
      <div class="flight-line">
        <div class="flight-plane">✈</div>
      </div>
      <div class="flight-number">${offer.flightNumber}${aircraft ? ` · ${aircraft}` : ''}</div>
    </div>

    <div class="airport-block">
      <div class="airport-code">${toAirport}</div>
      <div class="airport-city">${toCity || toAirport}</div>
    </div>
  </div>

  <!-- Times -->
  <div style="background:linear-gradient(135deg,#0F1E36,#162035);padding:0 32px 20px;">
    <div class="time-row">
      <div class="time-block">
        <div class="time-val">${formatTime(departStr)}</div>
        <div class="time-date">${formatDateAr(departStr.slice(0,10))}</div>
      </div>
      <div class="time-block">
        <div class="time-val">${formatTime(arriveStr)}</div>
        <div class="time-date">${formatDateAr(arriveStr.slice(0,10))}</div>
      </div>
    </div>
  </div>

  <!-- Perforated divider -->
  <div class="perforated">
    <div class="perf-circle-l"></div>
    <div class="perf-line"></div>
    <div class="perf-circle-r"></div>
  </div>

  <!-- Info grid -->
  <div class="info-grid">
    <div class="info-cell">
      <label>رقم المرجع / PNR</label>
      <span class="pnr-val">${booking!.bookingReference ?? '—'}</span>
    </div>
    <div class="info-cell">
      <label>رقم الطلب / Booking Ref</label>
      <span>${booking!.referenceNumber}</span>
    </div>
    <div class="info-cell">
      <label>الدرجة / Class</label>
      <span class="cabin-val">${CABIN_LABELS_AR[offer.cabinClass] ?? offer.cabinClass}</span>
    </div>
    <div class="info-cell">
      <label>عدد المسافرين / Pax</label>
      <span>${paxCount} ${paxCount === 1 ? 'مسافر' : 'مسافرون'}</span>
    </div>
  </div>

  <!-- Baggage -->
  ${booking!.baggage ? `
  <div class="baggage-strip">
    <span class="baggage-icon">🧳</span>
    <span class="baggage-label">الأمتعة المسموح بها:</span>
    <span class="baggage-val">${booking!.baggage}</span>
    <span style="margin-right:auto;font-size:11px;color:#059669">Baggage Allowance</span>
  </div>` : ''}

  <!-- Passengers table -->
  <div class="section-title">بيانات المسافرين / PASSENGER DETAILS</div>
  <table>
    <thead>
      <tr>
        <th style="width:32px">#</th>
        <th>الاسم / Name</th>
        <th>رقم الجواز / Passport</th>
        <th>رقم التذكرة / E-Ticket No.</th>
      </tr>
    </thead>
    <tbody>${passengerRows}</tbody>
  </table>

  <!-- Footer -->
  <div class="ticket-footer">
    <div class="footer-ar">
      صدرت بواسطة: قمة للسفر والسياحة · تاريخ الإصدار: ${issueDate}<br/>
      الرجاء إحضار هذه التذكرة والجواز معك إلى المطار
    </div>
    <div class="footer-en">
      Issued by: Qema Travel &amp; Tourism<br/>
      Please carry this e-ticket and passport to the airport
    </div>
  </div>

</div><!-- /ticket -->

<!-- ══════════════════════ TERMS & CONDITIONS ══════════════════════ -->
<div class="conditions">
  <h3>شروط وأحكام مهمة · Important Terms</h3>
  <ul>
    <li>يجب الحضور إلى المطار قبل موعد الإقلاع بساعتين على الأقل للرحلات الدولية.</li>
    <li>Arrive at the airport at least 2 hours before departure for international flights.</li>
    <li>هذه التذكرة شخصية وغير قابلة للتحويل · This ticket is non-transferable.</li>
    <li>تأكد من صلاحية جواز سفرك قبل السفر · Ensure your passport is valid before travel.</li>
    <li>قمة للسفر والسياحة · Qema Travel &amp; Tourism — للاستفسار: info@qema.travel</li>
  </ul>
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
