import React, { useState, useEffect } from 'react';
import { 
  useListAllNotifications,
  getListAllNotificationsQueryKey,
  useSendNotification,
  NotificationType
} from '@workspace/api-client-react';
import { 
  Loader2, Send, Bell, Calendar, User, Users, 
  Smartphone, Megaphone, Info, RefreshCw,
  Plane, Earth, Package, CreditCard, Settings, Tag
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { NOTIFICATION_TYPE_ARABIC, formatDateTimeAr } from '@/lib/translations';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { customFetch } from '@workspace/api-client-react';

// ─── Deep link routes ─────────────────────────────────────────────────────────
const DEEP_LINKS = [
  { label: 'لا يوجد رابط',          value: '' },
  { label: 'طلباتي وحجوزاتي',       value: '/bookings' },
  { label: 'صفحة التأشيرات',         value: '/visa' },
  { label: 'الباقات السياحية',       value: '/packages' },
  { label: 'الرحلات الجوية',         value: '/my-flights' },
  { label: 'الملف الشخصي',           value: '/my-profile' },
  { label: 'الإشعارات',              value: '/notifications' },
];

// ─── Type icons ───────────────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, React.ElementType> = {
  visa_application: Earth,
  package_booking:  Package,
  flight_booking:   Plane,
  general:          Bell,
  promotion:        Tag,
  payment:          CreditCard,
  system:           Settings,
};

const TYPE_COLORS: Record<string, string> = {
  visa_application: '#3B82F6',
  package_booking:  '#8B5CF6',
  flight_booking:   '#C9A060',
  general:          '#6366F1',
  promotion:        '#F59E0B',
  payment:          '#10B981',
  system:           '#6B7280',
};

const notificationSchema = z.object({
  target:   z.enum(['all', 'user']),
  userId:   z.coerce.number().optional().nullable(),
  title:    z.string().min(1, 'العنوان مطلوب'),
  message:  z.string().min(1, 'الرسالة مطلوبة'),
  type:     z.nativeEnum(NotificationType),
  imageUrl: z.string().url().optional().or(z.literal('')),
  route:    z.string().optional(),
});

