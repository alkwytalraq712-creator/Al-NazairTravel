import { useState } from 'react';
import { Plane, Map, FileText, Power, Settings2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGetServiceSettings, useUpdateServiceSettings, getGetServiceSettingsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

// ── Service card config ────────────────────────────────────────────────────────
const SERVICES = [
  {
    key: 'flightsEnabled' as const,
    label: 'حجوزات الطيران',
    labelEn: 'Flight Bookings',
    description: 'تشغيل أو إيقاف خدمة حجز تذاكر الطيران بالكامل. عند الإيقاف تختفي من الواجهة وتُمنع من أي رابط مباشر.',
    icon: Plane,
    activeGrad: 'from-blue-500 to-blue-600',
    inactiveGrad: 'from-slate-400 to-slate-500',
    activeBg: 'bg-blue-50 dark:bg-blue-950/30',
    activeBorder: 'border-blue-200 dark:border-blue-800',
    inactiveBg: 'bg-slate-50 dark:bg-slate-900/30',
    inactiveBorder: 'border-slate-200 dark:border-slate-700',
  },
  {
    key: 'packagesEnabled' as const,
    label: 'باقات السفر',
    labelEn: 'Travel Packages',
    description: 'تشغيل أو إيقاف عرض الباقات السياحية وتقديم الطلبات. عند الإيقاف تُزال الباقات بالكامل من التطبيق.',
    icon: Map,
    activeGrad: 'from-emerald-500 to-emerald-600',
    inactiveGrad: 'from-slate-400 to-slate-500',
    activeBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    activeBorder: 'border-emerald-200 dark:border-emerald-800',
    inactiveBg: 'bg-slate-50 dark:bg-slate-900/30',
    inactiveBorder: 'border-slate-200 dark:border-slate-700',
  },
  {
    key: 'visasEnabled' as const,
    label: 'خدمة التأشيرات',
    labelEn: 'Visa Services',
    description: 'تشغيل أو إيقاف عرض أنواع التأشيرات وتقديم الطلبات. عند الإيقاف لا يمكن الوصول لأي تأشيرة.',
    icon: FileText,
    activeGrad: 'from-violet-500 to-violet-600',
    inactiveGrad: 'from-slate-400 to-slate-500',
    activeBg: 'bg-violet-50 dark:bg-violet-950/30',
    activeBorder: 'border-violet-200 dark:border-violet-800',
    inactiveBg: 'bg-slate-50 dark:bg-slate-900/30',
    inactiveBorder: 'border-slate-200 dark:border-slate-700',
  },
] as const;

export function ServiceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetServiceSettings();
  const updateMutation = useUpdateServiceSettings();
  const [pending, setPending] = useState<string | null>(null);

  async function handleToggle(key: 'flightsEnabled' | 'packagesEnabled' | 'visasEnabled', value: boolean) {
    setPending(key);
    try {
      const updated = await updateMutation.mutateAsync({ [key]: value });
      queryClient.setQueryData(getGetServiceSettingsQueryKey(), updated);
      const svc = SERVICES.find(s => s.key === key)!;
      toast({
        title: value ? `✅ ${svc.label} — مفعّلة` : `⏸ ${svc.label} — موقوفة`,
        description: value
          ? 'الخدمة تعمل الآن وستظهر فوراً في التطبيق.'
          : 'تم إيقاف الخدمة. لن يتمكن العملاء من الوصول إليها.',
      });
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحديث الإعدادات. يرجى المحاولة مجدداً.', variant: 'destructive' });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">

      {/* ── Page header ── */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          <Settings2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الخدمات</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            تحكم فوري في خدمات التطبيق — أوقف أي خدمة أو أعد تشغيلها بضغطة زر دون تحديث.
          </p>
        </div>
      </div>

      {/* ── Summary strip ── */}
      {!isLoading && settings && (
        <Card className="border-0 bg-muted/40">
          <CardContent className="py-4 px-5">
            <div className="flex flex-wrap gap-3">
              {SERVICES.map(svc => {
                const enabled = settings[svc.key];
                return (
                  <div key={svc.key} className="flex items-center gap-2">
                    {enabled
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      : <XCircle     className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                    <span className={`text-sm font-medium ${enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {svc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Service toggles ── */}
      <div className="space-y-4">
        {SERVICES.map((svc) => {
          const enabled = settings ? settings[svc.key] : true;
          const isPending = pending === svc.key;
          const Icon = svc.icon;

          return (
            <Card
              key={svc.key}
              className={`transition-all duration-300 border-2 ${
                enabled ? svc.activeBorder : svc.inactiveBorder
              } ${enabled ? svc.activeBg : svc.inactiveBg}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-md transition-all duration-300 ${
                    enabled ? svc.activeGrad : svc.inactiveGrad
                  }`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-base text-foreground">{svc.label}</span>
                      <span className="text-xs text-muted-foreground">{svc.labelEn}</span>
                      <Badge
                        variant={enabled ? 'default' : 'secondary'}
                        className={`text-xs px-2 py-0.5 ${enabled ? 'bg-emerald-500 hover:bg-emerald-500 text-white' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}
                      >
                        {enabled ? 'مفعّلة' : 'موقوفة'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{svc.description}</p>
                  </div>

                  {/* Toggle */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={enabled}
                      onCheckedChange={(v) => handleToggle(svc.key, v)}
                      disabled={isLoading || isPending}
                      className={`scale-125 ${enabled ? '' : 'opacity-70'}`}
                    />
                    <span className={`text-xs font-semibold ${enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {isPending ? '...' : enabled ? 'تشغيل' : 'إيقاف'}
                    </span>
                  </div>

                </div>

                {/* Status bar */}
                <div className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all ${
                  enabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                }`}>
                  <Power className="w-3.5 h-3.5 flex-shrink-0" />
                  {enabled
                    ? 'الخدمة تعمل بشكل طبيعي — تظهر في التطبيق ويمكن الوصول إليها'
                    : 'الخدمة موقوفة — مخفية من التطبيق ومحظورة من أي رابط مباشر'}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Info note ── */}
      <Card className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            <strong>ملاحظة:</strong> تنعكس التغييرات فوراً على التطبيق دون الحاجة إلى إعادة تشغيل أو تحديث.
            عند الإيقاف يُخفى القسم من الواجهة ويُمنع الوصول إليه حتى في حالة الروابط المباشرة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
