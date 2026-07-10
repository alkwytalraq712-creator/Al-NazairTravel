import React, { useState } from 'react';
import { 
  useListAllNotifications,
  getListAllNotificationsQueryKey,
  useSendNotification,
  NotificationType
} from '@workspace/api-client-react';
import { Loader2, Send, Bell, Calendar, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { NOTIFICATION_TYPE_ARABIC, formatDateTimeAr } from '@/lib/translations';

const notificationSchema = z.object({
  userId: z.coerce.number().optional().nullable(),
  title: z.string().min(1, 'العنوان مطلوب'),
  message: z.string().min(1, 'الرسالة مطلوبة'),
  type: z.nativeEnum(NotificationType),
});

export function Notifications() {
  const { data: notifications, isLoading } = useListAllNotifications();
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الإشعارات</h1>
          <p className="text-muted-foreground mt-1">إرسال رسائل للعملاء أو تنبيهات مباشرة.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Send className="w-4 h-4 rotate-180" />
          إرسال إشعار
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="divide-y divide-border/50">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Bell className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">لم يتم إرسال إشعارات</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                لم تقم بإرسال أي إشعارات بعد. استخدم الزر أعلاه لإرسال إشعار للجميع أو لعميل محدد.
              </p>
            </div>
          ) : (
            notifications?.map((notification) => (
              <div key={notification.id} className="p-4 sm:p-6 hover:bg-muted/10 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0">
                        {NOTIFICATION_TYPE_ARABIC[notification.type] || notification.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTimeAr(notification.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {notification.userId === null ? 'إشعار للجميع (كل المستخدمين)' : `معرف المستخدم: ${notification.userId}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال إشعار</DialogTitle>
          </DialogHeader>
          <NotificationForm onSuccess={() => setIsFormOpen(false)} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotificationForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sendMutation = useSendNotification();

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      userId: null as any,
      title: '',
      message: '',
      type: NotificationType.general,
    }
  });

  const onSubmit = (values: z.infer<typeof notificationSchema>) => {
    sendMutation.mutate({ 
      data: {
        ...values,
        userId: values.userId || null
      } 
    }, {
      onSuccess: () => {
        toast({ title: "تم إرسال الإشعار بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListAllNotificationsQueryKey() });
        onSuccess();
      },
      onError: (e) => toast({ title: "خطأ في الإرسال", description: e.error, variant: "destructive" })
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>نوع الإشعار</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.values(NotificationType).map(type => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {NOTIFICATION_TYPE_ARABIC[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="userId" render={({ field }) => (
          <FormItem>
            <FormLabel>معرف المستخدم المستلم (اختياري)</FormLabel>
            <FormControl>
              <Input type="number" dir="ltr" className="text-end" placeholder="اتركه فارغاً لإرسال الإشعار للجميع" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>العنوان *</FormLabel>
            <FormControl><Input placeholder="تحديث هام" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel>الرسالة *</FormLabel>
            <FormControl><Textarea className="resize-none" rows={4} placeholder="يرجى الملاحظة أن..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" disabled={sendMutation.isPending}>
            {sendMutation.isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            إرسال الإشعار
          </Button>
        </div>
      </form>
    </Form>
  );
}
