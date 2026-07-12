import React, { useState } from 'react';
import { 
  useListPackages, 
  useCreatePackage, 
  useUpdatePackage, 
  useDeletePackage,
  Package
} from '@workspace/api-client-react';
import { getListPackagesQueryKey } from '@workspace/api-client-react';
import { Loader2, Plus, Edit, Trash2, MapPin, Calendar, Star, DollarSign } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const packageSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  country: z.string().min(1, 'الدولة مطلوبة'),
  city: z.string().min(1, 'المدينة مطلوبة'),
  days: z.coerce.number().min(1),
  nights: z.coerce.number().min(0),
  priceFrom: z.coerce.number().min(0),
  currency: z.string().min(1, 'العملة مطلوبة'),
  rating: z.coerce.number().min(1).max(5).default(5),
  images: z.string().min(1, 'مطلوب رابط صورة واحد على الأقل'),
  videoUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().min(1, 'مطلوب'),
  hotelsIncluded: z.string(),
  hotelStars: z.coerce.number().min(1).max(5),
  roomType: z.string(),
  meals: z.string(),
  transportation: z.string(),
  itinerary: z.array(z.object({
    day: z.coerce.number(),
    title: z.string().min(1),
    description: z.string().min(1)
  })).min(1, 'مطلوب يوم واحد على الأقل في مسار الرحلة'),
  includedServices: z.string(),
  excludedServices: z.string(),
  cancellationPolicy: z.string(),
  isFeatured: z.boolean().default(false),
});

