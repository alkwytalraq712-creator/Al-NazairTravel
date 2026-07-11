import React, { useState } from 'react';
import { 
  useListVisas, 
  useCreateVisa, 
  useUpdateVisa, 
  useDeleteVisa,
  Visa,
  VisaType
} from '@workspace/api-client-react';
import { Loader2, Plus, Edit, Trash2, Clock, Filter, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListVisasQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { VISA_TYPE_ARABIC } from '@/lib/translations';

// ─── Zod schema ──────────────────────────────────────────────────────────────

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
  // Per-visa requirement flags
  requiresGulfResidence:   z.boolean().default(false),
  requiresPersonalPhoto:   z.boolean().default(true),
  requiresPassportImage:   z.boolean().default(true),
  requiresBankStatement:   z.boolean().default(false),
  requiresFlightBooking:   z.boolean().default(false),
  requiresHotelBooking:    z.boolean().default(false),
  requiresTravelInsurance: z.boolean().default(false),
  requiresAdditionalDocs:  z.boolean().default(false),
  requiresInvitationLetter:z.boolean().default(false),
  // Eligibility rules
  allowedNationalities:    z.string().default(''),  // comma-separated
  blockedNationalities:    z.string().default(''),  // comma-separated
  requiresGulfResidenceCountry: z.string().default(''),
  requiresValidVisaCountries:   z.string().default(''),  // comma-separated
});

type VisaFormValues = z.infer<typeof visaSchema>;

// ─── Requirement flag labels ─────────────────────────────────────────────────

