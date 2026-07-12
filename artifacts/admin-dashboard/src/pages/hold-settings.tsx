import React, { useEffect, useState } from 'react';
import {
  useGetHoldSettings,
  useUpdateHoldSettings,
  useListAllFlightBookings,
  useUpdateFlightBookingStatus,
  getGetHoldSettingsQueryKey,
  getListAllFlightBookingsQueryKey,
  FlightBooking,
  FlightBookingStatus,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, AlertTriangle, CheckCircle2, XCircle, Users, Plane, Settings } from 'lucide-react';
import { formatDateTimeAr } from '@/lib/translations';

// ─── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(expiresAt: string | null | undefined): string {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!expiresAt) { setLabel(''); return; }
    function update() {
      const diff = new Date(expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setLabel('انتهت المدة'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setLabel(`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return label;
}

// ─── Countdown cell ────────────────────────────────────────────────────────────
function CountdownCell({ expiresAt }: { expiresAt?: string | null }) {
  const label = useCountdown(expiresAt);
  if (!expiresAt) return <span className="text-muted-foreground text-xs">—</span>;
  const isExpired = new Date(expiresAt).getTime() < Date.now();
  const isWarning = !isExpired && new Date(expiresAt).getTime() - Date.now() < 2 * 3_600_000;
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`font-mono text-sm font-bold tabular-nums ${isExpired ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
        {label}
      </span>
      <span className="text-xs text-muted-foreground">{formatDateTimeAr(expiresAt)}</span>
    </div>
  );
}

// ─── Hold settings form ────────────────────────────────────────────────────────
function HoldSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetHoldSettings();
  const updateMutation = useUpdateHoldSettings();

  const [form, setForm] = useState({ holdEnabled: true, holdFeeAmount: 25, holdDurationHours: 24 });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        holdEnabled: settings.holdEnabled,
        holdFeeAmount: settings.holdFeeAmount,
        holdDurationHours: settings.holdDurationHours,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate(
      { data: form },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetHoldSettingsQueryKey(), updated);
          setDirty(false);
          toast({ title: 'تم الحفظ', description: 'تم تحديث إعدادات الحجز المؤقت بنجاح.' });
        },
        onError: () => toast({ title: 'فشل الحفظ', variant: 'destructive' }),
      },
    );
  };

  if (isLoading) return (
    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="w-4 h-4 text-violet-500" />
          إعدادات الحجز المؤقت
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50">
          <div>
            <p className="font-medium text-sm">تفعيل خدمة الحجز المؤقت</p>
            <p className="text-xs text-muted-foreground mt-0.5">عند التفعيل يمكن للعملاء حجز مؤقت للرحلات مقابل رسوم.</p>
          </div>
          <Switch
            checked={form.holdEnabled}
            onCheckedChange={(v) => { setForm(f => ({ ...f, holdEnabled: v })); setDirty(true); }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fee amount */}
          <div className="space-y-2">
            <Label htmlFor="holdFee">رسوم الحجز المؤقت (USD)</Label>
            <div className="relative">
              <Input
                id="holdFee"
                type="number"
                min={0}
                step={0.5}
                value={form.holdFeeAmount}
                onChange={(e) => { setForm(f => ({ ...f, holdFeeAmount: parseFloat(e.target.value) || 0 })); setDirty(true); }}
                className="pe-12"
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USD</span>
            </div>
            <p className="text-xs text-muted-foreground">رسوم غير قابلة للاسترداد تُدفع عند إنشاء الحجز المؤقت.</p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="holdDuration">مدة الحجز المؤقت (ساعة)</Label>
            <div className="relative">
              <Input
                id="holdDuration"
                type="number"
                min={1}
                max={168}
                step={1}
                value={form.holdDurationHours}
                onChange={(e) => { setForm(f => ({ ...f, holdDurationHours: parseInt(e.target.value) || 24 })); setDirty(true); }}
                className="pe-14"
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ساعة</span>
            </div>
            <p className="text-xs text-muted-foreground">المدة الزمنية المتاحة لإتمام الدفع الكامل.</p>
          </div>
        </div>

        {dirty && (
          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { if (settings) setForm({ holdEnabled: settings.holdEnabled, holdFeeAmount: settings.holdFeeAmount, holdDurationHours: settings.holdDurationHours }); setDirty(false); }}
            >
              تراجع
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              حفظ الإعدادات
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Held bookings table ───────────────────────────────────────────────────────
function HeldBookingRow({ booking }: { booking: FlightBooking }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateFlightBookingStatus();

  const handleStatus = (status: FlightBookingStatus) => {
    updateMutation.mutate(
      { id: booking.id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: 'تم تحديث الحالة', description: `حالة الحجز: ${status === 'confirmed' ? 'مؤكد' : 'ملغى'}` });
          queryClient.invalidateQueries({ queryKey: getListAllFlightBookingsQueryKey() });
        },
        onError: () => toast({ title: 'فشل التحديث', variant: 'destructive' }),
      },
    );
  };

  const isExpired = booking.holdExpiresAt && new Date(booking.holdExpiresAt).getTime() < Date.now();
  const pax = booking.passengers[0];

  return (
    <div className="p-4 sm:p-5 hover:bg-muted/10 transition-colors flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      {/* Info */}
      <div className="flex gap-3 items-start min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
              {booking.referenceNumber}
            </span>
            <Badge variant="outline" className={isExpired ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-violet-500/10 text-violet-500 border-violet-500/20"}>
              {isExpired ? 'انتهت المدة' : 'حجز مؤقت'}
            </Badge>
          </div>
          <p className="text-sm font-semibold" dir="ltr">
            {booking.offer.fromAirport} → {booking.offer.toAirport}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {booking.offer.airlineName} • {pax ? `${pax.firstName} ${pax.lastName}` : '—'}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {booking.passengers.length} مسافر
            </span>
            <span>{booking.offer.price} {booking.offer.currency}</span>
            {booking.holdFeeAmount ? (
              <span className="text-amber-500">رسوم مؤقت: {booking.holdFeeAmount} {booking.offer.currency}</span>
            ) : null}
            <span>{booking.email}</span>
          </div>
        </div>
      </div>

      {/* Countdown + Actions */}
      <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0">
        <CountdownCell expiresAt={booking.holdExpiresAt} />
        <div className="flex items-center gap-2">
          {booking.status === 'held' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={() => handleStatus('confirmed' as FlightBookingStatus)}
                disabled={updateMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4" />
                تأكيد
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-red-500 border-red-500/30 hover:bg-red-500/10"
                onClick={() => handleStatus('cancelled' as FlightBookingStatus)}
                disabled={updateMutation.isPending}
              >
                <XCircle className="w-4 h-4" />
                إلغاء
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function HoldSettings() {
  const { data: allBookings, isLoading } = useListAllFlightBookings();

  const heldBookings = allBookings?.filter(
    (b) => b.status === 'held' || b.status === 'expired_hold',
  ) ?? [];

  const activeHolds = heldBookings.filter((b) => b.status === 'held');
  const expiredHolds = heldBookings.filter((b) => b.status === 'expired_hold');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الحجوزات المؤقتة</h1>
        <p className="text-muted-foreground mt-1">إدارة إعدادات الحجز المؤقت ومراقبة الحجوزات النشطة.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeHolds.length}</p>
              <p className="text-xs text-muted-foreground">حجوزات مؤقتة نشطة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {activeHolds.filter((b) => b.holdExpiresAt && new Date(b.holdExpiresAt).getTime() - Date.now() < 2 * 3_600_000).length}
              </p>
              <p className="text-xs text-muted-foreground">ينتهي خلال ساعتين</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiredHolds.length}</p>
              <p className="text-xs text-muted-foreground">حجوزات منتهية</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings form */}
      <HoldSettingsForm />

      {/* Active holds table */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="w-4 h-4 text-violet-500" />
            الحجوزات المؤقتة النشطة
            {activeHolds.length > 0 && (
              <Badge variant="secondary" className="ms-1">{activeHolds.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <div className="divide-y divide-border/50">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : activeHolds.length === 0 ? (
            <div className="p-10 flex flex-col items-center justify-center text-center">
              <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد حجوزات مؤقتة نشطة حالياً.</p>
            </div>
          ) : (
            activeHolds.map((b) => <HeldBookingRow key={b.id} booking={b} />)
          )}
        </div>
      </Card>

      {/* Expired holds */}
      {expiredHolds.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              الحجوزات المنتهية
              <Badge variant="secondary" className="ms-1">{expiredHolds.length}</Badge>
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-border/50">
            {expiredHolds.map((b) => <HeldBookingRow key={b.id} booking={b} />)}
          </div>
        </Card>
      )}
    </div>
  );
}
