import React, { useState } from 'react';
import { 
  useListVisas, 
  useCreateVisa, 
  useUpdateVisa, 
  useDeleteVisa,
  Visa,
  VisaType
} from '@workspace/api-client-react';
import { Loader2, Plus, Edit, Trash2, Globe, Clock, CreditCard, Filter } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListVisasQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { VISA_TYPE_ARABIC } from '@/lib/translations';

const visaSchema = z.object({
  countryName: z.string().min(1, 'اسم الدولة مطلوب'),
  countryFlagUrl: z.string().url('يجب أن يكون رابطاً صحيحاً'),
  countryImageUrl: z.string().url('يجب أن يكون رابطاً صحيحاً'),
  visaType: z.nativeEnum(VisaType),
  processingTime: z.string().min(1, 'مطلوب'),
  stayDuration: z.string().min(1, 'مطلوب'),
  price: z.coerce.number().min(0),
  currency: z.string().min(1, 'مطلوب'),
  description: z.string().min(1, 'مطلوب'),
  requiredDocuments: z.string(),
  entriesAllowed: z.string().min(1, 'مطلوب'),
  validity: z.string().min(1, 'مطلوب'),
  isFeatured: z.boolean().default(false),
});

export function Visas() {
  const { data: visas, isLoading } = useListVisas();
  const [filterType, setFilterType] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<Visa | null>(null);

  const filteredVisas = visas?.filter(v => filterType === 'all' || v.visaType === filterType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">عروض التأشيرات</h1>
          <p className="text-muted-foreground mt-1">إدارة وجهات الدول وأنواع التأشيرات.</p>
        </div>
        <Button onClick={() => { setEditingVisa(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة تأشيرة
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 flex flex-wrap gap-4 items-center bg-muted/20">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">تصفية حسب النوع:</span>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="جميع أنواع التأشيرات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع أنواع التأشيرات</SelectItem>
              {Object.values(VisaType).map(type => (
                <SelectItem key={type} value={type}>
                  {VISA_TYPE_ARABIC[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>الوجهة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المعالجة</TableHead>
                <TableHead>الصلاحية / الإقامة</TableHead>
                <TableHead className="text-end">السعر</TableHead>
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
              ) : filteredVisas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    لم يتم العثور على تأشيرات. قم بإنشاء واحدة للبدء.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisas?.map(visa => (
                  <TableRow key={visa.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={visa.countryFlagUrl} 
                          alt={visa.countryName} 
                          className="w-8 h-6 object-cover rounded shadow-sm"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            {visa.countryName}
                            {visa.isFeatured && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">مميزة</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground">{visa.entriesAllowed}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {VISA_TYPE_ARABIC[visa.visaType] || visa.visaType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Clock className="w-3.5 h-3.5 me-1.5 text-muted-foreground" />
                        {visa.processingTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{visa.validity}</p>
                        <p className="text-xs text-muted-foreground">{visa.stayDuration}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-end font-medium">
                      {visa.price} {visa.currency}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => { setEditingVisa(visa); setIsFormOpen(true); }}
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <DeleteVisaButton visa={visa} />
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
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVisa ? 'تعديل عرض التأشيرة' : 'إنشاء عرض تأشيرة'}</DialogTitle>
          </DialogHeader>
          <VisaForm 
            visa={editingVisa} 
            onSuccess={() => setIsFormOpen(false)} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeleteVisaButton({ visa }: { visa: Visa }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteVisa();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: visa.id }, {
      onSuccess: () => {
        toast({ title: "تم حذف التأشيرة بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListVisasQueryKey() });
        setOpen(false);
      },
      onError: (error) => {
        toast({ title: "خطأ في حذف التأشيرة", description: error.error, variant: "destructive" });
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
          <DialogTitle>حذف تأشيرة {visa.countryName}؟</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف عرض التأشيرة بشكل دائم.</p>
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

function VisaForm({ visa, onSuccess, onCancel }: { visa: Visa | null, onSuccess: () => void, onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVisa();
  const updateMutation = useUpdateVisa();

  const form = useForm<z.infer<typeof visaSchema>>({
    resolver: zodResolver(visaSchema),
    defaultValues: visa ? {
      ...visa,
      requiredDocuments: visa.requiredDocuments.join('\n')
    } : {
      countryName: '',
      countryFlagUrl: '',
      countryImageUrl: '',
      visaType: VisaType.tourism,
      processingTime: '3-5 أيام عمل',
      stayDuration: '30 يوماً',
      price: 0,
      currency: 'USD',
      description: '',
      requiredDocuments: 'جواز السفر\nصورة شخصية',
      entriesAllowed: 'دخول لمرة واحدة',
      validity: '90 يوماً',
      isFeatured: false,
    }
  });

  const onSubmit = (values: z.infer<typeof visaSchema>) => {
    const data = {
      ...values,
      requiredDocuments: values.requiredDocuments.split('\n').map(s => s.trim()).filter(Boolean)
    };

    if (visa) {
      updateMutation.mutate({ id: visa.id, data }, {
        onSuccess: () => {
          toast({ title: "تم تحديث التأشيرة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListVisasQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: e.error, variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "تم إنشاء التأشيرة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListVisasQueryKey() });
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
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="countryName" render={({ field }) => (
            <FormItem><FormLabel>اسم الدولة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="visaType" render={({ field }) => (
            <FormItem>
              <FormLabel>نوع التأشيرة</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(VisaType).map(type => (
                    <SelectItem key={type} value={type}>{VISA_TYPE_ARABIC[type] || type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="countryFlagUrl" render={({ field }) => (
            <FormItem><FormLabel>رابط العلم</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="countryImageUrl" render={({ field }) => (
            <FormItem><FormLabel>رابط صورة الغلاف</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem className="col-span-2"><FormLabel>السعر</FormLabel><FormControl><Input type="number" dir="ltr" className="text-end" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem className="col-span-2"><FormLabel>العملة</FormLabel><FormControl><Input dir="ltr" className="text-end" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="processingTime" render={({ field }) => (
            <FormItem><FormLabel>وقت المعالجة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="stayDuration" render={({ field }) => (
            <FormItem><FormLabel>مدة الإقامة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="validity" render={({ field }) => (
            <FormItem><FormLabel>الصلاحية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="entriesAllowed" render={({ field }) => (
            <FormItem><FormLabel>مرات الدخول المسموحة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea className="resize-none" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField control={form.control} name="requiredDocuments" render={({ field }) => (
          <FormItem>
            <FormLabel>المستندات المطلوبة (كل مستند في سطر)</FormLabel>
            <FormControl><Textarea className="resize-none" rows={4} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="isFeatured" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 gap-3">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>تأشيرة مميزة</FormLabel>
              <p className="text-sm text-muted-foreground mt-1">أظهر هذه التأشيرة بشكل بارز في الصفحة الرئيسية.</p>
            </div>
          </FormItem>
        )} />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            {visa ? 'تحديث التأشيرة' : 'إنشاء التأشيرة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
