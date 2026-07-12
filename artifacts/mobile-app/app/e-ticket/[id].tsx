/**
 * E-Ticket Screen — Professional airline-grade itinerary & PDF export.
 * Redesigned to Qatar Airways / Emirates / Oman Air standard.
 * Company: قمة النظائر للسفريات والسياحة
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Linking, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  useGetFlightBooking,
  getGetFlightBookingQueryKey,
  useCompleteHoldBooking,
} from '@workspace/api-client-react';
import { formatTime, formatDuration, CABIN_LABELS_AR } from '@/lib/flightService';
import { codeToEnglishName } from '@/lib/countriesEn';
import { useColors } from '@/hooks/useColors';
import { COMPANY_LOGO_BASE64 } from '@/lib/logoBase64';

// ─── Brand & Company ──────────────────────────────────────────────────────────
const GOLD       = '#C9A060';
const GOLD2      = '#E8C07A';
const DARK_BG    = '#0B1628';
const TICKET_BG  = '#FFFFFF';
const TICKET_SECONDARY = '#F7F8FC';

const COMPANY_AR    = 'قمة النظائر للسفريات والسياحة';
const COMPANY_EN    = 'QEMA AL-NAZAER FOR TRAVEL & TOURISM';
const COMPANY_PHONE  = '+964 780 101 6390';
const COMPANY_PHONE2 = '+964 773 326 6663';
const COMPANY_EMAIL  = 'alnathair2@gmail.com';
const COMPANY_CITY   = 'العراق - البصرة - الجزائر - العباسية / شارع كيا سابقاً';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  pending:      'قيد الانتظار',
  confirmed:    'مؤكد',
  ticketed:     'صدرت التذكرة',
  cancelled:    'ملغى',
  completed:    'مكتمل',
  held:         'حجز مؤقت',
  expired_hold: 'انتهى الحجز المؤقت',
};
const STATUS_COLORS: Record<string, string> = {
  pending:      '#F59E0B',
  confirmed:    '#3B82F6',
  ticketed:     '#10B981',
  cancelled:    '#EF4444',
  completed:    '#6B7280',
  held:         '#F97316',
  expired_hold: '#EF4444',
};
const GENDER_MAP: Record<string, string> = {
  male: 'ذكر / Male', female: 'أنثى / Female', M: 'ذكر / Male', F: 'أنثى / Female',
};

function isTemporary(status: string) {
  return status === 'held' || status === 'pending' || status === 'expired_hold';
}
function isConfirmed(status: string) {
  return status === 'confirmed' || status === 'ticketed' || status === 'completed';
}

function dayFull(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return iso; }
}
function dateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

// ─── Visual Barcode (SVG) ─────────────────────────────────────────────────────
function BarcodeView({ value, width = 220, height = 52, color = '#1A2035' }: {
  value: string; width?: number; height?: number; color?: string;
}) {
  const src = value.padEnd(20, '1').slice(0, 20);
  const segments: { x: number; w: number; black: boolean }[] = [];
  let cursor = 0;
  const unit = width / (src.length * 7);

  Array.from(src).forEach((c) => {
    const code = c.charCodeAt(0);
    const mods = [
      (code >> 4) & 1 ? 3 : 1,
      (code >> 3) & 1 ? 1 : 2,
      (code >> 2) & 1 ? 2 : 1,
      (code >> 1) & 1 ? 1 : 3,
      code & 1 ? 2 : 1,
      1, 1,
    ];
    mods.forEach((m, i) => {
      const bw = Math.max(m * unit, 0.8);
      segments.push({ x: cursor, w: bw, black: i % 2 === 0 });
      cursor += bw;
    });
  });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${cursor} ${height}`} preserveAspectRatio="none">
      {segments.filter(s => s.black).map((s, i) => (
        <Rect key={i} x={s.x} y={0} width={s.w} height={height} fill={color} />
      ))}
    </Svg>
  );
}

// ─── Ticket field row ─────────────────────────────────────────────────────────
function TField({ label, value, icon, gold }: {
  label: string; value?: string | null; icon?: string; gold?: boolean;
}) {
  const display = value?.trim() ? value.trim() : 'غير متوفر';
  const empty   = !value?.trim();
  return (
    <View style={tf.row}>
      <View style={tf.labelWrap}>
        {icon && <Ionicons name={icon as any} size={11} color="#99AABB" />}
        <Text style={tf.label}>{label}</Text>
      </View>
      <Text style={[tf.value, gold && tf.gold, empty && tf.empty]}>{display}</Text>
    </View>
  );
}
const tf = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#EEF0F6',
  },
  labelWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  label: { fontFamily: 'Tajawal_400Regular', fontSize: 11, color: '#778899' },
  value: { fontFamily: 'Tajawal_700Bold', fontSize: 12, color: '#1A2035', flex: 1, textAlign: 'left', marginRight: 12 },
  gold: { color: GOLD, letterSpacing: 1, fontFamily: 'Tajawal_800ExtraBold' },
  empty: { color: '#C0C8D4', fontFamily: 'Tajawal_400Regular', fontStyle: 'italic' },
});

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionTitle({ title, icon, color = GOLD }: { title: string; icon: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: color + '33', marginBottom: 4 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color + '18', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={14} color={color} />
      </View>
      <Text style={{ fontFamily: 'Tajawal_800ExtraBold', fontSize: 13, color: '#1A2035' }}>{title}</Text>
    </View>
  );
}

// ─── Countdown Banner ─────────────────────────────────────────────────────────
function HoldCountdownBanner({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setLabel('انتهت المدة'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setLabel(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const diff   = new Date(expiresAt).getTime() - Date.now();
  const expired = diff <= 0;
  const warning = !expired && diff < 2 * 3_600_000;
  const col    = expired ? '#EF4444' : warning ? '#F59E0B' : '#F97316';

  return (
    <View style={{ backgroundColor: col + '12', borderRadius: 16, borderWidth: 1.5, borderColor: col + '35', padding: 16, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: expired ? 0 : 10 }}>
        <Ionicons name={expired ? 'alert-circle' : 'timer'} size={20} color={col} />
        <Text style={{ color: col, fontFamily: 'Tajawal_700Bold', fontSize: 14 }}>
          {expired ? 'انتهت مدة الحجز المؤقت' : 'الوقت المتبقي لإتمام الدفع'}
        </Text>
      </View>
      {!expired && (
        <>
          <Text style={{ color: col, fontFamily: 'Tajawal_800ExtraBold', fontSize: 34, textAlign: 'center', letterSpacing: 4, fontVariant: ['tabular-nums'] }}>
            {label}
          </Text>
          <Text style={{ color: col + 'BB', fontFamily: 'Tajawal_400Regular', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
            ينتهي في: {new Date(expiresAt).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        </>
      )}
      {expired && (
        <Text style={{ color: col + 'BB', fontFamily: 'Tajawal_400Regular', fontSize: 12, textAlign: 'right', marginTop: 4 }}>
          تعذر إتمام الدفع في الوقت المحدد. يرجى إنشاء حجز جديد.
        </Text>
      )}
    </View>
  );
}

// ─── PDF HTML Builder ─────────────────────────────────────────────────────────
function buildTicketHtml(booking: any, segments: any[], offer: any, departStr: string, arriveStr: string): string {
  const logoDataUrl = COMPANY_LOGO_BASE64;
  const pnr          = booking.bookingReference ?? '—';
  const isConfirmedDoc = isConfirmed(booking.status);
  const docTitle     = isConfirmedDoc ? 'التذكرة الإلكترونية · ELECTRONIC TICKET' : 'تأكيد الحجز المؤقت · TEMPORARY BOOKING CONFIRMATION';
  const statusColor  = STATUS_COLORS[booking.status] ?? '#888';
  const statusLabel  = STATUS_LABELS[booking.status] ?? booking.status;

  const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const issueTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const segsToRender = (segments && segments.length > 0)
    ? segments
    : [{ fromAirport: offer.fromAirport, fromAirportName: '', fromCity: '', toAirport: offer.toAirport, toAirportName: '', toCity: '', departTime: departStr, arriveTime: arriveStr, airlineName: offer.airlineName, flightNumber: offer.flightNumber, aircraft: '', durationMinutes: offer.durationMinutes, cabinClass: offer.cabinClass }];

  const segHtml = segsToRender.map((s: any, idx: number) => {
    const depDt  = typeof s.departTime === 'string' ? s.departTime : (s.departTime as any)?.toISOString?.() ?? '';
    const arrDt  = typeof s.arriveTime === 'string' ? s.arriveTime : (s.arriveTime as any)?.toISOString?.() ?? '';
    const depTime = formatTime(depDt);
    const arrTime = formatTime(arrDt);
    const depDate = dayFull(depDt.slice(0, 10));
    const arrDate = dayFull(arrDt.slice(0, 10));
    const dur    = s.durationMinutes ? formatDuration(s.durationMinutes) : '—';
    const cabin  = CABIN_LABELS_AR[s.cabinClass ?? ''] ?? (s.cabinClass ?? offer.cabinClass ?? '—');
    const airline = s.airlineName ?? offer.airlineName ?? '—';
    const flNum  = s.flightNumber ?? offer.flightNumber ?? '—';
    const fromName = s.fromAirportName ?? s.fromAirport;
    const toName   = s.toAirportName ?? s.toAirport;
    const fromCity = s.fromCity ? `<br><span style="font-size:10px;color:#888">${s.fromCity}</span>` : '';
    const toCity   = s.toCity   ? `<br><span style="font-size:10px;color:#888">${s.toCity}</span>` : '';
    const isNonstop = segsToRender.length === 1 && idx === 0;
    const confColor = isConfirmedDoc ? '#059669' : '#F97316';
    const confText  = isConfirmedDoc ? 'Confirmed' : 'Pending';

    const airlineLogoUrl = s.airlineLogoUrl ?? offer.airlineLogoUrl ?? '';

    // Simple SVG barcode for PDF
    const barVal = pnr.padEnd(20, '0').slice(0, 20);
    const bw = 2;
    let bx = 0;
    const bars: string[] = [];
    Array.from(barVal as string).forEach((c: string) => {
      const code = c.charCodeAt(0);
      [3,1,2,1,3,1,1].forEach((m, i) => {
        const bww = (i % 2 === 0 ? (code >> (4 - Math.min(i, 4)) & 1 ? 3 : 1) : 1) * bw;
        if (i % 2 === 0) bars.push(`<rect x="${bx}" y="0" width="${bww}" height="40" fill="#1A2035"/>`);
        bx += bww;
      });
    });
    const barcodeSvg = isConfirmedDoc ? `<svg xmlns="http://www.w3.org/2000/svg" width="${bx}" height="40" viewBox="0 0 ${bx} 40">${bars.join('')}</svg>` : '';

    return `
    <div class="segment-block" ${idx > 0 ? 'style="margin-top:16px"' : ''}>
      <div class="seg-date-bar">${depDate}</div>
      <div class="seg-inner">
        <!-- Airline row -->
        <div class="seg-airline-row">
          <div class="airline-icon">
            ${airlineLogoUrl
              ? `<img src="${airlineLogoUrl}" class="airline-logo-img" alt="${airline}" onerror="this.style.display='none';this.parentNode.innerHTML='✈'" />`
              : '✈'}
          </div>
          <div class="airline-info">
            <span class="airline-name">${airline}</span>
            <span class="flight-num">${flNum}</span>
          </div>
          <div class="seg-badge" style="background:${confColor}18;color:${confColor};border:1px solid ${confColor}44">${confText}</div>
        </div>
        <!-- Route -->
        <div class="route-grid">
          <div class="port-dep">
            <div class="port-time">${depTime}</div>
            <div class="port-date">${depDate.split('،')[1]?.trim() ?? depDate}</div>
            <div class="port-code">${s.fromAirport ?? '—'}</div>
            <div class="port-name">${fromName}${fromCity}</div>
          </div>
          <div class="route-mid">
            <div class="route-arrow">────── ✈ ──────</div>
            <div class="route-dur">${dur}</div>
            ${isNonstop ? '<div class="route-nonstop">Non-stop</div>' : ''}
          </div>
          <div class="port-arr">
            <div class="port-time">${arrTime}</div>
            <div class="port-date">${arrDate.split('،')[1]?.trim() ?? arrDate}</div>
            <div class="port-code">${s.toAirport ?? '—'}</div>
            <div class="port-name">${toName}${toCity}</div>
          </div>
        </div>
        <!-- Details strip -->
        <div class="details-strip">
          <div class="det-item"><span class="det-label">Cabin Class</span><span class="det-val">${cabin}</span></div>
          ${s.aircraft ? `<div class="det-item"><span class="det-label">Aircraft</span><span class="det-val">${s.aircraft}</span></div>` : ''}
          <div class="det-item"><span class="det-label">Duration</span><span class="det-val">${dur}</span></div>
          <div class="det-item"><span class="det-label">Status</span><span class="det-val" style="color:${confColor}">${confText}</span></div>
          <div class="det-item"><span class="det-label">Seat</span><span class="det-val">${(offer as any).seat ?? 'غير متوفر'}</span></div>
          <div class="det-item"><span class="det-label">Gate</span><span class="det-val">${(offer as any).gate ?? '—'}</span></div>
          <div class="det-item"><span class="det-label">Terminal</span><span class="det-val">${(offer as any).terminal ?? '—'}</span></div>
          <div class="det-item"><span class="det-label">Boarding</span><span class="det-val">${(offer as any).boardingTime ?? '—'}</span></div>
        </div>
        ${isConfirmedDoc ? `
        <!-- Barcode -->
        <div class="barcode-wrap">
          ${barcodeSvg}
          <div style="font-size:9px;color:#999;margin-top:4px;letter-spacing:2px;font-family:monospace">${pnr}</div>
          <div style="font-size:9px;color:#AAA;margin-top:2px">Scan this code at the airport</div>
        </div>` : ''}
      </div>
    </div>`;
  }).join('');

  const passengerHtml = booking.passengers.map((p: any, i: number) => {
    const eTicket = (p as any).eTicketNumber ?? booking.eticketNumbers?.[i] ?? '—';
    const nat     = codeToEnglishName(p.nationality ?? '');
    const dob     = p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-GB') : '—';
    const gender  = GENDER_MAP[p.gender ?? ''] ?? p.gender ?? '—';
    return `
    <div class="pax-card" ${i > 0 ? 'style="margin-top:10px"' : ''}>
      <div class="pax-header">
        <span class="pax-num">${i + 1}</span>
        <div class="pax-name-block">
          <span class="pax-name">${p.firstName ?? ''} ${p.lastName ?? ''}</span>
          <span class="pax-type">${p.type ?? 'Adult'}</span>
        </div>
        ${eTicket !== '—' ? `<span class="pax-eticket">Ticket: ${eTicket}</span>` : ''}
      </div>
      <div class="pax-grid">
        <div class="pax-field"><span class="pax-fl">Passport No.</span><span class="pax-fv">${p.passportNumber ?? '—'}</span></div>
        <div class="pax-field"><span class="pax-fl">Nationality</span><span class="pax-fv">${nat || '—'}</span></div>
        <div class="pax-field"><span class="pax-fl">Date of Birth</span><span class="pax-fv">${dob}</span></div>
        <div class="pax-field"><span class="pax-fl">Gender</span><span class="pax-fv">${gender}</span></div>
        <div class="pax-field"><span class="pax-fl">Passport Expiry</span><span class="pax-fv">${p.passportExpiry ? new Date(p.passportExpiry).toLocaleDateString('en-GB') : '—'}</span></div>
        <div class="pax-field"><span class="pax-fl">Fare Basis</span><span class="pax-fv">${p.fareBasis ?? (offer as any).fareBasis ?? '—'}</span></div>
      </div>
    </div>`;
  }).join('');

  const baggage  = (offer as any).baggage ?? booking.baggage ?? '—';
  const numBags  = (offer as any).numberOfBags ?? '—';
  const isTemp   = isTemporary(booking.status);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Electronic_Ticket_${pnr}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:15mm 12mm}
body{
  font-family:Tahoma,'Segoe UI Arabic','Arial Unicode MS',Arial,Helvetica,sans-serif;
  background:#E8EAF0;color:#1A2035;font-size:13px;
  print-color-adjust:exact;-webkit-print-color-adjust:exact;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.page{max-width:780px;margin:0 auto;padding:12px}

/* Watermark */
.watermark{
  position:fixed;top:50%;left:50%;
  transform:translate(-50%,-50%) rotate(-42deg);
  font-size:52px;font-weight:900;
  color:rgba(201,160,96,0.055);
  white-space:nowrap;pointer-events:none;z-index:0;font-family:'Cairo',sans-serif;
}

