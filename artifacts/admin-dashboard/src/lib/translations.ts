import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const STATUS_ARABIC: Record<string, string> = {
  received: "مُستلمة",
  reviewing: "قيد المراجعة",
  awaiting_documents: "بانتظار المستندات",
  submitted_to_embassy: "مُقدمة للسفارة",
  processing: "قيد المعالجة",
  issued: "مُصدرة",
  completed: "مكتملة",
  rejected: "مرفوضة",
  pending: "قيد الانتظار",
  confirmed: "مؤكدة",
  awaiting_payment: "بانتظار الدفع",
  paid: "مدفوعة",
  vouchers_issued: "تم إصدار القسائم",
  cancelled: "ملغاة",
  ticketed: "مُصدرة التذكرة",
  refunded: "مُرجعة",
  failed: "فشلت",
  draft: "مسودة",
};

export const PAYMENT_METHOD_ARABIC: Record<string, string> = {
  cash: "نقداً",
  bank_transfer: "تحويل بنكي",
  card: "بطاقة",
  other: "أخرى",
};

export const BOOKING_TYPE_ARABIC: Record<string, string> = {
  flight: "حجز طيران",
  package: "حجز باقة",
  visa: "طلب تأشيرة",
  other: "أخرى",
};

export const VISA_TYPE_ARABIC: Record<string, string> = {
  tourism: "سياحة",
  business: "أعمال",
  medical: "علاج",
  study: "دراسة",
  visit: "زيارة",
  investment: "استثمار"
};

export const CABIN_CLASS_ARABIC: Record<string, string> = {
  economy: "سياحية",
  premium_economy: "سياحية ممتازة",
  business: "أعمال",
  first: "أولى"
};

export const NOTIFICATION_TYPE_ARABIC: Record<string, string> = {
  visa_application: "طلب تأشيرة",
  package_booking: "حجز باقة",
  flight_booking: "حجز طيران",
  general: "عام",
  promotion: "عرض ترويجي"
};

export function formatDateAr(date: string | Date, formatStr: string = 'd MMM yyyy') {
  return format(new Date(date), formatStr, { locale: ar });
}

export function formatDateTimeAr(date: string | Date) {
  return format(new Date(date), 'd MMM yyyy، h:mm a', { locale: ar });
}
