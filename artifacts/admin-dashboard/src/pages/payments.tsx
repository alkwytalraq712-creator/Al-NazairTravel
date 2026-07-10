import React, { useState } from 'react';
import {
  useListPayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
  getListPaymentsQueryKey,
  Payment,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Edit, Trash2, Wallet, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { STATUS_ARABIC, PAYMENT_METHOD_ARABIC, BOOKING_TYPE_ARABIC, formatDateTimeAr } from '@/lib/translations';

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  refunded: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
};

const paymentSchema = z.object({
  bookingType: z.string().min(1, 'مطلوب'),
  customerName: z.string().min(1, 'اسم العميل مطلوب'),
  customerPhone: z.string().min(3, 'رقم الهاتف مطلوب'),
  amount: z.coerce.number().min(0, 'المبلغ يجب أن يكون صحيحاً'),
  currency: z.string().min(1, 'مطلوب'),
  method: z.string().min(1, 'مطلوب'),
  status: z.string().min(1, 'مطلوب'),
  transactionId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function Payments() {
  const { data: payments, isLoading } = useListPayments();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const filtered = payments?.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.referenceNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.customerPhone.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPaid = payments
    ?.filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const totalPending = payments
    ?.filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المدفوعات</h1>
          <p className="text-muted-foreground mt-1">تتبع مدفوعات الحجوزات وحالتها.</p>
        </div>
        <Button onClick={() => { setEditingPayment(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          تسجيل دفعة
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5 border-border/50">
          <p className="text-sm text-muted-foreground">إجمالي المدفوعات المؤكدة</p>
          <p className="text-2xl font-bold mt-1 text-emerald-500">{totalPaid.toLocaleString('ar')} </p>
        </Card>
        <Card className="p-5 border-border/50">
          <p className="text-sm text-muted-foreground">قيد الانتظار</p>
          <p className="text-2xl font-bold mt-1 text-amber-500">{totalPending.toLocaleString('ar')}</p>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/10">
          <div className="relative w-full sm:w-80">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم المرجع، الاسم، أو الهاتف..."
              className="ps-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="refunded">مُرجعة</SelectItem>
                <SelectItem value="failed">فشلت</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>المرجع</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>نوع الحجز</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-end">المبلغ</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    لا توجد مدفوعات مطابقة.
                  </TableCell>
                </TableRow>
              ) : (
                filtered?.map((payment) => (
                  <TableRow key={payment.id} className="group">
                    <TableCell>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                        {payment.referenceNumber}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateTimeAr(payment.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{payment.customerName}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{payment.customerPhone}</p>
                    </TableCell>
                    <TableCell className="text-sm">{BOOKING_TYPE_ARABIC[payment.bookingType] || payment.bookingType}</TableCell>
                    <TableCell className="text-sm">{PAYMENT_METHOD_ARABIC[payment.method] || payment.method}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[payment.status] || ""}>
                        {STATUS_ARABIC[payment.status] || payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-semibold" dir="ltr">
                      {Number(payment.amount).toLocaleString('ar')} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPayment(payment); setIsFormOpen(true); }}>
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <DeletePaymentButton payment={payment} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'تعديل الدفعة' : 'تسجيل دفعة جديدة'}</DialogTitle>
          </DialogHeader>
          <PaymentForm
            payment={editingPayment}
            onSuccess={() => setIsFormOpen(false)}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeletePaymentButton({ payment }: { payment: Payment }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeletePayment();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: payment.id }, {
      onSuccess: () => {
        toast({ title: "تم حذف الدفعة بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
        setOpen(false);
      },
      onError: (error) => {
        toast({ title: "خطأ في حذف الدفعة", description: error.error, variant: "destructive" });
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
          <DialogTitle>حذف الدفعة {payment.referenceNumber}؟</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">لا يمكن التراجع عن هذا الإجراء.</p>
        <DialogFooter className="mt-4 flex-row justify-end gap-2">
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

function PaymentForm({ payment, onSuccess, onCancel }: { payment: Payment | null; onSuccess: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment ? {
      bookingType: payment.bookingType,
      customerName: payment.customerName,
      customerPhone: payment.customerPhone,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId || '',
      notes: payment.notes || '',
    } : {
      bookingType: 'other',
      customerName: '',
      customerPhone: '',
      amount: 0,
      currency: 'IQD',
      method: 'cash',
      status: 'pending',
      transactionId: '',
      notes: '',
    },
  });

  const onSubmit = (values: PaymentFormValues) => {
    const data = {
      bookingType: values.bookingType,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      amount: String(values.amount),
      currency: values.currency,
      method: values.method as any,
      status: values.status as any,
      transactionId: values.transactionId || null,
      notes: values.notes || null,
      paidAt: values.status === 'paid' ? new Date().toISOString() : null,
    };

    if (payment) {
      updateMutation.mutate({ id: payment.id, data }, {
        onSuccess: () => {
          toast({ title: "تم تحديث الدفعة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: e.error, variant: "destructive" }),
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "تم تسجيل الدفعة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: e.error, variant: "destructive" }),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="customerName" render={({ field }) => (
          <FormItem><FormLabel>اسم العميل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="customerPhone" render={({ field }) => (
            <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="bookingType" render={({ field }) => (
            <FormItem>
              <FormLabel>نوع الحجز</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="flight">حجز طيران</SelectItem>
                  <SelectItem value="package">حجز باقة</SelectItem>
                  <SelectItem value="visa">طلب تأشيرة</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem><FormLabel>المبلغ</FormLabel><FormControl><Input type="number" step="0.01" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem><FormLabel>العملة</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="method" render={({ field }) => (
            <FormItem>
              <FormLabel>طريقة الدفع</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>الحالة</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="refunded">مُرجعة</SelectItem>
                  <SelectItem value="failed">فشلت</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="transactionId" render={({ field }) => (
          <FormItem><FormLabel>رقم العملية (اختياري)</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            {payment ? 'تحديث الدفعة' : 'تسجيل الدفعة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
