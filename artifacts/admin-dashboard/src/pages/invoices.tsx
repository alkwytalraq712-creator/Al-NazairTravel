import React, { useState } from 'react';
import {
  useListInvoices,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  getListInvoicesQueryKey,
  Invoice,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Edit, Trash2, Receipt, Search, Filter, X } from 'lucide-react';
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
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { STATUS_ARABIC, formatDateTimeAr } from '@/lib/translations';

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  issued: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const invoiceSchema = z.object({
  customerName: z.string().min(1, 'اسم العميل مطلوب'),
  customerPhone: z.string().min(3, 'رقم الهاتف مطلوب'),
  customerEmail: z.string().email('بريد غير صحيح').optional().or(z.literal('')),
  currency: z.string().min(1, 'مطلوب'),
  tax: z.coerce.number().min(0).default(0),
  status: z.string().min(1, 'مطلوب'),
  dueDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(z.object({
    description: z.string().min(1, 'الوصف مطلوب'),
    amount: z.coerce.number().min(0),
  })).min(1, 'أضف بنداً واحداً على الأقل'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function Invoices() {
  const { data: invoices, isLoading } = useListInvoices();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const filtered = invoices?.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الفواتير</h1>
          <p className="text-muted-foreground mt-1">إصدار ومتابعة فواتير العملاء.</p>
        </div>
        <Button onClick={() => { setEditingInvoice(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          إنشاء فاتورة
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/10">
          <div className="relative w-full sm:w-80">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الفاتورة أو اسم العميل..."
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
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="issued">صادرة</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>البنود</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-end">الإجمالي</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    لا توجد فواتير مطابقة.
                  </TableCell>
                </TableRow>
              ) : (
                filtered?.map((invoice) => (
                  <TableRow key={invoice.id} className="group">
                    <TableCell>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                        {invoice.invoiceNumber}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateTimeAr(invoice.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{invoice.customerName}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{invoice.customerPhone}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{invoice.items.length} بند</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[invoice.status] || ""}>
                        {STATUS_ARABIC[invoice.status] || invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-semibold" dir="ltr">
                      {Number(invoice.total).toLocaleString('ar')} {invoice.currency}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingInvoice(invoice); setIsFormOpen(true); }}>
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <DeleteInvoiceButton invoice={invoice} />
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة'}</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            invoice={editingInvoice}
            onSuccess={() => setIsFormOpen(false)}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeleteInvoiceButton({ invoice }: { invoice: Invoice }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteInvoice();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: invoice.id }, {
      onSuccess: () => {
        toast({ title: "تم حذف الفاتورة بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        setOpen(false);
      },
      onError: (error) => {
        toast({ title: "خطأ في حذف الفاتورة", description: (error as any)?.data?.error, variant: "destructive" });
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
          <DialogTitle>حذف الفاتورة {invoice.invoiceNumber}؟</DialogTitle>
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

function InvoiceForm({ invoice, onSuccess, onCancel }: { invoice: Invoice | null; onSuccess: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice ? {
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      customerEmail: invoice.customerEmail || '',
      currency: invoice.currency,
      tax: Number(invoice.tax),
      status: invoice.status,
      dueDate: invoice.dueDate || '',
      notes: invoice.notes || '',
      items: invoice.items.map((i) => ({ description: i.description, amount: i.amount })),
    } : {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      currency: 'IQD',
      tax: 0,
      status: 'draft',
      dueDate: '',
      notes: '',
      items: [{ description: '', amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const watchedItems = form.watch('items');
  const watchedTax = form.watch('tax');
  const subtotal = watchedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const total = subtotal + (Number(watchedTax) || 0);

  const onSubmit = (values: InvoiceFormValues) => {
    const data = {
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail || null,
      currency: values.currency,
      status: values.status as any,
      dueDate: values.dueDate || null,
      notes: values.notes || null,
      items: values.items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
      subtotal: String(subtotal),
      tax: String(values.tax || 0),
      total: String(total),
      issuedAt: values.status === 'issued' || values.status === 'paid' ? new Date().toISOString() : null,
    };

    if (invoice) {
      updateMutation.mutate({ id: invoice.id, data }, {
        onSuccess: () => {
          toast({ title: "تم تحديث الفاتورة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: (e as any)?.data?.error, variant: "destructive" }),
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "تم إنشاء الفاتورة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: (e as any)?.data?.error, variant: "destructive" }),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="customerName" render={({ field }) => (
            <FormItem><FormLabel>اسم العميل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="customerPhone" render={({ field }) => (
            <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="customerEmail" render={({ field }) => (
            <FormItem><FormLabel>البريد الإلكتروني (اختياري)</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem><FormLabel>تاريخ الاستحقاق (اختياري)</FormLabel><FormControl><Input type="date" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="space-y-2">
          <FormLabel>بنود الفاتورة</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                <FormItem className="flex-1"><FormControl><Input placeholder="الوصف" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name={`items.${index}.amount`} render={({ field }) => (
                <FormItem className="w-32"><FormControl><Input type="number" step="0.01" placeholder="المبلغ" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', amount: 0 })} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> إضافة بند
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem><FormLabel>العملة</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="tax" render={({ field }) => (
            <FormItem><FormLabel>الضريبة</FormLabel><FormControl><Input type="number" step="0.01" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>الحالة</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="issued">صادرة</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex items-center justify-end gap-6 py-3 px-4 bg-muted/30 rounded-md text-sm">
          <span className="text-muted-foreground">المجموع الفرعي: <span className="font-semibold text-foreground" dir="ltr">{subtotal.toLocaleString('ar')}</span></span>
          <span className="text-muted-foreground">الضريبة: <span className="font-semibold text-foreground" dir="ltr">{(Number(watchedTax) || 0).toLocaleString('ar')}</span></span>
          <span className="font-bold">الإجمالي: <span dir="ltr">{total.toLocaleString('ar')}</span></span>
        </div>

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            {invoice ? 'تحديث الفاتورة' : 'إنشاء الفاتورة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
