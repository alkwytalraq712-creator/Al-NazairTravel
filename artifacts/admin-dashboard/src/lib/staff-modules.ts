/**
 * Staff module definitions — the assignable permission units.
 * Admin (permissions === null) always has full access.
 * Staff see only the modules whose keys appear in their permissions array.
 */

export interface StaffModule {
  key: string;
  label: string;
  path: string;
}

export const STAFF_MODULES: StaffModule[] = [
  { key: 'flight_bookings',  label: 'حجوزات الطيران',       path: '/flight-bookings' },
  { key: 'hold_settings',    label: 'الحجوزات المؤقتة',      path: '/hold-settings' },
  { key: 'visa_applications',label: 'طلبات التأشيرات',       path: '/visa-applications' },
  { key: 'visas',            label: 'عروض التأشيرات',        path: '/visas' },
  { key: 'package_bookings', label: 'حجوزات الباقات',        path: '/package-bookings' },
  { key: 'packages',         label: 'الباقات السياحية',      path: '/packages' },
  { key: 'customers',        label: 'العملاء',               path: '/customers' },
  { key: 'payments',         label: 'المدفوعات',             path: '/payments' },
  { key: 'invoices',         label: 'الفواتير',              path: '/invoices' },
  { key: 'notifications',    label: 'الإشعارات',             path: '/notifications' },
  { key: 'banners',          label: 'اللافتات الترويجية',   path: '/banners' },
  { key: 'testimonials',     label: 'الآراء والتقييمات',    path: '/testimonials' },
  { key: 'company_settings', label: 'إعدادات التواصل',      path: '/company-settings' },
];

/** Resolve permissions: null = admin (all), array = staff (listed only). */
export function canAccess(permissions: string[] | null | undefined, moduleKey: string): boolean {
  if (permissions == null) return true; // admin
  return permissions.includes(moduleKey);
}

/** Find a module's key by its route path. */
export function moduleKeyForPath(path: string): string | undefined {
  return STAFF_MODULES.find(m => m.path === path)?.key;
}
