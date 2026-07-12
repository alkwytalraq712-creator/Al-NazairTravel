import React, { useState } from 'react';
import { 
  useListTestimonials, 
  useCreateTestimonial, 
  useUpdateTestimonial, 
  useDeleteTestimonial,
  Testimonial
} from '@workspace/api-client-react';
import { Loader2, Plus, Edit, Trash2, Star, Quote } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const testimonialSchema = z.object({
  customerName: z.string().min(1, 'الاسم مطلوب'),
  avatarUrl: z.string().url('يجب أن يكون رابطاً صحيحاً').optional().or(z.literal('')),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(1, 'التقييم أو الرأي مطلوب'),
});

export function Testimonials() {
  const { data: testimonials, isLoading } = useListTestimonials();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الآراء والتقييمات</h1>
          <p className="text-muted-foreground mt-1">إدارة آراء العملاء المعروضة في الصفحة الرئيسية.</p>
        </div>
        <Button onClick={() => { setEditingTestimonial(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة تقييم
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : testimonials?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Quote className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">لا توجد تقييمات حتى الآن</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-4">
              أضف آراء إيجابية لعملائك لتعزيز الثقة.
            </p>
            <Button onClick={() => { setEditingTestimonial(null); setIsFormOpen(true); }} variant="outline">
              إضافة تقييم
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {testimonials?.map((testimonial) => (
            <Card key={testimonial.id} className="hover-elevate transition-all border-border/50 group relative">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border/50">
                    <AvatarImage src={testimonial.avatarUrl || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {testimonial.customerName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">{testimonial.customerName}</h3>
                    <div className="flex items-center mt-0.5" dir="ltr">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTestimonial(testimonial); setIsFormOpen(true); }}>
                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <DeleteTestimonialButton testimonial={testimonial} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "{testimonial.comment}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? 'تعديل التقييم' : 'إضافة تقييم'}</DialogTitle>
          </DialogHeader>
          <TestimonialForm 
            testimonial={editingTestimonial} 
            onSuccess={() => setIsFormOpen(false)} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeleteTestimonialButton({ testimonial }: { testimonial: Testimonial }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteTestimonial();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: testimonial.id }, {
      onSuccess: () => {
        toast({ title: "تم حذف التقييم بنجاح" });
        queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف التقييم؟</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">هل أنت متأكد من حذف رأي العميل {testimonial.customerName}؟</p>
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

function TestimonialForm({ testimonial, onSuccess, onCancel }: { testimonial: Testimonial | null, onSuccess: () => void, onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();

  const form = useForm<z.infer<typeof testimonialSchema>>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: testimonial ? {
      customerName: testimonial.customerName,
      avatarUrl: testimonial.avatarUrl || '',
      rating: testimonial.rating,
      comment: testimonial.comment,
    } : {
      customerName: '',
      avatarUrl: '',
      rating: 5,
      comment: '',
    }
  });

  const onSubmit = (values: z.infer<typeof testimonialSchema>) => {
    const data = {
      ...values,
      avatarUrl: values.avatarUrl || undefined,
    };

    if (testimonial) {
      updateMutation.mutate({ id: testimonial.id, data }, {
        onSuccess: () => {
          toast({ title: "تم تحديث التقييم" });
          queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
          onSuccess();
        },
        onError: (e) => toast({ title: "خطأ", description: (e.data as { error?: string })?.error, variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "تم إضافة التقييم بنجاح" });
          queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
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
        <FormField control={form.control} name="customerName" render={({ field }) => (
          <FormItem>
            <FormLabel>اسم العميل *</FormLabel>
            <FormControl><Input placeholder="محمد عبدالله" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField control={form.control} name="avatarUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>رابط الصورة (اختياري)</FormLabel>
            <FormControl><Input dir="ltr" placeholder="https://..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="rating" render={({ field }) => (
          <FormItem>
            <FormLabel>التقييم (1-5) *</FormLabel>
            <FormControl><Input type="number" min={1} max={5} dir="ltr" className="text-end" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="comment" render={({ field }) => (
          <FormItem>
            <FormLabel>الرأي أو التعليق *</FormLabel>
            <FormControl><Textarea className="resize-none" rows={4} placeholder="خدمة ممتازة..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            {testimonial ? 'تحديث' : 'إضافة تقييم'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
