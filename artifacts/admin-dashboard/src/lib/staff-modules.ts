/**
 * Staff permissions — granular action-level permission system.
 *
 * Permissions are stored as a flat string[] in the DB, using dot-notation:
 *   'visa_applications.view', 'visa_applications.issue', etc.
 *
 * Admin (permissions === null) always has full access.
 * Staff see only the modules and actions listed in their permissions array.
 *
 * Backward compatibility: legacy module-root keys (e.g. 'visa_applications')
 * still grant full access to that module for old accounts.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PermissionItem {
  key: string;          // e.g. 'visa_applications.view'
  label: string;
  description?: string;
  isRestrictive?: boolean; // highlight in UI as a sensitive/destructive permission
}

export interface PermissionGroup {
  key: string;          // module root, e.g. 'visa_applications'
  label: string;        // Arabic label
  icon: string;         // lucide icon name
  path: string;         // sidebar route path (for backward-compat with Sidebar)
  items: PermissionItem[];
}

// ── Permission Groups ─────────────────────────────────────────────────────────

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'visa_applications',
    label: 'طلبات التأشيرات',
    icon: 'FileText',
    path: '/visa-applications',
    items: [
      { key: 'visa_applications.view',          label: 'عرض طلبات التأشيرات' },
      { key: 'visa_applications.create',         label: 'استقبال طلبات جديدة' },
      { key: 'visa_applications.review',         label: 'مراجعة الطلبات' },
      { key: 'visa_applications.update_status',  label: 'تحديث حالة الطلب' },
      { key: 'visa_applications.upload_files',   label: 'رفع الملفات والمرفقات' },
      { key: 'visa_applications.add_notes',      label: 'إضافة ملاحظات على الطلب' },
      { key: 'visa_applications.issue',          label: 'إصدار التأشيرة' },
      { key: 'visa_applications.print',          label: 'طباعة التأشيرة' },
      { key: 'visa_applications.delete',         label: 'حذف الطلبات',          isRestrictive: true },
      { key: 'visa_applications.edit_price',     label: 'تعديل الأسعار',         isRestrictive: true },
      { key: 'visa_applications.cancel',         label: 'إلغاء الطلبات',         isRestrictive: true },
    ],
  },
  {
    key: 'visas',
    label: 'عروض التأشيرات',
    icon: 'Briefcase',
    path: '/visas',
    items: [
      { key: 'visas.view',   label: 'عرض عروض التأشيرات' },
      { key: 'visas.create', label: 'إضافة تأشيرة جديدة' },
      { key: 'visas.edit',   label: 'تعديل التأشيرة' },
      { key: 'visas.delete', label: 'حذف التأشيرة', isRestrictive: true },
    ],
  },
  {
    key: 'flight_bookings',
    label: 'حجوزات الطيران',
    icon: 'Plane',
    path: '/flight-bookings',
    items: [
      { key: 'flight_bookings.view',        label: 'عرض الحجوزات' },
      { key: 'flight_bookings.create',      label: 'إنشاء حجز جديد' },
      { key: 'flight_bookings.edit',        label: 'تعديل الحجز' },
      { key: 'flight_bookings.issue_ticket',label: 'إصدار التذكرة' },
      { key: 'flight_bookings.print_ticket',label: 'طباعة التذكرة' },
      { key: 'flight_bookings.delete',      label: 'حذف الحجوزات',   isRestrictive: true },
      { key: 'flight_bookings.cancel',      label: 'إلغاء الحجوزات', isRestrictive: true },
    ],
  },
  {
    key: 'package_bookings',
    label: 'حجوزات الباقات',
    icon: 'Map',
    path: '/package-bookings',
    items: [
      { key: 'package_bookings.view',   label: 'عرض الحجوزات' },
      { key: 'package_bookings.edit',   label: 'تعديل الحجز' },
      { key: 'package_bookings.cancel', label: 'إلغاء الحجز', isRestrictive: true },
    ],
  },
  {
    key: 'customers',
    label: 'العملاء',
    icon: 'Users',
    path: '/customers',
    items: [
      { key: 'customers.view',   label: 'عرض العملاء' },
      { key: 'customers.create', label: 'إضافة عميل' },
      { key: 'customers.edit',   label: 'تعديل بيانات العميل' },
      { key: 'customers.delete', label: 'حذف العملاء', isRestrictive: true },
    ],
  },
  {
    key: 'employees',
    label: 'الموظفين',
    icon: 'UserCog',
    path: '/employees',
    items: [
      { key: 'employees.view',   label: 'عرض الموظفين' },
      { key: 'employees.create', label: 'إضافة موظف' },
      { key: 'employees.edit',   label: 'تعديل بيانات الموظفين' },
      { key: 'employees.delete', label: 'حذف الموظفين', isRestrictive: true },
    ],
  },
  {
    key: 'payments',
    label: 'الإدارة المالية',
    icon: 'Wallet',
    path: '/payments',
    items: [
      { key: 'payments.view',          label: 'عرض المدفوعات' },
      { key: 'payments.create',         label: 'إضافة عمليات مالية' },
      { key: 'payments.edit_prices',    label: 'تعديل الأسعار',       isRestrictive: true },
      { key: 'payments.issue_invoices', label: 'إصدار الفواتير' },
      { key: 'payments.refund',         label: 'استرجاع الأموال',      isRestrictive: true },
    ],
  },
  {
    key: 'reports',
    label: 'التقارير',
    icon: 'BarChart2',
    path: '/reports',
    items: [
      { key: 'reports.view',         label: 'عرض التقارير' },
      { key: 'reports.export_pdf',   label: 'تصدير PDF' },
      { key: 'reports.export_excel', label: 'تصدير Excel' },
    ],
  },
  {
    key: 'company_settings',
    label: 'إعدادات النظام',
    icon: 'Building2',
    path: '/company-settings',
    items: [
      { key: 'settings.company',      label: 'تعديل بيانات الشركة' },
      { key: 'settings.branding',     label: 'تعديل الشعارات' },
      { key: 'settings.manage_users', label: 'إدارة المستخدمين', isRestrictive: true },
    ],
  },
  {
    key: 'notifications',
    label: 'الإشعارات',
    icon: 'Bell',
    path: '/notifications',
    items: [
      { key: 'notifications.view',   label: 'عرض الإشعارات' },
      { key: 'notifications.create', label: 'إرسال إشعارات' },
    ],
  },
  {
    key: 'banners',
    label: 'اللافتات الترويجية',
    icon: 'Image',
    path: '/banners',
    items: [
      { key: 'banners.view',   label: 'عرض اللافتات' },
      { key: 'banners.create', label: 'إضافة لافتة' },
      { key: 'banners.edit',   label: 'تعديل اللافتات' },
      { key: 'banners.delete', label: 'حذف اللافتات', isRestrictive: true },
    ],
  },
  {
    key: 'packages',
    label: 'الباقات السياحية',
    icon: 'Package',
    path: '/packages',
    items: [
      { key: 'packages.view',   label: 'عرض الباقات' },
      { key: 'packages.create', label: 'إضافة باقة جديدة' },
      { key: 'packages.edit',   label: 'تعديل الباقات' },
      { key: 'packages.delete', label: 'حذف الباقات', isRestrictive: true },
    ],
  },
  {
    key: 'testimonials',
    label: 'آراء العملاء',
    icon: 'MessageSquare',
    path: '/testimonials',
    items: [
      { key: 'testimonials.view',   label: 'عرض الآراء' },
      { key: 'testimonials.create', label: 'إضافة رأي' },
      { key: 'testimonials.edit',   label: 'تعديل الآراء' },
      { key: 'testimonials.delete', label: 'حذف الآراء', isRestrictive: true },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** All permission keys flattened (for "select all") */
