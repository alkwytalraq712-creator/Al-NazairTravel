/**
 * E-Ticket Screen — professional airline itinerary + PDF export.
 * Design modeled after standard IATA itinerary documents.
 * Company: قمة النظائر للسفريات والسياحة
 */
import React from 'react';
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
import { codeToEnglishName } from '@/lib/countriesEn';

const GOLD = '#C9A060';
const DARK = '#0B1628';
const DARK2 = '#0F1E36';
const DARK3 = '#162035';
const BORDER = 'rgba(255,255,255,0.09)';
const MUTED = 'rgba(255,255,255,0.50)';
const WHITE = '#FFFFFF';
const GREEN = '#10B981';

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

// ─── Company constants ────────────────────────────────────────────────────────
const COMPANY_AR = 'قمة النظائر للسفريات والسياحة';
const COMPANY_EN = 'QEMA AL-NAZAER FOR TRAVEL & TOURISM';
const COMPANY_PHONE = '+967 1 234 5678';
const COMPANY_EMAIL = 'info@qema-travel.com';
const COMPANY_CITY = 'صنعاء، الجمهورية اليمنية';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoValue, highlight && { color: GOLD, letterSpacing: 1 }]}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function dayOfWeekAr(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

// ─── Screen ───────────────────────────────────────────────────────────────────
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
  const qrValue = booking.bookingReference ?? booking.referenceNumber ?? String(booking.id);

  const departStr = typeof offer.departTime === 'string'
    ? offer.departTime
    : (offer.departTime as any)?.toISOString?.() ?? '';
  const arriveStr = typeof offer.arriveTime === 'string'
    ? offer.arriveTime
    : (offer.arriveTime as any)?.toISOString?.() ?? '';

  // Prefer real Duffel segment data when available
  const segments = booking.segments ?? [];
  const seg0 = segments[0];
  const fromAirport = seg0?.fromAirport ?? offer.fromAirport;
  const toAirport = seg0?.toAirport ?? offer.toAirport;
  const fromCity = seg0?.fromCity ?? '';
  const toCity = seg0?.toCity ?? '';
  const aircraft = seg0?.aircraft ?? '';
  const duration = seg0?.durationMinutes ?? offer.durationMinutes;
  const statusColor = STATUS_COLORS[booking.status] ?? MUTED;
  const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;

  // ─── PDF Builder ────────────────────────────────────────────────────────────
  function buildTicketHtml(): string {
    const issueDate = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const passengerName = booking!.passengers[0]
      ? `${booking!.passengers[0].firstName} ${booking!.passengers[0].lastName}`
      : '—';
    const paxCount = booking!.passengers.length;

    // Build segment blocks
    const segBlocks = (() => {
      const segs = (booking!.segments && booking!.segments.length > 0)
        ? booking!.segments
        : [{
          fromAirport: offer.fromAirport,
          fromAirportName: '',
          fromCity: '',
          toAirport: offer.toAirport,
          toAirportName: '',
          toCity: '',
          departTime: departStr,
          arriveTime: arriveStr,
          airlineName: offer.airlineName,
          flightNumber: offer.flightNumber,
          aircraft: '',
          durationMinutes: offer.durationMinutes,
          cabinClass: offer.cabinClass,
        }];

      return segs.map((s, idx) => {
        const depDt = typeof s.departTime === 'string' ? s.departTime : (s.departTime as any)?.toISOString?.() ?? '';
        const arrDt = typeof s.arriveTime === 'string' ? s.arriveTime : (s.arriveTime as any)?.toISOString?.() ?? '';
        const depTime = formatTime(depDt);
        const arrTime = formatTime(arrDt);
        const depDate = dayOfWeekAr(depDt.slice(0, 10));
        const arrDate = dayOfWeekAr(arrDt.slice(0, 10));
        const dur = s.durationMinutes ? formatDuration(s.durationMinutes) : '';
        const cabinAr = CABIN_LABELS_AR[s.cabinClass ?? ''] ?? (s.cabinClass ?? offer.cabinClass);
        const airline = s.airlineName ?? offer.airlineName;
        const flNum = s.flightNumber ?? offer.flightNumber;
        const fromName = s.fromAirportName ?? s.fromAirport;
        const toName = s.toAirportName ?? s.toAirport;
        const fromCityStr = s.fromCity ? `, ${s.fromCity}` : '';
        const toCityStr = s.toCity ? `, ${s.toCity}` : '';

        return `
        <div class="segment" style="${idx > 0 ? 'margin-top:12px' : ''}">
          <!-- Day header -->
          <div class="seg-day-header">
            <span class="seg-day-text">${depDate}</span>
          </div>

          <!-- Airline row -->
          <div class="seg-airline-row">
            <span class="seg-airline-logo">✈</span>
            <div>
              <div class="seg-airline-name">${airline}</div>
              <div class="seg-flight-num">${flNum}</div>
            </div>
            <div class="seg-status-badge">${booking!.status === 'ticketed' || booking!.status === 'confirmed' ? 'Confirmed' : 'Pending'}</div>
          </div>

          <!-- Route grid -->
          <div class="seg-route-grid">
            <!-- Departure -->
            <div class="seg-port">
              <div class="seg-port-time">${depTime}</div>
              <div class="seg-port-date">${depDate.split('،')[1]?.trim() ?? depDate}</div>
              <div class="seg-port-code">${s.fromAirport}</div>
              <div class="seg-port-name">${fromName}${fromCityStr}</div>
            </div>

            <!-- Duration middle -->
            <div class="seg-mid">
              <div class="seg-mid-arrow">→</div>
              <div class="seg-mid-dur">${dur}</div>
              <div class="seg-mid-stops">${segs.length === 1 && idx === 0 ? 'Non stop' : ''}</div>
            </div>

            <!-- Arrival -->
            <div class="seg-port seg-port-right">
              <div class="seg-port-time">${arrTime}</div>
              <div class="seg-port-date">${arrDate.split('،')[1]?.trim() ?? arrDate}</div>
              <div class="seg-port-code">${s.toAirport}</div>
              <div class="seg-port-name">${toName}${toCityStr}</div>
            </div>
          </div>

          <!-- Details row -->
          <div class="seg-details">
            <div class="seg-detail-item">
              <span class="seg-detail-label">Class</span>
              <span class="seg-detail-val">${cabinAr}</span>
            </div>
            ${s.aircraft ? `
            <div class="seg-detail-item">
              <span class="seg-detail-label">Equipment</span>
              <span class="seg-detail-val">${s.aircraft}</span>
            </div>` : ''}
            <div class="seg-detail-item">
              <span class="seg-detail-label">Status</span>
              <span class="seg-detail-val seg-detail-confirmed">${booking!.status === 'ticketed' || booking!.status === 'confirmed' ? 'Confirmed' : 'Pending'}</span>
            </div>
          </div>
        </div>`;
      }).join('');
    })();

    // Passenger rows
    const passengerRows = booking!.passengers.map((p, i) => {
      const eTicket = (p as any).eTicketNumber ?? booking!.eticketNumbers?.[i] ?? '—';
      const nat = codeToEnglishName(p.nationality ?? '');
      return `
      <tr>
        <td class="pax-num">${i + 1}</td>
        <td>
          <div class="pax-name">${p.firstName} ${p.lastName}</div>
          <div class="pax-nat">${nat}</div>
        </td>
        <td class="pax-passport">${p.passportNumber ?? '—'}</td>
        <td class="pax-eticket">${eTicket}</td>
      </tr>`;
    }).join('');

    const pnr = booking!.bookingReference ?? '—';

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>تذكرة سفر — ${COMPANY_AR}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Cairo', Arial, sans-serif;
    background: #e8eaf0;
    color: #1a1a2e;
    font-size: 12px;
    padding: 16px;
  }
  .page { max-width: 820px; margin: 0 auto; }

  /* ── Main document card ── */
  .doc-card {
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.13);
    overflow: hidden;
    margin-bottom: 12px;
  }

  /* ── Dark header bar ── */
  .doc-header {
    background: linear-gradient(135deg, #0B1628 0%, #1a2e4a 100%);
    padding: 0;
  }
  .doc-header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 18px 24px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .company-block { text-align: right; }
  .company-name-ar {
    font-size: 20px; font-weight: 900; color: #C9A060;
    line-height: 1.2; margin-bottom: 2px;
  }
  .company-name-en { font-size: 10px; color: rgba(255,255,255,0.45); letter-spacing: 0.5px; }
  .company-contact { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 4px; direction: ltr; text-align: right; }
  
  .doc-meta { text-align: left; }
  .doc-meta-label { font-size: 9px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; }
  .doc-meta-val { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  .doc-meta-pnr { font-size: 22px; font-weight: 900; color: #C9A060; font-family: monospace; letter-spacing: 3px; }

  /* ── Traveler + Agency bar ── */
  .traveler-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background: rgba(255,255,255,0.04);
  }
  .traveler-block { text-align: right; }
  .traveler-label { font-size: 9px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .traveler-name { font-size: 16px; font-weight: 700; color: #fff; }
  .traveler-count { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 2px; }
  .issue-block { text-align: left; }
  .issue-label { font-size: 9px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; }
  .issue-date { font-size: 11px; color: rgba(255,255,255,0.7); }

  /* ── Segments area ── */
  .segments-area { padding: 16px 20px; background: #f7f8fc; }

  /* ── Single segment ── */
  .segment {
    background: #fff;
    border: 1px solid #dde1ed;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .seg-day-header {
    background: #0B1628;
    padding: 8px 16px;
    display: flex;
    align-items: center;
  }
  .seg-day-text { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); direction: rtl; }

  .seg-airline-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px 8px;
    border-bottom: 1px solid #f0f2f8;
    direction: ltr;
  }
  .seg-airline-logo {
    font-size: 22px;
    width: 36px; height: 36px;
    background: #0B1628;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #C9A060;
    flex-shrink: 0;
  }
  .seg-airline-name { font-size: 14px; font-weight: 700; color: #1a1a2e; }
  .seg-flight-num { font-size: 11px; color: #888; margin-top: 1px; }
  .seg-status-badge {
    margin-left: auto;
    background: rgba(16,185,129,0.12);
    color: #059669;
    border: 1px solid rgba(16,185,129,0.3);
    border-radius: 20px;
    padding: 3px 12px;
    font-size: 11px;
    font-weight: 700;
  }

  /* Route grid */
  .seg-route-grid {
    display: flex;
    align-items: center;
    padding: 16px;
    gap: 8px;
    direction: ltr;
  }
  .seg-port { flex: 1; }
  .seg-port-right { text-align: right; }
  .seg-port-time { font-size: 28px; font-weight: 900; color: #0B1628; line-height: 1; }
  .seg-port-date { font-size: 10px; color: #888; margin: 2px 0 4px; }
  .seg-port-code { font-size: 13px; font-weight: 700; color: #C9A060; }
  .seg-port-name { font-size: 10px; color: #666; margin-top: 2px; max-width: 180px; }
  .seg-port-right .seg-port-name { margin-left: auto; }

  .seg-mid {
    text-align: center;
    flex: 0 0 100px;
    padding: 0 8px;
  }
  .seg-mid-arrow { font-size: 22px; color: #C9A060; font-weight: 300; letter-spacing: -2px; }
  .seg-mid-dur { font-size: 12px; font-weight: 700; color: #555; margin-top: 4px; }
  .seg-mid-stops { font-size: 10px; color: #aaa; margin-top: 2px; }

  /* Details strip */
  .seg-details {
    display: flex;
    gap: 0;
    border-top: 1px solid #f0f2f8;
    background: #fcfcfe;
    direction: ltr;
  }
  .seg-detail-item {
    flex: 1;
    padding: 10px 14px;
    border-right: 1px solid #f0f2f8;
  }
  .seg-detail-item:last-child { border-right: none; }
  .seg-detail-label { display: block; font-size: 9px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .seg-detail-val { font-size: 12px; font-weight: 700; color: #333; }
  .seg-detail-confirmed { color: #059669; }

  /* ── Passengers section ── */
  .pax-section {
    padding: 0 20px 16px;
    background: #f7f8fc;
  }
  .section-title {
    font-size: 11px;
    font-weight: 700;
    color: #C9A060;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 12px 0 8px;
    border-bottom: 2px solid #C9A060;
    margin-bottom: 0;
  }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #dde1ed; border-radius: 8px; overflow: hidden; }
  thead tr { background: #0B1628; }
  thead th {
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody td { padding: 10px 14px; font-size: 12px; border-bottom: 1px solid #f0f2f8; vertical-align: middle; }
  tbody tr:last-child td { border-bottom: none; }
  .pax-num { font-weight: 900; color: #C9A060; width: 30px; text-align: center; }
  .pax-name { font-weight: 700; color: #1a1a2e; font-size: 13px; }
  .pax-nat { font-size: 10px; color: #888; margin-top: 2px; }
  .pax-passport { font-family: monospace; font-size: 13px; letter-spacing: 1px; color: #444; }
  .pax-eticket { font-family: monospace; font-size: 11px; color: #C9A060; font-weight: 700; letter-spacing: 1px; }

  /* ── Reference section ── */
  .ref-section {
    padding: 12px 20px;
    background: #f7f8fc;
    border-top: 1px solid #e8eaf0;
  }
  .ref-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px dashed #e0e4ee;
    direction: ltr;
  }
  .ref-row:last-child { border-bottom: none; }
  .ref-label { font-size: 10px; color: #888; min-width: 180px; }
  .ref-val { font-weight: 700; color: #C9A060; font-family: monospace; letter-spacing: 2px; font-size: 15px; }

  /* ── Notes section ── */
  .notes-section {
    padding: 14px 20px;
    background: #fff;
    border-top: 2px solid #f0f2f8;
  }
  .notes-title { font-size: 11px; font-weight: 700; color: #555; margin-bottom: 8px; direction: rtl; }
  .note-item { font-size: 10px; color: #777; line-height: 1.8; direction: rtl; }

  /* ── Footer ── */
  .doc-footer {
    background: #0B1628;
    padding: 14px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    direction: ltr;
  }
  .footer-left { text-align: left; }
  .footer-right { text-align: right; }
  .footer-company { font-size: 11px; color: #C9A060; font-weight: 700; }
  .footer-sub { font-size: 9px; color: rgba(255,255,255,0.35); margin-top: 3px; }
  .footer-disclaimer { font-size: 8px; color: rgba(255,255,255,0.25); max-width: 400px; line-height: 1.6; }

  @media print {
    body { padding: 0; background: white; }
    .doc-card { box-shadow: none; }
  }
</style>
</head>
<body>
<div class="page">
<div class="doc-card">

  <!-- ═══ DARK HEADER ═══ -->
  <div class="doc-header">
    <div class="doc-header-top">
      <!-- Right: Company -->
      <div class="company-block">
        <div class="company-name-ar">${COMPANY_AR}</div>
        <div class="company-name-en">${COMPANY_EN}</div>
        <div class="company-contact">${COMPANY_PHONE} · ${COMPANY_EMAIL}</div>
        <div class="company-contact">${COMPANY_CITY}</div>
      </div>
      <!-- Left: Booking ref -->
      <div class="doc-meta">
        <div class="doc-meta-label">Booking Reference / رقم المرجع</div>
        <div class="doc-meta-pnr">${pnr}</div>
        <div style="margin-top:8px">
          <div class="doc-meta-label">Document Issue Date / تاريخ الإصدار</div>
          <div class="doc-meta-val" style="font-size:11px;color:rgba(255,255,255,0.7)">${issueDate}</div>
        </div>
        <div style="margin-top:6px">
          <div class="doc-meta-label">Booking No.</div>
          <div class="doc-meta-val" style="font-size:11px">${booking!.referenceNumber}</div>
        </div>
      </div>
    </div>

    <!-- Traveler bar -->
    <div class="traveler-bar">
      <div class="traveler-block">
        <div class="traveler-label">Traveler / المسافر</div>
        <div class="traveler-name">${passengerName}</div>
        ${paxCount > 1 ? `<div class="traveler-count">+ ${paxCount - 1} مسافر آخر / other traveler(s)</div>` : ''}
      </div>
      <div class="issue-block">
        <div class="issue-label">Status</div>
        <div class="issue-date" style="font-weight:700;color:#10B981">
          ${booking!.status === 'ticketed' ? '✓ Ticketed' : booking!.status === 'confirmed' ? '✓ Confirmed' : booking!.status}
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ SEGMENTS ═══ -->
  <div class="segments-area">
    ${segBlocks}
  </div>

  <!-- ═══ PASSENGERS ═══ -->
  <div class="pax-section">
    <div class="section-title">Passenger Details / بيانات المسافرين</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name / الاسم</th>
          <th>Passport No. / رقم الجواز</th>
          <th>E-Ticket No. / رقم التذكرة</th>
        </tr>
      </thead>
      <tbody>${passengerRows}</tbody>
    </table>
  </div>

  <!-- ═══ BOOKING REFERENCE ═══ -->
  ${pnr !== '—' ? `
  <div class="ref-section">
    <div class="section-title" style="padding-bottom:8px;margin-bottom:4px">Airline Booking Reference(s)</div>
    <div class="ref-row">
      <span class="ref-label">${offer.airlineName}:</span>
      <span class="ref-val">${pnr}</span>
    </div>
  </div>` : ''}

  <!-- ═══ NOTES ═══ -->
  <div class="notes-section">
    <div class="notes-title">General Information / معلومات عامة</div>
    <div class="note-item">• يرجى الحضور إلى المطار قبل موعد الإقلاع بساعتين على الأقل للرحلات الدولية.</div>
    <div class="note-item">• Please check airline's check-in procedures for this itinerary.</div>
    <div class="note-item">• هذه التذكرة شخصية وغير قابلة للتحويل · This ticket is non-transferable and non-refundable.</div>
    <div class="note-item">• تأكد من صلاحية جواز سفرك قبل السفر · Ensure your passport is valid before travel.</div>
    <div class="note-item">• للاستفسار والمساعدة: ${COMPANY_PHONE} · ${COMPANY_EMAIL}</div>
  </div>

  <!-- ═══ FOOTER ═══ -->
  <div class="doc-footer">
    <div class="footer-left">
      <div class="footer-company">${COMPANY_EN}</div>
      <div class="footer-sub">${COMPANY_PHONE} · ${COMPANY_EMAIL}</div>
    </div>
    <div class="footer-right">
      <div class="footer-disclaimer">
        Your personal data will be processed in accordance with applicable privacy policies.
        This document is issued by ${COMPANY_AR} on behalf of the passenger.
      </div>
    </div>
  </div>

</div><!-- /doc-card -->
</div><!-- /page -->
</body>
</html>`;
  }

  // ─── PDF Export ──────────────────────────────────────────────────────────────
  async function handleExportPDF() {
    if (Platform.OS === 'web') {
      try { await Print.printAsync({ html: buildTicketHtml() }); } catch { /* cancelled */ }
      return;
    }
    setExporting(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: buildTicketHtml(), base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `تذكرة ${offer.fromAirport}–${offer.toAirport}`,
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

  // ─── UI ──────────────────────────────────────────────────────────────────────
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
        {/* ── Company ticket card (dark style matching app) ── */}
        <View style={styles.ticketDoc}>
          {/* Company header */}
          <View style={styles.ticketTop}>
            <View>
              <Text style={styles.companyName}>{COMPANY_AR}</Text>
              <Text style={styles.companyEn}>{COMPANY_EN}</Text>
              <Text style={styles.companyPhone}>{COMPANY_PHONE}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.docMetaLabel}>رقم الحجز</Text>
              <Text style={styles.pnrText}>{qrValue}</Text>
              <Text style={[styles.docMetaLabel, { marginTop: 6 }]}>رقم الطلب</Text>
              <Text style={styles.refText}>{booking.referenceNumber}</Text>
            </View>
          </View>

          {/* Traveler bar */}
          <View style={styles.travelerBar}>
            <View>
              <Text style={styles.travelerLabel}>المسافر</Text>
              <Text style={styles.travelerName}>
                {booking.passengers[0] ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}` : '—'}
              </Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: statusColor + '22', borderColor: statusColor + '66' }]}>
              <Text style={[styles.statusChipText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* Perforation line */}
          <View style={styles.perforation}>
            <View style={[styles.halfCircle, { left: -14 }]} />
            <View style={styles.dashedLine} />
            <View style={[styles.halfCircle, { right: -14, transform: [{ rotate: '180deg' }] }]} />
          </View>

          {/* Flight segment(s) */}
          {(segments.length > 0 ? segments : [{
            fromAirport, toAirport, fromCity, toCity,
            departTime: departStr, arriveTime: arriveStr,
            airlineName: offer.airlineName, flightNumber: offer.flightNumber,
            aircraft, durationMinutes: duration, cabinClass: offer.cabinClass,
            fromAirportName: '', toAirportName: '',
          }]).map((seg: any, idx: number) => {
            const segDepStr = typeof seg.departTime === 'string' ? seg.departTime : seg.departTime?.toISOString?.() ?? '';
            const segArrStr = typeof seg.arriveTime === 'string' ? seg.arriveTime : seg.arriveTime?.toISOString?.() ?? '';
            return (
              <View key={idx} style={[styles.segBlock, idx > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}>
                {/* Date label */}
                <Text style={styles.segDateLabel}>
                  {dayOfWeekAr(segDepStr.slice(0, 10))}
                </Text>

                {/* Airline row */}
                <View style={styles.segAirlineRow}>
                  {offer.airlineLogoUrl ? (
                    <Image source={{ uri: offer.airlineLogoUrl }} style={styles.airlineLogo} contentFit="contain" />
                  ) : (
                    <View style={[styles.airlineLogo, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="airplane" size={18} color={GOLD} />
                    </View>
                  )}
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.airlineName}>{seg.airlineName ?? offer.airlineName}</Text>
                    <Text style={styles.flightNum}>{seg.flightNumber ?? offer.flightNumber}</Text>
                  </View>
                </View>

                {/* Route */}
                <View style={styles.routeRow}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.routeCode}>{seg.toAirport}</Text>
                    {seg.toCity ? <Text style={styles.routeCity}>{seg.toCity}</Text> : null}
                    <Text style={styles.routeTime}>{formatTime(segArrStr)}</Text>
                  </View>
                  <View style={styles.routeMid}>
                    <View style={styles.routeLine} />
                    <Ionicons name="airplane" size={18} color={GOLD} style={{ transform: [{ rotate: '180deg' }] }} />
                    <View style={styles.routeLine} />
                    <Text style={styles.routeDur}>{formatDuration(seg.durationMinutes ?? duration)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.routeCode}>{seg.fromAirport}</Text>
                    {seg.fromCity ? <Text style={styles.routeCity}>{seg.fromCity}</Text> : null}
                    <Text style={styles.routeTime}>{formatTime(segDepStr)}</Text>
                  </View>
                </View>

                {/* Details chips */}
                <View style={styles.detailChips}>
                  <View style={styles.detailChip}>
                    <Ionicons name="ribbon-outline" size={12} color={GOLD} />
                    <Text style={styles.detailChipText}>{CABIN_LABELS_AR[seg.cabinClass ?? offer.cabinClass] ?? seg.cabinClass}</Text>
                  </View>
                  {seg.aircraft ? (
                    <View style={styles.detailChip}>
                      <Ionicons name="airplane-outline" size={12} color={MUTED} />
                      <Text style={styles.detailChipText}>{seg.aircraft}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.detailChip, { borderColor: GREEN + '55', backgroundColor: GREEN + '11' }]}>
                    <Text style={[styles.detailChipText, { color: GREEN }]}>{statusLabel}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Passengers card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>بيانات المسافرين</Text>
          {booking.passengers.map((p, i) => {
            const eTicket = (p as any).eTicketNumber ?? booking.eticketNumbers?.[i];
            return (
              <View key={i} style={[i > 0 && { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER }]}>
                <Text style={styles.paxName}>{p.firstName} {p.lastName}</Text>
                <View style={styles.paxMeta}>
                  <Text style={styles.paxDetail}>جواز: {p.passportNumber}</Text>
                  <Text style={styles.paxDetail}>{codeToEnglishName(p.nationality ?? '')}</Text>
                </View>
                {eTicket ? (
                  <Text style={[styles.paxDetail, { color: GOLD, marginTop: 3 }]}>تذكرة: {eTicket}</Text>
                ) : null}
              </View>
            );
          })}
          {booking.baggage ? (
            <View style={[styles.baggageRow, { marginTop: 12 }]}>
              <Ionicons name="bag-handle-outline" size={14} color={GREEN} />
              <Text style={[styles.paxDetail, { color: GREEN }]}>{booking.baggage}</Text>
            </View>
          ) : null}
        </View>

        {/* ── References card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>مراجع الحجز</Text>
          <InfoRow label="رقم طلب الحجز" value={booking.referenceNumber} />
          <InfoRow label="رقم المرجع (PNR)" value={booking.bookingReference} highlight />
          {booking.eticketNumbers && booking.eticketNumbers.length > 0 && (
            <InfoRow label="رقم التذكرة الإلكترونية" value={booking.eticketNumbers.join(' / ')} highlight />
          )}
          {aircraft && <InfoRow label="طراز الطائرة" value={aircraft} />}
        </View>

        {/* ── QR card ── */}
        <View style={styles.qrCard}>
          <Text style={styles.qrLabel}>امسح الرمز عند المطار</Text>
          <View style={styles.qrBox}>
            <QRCode value={qrValue} size={150} color={DARK} backgroundColor={WHITE} />
          </View>
          <Text style={styles.qrRef}>{qrValue}</Text>
        </View>
      </ScrollView>

      {/* PDF export */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.pdfBtn, exporting && { opacity: 0.7 }]}
          onPress={handleExportPDF}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting
            ? <ActivityIndicator color={DARK} size="small" />
            : <Ionicons name="download-outline" size={20} color={DARK} />}
          <Text style={styles.pdfBtnText}>
            {exporting ? 'جاري التصدير...' : 'تحميل التذكرة PDF'}
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

  // Ticket document card
  ticketDoc: {
    backgroundColor: DARK2, borderRadius: 20, borderWidth: 1,
    borderColor: BORDER, overflow: 'hidden', marginBottom: 14,
  },
  ticketTop: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 18, backgroundColor: '#0a1525',
    borderBottomWidth: 1, borderBottomColor: 'rgba(201,160,96,0.2)',
  },
  companyName: { color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 16, textAlign: 'right' },
  companyEn: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Tajawal_400Regular', fontSize: 9, textAlign: 'right', marginTop: 2 },
  companyPhone: { color: 'rgba(255,255,255,0.35)', fontFamily: 'Tajawal_400Regular', fontSize: 10, textAlign: 'right', marginTop: 3 },
  docMetaLabel: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Tajawal_400Regular', fontSize: 9, textAlign: 'left' },
  pnrText: { color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 22, letterSpacing: 3, textAlign: 'left' },
  refText: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 12, textAlign: 'left' },

  travelerBar: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  travelerLabel: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Tajawal_400Regular', fontSize: 10, textAlign: 'right' },
  travelerName: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusChipText: { fontFamily: 'Tajawal_700Bold', fontSize: 11 },

  perforation: {
    height: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: DARK,
  },
  halfCircle: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: DARK2,
    position: 'absolute', top: -1,
  },
  dashedLine: {
    flex: 1, height: 1, marginHorizontal: 18,
    borderStyle: 'dashed', borderWidth: 1, borderColor: BORDER,
  },

  // Segment
  segBlock: { padding: 16 },
  segDateLabel: {
    color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 12,
    textAlign: 'right', marginBottom: 10,
  },
  segAirlineRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  airlineLogo: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: DARK3,
  },
  airlineName: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14 },
  flightNum: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12 },

  routeRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  routeCode: { color: WHITE, fontFamily: 'Tajawal_800ExtraBold', fontSize: 24 },
  routeCity: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 11, textAlign: 'right' },
  routeTime: { color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 13, textAlign: 'right', marginTop: 2 },
  routeMid: { flex: 1, alignItems: 'center', gap: 3 },
  routeLine: { flex: 1, height: 1, backgroundColor: BORDER, width: '100%' },
  routeDur: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 10, marginTop: 2 },

  detailChips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  detailChip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  detailChipText: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 11 },

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
  infoValue: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14 },

  paxName: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right', marginBottom: 4 },
  paxMeta: { flexDirection: 'row-reverse', gap: 12, flexWrap: 'wrap' },
  paxDetail: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12 },
  baggageRow: { flexDirection: 'row-reverse', gap: 6, alignItems: 'center' },

  // QR
  qrCard: {
    backgroundColor: DARK2, borderRadius: 18, borderWidth: 1,
    borderColor: BORDER, padding: 20, marginBottom: 14, alignItems: 'center',
  },
  qrLabel: { color: MUTED, fontFamily: 'Tajawal_500Medium', fontSize: 13, marginBottom: 16 },
  qrBox: {
    backgroundColor: WHITE, borderRadius: 16, padding: 12,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  qrRef: { color: GOLD, fontFamily: 'Tajawal_800ExtraBold', fontSize: 18, marginTop: 14, letterSpacing: 2 },

  // Footer
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
