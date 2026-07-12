import React, { useState } from 'react';
import { 
  useListAllBanners, 
  useCreateBanner, 
  useUpdateBanner, 
  useDeleteBanner,
  Banner
} from '@workspace/api-client-react';
import { getListAllBannersQueryKey } from '@workspace/api-client-react';
import { Loader2, Plus, Edit, Trash2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

const bannerSchema = z.object({
  imageUrl: z.string().url('يجب أن يكون رابطاً صحيحاً'),
  title: z.string().optional(),
  linkUrl: z.string().url('يجب أن يكون رابطاً صحيحاً').optional().or(z.literal('')),
  sortOrder: z.coerce.number().min(0),
  isActive: z.boolean().default(true),
});

export function Banners() {
  const { data: banners, isLoading } = useListAllBanners();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Sort by order
  const sortedBanners = [...(banners || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">اللافتات الترويجية (Banners)</h1>
          <p className="text-muted-foreground mt-1">إدارة اللافتات المعروضة في الصفحة الرئيسية.</p>
        </div>
        <Button onClick={() => { setEditingBanner(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة لافتة
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : sortedBanners.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">لا توجد لافتات حالياً</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-4">
              أضف أول لافتة ترويجية لعرضها في واجهة التطبيق.
            </p>
            <Button onClick={() => { setEditingBanner(null); setIsFormOpen(true); }} variant="outline">
              إضافة لافتة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedBanners.map((banner) => (
            <BannerCard 
              key={banner.id} 
              banner={banner} 
              onEdit={() => { setEditingBanner(banner); setIsFormOpen(true); }} 
            />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'تعديل اللافتة' : 'إنشاء لافتة'}</DialogTitle>
          </DialogHeader>
          <BannerForm 
            banner={editingBanner} 
            nextOrder={sortedBanners.length > 0 ? sortedBanners[sortedBanners.length - 1].sortOrder + 10 : 0}
            onSuccess={() => setIsFormOpen(false)} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerCard({ banner, onEdit }: { banner: Banner, onEdit: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateBanner();
  
  const toggleActive = () => {
    updateMutation.mutate(
      { id: banner.id, data: { isActive: !banner.isActive } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAllBannersQueryKey() });
          toast({ title: banner.isActive ? "تم تعطيل اللافتة" : "تم تنشيط اللافتة" });
        }
      }
    );
  };

  return (
    <Card className={`overflow-hidden transition-all border-border/50 ${!banner.isActive ? 'opacity-60' : ''}`}>
      <div className="aspect-[21/9] bg-muted relative group">
        <img 
          src={banner.imageUrl} 
          alt={banner.title || 'Banner'} 
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 ms-2" /> تعديل
          </Button>
          <DeleteBannerButton banner={banner} />
        </div>
        {!banner.isActive && (
          <div className="absolute top-2 start-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            غير نشط
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold truncate ps-2">{banner.title || 'بدون عنوان'}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 rounded">
              #{banner.sortOrder}
            </span>
          </div>
        </div>
        {banner.linkUrl ? (
          <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="flex items-center text-xs text-primary hover:underline truncate">
            <LinkIcon className="w-3 h-3 ms-1 flex-shrink-0" />
            <span className="truncate" dir="ltr">{banner.linkUrl}</span>
          </a>
        ) : (
          <span className="text-xs text-muted-foreground flex items-center">
            <LinkIcon className="w-3 h-3 ms-1 opacity-50" /> لا يوجد رابط
          </span>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center border-t border-border/50 mt-4 bg-muted/10 h-14">
        <Label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={banner.isActive} onCheckedChange={toggleActive} disabled={updateMutation.isPending} />
          <span className="text-sm">{banner.isActive ? 'نشط' : 'غير نشط'}</span>
        </Label>
      </CardFooter>
    </Card>
  );
}

function DeleteBannerButton({ banner }: { banner: Banner }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteBanner();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: banner.id }, {
      onSuccess: () => {
        toast({ title: "تم حذف اللافتة بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListAllBannersQueryKey() });
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف اللافتة؟</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">هل أنت متأكد من حذف هذه اللافتة؟ لا يمكن التراجع عن هذا الإجراء.</p>
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

function BannerForm({ banner, nextOrder, onSuccess, onCancel }: { banner: Banner | null, nextOrder: number, onSuccess: () => void, onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();

  const form = useForm<z.infer<typeof bannerSchema>>({
    resolver: zodResolver(bannerSchema),
    defaultValues: banner ? {
      imageUrl: banner.imageUrl,
      title: banner.title || '',
      linkUrl: banner.linkUrl || '',
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    } : {
      imageUrl: '',
      title: '',
      linkUrl: '',
      sortOrder: nextOrder,
      isActive: true,
    }
  });

  const onSubmit = (values: z.infer<typeof bannerSchema>) => {
    const data = {
      ...values,
      linkUrl: values.linkUrl || undefined,
      title: values.title || undefined,
    };

    if (banner) {
      updateMutation.mutate({ id: banner.id, data }, {
        onSuccess: () => {
          toast({ title: "تم تحديث اللافتة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListAllBannersQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: (e.data as { error?: string })?.error, variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "تم إنشاء اللافتة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListAllBannersQueryKey() });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: (e.data as { error?: string })?.error, variant: "destructive" })
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="imageUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>رابط الصورة *</FormLabel>
            <FormControl><Input dir="ltr" placeholder="https://..." {...field} /></FormControl>
            <FormDescription>النسبة الموصى بها: 21:9 (مثال: 2100x900px)</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>العنوان (اختياري)</FormLabel>
            <FormControl><Input placeholder="عروض الصيف" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="linkUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>رابط التوجيه (اختياري)</FormLabel>
            <FormControl><Input dir="ltr" placeholder="https://..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="sortOrder" render={({ field }) => (
            <FormItem>
              <FormLabel>ترتيب الفرز</FormLabel>
              <FormControl><Input type="number" dir="ltr" className="text-end" {...field} /></FormControl>
              <FormDescription>الأرقام الأقل تظهر أولاً</FormDescription>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="isActive" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm h-[76px] mt-2">
              <div className="space-y-0.5">
                <FormLabel className="text-base">تنشيط اللافتة</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            {banner ? 'تحديث اللافتة' : 'إنشاء لافتة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