/* Main card */
.doc-card{background:#fff;border-radius:6px;box-shadow:0 2px 20px rgba(0,0,0,0.12);overflow:hidden;margin-bottom:14px;position:relative;z-index:1}

/* Status top bar */
.status-top-bar{
  height:5px;
  background:${isTemp ? 'linear-gradient(90deg,#F97316,#FBBF24)' : 'linear-gradient(90deg,#C9A060,#E8C07A,#C9A060)'};
}

/* ═══════════════════════════════
   HEADER — AIRLINE-GRADE DESIGN
   ═══════════════════════════════ */
.doc-header{
  background:linear-gradient(160deg,#081220 0%,#0D1A2E 55%,#0A1828 100%);
  padding:24px 28px 0;
}
.header-top{
  display:table;width:100%;
  border-collapse:collapse;
}
.company-block{
  display:table-cell;
  vertical-align:top;
  text-align:right;
  direction:rtl;
  padding-bottom:20px;
  width:55%;
}
/* Logo */
.company-logo{
  display:block;height:60px;width:auto;max-width:150px;
  object-fit:contain;margin:0 0 14px auto;
}
/* Arabic company name — primary identity */
.company-name-ar{
  font-family:Tahoma,'Segoe UI Arabic','Arial Unicode MS',Arial,sans-serif;
  font-size:21px;font-weight:bold;
  color:#D4AA6A;
  line-height:1.25;
  display:block;
  margin-bottom:4px;
}
/* English company name */
.company-name-en{
  font-family:Arial,Helvetica,sans-serif;
  font-size:11px;font-weight:bold;
  color:rgba(255,255,255,0.80);
  letter-spacing:1px;
  text-transform:uppercase;
  display:block;
  margin-bottom:14px;
  direction:ltr;
  text-align:right;
}
/* Gold rule separator */
.company-rule{
  display:block;
  width:100%;height:1px;
  background:linear-gradient(to left,#C9A060,rgba(201,160,96,0.1));
  margin-bottom:12px;
}
/* Contact rows — BLOCK layout, NOT flex */
.contact-row{
  display:block;
  font-family:Arial,Helvetica,sans-serif;
  font-size:13px;
  font-weight:bold;
  color:#FFFFFF;
  line-height:1.9;
  text-align:right;
  direction:ltr;
  white-space:nowrap;
}
.contact-row-rtl{
  display:block;
  font-family:Tahoma,'Segoe UI Arabic','Arial Unicode MS',Arial,sans-serif;
  font-size:12px;
  font-weight:normal;
  color:rgba(255,255,255,0.85);
  line-height:1.7;
  text-align:right;
  direction:rtl;
}
/* Meta block (right side — PNR area) */
.doc-meta{
  display:table-cell;
  vertical-align:top;
  text-align:left;
  direction:ltr;
  padding-bottom:20px;
  width:45%;
}
.doc-type-label{
  font-family:Arial,Helvetica,sans-serif;
  font-size:9px;color:rgba(255,255,255,0.40);
  text-transform:uppercase;letter-spacing:0.8px;
  margin-bottom:4px;display:block;
}
.doc-type-val{
  display:block;
  font-family:Arial,Helvetica,sans-serif;
  font-size:13px;font-weight:bold;
  color:${isTemp ? '#F97316' : '#C9A060'};
  margin-bottom:12px;letter-spacing:0.3px;
}
.pnr-label{
  display:block;
  font-family:Arial,Helvetica,sans-serif;
  font-size:9px;color:rgba(255,255,255,0.40);
  text-transform:uppercase;letter-spacing:0.8px;
}
.pnr-val{
  display:block;
  font-family:'Courier New',Courier,monospace;
  font-size:26px;font-weight:bold;
  color:#FFFFFF;letter-spacing:5px;line-height:1.1;
  margin:2px 0 8px;
}
.status-badge{
  display:inline-block;margin-top:4px;
  padding:4px 12px;border-radius:20px;
  font-family:Arial,Helvetica,sans-serif;
  font-size:10px;font-weight:bold;
  background:${statusColor}28;color:${statusColor};
  border:1px solid ${statusColor}60;
  letter-spacing:0.3px;
}

/* Traveler strip */
.traveler-strip{
  display:flex;justify-content:space-between;align-items:center;
  padding:10px 24px;background:rgba(255,255,255,0.04);
  border-top:1px solid rgba(255,255,255,0.06);
}
.trav-label{font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}
.trav-name{font-size:15px;font-weight:700;color:#fff}
.trav-count{font-size:9px;color:rgba(255,255,255,0.4);margin-top:2px}
.issue-val{font-size:10px;color:rgba(255,255,255,0.55);text-align:left}

/* Segments area */
.segments-area{padding:16px 20px;background:#F7F8FC}

/* Segment block */
.segment-block{}
.seg-date-bar{
  background:#0B1628;padding:7px 16px;
  font-size:11px;font-weight:700;color:rgba(255,255,255,0.65);
  border-radius:6px 6px 0 0;direction:rtl;
}
.seg-inner{background:#fff;border:1px solid #DDE1ED;border-top:none;border-radius:0 0 8px 8px;overflow:hidden}
.seg-airline-row{display:flex;align-items:center;gap:12px;padding:12px 16px 10px;border-bottom:1px solid #F0F2F8;direction:ltr}
.airline-icon{width:40px;height:40px;background:#0B1628;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#C9A060;flex-shrink:0;overflow:hidden;font-size:18px}
.airline-logo-img{width:36px;height:36px;object-fit:contain;border-radius:6px}
.airline-info{flex:1}
.airline-name{display:block;font-size:14px;font-weight:700;color:#1A2035}
.flight-num{display:block;font-size:11px;color:#888;margin-top:2px}
.seg-badge{margin-left:auto;border-radius:20px;padding:3px 12px;font-size:10px;font-weight:700}

/* Route grid */
.route-grid{display:flex;align-items:center;padding:18px 16px;gap:12px;direction:ltr}
.port-dep,.port-arr{flex:1}
.port-arr{text-align:right}
.port-time{font-size:32px;font-weight:900;color:#0B1628;line-height:1;font-family:'Cairo',monospace}
.port-date{font-size:10px;color:#888;margin:3px 0}
.port-code{font-size:14px;font-weight:700;color:#C9A060;letter-spacing:1px}
.port-name{font-size:10px;color:#666;margin-top:2px;max-width:160px}
.route-mid{flex:0 0 120px;text-align:center}
.route-arrow{font-size:11px;color:#C9A060;margin-bottom:4px}
.route-dur{font-size:12px;font-weight:700;color:#444}
.route-nonstop{font-size:9px;color:#AAA;margin-top:3px}

/* Details strip */
.details-strip{display:flex;flex-wrap:wrap;border-top:1px solid #F0F2F8;background:#FAFBFD;direction:ltr}
.det-item{flex:0 0 25%;padding:8px 14px;border-right:1px solid #F0F2F8;border-bottom:1px solid #F0F2F8}
.det-item:nth-child(4n){border-right:none}
.det-label{display:block;font-size:8px;color:#AAA;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}
.det-val{display:block;font-size:11px;font-weight:700;color:#333}

/* Barcode */
.barcode-wrap{padding:12px 16px;border-top:1px solid #F0F2F8;text-align:center;background:#FCFCFD}

/* Passengers */
.pax-section{padding:0 20px 16px;background:#F7F8FC}
.section-title{
  font-size:11px;font-weight:700;color:#C9A060;text-transform:uppercase;letter-spacing:0.8px;
  padding:14px 0 8px;border-bottom:2px solid #C9A060;margin-bottom:10px;
}
.pax-card{background:#fff;border:1px solid #DDE1ED;border-radius:8px;overflow:hidden}
.pax-header{display:flex;align-items:center;gap:12px;padding:10px 14px;background:#0B1628;direction:ltr}
.pax-num{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#C9A060;color:#0B1628;font-size:11px;font-weight:900;flex-shrink:0}
.pax-name-block{flex:1}
.pax-name{display:block;font-size:14px;font-weight:700;color:#fff}
.pax-type{display:block;font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px}
.pax-eticket{font-size:10px;color:#C9A060;font-family:monospace;letter-spacing:1px;font-weight:700}
.pax-grid{display:flex;flex-wrap:wrap;direction:ltr}
.pax-field{flex:0 0 50%;padding:8px 14px;border-right:1px solid #F0F2F8;border-bottom:1px solid #F0F2F8}
.pax-field:nth-child(2n){border-right:none}
.pax-fl{display:block;font-size:9px;color:#AAA;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:3px}
.pax-fv{display:block;font-size:12px;font-weight:700;color:#333}

/* Booking summary */
.summary-section{padding:0 20px 16px;background:#F7F8FC}
.summary-grid{background:#fff;border:1px solid #DDE1ED;border-radius:8px;overflow:hidden;direction:ltr}
.sum-row{display:flex;padding:9px 14px;border-bottom:1px solid #F0F2F8;align-items:center}
.sum-row:last-child{border-bottom:none}
.sum-label{flex:0 0 200px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.4px}
.sum-val{flex:1;font-size:12px;font-weight:700;color:#1A2035}
.sum-val-gold{color:#C9A060;font-family:monospace;letter-spacing:2px;font-size:14px;font-weight:900}

/* Baggage */
.baggage-section{padding:0 20px 14px;background:#F7F8FC}
.baggage-card{background:#fff;border:1px solid #DDE1ED;border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:14px;direction:ltr}
.bag-icon{font-size:22px}
.bag-info{}
.bag-main{font-size:14px;font-weight:700;color:#1A2035}
.bag-sub{font-size:11px;color:#888;margin-top:2px}

/* Notes */
.notes-section{padding:12px 20px 16px;background:#fff;border-top:1px solid #EEF0F6}
.notes-title{font-size:11px;font-weight:700;color:#555;margin-bottom:8px;direction:rtl}
.note{font-size:10px;color:#777;line-height:1.8;direction:rtl;padding:2px 0}

/* Footer */
.doc-footer{background:#0B1628;padding:14px 24px;display:flex;justify-content:space-between;align-items:center;direction:ltr}
.footer-company{font-size:11px;color:#C9A060;font-weight:700}
.footer-sub{font-size:9px;color:rgba(255,255,255,0.3);margin-top:3px}
.footer-disc{font-size:8px;color:rgba(255,255,255,0.2);max-width:380px;line-height:1.6;text-align:right}

/* Temporary booking notice */
.temp-notice{
  background:#FFF7ED;border:1.5px solid #F97316;border-radius:8px;
  padding:12px 16px;margin:0 20px 14px;
  font-size:12px;color:#C05702;direction:rtl;font-weight:600;
  text-align:center;
}

@media print{
  body{background:white;padding:0}
  .doc-card{box-shadow:none}
  .page{padding:0;max-width:100%}
}
</style>
</head>
<body>
<div class="watermark">${COMPANY_AR}</div>
<div class="page">
<div class="doc-card">

  <!-- Status bar -->
  <div class="status-top-bar"></div>

  <!-- Header -->
  <div class="doc-header">
    <div class="header-top">
      <!-- Company block — system fonts, block layout, high-contrast text -->
      <div class="company-block">
        <img src="${logoDataUrl}" class="company-logo" alt="Qema"/>
        <span class="company-name-ar">${COMPANY_AR}</span>
        <span class="company-name-en">${COMPANY_EN}</span>
        <span class="company-rule"></span>
        <span class="contact-row">&#128222; ${COMPANY_PHONE} &nbsp;|&nbsp; ${COMPANY_PHONE2}</span>
        <span class="contact-row">&#9993; ${COMPANY_EMAIL}</span>
        <span class="contact-row-rtl">&#128205; ${COMPANY_CITY}</span>
      </div>
      <div class="doc-meta">
        <div class="doc-type-label">Document Type</div>
        <div class="doc-type-val">${isTemp ? 'TEMPORARY BOOKING' : 'ELECTRONIC TICKET'}</div>
        <div class="pnr-label">Booking Reference / PNR</div>
        <div class="pnr-val">${pnr}</div>
        <div class="status-badge">${statusLabel}</div>
        <div style="margin-top:10px">
          <div class="pnr-label">Booking No.</div>
          <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);margin-top:2px">${booking.referenceNumber ?? '—'}</div>
        </div>
      </div>
    </div>

    <div class="traveler-strip">
      <div>
        <div class="trav-label">Passenger / المسافر</div>
        <div class="trav-name">${booking.passengers[0] ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}` : '—'}</div>
        ${booking.passengers.length > 1 ? `<div class="trav-count">+ ${booking.passengers.length - 1} other passenger(s)</div>` : ''}
      </div>
      <div style="text-align:left">
        <div class="trav-label">Issue Date</div>
        <div class="issue-val">${issueDate} · ${issueTime}</div>
      </div>
    </div>
  </div>

  <!-- Segments -->
  <div class="segments-area">
    ${segHtml}
  </div>

  ${isTemp ? `<div class="temp-notice">⚠ هذا حجز مؤقت — يرجى إتمام الدفع لإصدار التذكرة الإلكترونية النهائية<br>This is a temporary booking — please complete payment to issue the final e-ticket</div>` : ''}

  <!-- Passengers -->
  <div class="pax-section">
    <div class="section-title">Passenger Details / بيانات المسافرين</div>
    ${passengerHtml}
  </div>

  <!-- Baggage -->
  ${baggage !== '—' || numBags !== '—' ? `
  <div class="baggage-section">
    <div class="section-title">Baggage Allowance / وزن الأمتعة</div>
    <div class="baggage-card">
      <span class="bag-icon">🧳</span>
      <div class="bag-info">
        <div class="bag-main">${baggage}</div>
        ${numBags !== '—' ? `<div class="bag-sub">${numBags} piece(s) per passenger</div>` : ''}
      </div>
    </div>
  </div>` : ''}

  <!-- Summary -->
  <div class="summary-section">
    <div class="section-title">Booking Summary / ملخص الحجز</div>
    <div class="summary-grid">
      <div class="sum-row"><span class="sum-label">Booking Reference (PNR)</span><span class="sum-val sum-val-gold">${pnr}</span></div>
      ${booking.eticketNumbers?.length ? `<div class="sum-row"><span class="sum-label">Ticket Number</span><span class="sum-val sum-val-gold">${booking.eticketNumbers.join(' / ')}</span></div>` : ''}
      <div class="sum-row"><span class="sum-label">Booking No.</span><span class="sum-val">${booking.referenceNumber ?? '—'}</span></div>
      <div class="sum-row"><span class="sum-label">Airline</span><span class="sum-val">${offer.airlineName ?? '—'}</span></div>
      <div class="sum-row"><span class="sum-label">Flight Number</span><span class="sum-val">${offer.flightNumber ?? '—'}</span></div>
      <div class="sum-row"><span class="sum-label">Cabin Class</span><span class="sum-val">${CABIN_LABELS_AR[offer.cabinClass ?? ''] ?? (offer.cabinClass ?? '—')}</span></div>
      <div class="sum-row"><span class="sum-label">Status</span><span class="sum-val" style="color:${statusColor};font-weight:700">${statusLabel}</span></div>
      <div class="sum-row"><span class="sum-label">Issue Date</span><span class="sum-val">${issueDate}</span></div>
    </div>
  </div>

  <!-- Notes -->
  <div class="notes-section">
    <div class="notes-title">معلومات مهمة / Important Information</div>
    <div class="note">• يرجى الحضور إلى المطار قبل موعد الإقلاع بساعتين على الأقل للرحلات الدولية.</div>
    <div class="note">• Please check airline's check-in procedures and baggage policy for this itinerary.</div>
    <div class="note">• هذه التذكرة شخصية وغير قابلة للتحويل · This ticket is non-transferable.</div>
    <div class="note">• تأكد من صلاحية جواز سفرك قبل السفر · Ensure your passport is valid before travel.</div>
    <div class="note">• للاستفسار والمساعدة: ${COMPANY_PHONE} · ${COMPANY_PHONE2} · ${COMPANY_EMAIL}</div>
  </div>

  <!-- Footer -->
  <div class="doc-footer">
    <div>
      <div class="footer-company">${COMPANY_AR}</div>
      <div class="footer-company" style="font-size:9px;font-weight:600;margin-top:2px">${COMPANY_EN}</div>
      <div class="footer-sub">${COMPANY_PHONE} &nbsp;·&nbsp; ${COMPANY_PHONE2} &nbsp;·&nbsp; ${COMPANY_EMAIL}</div>
      <div class="footer-sub">${COMPANY_CITY}</div>
    </div>
    <div class="footer-disc">
      تم إصدار هذه التذكرة الإلكترونية بواسطة شركة قمة النظائر للسفريات والسياحة، وهي وثيقة إلكترونية معتمدة. لأي استفسارات أو دعم أو تعديل على الحجز، يرجى التواصل معنا عبر أرقام الهاتف أو البريد الإلكتروني أو زيارة مقر الشركة.<br/>
      This electronic ticket has been officially issued by QEMA AL-NAZAER FOR TRAVEL &amp; TOURISM. For inquiries, support, or booking modifications, please contact us using the phone numbers or email listed above.
    </div>
  </div>

</div><!-- /doc-card -->
</div><!-- /page -->
</body>
</html>`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ETicketScreen() {
  const colors      = useColors();
  const insets      = useSafeAreaInsets();
  const { id }      = useLocalSearchParams<{ id: string }>();
  const paddingTop  = Platform.OS === 'web' ? 67 : insets.top;
  const [exporting, setExporting]   = useState(false);
  const [completing, setCompleting] = useState(false);

  // Fade-in animation
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const completeMutation = useCompleteHoldBooking();
  const bookingId        = Number(id);
  const { data: booking, isLoading, isError, refetch } = useGetFlightBooking(bookingId, {
    query: {
      enabled: !!bookingId && !isNaN(bookingId),
      queryKey: getGetFlightBookingQueryKey(bookingId),
    },
  });

  useEffect(() => {
    if (booking) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start();
    }
  }, [!!booking]);

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 14 }]}>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 14 }}>
          جاري تحميل التذكرة...
        </Text>
      </View>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (isError || !booking) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 18 }]}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#EF444418', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        </View>
        <Text style={{ color: colors.foreground, fontFamily: 'Tajawal_700Bold', fontSize: 16 }}>تعذر تحميل التذكرة</Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular', fontSize: 13 }}>يرجى التحقق من اتصالك بالإنترنت</Text>
        <TouchableOpacity onPress={() => refetch()} style={[styles.outlineBtn, { borderColor: GOLD }]}>
          <Ionicons name="refresh" size={16} color={GOLD} />
          <Text style={{ color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 14 }}>إعادة المحاولة</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={[styles.outlineBtn, { borderColor: colors.border }]}>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 14 }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Data Extraction ─────────────────────────────────────────────────────────
  const offer       = booking.offer as any;
  const segments    = (booking.segments ?? []) as any[];
  const seg0        = segments[0];
  const departStr   = typeof offer.departTime === 'string' ? offer.departTime : (offer.departTime as any)?.toISOString?.() ?? '';
  const arriveStr   = typeof offer.arriveTime === 'string' ? offer.arriveTime : (offer.arriveTime as any)?.toISOString?.() ?? '';
  const fromAirport = seg0?.fromAirport ?? offer.fromAirport ?? '—';
  const toAirport   = seg0?.toAirport ?? offer.toAirport ?? '—';
  const fromCity    = seg0?.fromCity ?? '';
  const toCity      = seg0?.toCity ?? '';
  const fromAirportName = seg0?.fromAirportName ?? fromAirport;
  const toAirportName   = seg0?.toAirportName ?? toAirport;
  const aircraft    = seg0?.aircraft ?? offer.aircraft ?? '';
  const qrValue     = booking.bookingReference ?? booking.referenceNumber ?? String(booking.id);
  const pnr         = booking.bookingReference ?? booking.referenceNumber ?? '—';
  const statusColor = STATUS_COLORS[booking.status] ?? '#888';
  const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;
  const isTemp      = isTemporary(booking.status);
  const isConf      = isConfirmed(booking.status);
  const ticketColor = isTemp ? '#F97316' : isConf ? '#10B981' : '#3B82F6';
  const ticketDocLabel = isTemp ? 'حجز مؤقت · TEMPORARY BOOKING' : isConf ? 'تذكرة إلكترونية · ELECTRONIC TICKET' : 'قيد الانتظار · PENDING';

  const firstPax = booking.passengers[0] as any;
  const passengerName = firstPax ? `${firstPax.firstName} ${firstPax.lastName}` : '—';
  const holdExpiresStr = booking.holdExpiresAt
    ? (typeof booking.holdExpiresAt === 'string' ? booking.holdExpiresAt : (booking.holdExpiresAt as any)?.toISOString?.() ?? '')
    : '';

  // ─── PDF Export ──────────────────────────────────────────────────────────────
  async function handleExportPDF() {
    const html     = buildTicketHtml(booking, segments, offer, departStr, arriveStr);
    const filename = `Electronic_Ticket_${pnr}.pdf`;

    if (Platform.OS === 'web') {
      // Use hidden iframe to print without opening a new tab
      try {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;';
        document.body.appendChild(iframe);
        const win = iframe.contentWindow!;
        win.document.open();
        win.document.write(html);
        win.document.title = filename;
        win.document.close();
        setTimeout(() => {
          win.focus();
          win.print();
          setTimeout(() => document.body.removeChild(iframe), 3000);
        }, 600);
      } catch {
        window.print();
      }
      return;
    }

    setExporting(true);
    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      // Rename to proper filename
      const dir     = FileSystem.documentDirectory ?? '';
      const newUri  = dir + filename;
      try { await FileSystem.deleteAsync(newUri, { idempotent: true }); } catch {}
      await FileSystem.moveAsync({ from: uri, to: newUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: filename,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('تم الحفظ', `تم حفظ التذكرة:\n${newUri}`);
      }
    } catch (e: any) {
      Alert.alert('خطأ في التصدير', e?.message ?? 'تعذر تصدير التذكرة');
    } finally {
      setExporting(false);
    }
  }

  // ─── Complete Payment ────────────────────────────────────────────────────────
  async function handleCompletePayment() {
    Alert.alert(
      'إتمام الدفع وإصدار التذكرة',
      `سيتم تحويل حجزك إلى طور الدفع وإشعار فريقنا لإصدار التذكرة الإلكترونية النهائية.\n\nالرحلة: ${fromAirport} ← ${toAirport}\nالمبلغ: ${offer.price ?? '—'} ${offer.currency ?? ''}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد الدفع',
          onPress: async () => {
            setCompleting(true);
            try {
              await completeMutation.mutateAsync({ id: booking!.id });
              Alert.alert(
                '✅ تم استلام طلب الدفع',
                'تم تحويل حجزك إلى قيد الانتظار. سيقوم فريقنا بالتواصل معك لإتمام عملية الدفع وإصدار التذكرة الإلكترونية.',
                [{ text: 'حسناً', onPress: () => refetch() }],
              );
            } catch (e: any) {
              const msg = e?.data?.error ?? e?.message ?? 'حدث خطأ غير متوقع';
              Alert.alert('فشلت عملية الدفع', `${msg}\n\nلا يزال الحجز مؤقتاً، يرجى إعادة المحاولة.`, [{ text: 'حسناً' }]);
            } finally {
              setCompleting(false);
            }
          },
        },
      ],
    );
  }

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: paddingTop + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>التذكرة الإلكترونية</Text>
          <View style={[styles.headerBadge, { backgroundColor: ticketColor + '18', borderColor: ticketColor + '44' }]}>
            <Text style={[styles.headerBadgeText, { color: ticketColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleExportPDF} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={22} color={GOLD} />
        </TouchableOpacity>
      </View>

      {/* ── Scroll Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 14, paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 110 }}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Hold countdown ── */}
          {booking.status === 'held' && holdExpiresStr && (
            <HoldCountdownBanner expiresAt={holdExpiresStr} />
          )}

          {/* ════════ MAIN TICKET CARD ════════ */}
          <View style={styles.ticketCard}>

            {/* Status accent bar */}
            <View style={[styles.ticketAccentBar, { backgroundColor: ticketColor }]} />

            {/* Document type strip */}
            <View style={[styles.docTypeStrip, { borderBottomColor: ticketColor + '30' }]}>
              <Ionicons name={isConf ? 'checkmark-circle' : isTemp ? 'time' : 'hourglass'} size={15} color={ticketColor} />
              <Text style={[styles.docTypeText, { color: ticketColor }]}>{ticketDocLabel}</Text>
            </View>

            {/* Company header — pure real text, no images */}
            <View style={styles.companyHeader}>
              {/* Gold accent bar */}
              <View style={styles.companyAccentBar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.companyAr}>{COMPANY_AR}</Text>
                <Text style={styles.companyEn}>{COMPANY_EN}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                <Text style={styles.pnrLabel}>PNR / رقم الحجز</Text>
                <Text style={styles.pnrValue}>{pnr}</Text>
              </View>
            </View>

            {/* Traveler strip */}
            <View style={styles.travelerStrip}>
              <View>
                <Text style={styles.travelerLabel}>TRAVELER / المسافر</Text>
                <Text style={styles.travelerName}>{passengerName}</Text>
                {booking.passengers.length > 1 && (
                  <Text style={styles.travelerCount}>+{booking.passengers.length - 1} مسافر آخر</Text>
                )}
              </View>
              <View style={[styles.issueDateBlock]}>
                <Text style={styles.travelerLabel}>ISSUED</Text>
                <Text style={styles.issueDateText}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</Text>
              </View>
            </View>

            {/* Perforation */}
            <View style={styles.perforation}>
              <View style={[styles.halfCircle, { left: -13 }]} />
              <View style={styles.dashedLine} />
              <View style={[styles.halfCircle, { right: -13, transform: [{ scaleX: -1 }] }]} />
            </View>

            {/* Flight segments */}
            {(segments.length > 0 ? segments : [{
              fromAirport, toAirport, fromCity, toCity,
              fromAirportName, toAirportName,
              departTime: departStr, arriveTime: arriveStr,
              airlineName: offer.airlineName, flightNumber: offer.flightNumber,
              aircraft, durationMinutes: offer.durationMinutes, cabinClass: offer.cabinClass,
            }]).map((seg: any, idx: number) => {
              const depStr2 = typeof seg.departTime === 'string' ? seg.departTime : seg.departTime?.toISOString?.() ?? '';
              const arrStr2 = typeof seg.arriveTime === 'string' ? seg.arriveTime : seg.arriveTime?.toISOString?.() ?? '';
              const depTime = formatTime(depStr2);
              const arrTime = formatTime(arrStr2);
              const depDate = dayFull(depStr2.slice(0, 10));
              const dur     = seg.durationMinutes ? formatDuration(seg.durationMinutes) : '—';
              const cabin   = CABIN_LABELS_AR[seg.cabinClass ?? ''] ?? seg.cabinClass ?? offer.cabinClass ?? '—';

              return (
                <View key={idx} style={[styles.segBlock, idx > 0 && { borderTopWidth: 1, borderTopColor: '#EEF0F6' }]}>
                  {/* Date label */}
                  <View style={styles.segDateRow}>
                    <Ionicons name="calendar-outline" size={12} color={GOLD} />
                    <Text style={styles.segDateText}>{depDate}</Text>
                  </View>

                  {/* Airline info */}
                  <View style={styles.airlineRow}>
                    <View style={styles.airlineIconBox}>
                      {offer.airlineLogoUrl ? (
                        <Image source={{ uri: offer.airlineLogoUrl }} style={{ width: 28, height: 28 }} contentFit="contain" />
                      ) : (
                        <Ionicons name="airplane" size={16} color={GOLD} />
                      )}
                    </View>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.airlineName}>{seg.airlineName ?? offer.airlineName ?? '—'}</Text>
                      <Text style={styles.flightNum}>{seg.flightNumber ?? offer.flightNumber ?? '—'}</Text>
                    </View>
                    <View style={[styles.segStatusChip, { backgroundColor: ticketColor + '15', borderColor: ticketColor + '40' }]}>
                      <Text style={[styles.segStatusText, { color: ticketColor }]}>{statusLabel}</Text>
                    </View>
                  </View>

                  {/* Route visual */}
                  <View style={styles.routeRow}>
                    {/* Departure — right side (RTL) */}
                    <View style={styles.routePort}>
                      <Text style={styles.routeTime}>{depTime}</Text>
                      <Text style={styles.routeDateSmall}>{dateShort(depStr2.slice(0, 10))}</Text>
                      <Text style={styles.routeCode}>{seg.fromAirport ?? fromAirport}</Text>
                      <Text style={styles.routePortName} numberOfLines={2}>{seg.fromAirportName ?? seg.fromAirport}</Text>
                      {(seg.fromCity ?? fromCity) ? <Text style={styles.routeCity}>{seg.fromCity ?? fromCity}</Text> : null}
                    </View>

                    {/* Middle */}
                    <View style={styles.routeMid}>
                      <View style={styles.routeLine} />
                      <View style={styles.routePlaneCircle}>
                        <Ionicons name="airplane" size={14} color={GOLD} style={{ transform: [{ rotate: '180deg' }] }} />
                      </View>
                      <View style={styles.routeLine} />
                      <Text style={styles.routeDur}>{dur}</Text>
                      {segments.length === 1 && <Text style={styles.routeNonstop}>Non-stop</Text>}
                    </View>

                    {/* Arrival — left side (RTL) */}
                    <View style={[styles.routePort, { alignItems: 'flex-start' }]}>
                      <Text style={styles.routeTime}>{arrTime}</Text>
                      <Text style={styles.routeDateSmall}>{dateShort(arrStr2.slice(0, 10))}</Text>
                      <Text style={styles.routeCode}>{seg.toAirport ?? toAirport}</Text>
                      <Text style={styles.routePortName} numberOfLines={2}>{seg.toAirportName ?? seg.toAirport}</Text>
                      {(seg.toCity ?? toCity) ? <Text style={styles.routeCity}>{seg.toCity ?? toCity}</Text> : null}
                    </View>
                  </View>

                  {/* Detail chips */}
                  <View style={styles.chipRow}>
                    <View style={styles.chip}>
                      <Ionicons name="ribbon-outline" size={11} color={GOLD} />
                      <Text style={styles.chipText}>{cabin}</Text>
                    </View>
                    {seg.aircraft || aircraft ? (
                      <View style={styles.chip}>
                        <Ionicons name="airplane-outline" size={11} color="#99AABB" />
                        <Text style={styles.chipText}>{seg.aircraft || aircraft}</Text>
                      </View>
                    ) : null}
                    {offer.seat && (
                      <View style={styles.chip}>
                        <Ionicons name="person-outline" size={11} color="#99AABB" />
                        <Text style={styles.chipText}>مقعد {offer.seat}</Text>
                      </View>
                    )}
                    {offer.baggage && (
                      <View style={[styles.chip, { backgroundColor: '#10B98112', borderColor: '#10B98135' }]}>
                        <Ionicons name="bag-handle-outline" size={11} color="#10B981" />
                        <Text style={[styles.chipText, { color: '#10B981' }]}>{offer.baggage}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* ════════ PASSENGER CARD ════════ */}
          <View style={styles.card}>
            <SectionTitle title="بيانات المسافرين" icon="people-outline" color="#60A5FA" />
            {booking.passengers.map((p: any, i: number) => {
              const eTicket = (p as any).eTicketNumber ?? booking.eticketNumbers?.[i];
              const nat     = codeToEnglishName(p.nationality ?? '');
              const dobStr  = p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('ar-EG') : null;
              return (
                <View key={i} style={[i > 0 && { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#EEF0F6' }]}>
                  <View style={styles.paxNameRow}>
                    <View style={[styles.paxNumBadge, { backgroundColor: GOLD }]}>
                      <Text style={styles.paxNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.paxName}>{p.firstName} {p.lastName}</Text>
                  </View>
                  <TField label="رقم التذكرة الإلكترونية" value={eTicket} icon="ticket-outline" gold />
                  <TField label="رقم الجواز"     value={p.passportNumber}   icon="card-outline" gold />
                  <TField label="الجنسية"         value={nat || p.nationality} icon="flag-outline" />
                  <TField label="تاريخ الميلاد"  value={dobStr}              icon="calendar-outline" />
                  <TField label="الجنس"           value={GENDER_MAP[p.gender ?? ''] ?? p.gender} icon="person-outline" />
                  <TField label="رقم الحجز (PNR)" value={pnr}                icon="barcode-outline" gold />
                  <TField label="شركة الطيران"   value={offer.airlineName}   icon="airplane-outline" />
                  <TField label="رقم الرحلة"     value={offer.flightNumber}  icon="navigate-outline" />
                  <TField label="درجة السفر"     value={CABIN_LABELS_AR[offer.cabinClass ?? ''] ?? offer.cabinClass} icon="ribbon-outline" />
                  <TField label="حالة الحجز"     value={statusLabel}         icon="checkmark-circle-outline" />
                  <TField label="رقم المقعد"     value={(offer as any).seat ?? null} icon="person-outline" />
                  <TField label="رقم البوابة"    value={(offer as any).gate ?? null} icon="navigate-circle-outline" />
                  <TField label="مبنى المغادرة"  value={(offer as any).terminal ?? null} icon="business-outline" />
                  <TField label="وقت الصعود"     value={(offer as any).boardingTime ?? null} icon="time-outline" />
                  <TField label="الوزن المسموح"  value={(offer as any).baggage ?? booking.baggage} icon="bag-handle-outline" />
                  <TField label="Fare Basis"      value={(p as any).fareBasis ?? (offer as any).fareBasis} icon="document-text-outline" />
                  <TField label="Cabin Class"     value={offer.cabinClass}    icon="layers-outline" />
                </View>
              );
            })}
          </View>

          {/* ════════ BOOKING SUMMARY ════════ */}
          <View style={styles.card}>
            <SectionTitle title="ملخص الحجز" icon="document-text-outline" color="#A78BFA" />
            <TField label="Booking Reference"         value={pnr}                         gold />
            {booking.eticketNumbers?.length ? (
              <TField label="Ticket Number"           value={booking.eticketNumbers.join(' / ')} gold />
            ) : null}
            <TField label="رقم الطلب الداخلي"        value={booking.referenceNumber} />
            <TField label="Flight Number"             value={offer.flightNumber} />
            <TField label="Airline"                   value={offer.airlineName} />
            <TField label="Cabin Class"               value={offer.cabinClass} />
            <TField label="Status"                    value={statusLabel} />
            <TField label="Issue Date"                value={new Date().toLocaleDateString('ar-SA')} />
          </View>

          {/* ════════ COMPANY CONTACT ════════ */}
          <View style={styles.card}>
            <SectionTitle title="التواصل مع الشركة" icon="call-outline" color={GOLD} />

            {/* Company logo */}
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <Image
                source={require('@/assets/images/logo_transparent.png')}
                style={{ width: 110, height: 60 }}
                contentFit="contain"
              />
            </View>

            {/* Company names */}
            <Text style={{ fontFamily: 'Tajawal_800ExtraBold', fontSize: 14, color: '#1A2035', textAlign: 'center', marginBottom: 2 }}>
              {COMPANY_AR}
            </Text>
            <Text style={{ fontFamily: 'Tajawal_400Regular', fontSize: 10, color: '#99AABB', textAlign: 'center', letterSpacing: 0.4, marginBottom: 14 }}>
              {COMPANY_EN}
            </Text>

            {/* Address */}
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={16} color={GOLD} />
              <Text style={styles.contactText}>{COMPANY_CITY}</Text>
            </View>

            {/* Phone 1 — clickable */}
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${COMPANY_PHONE.replace(/\s/g, '')}`)}>
              <Ionicons name="call-outline" size={16} color={GOLD} />
              <Text style={[styles.contactText, styles.contactLink]}>{COMPANY_PHONE}</Text>
            </TouchableOpacity>

            {/* Phone 2 — clickable */}
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${COMPANY_PHONE2.replace(/\s/g, '')}`)}>
              <Ionicons name="call-outline" size={16} color={GOLD} />
              <Text style={[styles.contactText, styles.contactLink]}>{COMPANY_PHONE2}</Text>
            </TouchableOpacity>

            {/* Email — clickable */}
            <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${COMPANY_EMAIL}`)}>
              <Ionicons name="mail-outline" size={16} color={GOLD} />
              <Text style={[styles.contactText, styles.contactLink]}>{COMPANY_EMAIL}</Text>
            </TouchableOpacity>
          </View>

          {/* ════════ QR + BARCODE (confirmed only) ════════ */}
          {isConf && (
            <View style={[styles.card, styles.qrCard]}>
              <SectionTitle title="رمز الدخول للمطار" icon="qr-code-outline" color="#10B981" />
              <Text style={styles.qrSubtitle}>Scan this code at the airport</Text>
              <View style={styles.qrBarcodeRow}>
                {/* QR Code */}
                <View style={styles.qrBox}>
                  <QRCode value={qrValue} size={130} color={DARK_BG} backgroundColor="#FFFFFF" />
                  <Text style={styles.qrRefText}>{qrValue}</Text>
                </View>
                {/* Barcode */}
                <View style={styles.barcodeBox}>
                  <BarcodeView value={qrValue} width={120} height={130} />
                  <Text style={styles.barcodeRefText}>{qrValue}</Text>
                </View>
              </View>
              <Text style={styles.scanHint}>امسح رمز QR عند بوابة الصعود للطائرة</Text>
            </View>
          )}

          {/* ════════ TEMP BOOKING NOTICE ════════ */}
          {isTemp && (
            <View style={[styles.card, { borderColor: '#F97316', borderWidth: 1.5 }]}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9731618', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="time" size={18} color="#F97316" />
                </View>
                <Text style={{ fontFamily: 'Tajawal_800ExtraBold', fontSize: 14, color: '#1A2035' }}>حجز مؤقت · Temporary Booking</Text>
              </View>
              <Text style={{ fontFamily: 'Tajawal_400Regular', fontSize: 12, color: '#667788', lineHeight: 22, textAlign: 'right' }}>
                تم إنشاء الحجز بنجاح، يرجى استكمال الدفع لإصدار التذكرة الإلكترونية النهائية.{'\n'}
                Your booking is confirmed. Please complete payment to issue the electronic ticket.
              </Text>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#F9731608', borderRadius: 10, padding: 10 }}>
                <Ionicons name="warning-outline" size={14} color="#F97316" />
                <Text style={{ fontFamily: 'Tajawal_500Medium', fontSize: 11, color: '#F97316' }}>
                  لن يتم إصدار QR أو Barcode إلا بعد إتمام الدفع والتأكيد
                </Text>
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* ── Footer Buttons ── */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 20 : insets.bottom + 12, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {/* Complete payment button — only shown for non-held confirmed/ticketed */}
        {!isTemp && booking.status !== 'held' && holdExpiresStr && new Date(holdExpiresStr).getTime() > Date.now() && (
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: '#F97316', marginBottom: 10 }, completing && { opacity: 0.7 }]}
            onPress={handleCompletePayment}
            disabled={completing}
            activeOpacity={0.85}
          >
            {completing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="card-outline" size={20} color="#fff" />}
            <Text style={[styles.footerBtnText, { color: '#fff' }]}>استكمال الدفع وإصدار التذكرة</Text>
          </TouchableOpacity>
        )}

        {/* PDF Download */}
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: GOLD, marginBottom: isTemp ? 10 : 0 }, exporting && { opacity: 0.7 }]}
          onPress={handleExportPDF}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting
            ? <ActivityIndicator color={DARK_BG} size="small" />
            : <Ionicons name="download-outline" size={20} color={DARK_BG} />}
          <Text style={[styles.footerBtnText, { color: DARK_BG }]}>
            {exporting ? 'جاري التصدير...' : 'تحميل التذكرة PDF'}
          </Text>
        </TouchableOpacity>

        {/* Return to Home — only for temporary/held bookings */}
        {isTemp && (
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border }]}
            onPress={() => router.replace('/' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={20} color={colors.foreground} />
            <Text style={[styles.footerBtnText, { color: colors.foreground }]}>العودة للصفحة الرئيسية</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 12, gap: 8,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  headerBadge: {
    paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20, borderWidth: 1, marginTop: 2,
  },
  headerBadgeText: { fontFamily: 'Tajawal_700Bold', fontSize: 10 },

  // ── Ticket card ──
  ticketCard: {
    backgroundColor: TICKET_BG,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  ticketAccentBar: { height: 5 },
  docTypeStrip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 9,
    borderBottomWidth: 1, backgroundColor: '#FAFBFD',
  },
  docTypeText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 11, letterSpacing: 0.5 },

  companyHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EEF0F6',
    backgroundColor: '#FAFBFD',
  },
  companyAccentBar: {
    width: 4, height: 36, borderRadius: 2,
    backgroundColor: GOLD, flexShrink: 0,
  },
  companyAr: {
    fontFamily: 'Tajawal_800ExtraBold', fontSize: 14,
    color: '#0B1628', letterSpacing: 0.2,
  },
  companyEn: {
    fontFamily: 'Tajawal_500Medium', fontSize: 9,
    color: '#6B7A99', marginTop: 2, letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pnrLabel: { fontFamily: 'Tajawal_400Regular', fontSize: 9, color: '#99AABB', textAlign: 'left' },
  pnrValue: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16, color: GOLD, letterSpacing: 2, textAlign: 'left', fontVariant: ['tabular-nums'] },

  travelerStrip: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 11,
    backgroundColor: TICKET_SECONDARY, borderBottomWidth: 1, borderBottomColor: '#EEF0F6',
  },
  travelerLabel: { fontFamily: 'Tajawal_400Regular', fontSize: 9, color: '#99AABB', letterSpacing: 0.5, marginBottom: 3 },
  travelerName: { fontFamily: 'Tajawal_700Bold', fontSize: 14, color: '#1A2035' },
  travelerCount: { fontFamily: 'Tajawal_400Regular', fontSize: 10, color: '#99AABB', marginTop: 2 },
  issueDateBlock: { alignItems: 'flex-end' },
  issueDateText: { fontFamily: 'Tajawal_700Bold', fontSize: 11, color: '#445566', textAlign: 'left' },

  perforation: {
    height: 18, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EBEDF5', paddingHorizontal: 0,
  },
  halfCircle: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: TICKET_BG, position: 'absolute',
  },
  dashedLine: {
    flex: 1, height: 1.5, marginHorizontal: 12,
    borderStyle: 'dashed', borderWidth: 1, borderColor: '#CCCED8',
  },

  // Segment
  segBlock: { padding: 16, backgroundColor: TICKET_BG },
  segDateRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 12 },
  segDateText: { fontFamily: 'Tajawal_700Bold', fontSize: 12, color: GOLD },
  airlineRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 16 },
  airlineIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: DARK_BG, alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },
  airlineName: { fontFamily: 'Tajawal_700Bold', fontSize: 14, color: '#1A2035', textAlign: 'right' },
  flightNum: { fontFamily: 'Tajawal_400Regular', fontSize: 11, color: '#99AABB', textAlign: 'right', marginTop: 2 },
  segStatusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  segStatusText: { fontFamily: 'Tajawal_700Bold', fontSize: 10 },

  routeRow: {
    flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 14, gap: 8,
  },
  routePort: { flex: 1, alignItems: 'flex-end' },
  routeTime: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 28, color: '#1A2035', lineHeight: 32 },
  routeDateSmall: { fontFamily: 'Tajawal_400Regular', fontSize: 10, color: '#99AABB', marginTop: 2 },
  routeCode: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16, color: GOLD, letterSpacing: 1, marginTop: 2 },
  routePortName: { fontFamily: 'Tajawal_400Regular', fontSize: 10, color: '#778899', marginTop: 2, textAlign: 'right', maxWidth: 110 },
  routeCity: { fontFamily: 'Tajawal_400Regular', fontSize: 10, color: '#AABBCC', marginTop: 1, textAlign: 'right' },
  routeMid: { flex: 0, alignItems: 'center', width: 80, gap: 4 },
  routeLine: { flex: 1, height: 1, backgroundColor: '#DDE1ED', width: 30 },
  routePlaneCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: GOLD + '18', borderWidth: 1, borderColor: GOLD + '44',
    alignItems: 'center', justifyContent: 'center',
  },
  routeDur: { fontFamily: 'Tajawal_500Medium', fontSize: 10, color: '#778899', marginTop: 4 },
  routeNonstop: { fontFamily: 'Tajawal_400Regular', fontSize: 9, color: '#AABBCC' },

  chipRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: '#DDE1ED', backgroundColor: '#F7F8FC',
  },
  chipText: { fontFamily: 'Tajawal_400Regular', fontSize: 11, color: '#667788' },

  // ── Generic card ──
  card: {
    backgroundColor: TICKET_BG, borderRadius: 18, borderWidth: 1, borderColor: '#EEF0F6',
    padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },

  // Passenger
  paxNameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 10 },
  paxNumBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  paxNumText: { color: DARK_BG, fontFamily: 'Tajawal_800ExtraBold', fontSize: 12 },
  paxName: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 15, color: '#1A2035' },

  // ── QR + Barcode ──
  qrCard: { alignItems: 'center' },
  qrSubtitle: { fontFamily: 'Tajawal_400Regular', fontSize: 12, color: '#778899', textAlign: 'center', marginBottom: 16 },
  qrBarcodeRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 20 },
  qrBox: {
    backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14,
    alignItems: 'center',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
    borderWidth: 1, borderColor: GOLD + '30',
  },
  qrRefText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 13, color: GOLD, marginTop: 10, letterSpacing: 2 },
  barcodeBox: {
    backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#0B1628', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#EEF0F6',
  },
  barcodeRefText: { fontFamily: 'Tajawal_500Medium', fontSize: 9, color: '#99AABB', marginTop: 8, letterSpacing: 3, fontVariant: ['tabular-nums'] },
  scanHint: { fontFamily: 'Tajawal_500Medium', fontSize: 11, color: '#99AABB', textAlign: 'center', marginTop: 16 },

  // ── Footer ──
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingTop: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 15, borderRadius: 16, minHeight: 52,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  footerBtnText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },

  outlineBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },

  // Contact section
  contactRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#EEF0F6',
  },
  contactText: {
    flex: 1, fontFamily: 'Tajawal_400Regular', fontSize: 13,
    color: '#445566', textAlign: 'right',
  },
  contactLink: {
    color: '#1A56DB', fontFamily: 'Tajawal_700Bold',
    textDecorationLine: 'underline',
  },
});
