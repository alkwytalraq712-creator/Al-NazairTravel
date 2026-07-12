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
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { formatDateAr } from '@/lib/translations';
import { STAFF_MODULES } from '@/lib/staff-modules';

const employeeSchema = z.object({
  fullName: z.string().min(1, 'الاسم الكامل مطلوب'),
  phone: z.string().min(3, 'رقم الهاتف مطلوب'),
  email: z.string().email('بريد إلكتروني غير صحيح').optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
});

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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            employee={editingEmployee}
            onSuccess={() => setIsFormOpen(false)}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Employee Card ──────────────────────────────────────────────────────────────
function EmployeeCard({ employee, onEdit }: { employee: User; onEdit: () => void }) {
  const permissions = (employee as any).permissions as string[] | null | undefined;
  const isStaff = permissions !== null && permissions !== undefined;
  const moduleCount = isStaff ? (permissions?.length ?? 0) : STAFF_MODULES.length;

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
                <div className="flex items-center text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 me-2 flex-shrink-0" />
                  <span>{moduleCount} من {STAFF_MODULES.length} صلاحية</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <PermissionsButton employee={employee} />
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </Button>
          <DeleteEmployeeButton employee={employee} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Permissions Dialog ─────────────────────────────────────────────────────────
function PermissionsButton({ employee }: { employee: User }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const currentPermissions = (employee as any).permissions as string[] | null | undefined;
  // null = admin (all access), undefined = unknown, array = staff
  const initialSelected: string[] =
    currentPermissions == null
      ? STAFF_MODULES.map(m => m.key)  // admin sees all pre-checked
      : currentPermissions;

  const [selected, setSelected] = useState<string[]>(initialSelected);

  const updateMutation = useUpdateEmployeePermissions();

  function toggle(key: string) {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  }

  function selectAll() { setSelected(STAFF_MODULES.map(m => m.key)); }
  function clearAll() { setSelected([]); }

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

  // Reset selection to DB value each time dialog opens
  function handleOpenChange(val: boolean) {
    if (val) {
      setSelected(
        currentPermissions == null
          ? STAFF_MODULES.map(m => m.key)
          : currentPermissions,
      );
    }
    setOpen(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="إدارة الصلاحيات">
          <Shield className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>صلاحيات {employee.fullName}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          اختر الأقسام التي يمكن لهذا الموظف الوصول إليها في مركز التحكم.
        </p>

        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={selectAll} className="text-xs h-7">
            تحديد الكل
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} className="text-xs h-7">
            إلغاء الكل
          </Button>
          <span className="ms-auto text-xs text-muted-foreground self-center">
            {selected.length} / {STAFF_MODULES.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1 max-h-72 overflow-y-auto border rounded-lg p-3">
          {STAFF_MODULES.map(mod => (
            <label
              key={mod.key}
              className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer select-none"
            >
              <Checkbox
                id={`perm-${mod.key}`}
                checked={selected.includes(mod.key)}
                onCheckedChange={() => toggle(mod.key)}
              />
              <span className="text-sm">{mod.label}</span>
            </label>
          ))}
        </div>

        <DialogFooter className="mt-2 flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            حفظ الصلاحيات
          </Button>
        </DialogFooter>
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
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف الموظف {employee.fullName}؟</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">لا يمكن التراجع عن هذا الإجراء. سيتم إلغاء صلاحية وصول هذا الموظف إلى مركز التحكم بشكل دائم.</p>
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

// ── Employee Form ──────────────────────────────────────────────────────────────
function EmployeeForm({
  employee, onSuccess, onCancel,
}: { employee: User | null; onSuccess: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? { fullName: employee.fullName, phone: employee.phone, email: employee.email || '', password: '' }
      : { fullName: '', phone: '', email: '', password: '' },
  });

  const onSubmit = (values: z.infer<typeof employeeSchema>) => {
    if (employee) {
      const data = {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || null,
        ...(values.password ? { password: values.password } : {}),
      };
      updateMutation.mutate({ id: employee.id, data }, {
        onSuccess: () => {
          toast({ title: 'تم تحديث بيانات الموظف بنجاح' });
          queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
          onSuccess();
        },
        onError: (e: any) => toast({ title: 'خطأ', description: e.error, variant: 'destructive' }),
      });
    } else {
      if (!values.password || values.password.length < 6) {
        form.setError('password', { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
        return;
      }
      createMutation.mutate({
        data: {
          fullName: values.fullName,
          phone: values.phone,
          email: values.email || undefined,
          password: values.password,
        },
      }, {
        onSuccess: () => {
          toast({ title: 'تم إضافة الموظف بنجاح' });
          queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
          onSuccess();
        },
        onError: (e: any) => toast({ title: 'خطأ', description: e.error, variant: 'destructive' }),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormLabel>{employee ? 'كلمة مرور جديدة' : 'كلمة المرور'}</FormLabel>
            <FormControl><Input type="password" dir="ltr" {...field} /></FormControl>
            {employee && <FormDescription>اتركها فارغة للاحتفاظ بكلمة المرور الحالية.</FormDescription>}
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            {employee ? 'تحديث البيانات' : 'إضافة الموظف'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