const REQUIREMENT_FLAGS: Array<{ field: keyof VisaFormValues; label: string; description: string }> = [
  { field: 'requiresGulfResidence',    label: 'إقامة خليجية سارية',    description: 'يشترط وجود إقامة سارية في دولة خليجية' },
  { field: 'requiresPersonalPhoto',    label: 'صورة شخصية',            description: 'صورة شخصية حديثة بخلفية بيضاء' },
  { field: 'requiresPassportImage',    label: 'صورة الجواز',            description: 'الصفحة الرئيسية من جواز السفر' },
  { field: 'requiresBankStatement',    label: 'كشف حساب بنكي',         description: '3 أشهر الأخيرة على الأقل' },
  { field: 'requiresFlightBooking',    label: 'حجز طيران',              description: 'تذكرة طيران مؤكدة أو حجز مؤقت' },
  { field: 'requiresHotelBooking',     label: 'حجز فندق',               description: 'حجز إقامة مؤكد طوال فترة الرحلة' },
  { field: 'requiresTravelInsurance',  label: 'تأمين سفر',              description: 'بوليصة تأمين سفر سارية' },
  { field: 'requiresAdditionalDocs',   label: 'مستندات إضافية',         description: 'مستندات خاصة بهذه الوجهة' },
  { field: 'requiresInvitationLetter', label: 'خطاب تعريف',             description: 'خطاب تعريف من جهة العمل أو الجهة الداعية' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

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
          <p className="text-muted-foreground mt-1">إدارة وجهات الدول وأنواع التأشيرات ومتطلباتها.</p>
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
                <TableHead>المتطلبات</TableHead>
                <TableHead className="text-end">السعر</TableHead>
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
              ) : filteredVisas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    لم يتم العثور على تأشيرات. قم بإنشاء واحدة للبدء.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisas?.map(visa => {
                  const v = visa as any;
                  const reqCount = REQUIREMENT_FLAGS.filter(r => v[r.field]).length;
                  return (
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
                            <div className="font-semibold text-foreground flex items-center gap-2">
                              {visa.countryName}
                              {visa.isFeatured && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">مميزة</Badge>}
                            </div>
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
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{reqCount} متطلبات</span>
                          {v.requiresGulfResidence && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-400 text-amber-600">خليجية</Badge>
                          )}
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
                  );
                })
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

// ─── Delete Button ────────────────────────────────────────────────────────────

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
      onError: (error: any) => {
        toast({ title: "خطأ في حذف التأشيرة", description: error?.data?.error ?? error?.message, variant: "destructive" });
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
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 ms-2 animate-spin" /> : <Trash2 className="w-4 h-4 ms-2" />}
            حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Visa Form ────────────────────────────────────────────────────────────────

function VisaForm({ visa, onSuccess, onCancel }: { visa: Visa | null; onSuccess: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVisa();
  const updateMutation = useUpdateVisa();

  const v = visa as any;

  const form = useForm<VisaFormValues>({
    resolver: zodResolver(visaSchema),
    defaultValues: visa ? {
      ...visa,
      price: Number(visa.price),
      requiredDocuments: visa.requiredDocuments.join('\n'),
      requiresGulfResidence:    v?.requiresGulfResidence    ?? false,
      requiresPersonalPhoto:    v?.requiresPersonalPhoto    ?? true,
      requiresPassportImage:    v?.requiresPassportImage    ?? true,
      requiresBankStatement:    v?.requiresBankStatement    ?? false,
      requiresFlightBooking:    v?.requiresFlightBooking    ?? false,
      requiresHotelBooking:     v?.requiresHotelBooking     ?? false,
      requiresTravelInsurance:  v?.requiresTravelInsurance  ?? false,
      requiresAdditionalDocs:   v?.requiresAdditionalDocs   ?? false,
      requiresInvitationLetter: v?.requiresInvitationLetter ?? false,
      allowedNationalities:    (v?.allowedNationalities    ?? []).join(', '),
      blockedNationalities:    (v?.blockedNationalities    ?? []).join(', '),
      requiresGulfResidenceCountry: v?.requiresGulfResidenceCountry ?? '',
      requiresValidVisaCountries:  (v?.requiresValidVisaCountries  ?? []).join(', '),
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
      requiresGulfResidence:    false,
      requiresPersonalPhoto:    true,
      requiresPassportImage:    true,
      requiresBankStatement:    false,
      requiresFlightBooking:    false,
      requiresHotelBooking:     false,
      requiresTravelInsurance:  false,
      requiresAdditionalDocs:   false,
      requiresInvitationLetter: false,
      allowedNationalities: '',
      blockedNationalities: '',
      requiresGulfResidenceCountry: '',
      requiresValidVisaCountries: '',
    }
  });

  const splitCSV = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

  const onSubmit = (values: VisaFormValues) => {
    const data = {
      ...values,
      requiredDocuments: values.requiredDocuments.split('\n').map(s => s.trim()).filter(Boolean),
      allowedNationalities: splitCSV(values.allowedNationalities as string),
      blockedNationalities: splitCSV(values.blockedNationalities as string),
      requiresGulfResidenceCountry: (values.requiresGulfResidenceCountry as string).trim() || null,
      requiresValidVisaCountries: splitCSV(values.requiresValidVisaCountries as string),
    };

    if (visa) {
      updateMutation.mutate({ id: visa.id, data }, {
        onSuccess: () => {
          toast({ title: "تم تحديث التأشيرة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListVisasQueryKey() });
          onSuccess();
        },
        onError: (e: any) => toast({ title: "خطأ", description: e?.data?.error ?? e?.message, variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "تم إنشاء التأشيرة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListVisasQueryKey() });
          onSuccess();
        },
        onError: (e: any) => toast({ title: "خطأ", description: e?.data?.error ?? e?.message, variant: "destructive" })
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="countryName" render={({ field }) => (
            <FormItem><FormLabel>اسم الدولة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="visaType" render={({ field }) => (
            <FormItem>
              <FormLabel>نوع التأشيرة</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
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
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>تأشيرة مميزة</FormLabel>
              <p className="text-sm text-muted-foreground mt-1">أظهر هذه التأشيرة بشكل بارز في الصفحة الرئيسية.</p>
            </div>
          </FormItem>
        )} />

        {/* ── Requirement Flags ─────────────────────────────────────────────── */}
        <div className="rounded-md border p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">متطلبات التأشيرة</p>
          </div>
          <p className="text-xs text-muted-foreground -mt-1 mb-3">
            حدد الوثائق والشروط التي يحتاجها المتقدم لهذه التأشيرة. سيتم عرضها للمستخدم عند التقديم.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {REQUIREMENT_FLAGS.map(({ field, label, description }) => (
              <FormField
                key={field}
                control={form.control}
                name={field as any}
                render={({ field: f }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={!!f.value}
                        onCheckedChange={f.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-0.5 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">{label}</FormLabel>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* ── Eligibility Rules ──────────────────────────────────────────────── */}
        <div className="rounded-md border p-4 space-y-3">
          <p className="font-semibold text-sm">شروط الأهلية</p>
          <p className="text-xs text-muted-foreground">
            حدد الجنسيات المسموح بها أو المحظورة، وشروط الإقامة الخليجية والتأشيرات السارية المطلوبة.
            اترك الحقل فارغاً لعدم تطبيق الشرط.
          </p>
          <FormField control={form.control} name="allowedNationalities" render={({ field }) => (
            <FormItem>
              <FormLabel>الجنسيات المسموح لها (مفصولة بفاصلة)</FormLabel>
              <FormControl><Input placeholder="مثال: Iraqi, Yemeni, Jordanian" {...field} /></FormControl>
              <p className="text-xs text-muted-foreground">فارغ = جميع الجنسيات مسموح لها</p>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="blockedNationalities" render={({ field }) => (
            <FormItem>
              <FormLabel>الجنسيات المحظورة (مفصولة بفاصلة)</FormLabel>
              <FormControl><Input placeholder="مثال: Israeli" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="requiresGulfResidenceCountry" render={({ field }) => (
            <FormItem>
              <FormLabel>دولة الإقامة الخليجية المحددة (اختياري)</FormLabel>
              <FormControl><Input placeholder="مثال: Saudi Arabia — فارغ = أي دولة خليجية" {...field} /></FormControl>
              <p className="text-xs text-muted-foreground">يُستخدم فقط عند تفعيل شرط الإقامة الخليجية</p>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="requiresValidVisaCountries" render={({ field }) => (
            <FormItem>
              <FormLabel>يشترط تأشيرة سارية لـ (مفصولة بفاصلة)</FormLabel>
              <FormControl><Input placeholder="مثال: schengen, uk, us, canada, australia, japan" {...field} /></FormControl>
              <p className="text-xs text-muted-foreground">فارغ = لا يشترط تأشيرة سابقة</p>
              <FormMessage />
            </FormItem>
          )} />
        </div>

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