export const ALL_PERMISSION_KEYS: string[] = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key));

/** All unique permission keys for a given group */
export function groupKeys(groupKey: string): string[] {
  return PERMISSION_GROUPS.find(g => g.key === groupKey)?.items.map(i => i.key) ?? [];
}

/**
 * Check if a user has a specific permission key.
 * - null permissions = admin = always true
 * - Checks exact key, module-root legacy key, AND module root access from any sub-permission
 */
export function canAccess(permissions: string[] | null | undefined, permKey: string): boolean {
  if (permissions == null) return true; // admin

  // Exact match (new granular key OR legacy module key)
  if (permissions.includes(permKey)) return true;

  if (permKey.includes('.')) {
    // Granular key — also check legacy module root
    const root = permKey.split('.')[0];
    if (permissions.includes(root)) return true;
  } else {
    // Module root check — return true if ANY sub-permission for this module exists
    if (permissions.some(p => p === permKey || p.startsWith(permKey + '.'))) return true;
  }

  return false;
}

// ── Legacy STAFF_MODULES (kept for backward compat in Sidebar + old code) ────

export interface StaffModule {
  key: string;
  label: string;
  path: string;
}

/** Derived from PERMISSION_GROUPS for sidebar backward compatibility */
export const STAFF_MODULES: StaffModule[] = PERMISSION_GROUPS.map(g => ({
  key: g.key,
  label: g.label,
  path: g.path,
}));

/** Find a module's key by its route path. */
export function moduleKeyForPath(path: string): string | undefined {
  return PERMISSION_GROUPS.find(g => g.path === path)?.key;
}
