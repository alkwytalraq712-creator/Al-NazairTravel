import React, { useState } from 'react';
import {
  useListEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  User,
} from '@workspace/api-client-react';
import { getListEmployeesQueryKey } from '@workspace/api-client-react';
import { Loader2, Plus, Edit, Trash2, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { formatDateAr } from '@/lib/translations';

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
            <Card key={employee.id} className="hover-elevate transition-all border-border/50 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 border border-border/50 shadow-sm">
                    <AvatarImage src={employee.avatarUrl || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {employee.fullName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                        {employee.fullName}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        مدير
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
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setEditingEmployee(employee); setIsFormOpen(true); }}
                  >
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <DeleteEmployeeButton employee={employee} />
                </div>
              </CardContent>
            </Card>
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

function DeleteEmployeeButton({ employee }: { employee: User }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteEmployee();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: employee.id }, {
      onSuccess: () => {
        toast({ title: "تم حذف الموظف بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
        setOpen(false);
      },
      onError: (error) => {
        toast({ title: "خطأ في حذف الموظف", description: error.error, variant: "destructive" });
      }
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
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : <Trash2 className="w-4 h-4 ms-2" />}
            حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmployeeForm({ employee, onSuccess, onCancel }: { employee: User | null, onSuccess: () => void, onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? {
      fullName: employee.fullName,
      phone: employee.phone,
      email: employee.email || '',
      password: '',
    } : {
      fullName: '',
      phone: '',
      email: '',
      password: '',
    }
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
          toast({ title: "تم تحديث بيانات الموظف بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: e.error, variant: "destructive" })
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
        }
      }, {
        onSuccess: () => {
          toast({ title: "تم إضافة الموظف بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: e.error, variant: "destructive" })
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