export function Packages() {
  const { data: packages, isLoading } = useListPackages();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الباقات السياحية</h1>
          <p className="text-muted-foreground mt-1">إدارة الباقات السياحية المنظمة ومسارات الرحلات.</p>
        </div>
        <Button onClick={() => { setEditingPackage(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة باقة
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : packages?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">لا توجد باقات حتى الآن</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-4">
              قم بإنشاء أول باقة سياحية لتقديمها للعملاء.
            </p>
            <Button onClick={() => { setEditingPackage(null); setIsFormOpen(true); }} variant="outline">
              إضافة باقة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {packages?.map((pkg) => (
            <PackageCard 
              key={pkg.id} 
              pkg={pkg} 
              onEdit={() => { setEditingPackage(pkg); setIsFormOpen(true); }} 
            />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'تعديل الباقة' : 'إنشاء باقة سياحية'}</DialogTitle>
          </DialogHeader>
          <PackageForm 
            pkg={editingPackage} 
            onSuccess={() => setIsFormOpen(false)} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackageCard({ pkg, onEdit }: { pkg: Package, onEdit: () => void }) {
  return (
    <Card className="overflow-hidden hover-elevate transition-all border-border/50 flex flex-col group">
      <div className="h-48 relative bg-muted">
        {pkg.images[0] ? (
          <img src={pkg.images[0]} alt={pkg.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 end-2 flex flex-col gap-2 items-start opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="icon" className="h-8 w-8 shadow-md" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <DeletePackageButton pkg={pkg} />
        </div>
        <div className="absolute bottom-2 start-2 flex gap-1">
          {pkg.isFeatured && (
            <Badge variant="secondary" className="bg-white/90 text-black border-none backdrop-blur-sm shadow-sm">مميزة</Badge>
          )}
          <Badge variant="secondary" className="bg-white/90 text-black border-none backdrop-blur-sm shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {pkg.rating}
          </Badge>
        </div>
      </div>
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">{pkg.name}</h3>
          <div className="text-end flex-shrink-0">
            <p className="text-xs text-muted-foreground uppercase font-semibold">يبدأ من</p>
            <p className="font-bold text-primary">{pkg.priceFrom} {pkg.currency}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4">
          <MapPin className="w-3.5 h-3.5" />
          {pkg.city}، {pkg.country}
        </p>
        <div className="mt-auto pt-4 border-t border-border/50 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-foreground" />
            {pkg.days} أيام / {pkg.nights} ليالي
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-foreground" />
            فنادق {pkg.hotelStars} نجوم
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeletePackageButton({ pkg }: { pkg: Package }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeletePackage();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: pkg.id }, {
      onSuccess: () => {
        toast({ title: "تم حذف الباقة بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="icon" className="h-8 w-8 shadow-md">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف الباقة؟</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">هل أنت متأكد من حذف باقة "{pkg.name}"؟ لا يمكن التراجع عن هذا الإجراء.</p>
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

function PackageForm({ pkg, onSuccess, onCancel }: { pkg: Package | null, onSuccess: () => void, onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();

  const form = useForm<z.infer<typeof packageSchema>>({
    resolver: zodResolver(packageSchema),
    defaultValues: pkg ? ({
      ...pkg,
      images: pkg.images.join('\n'),
      hotelsIncluded: pkg.hotelsIncluded.join('\n'),
      includedServices: pkg.includedServices.join('\n'),
      excludedServices: pkg.excludedServices.join('\n'),
    } as z.infer<typeof packageSchema>) : {
      name: '',
      country: '',
      city: '',
      days: 7,
      nights: 6,
      priceFrom: 0,
      currency: 'USD',
      rating: 5,
      images: '',
      videoUrl: '',
      description: '',
      hotelsIncluded: '',
      hotelStars: 4,
      roomType: 'غرفة مزدوجة',
      meals: 'الإفطار مشمول',
      transportation: 'استقبال المطار وباص سياحي',
      itinerary: [{ day: 1, title: 'الوصول', description: 'الاستقبال في المطار وتسجيل الدخول للفندق' }],
      includedServices: 'الإقامة الفندقية\nالإفطار اليومي\nالاستقبال والتوديع في المطار',
      excludedServices: 'تذاكر الطيران\nالمصاريف الشخصية\nالإكراميات',
      cancellationPolicy: 'إلغاء مجاني حتى 14 يوم قبل المغادرة.',
      isFeatured: false,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itinerary"
  });

  const onSubmit = (values: z.infer<typeof packageSchema>) => {
    const data = {
      ...values,
      videoUrl: values.videoUrl || undefined,
      images: values.images.split('\n').map(s => s.trim()).filter(Boolean),
      hotelsIncluded: values.hotelsIncluded.split('\n').map(s => s.trim()).filter(Boolean),
      includedServices: values.includedServices.split('\n').map(s => s.trim()).filter(Boolean),
      excludedServices: values.excludedServices.split('\n').map(s => s.trim()).filter(Boolean),
    };

    if (pkg) {
      updateMutation.mutate({ id: pkg.id, data }, {
        onSuccess: () => {
          toast({ title: "تم تحديث الباقة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: (e.data as { error?: string })?.error, variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "تم إنشاء الباقة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: (e.data as { error?: string })?.error, variant: "destructive" })
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">المعلومات الأساسية</h3>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>اسم الباقة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>الدولة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>المدينة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="days" render={({ field }) => (
                <FormItem><FormLabel>الأيام</FormLabel><FormControl><Input type="number" dir="ltr" className="text-end" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="nights" render={({ field }) => (
                <FormItem><FormLabel>الليالي</FormLabel><FormControl><Input type="number" dir="ltr" className="text-end" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="priceFrom" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>يبدأ السعر من</FormLabel><FormControl><Input type="number" dir="ltr" className="text-end" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem><FormLabel>العملة</FormLabel><FormControl><Input dir="ltr" className="text-end" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="images" render={({ field }) => (
              <FormItem><FormLabel>روابط الصور (رابط في كل سطر)</FormLabel><FormControl><Textarea rows={3} dir="ltr" className="text-end font-mono text-xs" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="isFeatured" render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none"><FormLabel>باقة مميزة</FormLabel></div>
              </FormItem>
            )} />
          </div>

          {/* Details & Inclusions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">التفاصيل والخدمات</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="hotelStars" render={({ field }) => (
                <FormItem><FormLabel>نجوم الفندق (1-5)</FormLabel><FormControl><Input type="number" dir="ltr" className="text-end" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="rating" render={({ field }) => (
                <FormItem><FormLabel>تقييم المستخدمين (1-5)</FormLabel><FormControl><Input type="number" step="0.1" dir="ltr" className="text-end" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="roomType" render={({ field }) => (
                <FormItem><FormLabel>نوع الغرفة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="meals" render={({ field }) => (
                <FormItem><FormLabel>الوجبات</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="transportation" render={({ field }) => (
              <FormItem><FormLabel>المواصلات</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="includedServices" render={({ field }) => (
                <FormItem><FormLabel>مشمول (خدمة بكل سطر)</FormLabel><FormControl><Textarea rows={4} className="text-xs" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="excludedServices" render={({ field }) => (
                <FormItem><FormLabel>غير مشمول (خدمة بكل سطر)</FormLabel><FormControl><Textarea rows={4} className="text-xs" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="hotelsIncluded" render={({ field }) => (
              <FormItem><FormLabel>الفنادق المشمولة (فندق بكل سطر)</FormLabel><FormControl><Textarea rows={2} className="text-xs" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cancellationPolicy" render={({ field }) => (
              <FormItem><FormLabel>سياسة الإلغاء</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>

        {/* Itinerary */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-sm">مسار الرحلة بالأيام</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ day: fields.length + 1, title: '', description: '' })}>
              <Plus className="w-4 h-4 me-2" /> إضافة يوم
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg bg-muted/10 relative group">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <FormField control={form.control} name={`itinerary.${index}.day`} render={({ field }) => (
                      <FormItem><FormLabel className="sr-only">اليوم</FormLabel><FormControl><Input type="number" dir="ltr" className="text-end" placeholder="يوم #" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name={`itinerary.${index}.title`} render={({ field }) => (
                      <FormItem><FormLabel className="sr-only">العنوان</FormLabel><FormControl><Input placeholder="عنوان اليوم (مثال: الوصول لباريس)" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name={`itinerary.${index}.description`} render={({ field }) => (
                    <FormItem><FormLabel className="sr-only">الوصف</FormLabel><FormControl><Textarea rows={2} placeholder="ماذا يحدث في هذا اليوم..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-border/50 sticky bottom-0 bg-background pb-2">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
            {pkg ? 'تحديث الباقة' : 'إنشاء الباقة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