// ─── Push stats card ──────────────────────────────────────────────────────────
function PushStatsCard() {
  const [stats, setStats] = useState<{ totalUsers: number; withPushToken: number } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await customFetch('/api/admin/notifications/push-stats');
      if (res.ok) setStats(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          إحصائيات الإشعارات الفورية (Push)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : stats ? (
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold">{stats.withPushToken}</p>
              <p className="text-xs text-muted-foreground">جهاز مسجّل للإشعارات</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">إجمالي المستخدمين</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalUsers > 0 ? Math.round((stats.withPushToken / stats.totalUsers) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">نسبة التغطية</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">تعذر تحميل الإحصائيات</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function Notifications() {
  const { data: notifications, isLoading, refetch } = useListAllNotifications();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const broadcastCount = notifications?.filter((n) => n.userId === null).length ?? 0;
  const targetedCount  = notifications?.filter((n) => n.userId !== null).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الإشعارات</h1>
          <p className="text-muted-foreground mt-1">إرسال إشعارات فورية للعملاء وإدارة الرسائل.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Send className="w-4 h-4 rotate-180" />
            إرسال إشعار
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PushStatsCard />
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{broadcastCount}</p>
                <p className="text-xs text-muted-foreground">إشعار جماعي</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{targetedCount}</p>
                <p className="text-xs text-muted-foreground">إشعار شخصي</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications list */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">سجل الإشعارات المرسلة</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border/50">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Bell className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">لم يتم إرسال إشعارات بعد</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                استخدم زر "إرسال إشعار" لإرسال أول إشعار للمستخدمين.
              </p>
            </div>
          ) : (
            notifications?.map((n) => {
              const TypeIcon = TYPE_ICONS[n.type] ?? Bell;
              const color = TYPE_COLORS[n.type] ?? '#6366F1';
              return (
                <div key={n.id} className="p-4 sm:p-5 hover:bg-muted/10 transition-colors">
                  <div className="flex gap-4 items-start">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: color + '18' }}
                    >
                      <TypeIcon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-sm">{n.title}</h4>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                          {NOTIFICATION_TYPE_ARABIC[n.type] || n.type}
                        </Badge>
                        {n.userId === null ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                            <Users className="w-2.5 h-2.5" />
                            جميع المستخدمين
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 border-blue-300 text-blue-600">
                            <User className="w-2.5 h-2.5" />
                            مستخدم #{n.userId}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTimeAr(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Send dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إرسال إشعار فوري</DialogTitle>
          </DialogHeader>
          <NotificationForm
            onSuccess={() => { setIsFormOpen(false); refetch(); }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Send Form ────────────────────────────────────────────────────────────────
function NotificationForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sendMutation = useSendNotification();

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      target: 'all',
      userId: null as any,
      title: '',
      message: '',
      type: NotificationType.general,
      imageUrl: '',
      route: '',
    },
  });

  const target = form.watch('target');

  const onSubmit = (values: z.infer<typeof notificationSchema>) => {
    const data: Record<string, string> = {};
    if (values.route) data.route = values.route;

    sendMutation.mutate({
      data: {
        userId: values.target === 'user' ? values.userId : null,
        title: values.title,
        message: values.message,
        type: values.type,
        imageUrl: values.imageUrl || undefined,
        data,
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: '✅ تم إرسال الإشعار بنجاح', description: values.target === 'all' ? 'سيصل لجميع المستخدمين المسجلين' : `سيصل للمستخدم #${values.userId}` });
        queryClient.invalidateQueries({ queryKey: getListAllNotificationsQueryKey() });
        onSuccess();
      },
      onError: (e: any) => toast({ title: 'خطأ في الإرسال', description: e?.message ?? e?.error, variant: 'destructive' }),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">

        {/* Target audience */}
        <FormField control={form.control} name="target" render={({ field }) => (
          <FormItem>
            <FormLabel>الجمهور المستهدف</FormLabel>
            <FormControl>
              <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-1.5 cursor-pointer">
                    <Users className="w-3.5 h-3.5" />
                    جميع المستخدمين
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user" className="flex items-center gap-1.5 cursor-pointer">
                    <User className="w-3.5 h-3.5" />
                    مستخدم محدد
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )} />

        {/* User ID (conditional) */}
        {target === 'user' && (
          <FormField control={form.control} name="userId" render={({ field }) => (
            <FormItem>
              <FormLabel>معرف المستخدم (ID)</FormLabel>
              <FormControl>
                <Input
                  type="number" dir="ltr"
                  placeholder="مثال: 42"
                  {...field} value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        {/* Type */}
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>نوع الإشعار</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الإشعار" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.values(NotificationType).map((type) => {
                  const Icon = TYPE_ICONS[type] ?? Bell;
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: TYPE_COLORS[type] }} />
                        {NOTIFICATION_TYPE_ARABIC[type] || type}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* Title */}
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>عنوان الإشعار *</FormLabel>
            <FormControl>
              <Input placeholder="مثال: عرض خاص لرحلات الصيف 🌴" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Message */}
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel>نص الإشعار *</FormLabel>
            <FormControl>
              <Textarea className="resize-none" rows={3} placeholder="اكتب نص الإشعار هنا..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Deep link */}
        <FormField control={form.control} name="route" render={({ field }) => (
          <FormItem>
            <FormLabel>الصفحة التي تفتح عند الضغط</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصفحة (اختياري)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {DEEP_LINKS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription className="text-xs">عند الضغط على الإشعار سيتم فتح هذه الصفحة مباشرة</FormDescription>
          </FormItem>
        )} />

        {/* Image URL */}
        <FormField control={form.control} name="imageUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>رابط صورة (اختياري)</FormLabel>
            <FormControl>
              <Input dir="ltr" placeholder="https://example.com/image.jpg" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Info note */}
        <div className="flex gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <p>سيتم إرسال الإشعار فوراً داخل التطبيق وعلى أجهزة المستخدمين المسجّلين للإشعارات الفورية.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" disabled={sendMutation.isPending} className="gap-2">
            {sendMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</>
              : <><Send className="w-4 h-4 rotate-180" /> إرسال الإشعار</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
