import React, { useState } from 'react';
import {
  useListEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useUpdateEmployeePermissions,
  User,
} from '@workspace/api-client-react';
import { getListEmployeesQueryKey } from '@workspace/api-client-react';
import {
  Loader2, Plus, Edit, Trash2, ShieldCheck, Mail, Phone, Calendar, Shield,
  ChevronDown, ChevronUp, AlertTriangle, CheckSquare, Square,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { formatDateAr } from '@/lib/translations';
import { PERMISSION_GROUPS, ALL_PERMISSION_KEYS, groupKeys, canAccess } from '@/lib/staff-modules';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ── Schema ────────────────────────────────────────────────────────────────────

const employeeSchema = z.object({
  fullName: z.string().min(1, 'الاسم الكامل مطلوب'),
  phone: z.string().min(3, 'رقم الهاتف مطلوب'),
  email: z.string().email('بريد إلكتروني غير صحيح').optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
});

// ── Main Page ─────────────────────────────────────────────────────────────────

export function Employees() {
  const { data: employees, isLoading } = useListEmployees();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الموظفين</h1>
          <p className="text-muted-foreground mt-1">إدارة حسابات الموظفين وصلاحيات الوصول إلى مركز التحكم.</p>
        </div>
        <Button onClick={() => { setEditingEmployee(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة موظف
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : employees?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">لا يوجد موظفون حتى الآن</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm mb-4">
              أضف حساب موظف لمنحه صلاحية الوصول إلى مركز التحكم.
            </p>
            <Button onClick={() => { setEditingEmployee(null); setIsFormOpen(true); }} variant="outline">
              إضافة موظف
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees?.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={() => { setEditingEmployee(employee); setIsFormOpen(true); }}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="text-xl">
              {editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <EmployeeForm
              employee={editingEmployee}
              onSuccess={() => setIsFormOpen(false)}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Employee Card ──────────────────────────────────────────────────────────────

function EmployeeCard({ employee, onEdit }: { employee: User; onEdit: () => void }) {
  const permissions = (employee as any).permissions as string[] | null | undefined;
  const isStaff = permissions !== null && permissions !== undefined;
  const permCount = isStaff ? (permissions?.length ?? 0) : ALL_PERMISSION_KEYS.length;
  const totalPerms = ALL_PERMISSION_KEYS.length;

  return (
    <Card className="hover-elevate transition-all border-border/50 group">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12 border border-border/50 shadow-sm">
            <AvatarImage src={(employee as any).avatarUrl || ''} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {employee.fullName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {employee.fullName}
              </h3>
              <Badge
                variant={isStaff ? 'outline' : 'secondary'}
                className="text-[10px] px-1.5 py-0 gap-1"
              >
                <ShieldCheck className="w-3 h-3" />
                {isStaff ? 'موظف' : 'مدير'}
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center text-sm text-muted-foreground truncate" dir="ltr">
                <Phone className="w-3.5 h-3.5 ms-2 flex-shrink-0" />
                <span className="truncate w-full text-end">{employee.phone}</span>
              </div>
              {employee.email && (
                <div className="flex items-center text-sm text-muted-foreground truncate">
                  <Mail className="w-3.5 h-3.5 me-2 flex-shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
              )}
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Calendar className="w-3.5 h-3.5 me-2 flex-shrink-0" />
                انضم {formatDateAr(employee.createdAt)}
              </div>
              {isStaff && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.round((permCount / totalPerms) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {permCount}/{totalPerms} صلاحية
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <PermissionsButton employee={employee} />
          <Button variant="ghost" size="icon" onClick={onEdit} title="تعديل البيانات">
            <Edit className="w-4 h-4 text-muted-foreground" />
          </Button>
          <DeleteEmployeeButton employee={employee} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Permissions Panel ─────────────────────────────────────────────────────────
// Shared between the Add form and the standalone PermissionsButton dialog.

function PermissionsPanel({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (keys: string[]) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(PERMISSION_GROUPS.map(g => [g.key, true]))
  );

  function toggle(key: string) {
    onChange(
      selected.includes(key)
        ? selected.filter(k => k !== key)
        : [...selected, key],
    );
  }

  function toggleGroup(groupKey: string, checked: boolean) {
    const keys = groupKeys(groupKey);
    if (checked) {
      onChange([...new Set([...selected, ...keys])]);
    } else {
      onChange(selected.filter(k => !keys.includes(k)));
    }
  }

  function toggleExpand(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const totalSelected = selected.length;
  const total = ALL_PERMISSION_KEYS.length;

  return (
    <div className="space-y-2">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex gap-2">
          <Button
            type="button" variant="outline" size="sm"
            className="text-xs h-7"
            onClick={() => onChange(ALL_PERMISSION_KEYS)}
          >
            تحديد الكل
          </Button>
          <Button
            type="button" variant="outline" size="sm"
            className="text-xs h-7"
            onClick={() => onChange([])}
          >
            مسح الكل
          </Button>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {totalSelected} / {total} صلاحية محددة
        </span>
      </div>

      {/* Groups */}
      {PERMISSION_GROUPS.map(group => {
        const groupAllKeys = groupKeys(group.key);
        const selectedInGroup = groupAllKeys.filter(k => selected.includes(k)).length;
        const allSelected = selectedInGroup === groupAllKeys.length;
        const someSelected = selectedInGroup > 0 && !allSelected;
        const isExpanded = expanded[group.key] !== false;

        return (
          <div key={group.key} className="border rounded-lg overflow-hidden">
            {/* Group header */}
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none transition-colors",
                allSelected ? "bg-primary/8" : someSelected ? "bg-amber-50 dark:bg-amber-950/20" : "bg-muted/40",
              )}
              onClick={() => toggleExpand(group.key)}
            >
              {/* Group checkbox */}
              <div onClick={e => { e.stopPropagation(); toggleGroup(group.key, !allSelected); }}>
                <Checkbox
                  checked={allSelected}
                  className={someSelected ? 'data-[state=unchecked]:opacity-50' : ''}
                  ref={(el) => {
                    if (el && someSelected) (el as any).dataset.indeterminate = 'true';
                  }}
                />
              </div>
              <span className="font-semibold text-sm flex-1">{group.label}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                allSelected ? "bg-primary/15 text-primary" :
                someSelected ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" :
                "bg-muted text-muted-foreground"
              )}>
                {selectedInGroup}/{groupAllKeys.length}
              </span>
              {isExpanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>

            {/* Permission items */}
            {isExpanded && (
              <div className="divide-y divide-border/50">
                {group.items.map(item => (
                  <label
                    key={item.key}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted/40 transition-colors",
                      item.isRestrictive && selected.includes(item.key) && "bg-red-50/60 dark:bg-red-950/10",
                    )}
                  >
                    <Checkbox
                      checked={selected.includes(item.key)}
                      onCheckedChange={() => toggle(item.key)}
                    />
                    <span className="text-sm flex-1">{item.label}</span>
                    {item.isRestrictive && (
                      <span className="text-[10px] text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        حساس
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Standalone Permissions Button (for editing existing employees) ─────────────

function PermissionsButton({ employee }: { employee: User }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const currentPermissions = (employee as any).permissions as string[] | null | undefined;
  const initialSelected: string[] =
    currentPermissions == null ? ALL_PERMISSION_KEYS : (currentPermissions ?? []);

  const [selected, setSelected] = useState<string[]>(initialSelected);
  const updateMutation = useUpdateEmployeePermissions();

  function handleOpenChange(val: boolean) {
    if (val) {
      setSelected(currentPermissions == null ? ALL_PERMISSION_KEYS : (currentPermissions ?? []));
    }
    setOpen(val);
  }

  function handleSave() {
    updateMutation.mutate({ id: employee.id, permissions: selected }, {
      onSuccess: () => {
        toast({ title: 'تم تحديث الصلاحيات بنجاح' });
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
        setOpen(false);
      },
      onError: (e: any) =>
        toast({ title: 'خطأ في تحديث الصلاحيات', description: e?.data?.error ?? e?.message, variant: 'destructive' }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="ghost" size="icon" title="إدارة الصلاحيات" onClick={() => setOpen(true)}>
        <Shield className="w-4 h-4 text-muted-foreground" />
      </Button>

      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>صلاحيات {employee.fullName}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            حدّد الأقسام والإجراءات التي يمكن لهذا الموظف تنفيذها.
          </p>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          <PermissionsPanel selected={selected} onChange={setSelected} />
        </ScrollArea>
        <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            حفظ الصلاحيات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteEmployeeButton({ employee }: { employee: User }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteEmployee();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: employee.id }, {
      onSuccess: () => {
        toast({ title: 'تم حذف الموظف بنجاح' });
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
        setOpen(false);
      },
      onError: (error) => {
        toast({ title: 'خطأ في حذف الموظف', description: (error as any).error, variant: 'destructive' });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost" size="icon"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف الموظف {employee.fullName}؟</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          لا يمكن التراجع عن هذا الإجراء. سيتم إلغاء صلاحية وصول هذا الموظف إلى مركز التحكم بشكل دائم.
        </p>
        <DialogFooter className="mt-4 flex-row justify-end space-x-0 gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin ms-2" />
              : <Trash2 className="w-4 h-4 ms-2" />}
            حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Employee Form (with inline permissions for new employees) ──────────────────

type FormStep = 'info' | 'permissions';

function EmployeeForm({
  employee, onSuccess, onCancel,
}: { employee: User | null; onSuccess: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const updatePermsMutation = useUpdateEmployeePermissions();

  // Permissions state — only shown when creating a new employee
  const [step, setStep] = useState<FormStep>('info');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? { fullName: employee.fullName, phone: employee.phone, email: employee.email || '', password: '' }
      : { fullName: '', phone: '', email: '', password: '' },
  });

  // ── Update existing employee (basic info only) ────────────────────────────
  function handleUpdate(values: z.infer<typeof employeeSchema>) {
    const data = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || null,
      ...(values.password ? { password: values.password } : {}),
    };
    updateMutation.mutate({ id: employee!.id, data }, {
      onSuccess: () => {
        toast({ title: 'تم تحديث بيانات الموظف بنجاح' });
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
        onSuccess();
      },
      onError: (e: any) => toast({ title: 'خطأ', description: e?.data?.error ?? e?.message, variant: 'destructive' }),
    });
  }

  // ── Create new employee (info → permissions in one flow) ──────────────────
  function handleInfoNext(values: z.infer<typeof employeeSchema>) {
    if (!values.password || values.password.length < 6) {
      form.setError('password', { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      return;
    }
    setStep('permissions');
  }

  function handleCreate() {
    const values = form.getValues();
    createMutation.mutate({
      data: {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        password: values.password!,
        // Pass permissions in body (backend reads req.body.permissions)
        ...(selectedPerms.length > 0 ? { permissions: selectedPerms } : {}),
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: 'تم إضافة الموظف بنجاح', description: `تم تعيين ${selectedPerms.length} صلاحية.` });
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
        onSuccess();
      },
      onError: (e: any) => toast({ title: 'خطأ', description: e?.data?.error ?? e?.message, variant: 'destructive' }),
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Edit existing employee ─────────────────────────────────────────────────
  if (employee) {
    return (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 px-6 py-4">
          <Form {...form}>
            <form id="employee-edit-form" onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة مرور جديدة</FormLabel>
                  <FormControl><Input type="password" dir="ltr" {...field} /></FormControl>
                  <FormDescription>اتركها فارغة للاحتفاظ بكلمة المرور الحالية.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0 text-primary" />
                لتعديل صلاحيات الموظف، استخدم زر الصلاحيات <Shield className="w-3 h-3 inline" /> في بطاقة الموظف.
              </div>
            </form>
          </Form>
        </ScrollArea>
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" form="employee-edit-form" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            تحديث البيانات
          </Button>
        </div>
      </div>
    );
  }

  // ── Create new employee — Step 1: Basic Info ───────────────────────────────
  if (step === 'info') {
    return (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 px-6 py-4">
          <Form {...form}>
            <form id="employee-info-form" onSubmit={form.handleSubmit(handleInfoNext)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>البريد الإلكتروني (اختياري)</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl><Input type="password" dir="ltr" {...field} /></FormControl>
                  <FormDescription>6 أحرف على الأقل.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </form>
          </Form>
        </ScrollArea>
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">الخطوة 1 من 2 — البيانات الأساسية</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
            <Button type="submit" form="employee-info-form">
              التالي — تحديد الصلاحيات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Create new employee — Step 2: Permissions ──────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 bg-muted/40 border-b shrink-0">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{form.getValues('fullName')}</span>
          {' '}— حدد الصلاحيات التي يمتلكها هذا الموظف. يمكنك تغييرها لاحقاً من بطاقة الموظف.
        </p>
      </div>
      <ScrollArea className="flex-1 px-6 py-4">
        <PermissionsPanel selected={selectedPerms} onChange={setSelectedPerms} />
      </ScrollArea>
      <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={() => setStep('info')} className="gap-1 text-muted-foreground">
            ← رجوع
          </Button>
          <span className="text-xs text-muted-foreground">الخطوة 2 من 2 — الصلاحيات</span>
        </div>
        <Button onClick={handleCreate} disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
          إضافة الموظف ({selectedPerms.length} صلاحية)
        </Button>
      </div>
    </div>
  );
}
