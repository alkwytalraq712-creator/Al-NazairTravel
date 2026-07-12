/**
 * Email service for Qema Travel.
 * Uses nodemailer when SMTP_HOST is configured, otherwise logs to console.
 */
import { logger } from "./logger";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // No SMTP configured — log to console (development mode)
    logger.info(
      { to: payload.to, subject: payload.subject },
      "[Email] SMTP not configured — logging email to console",
    );
    logger.info({ html: payload.html }, "[Email] HTML content");
    return;
  }

  try {
    // Dynamic import so the server starts even if nodemailer isn't installed
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
      secure: SMTP_PORT === "465",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: SMTP_FROM ?? `"قمة النظائر للسفريات والسياحة" <${SMTP_USER}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    logger.info({ to: payload.to, subject: payload.subject }, "[Email] Sent successfully");
  } catch (err: any) {
    logger.error({ err: err?.message }, "[Email] Failed to send");
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: Arial, 'Cairo', sans-serif; background:#f5f5f5; margin:0; padding:20px;
  direction: rtl; text-align: right;
`;
const CARD_STYLE = `
  background:#fff; border-radius:12px; padding:32px; max-width:600px;
  margin:0 auto; box-shadow:0 2px 16px rgba(0,0,0,0.08);
`;
const GOLD = "#C9A060";
const DARK = "#0B1628";

function headerHtml(title: string): string {
  return `
  <div style="background:${DARK};padding:20px 32px;border-radius:12px 12px 0 0;margin:-32px -32px 24px;text-align:center">
    <h1 style="color:${GOLD};font-size:20px;margin:0">قمة النظائر للسفريات والسياحة</h1>
    <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:4px 0 0">QEMA AL-NAZAER FOR TRAVEL &amp; TOURISM</p>
    <h2 style="color:#fff;font-size:16px;margin:16px 0 0">${title}</h2>
  </div>`;
}

function footerHtml(): string {
  return `
  <div style="text-align:center;margin-top:24px;padding-top:20px;border-top:1px solid #eee">
    <p style="color:#999;font-size:11px;margin:0">
      للاستفسار: info@qema-travel.com<br/>
      هذا البريد أُرسل تلقائياً من نظام قمة النظائر — الرجاء عدم الرد عليه.
    </p>
  </div>`;
}

export async function sendHoldConfirmationEmail(opts: {
  to: string;
  referenceNumber: string;
  fromAirport: string;
  toAirport: string;
  airlineName: string;
  departTime: string;
  holdExpiresAt: string;
  holdFeeAmount: number;
  currency: string;
  passengerName: string;
}): Promise<void> {
  const expiry = new Date(opts.holdExpiresAt).toLocaleString("ar-SA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  });
  const depart = new Date(opts.departTime).toLocaleString("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  });

  const html = `
<div style="${BASE_STYLE}">
<div style="${CARD_STYLE}">
${headerHtml("✅ تأكيد الحجز المؤقت")}

<p style="font-size:15px;color:#333">عزيزي العميل <strong>${opts.passengerName}</strong>،</p>
<p style="color:#555;line-height:1.8">تم تسجيل حجزك المؤقت بنجاح. لديك مدة <strong style="color:${GOLD}">24 ساعة</strong> لإتمام دفع قيمة التذكرة.</p>

<div style="background:#f8f4ec;border:1px solid #e8d8b0;border-radius:10px;padding:20px;margin:20px 0">
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr>
      <td style="padding:8px 0;color:#888">رقم الحجز</td>
      <td style="padding:8px 0;font-weight:700;color:${GOLD};font-family:monospace;letter-spacing:2px">${opts.referenceNumber}</td>
    </tr>
    <tr style="border-top:1px solid #eee">
      <td style="padding:8px 0;color:#888">الرحلة</td>
      <td style="padding:8px 0;font-weight:600">${opts.airlineName}: ${opts.fromAirport} → ${opts.toAirport}</td>
    </tr>
    <tr style="border-top:1px solid #eee">
      <td style="padding:8px 0;color:#888">موعد الإقلاع</td>
      <td style="padding:8px 0;font-weight:600">${depart}</td>
    </tr>
    <tr style="border-top:1px solid #eee">
      <td style="padding:8px 0;color:#888">رسوم الحجز المؤقت</td>
      <td style="padding:8px 0;font-weight:700;color:#059669">${opts.holdFeeAmount} ${opts.currency}</td>
    </tr>
  </table>
</div>

<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:16px;margin:16px 0">
  <p style="color:#856404;font-weight:700;margin:0 0 8px">⏰ موعد انتهاء الحجز المؤقت</p>
  <p style="color:#856404;font-size:16px;font-weight:700;margin:0">${expiry}</p>
</div>

<p style="color:#dc3545;font-size:13px;line-height:1.8">
  <strong>تنبيه:</strong> إذا لم يتم إتمام الدفع قبل الموعد المحدد، سيُلغى الحجز تلقائياً ولن تُسترد رسوم الحجز المؤقت.
</p>

${footerHtml()}
</div>
</div>`;

  await sendEmail({
    to: opts.to,
    subject: `✅ تأكيد الحجز المؤقت — ${opts.referenceNumber}`,
    html,
  });
}

export async function sendHoldExpiredEmail(opts: {
  to: string;
  referenceNumber: string;
  fromAirport: string;
  toAirport: string;
  airlineName: string;
  passengerName: string;
}): Promise<void> {
  const html = `
<div style="${BASE_STYLE}">
<div style="${CARD_STYLE}">
${headerHtml("❌ انتهت مدة الحجز المؤقت")}

<p style="font-size:15px;color:#333">عزيزي العميل <strong>${opts.passengerName}</strong>،</p>
<p style="color:#555;line-height:1.8">نأسف لإخطارك بأن مدة الحجز المؤقت الخاصة بك قد انتهت دون إتمام عملية الدفع.</p>

<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:20px;margin:20px 0">
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr>
      <td style="padding:8px 0;color:#888">رقم الحجز الملغى</td>
      <td style="padding:8px 0;font-weight:700;color:#dc3545;font-family:monospace">${opts.referenceNumber}</td>
    </tr>
    <tr style="border-top:1px solid #fee2e2">
      <td style="padding:8px 0;color:#888">الرحلة</td>
      <td style="padding:8px 0;font-weight:600">${opts.airlineName}: ${opts.fromAirport} → ${opts.toAirport}</td>
    </tr>
    <tr style="border-top:1px solid #fee2e2">
      <td style="padding:8px 0;color:#888">حالة الحجز</td>
      <td style="padding:8px 0;font-weight:700;color:#dc3545">ملغى — انتهاء مدة الحجز المؤقت</td>
    </tr>
  </table>
</div>

<p style="color:#555;line-height:1.8">يمكنك إعادة البحث وحجز رحلة جديدة في أي وقت من خلال تطبيق قمة النظائر.</p>

${footerHtml()}
</div>
</div>`;

  await sendEmail({
    to: opts.to,
    subject: `❌ إلغاء الحجز المؤقت — ${opts.referenceNumber}`,
    html,
  });
}
