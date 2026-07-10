import React, { useState } from 'react';
import { 
  useListAllPackageBookings, 
  useUpdatePackageBookingStatus,
  PackageBooking,
  PackageBookingStatus
} from '@workspace/api-client-react';
import { getListAllPackageBookingsQueryKey } from '@workspace/api-client-react';
import { Loader2, Search, Filter, Map, Clock, ExternalLink, Users, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { STATUS_ARABIC, formatDateAr } from '@/lib/translations';

const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  reviewing: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  awaiting_payment: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  paid: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  vouchers_issued: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  completed: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20"
};

export function PackageBookings() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  const { data: bookings, isLoading } = useListAllPackageBookings({
    status: statusFilter !== 'all' ? (statusFilter as PackageBookingStatus) : undefined
  });

  const filteredBookings = bookings?.filter(b => 
    b.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase()) ||
    b.travelerNames.some(name => name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">حجوزات الباقات</h1>
          <p className="text-muted-foreground mt-1">مراجعة وإدارة حجوزات الباقات السياحية.</p>
        </div>
      </div>

      <Card className="border-border/50">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/10">
          <div className="relative w-full sm:w-80">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="البحث بالمرجع، اسم المسافر، أو الإيميل..." 
              className="ps-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-background">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.values(PackageBookingStatus).map(status => (
                  <SelectItem key={status} value={status}>
                    {STATUS_ARABIC[status] || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredBookings?.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Map className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">لم يتم العثور على حجوزات</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                لا توجد حجوزات باقات سياحية تطابق معايير البحث.
              </p>
            </div>
          ) : (
            filteredBookings?.map(booking => (
              <PackageBookingRow key={booking.id} booking={booking} />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function PackageBookingRow({ booking }: { booking: PackageBooking }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <div className="p-4 sm:p-6 hover:bg-muted/10 transition-colors flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex gap-4 items-start w-full lg:w-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 overflow-hidden">
            {booking.package?.images[0] ? (
              <img src={booking.package.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <Map className="w-6 h-6 text-emerald-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                {booking.referenceNumber}
              </span>
              <Badge variant="outline" className={STATUS_COLORS[booking.status] || ""}>
                {STATUS_ARABIC[booking.status] || booking.status}
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-foreground truncate">
              {booking.package?.name || 'باقة غير معروفة'}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {booking.package?.city}، {booking.package?.country} • {formatDateAr(booking.travelDate)}
            </p>
            <div className="flex items-center text-xs text-muted-foreground mt-2 gap-4">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {booking.travelersCount} مسافرين
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                تاريخ الحجز {formatDateAr(booking.createdAt, 'd MMM')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0">
          <StatusUpdater booking={booking} />
          <Button variant="outline" onClick={() => setIsDetailsOpen(true)} className="gap-2">
            عرض التفاصيل
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              تفاصيل حجز الباقة
              <span className="font-mono text-xs font-normal px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                {booking.referenceNumber}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">تفاصيل الباقة</h4>
                {booking.package ? (
                  <Card className="bg-muted/30">
                    <CardContent className="p-0">
                      {booking.package.images[0] && (
                        <div className="h-32 w-full relative">
                          <img src={booking.package.images[0]} className="w-full h-full object-cover rounded-t-lg" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-lg" />
                          <div className="absolute bottom-3 start-4 text-white">
                            <p className="font-bold">{booking.package.name}</p>
                            <p className="text-xs opacity-90">{booking.package.city}، {booking.package.country}</p>
                          </div>
                        </div>
                      )}
                      <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          <span>{booking.package.days} أيام / {booking.package.nights} ليالي</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary">{booking.package.priceFrom} {booking.package.currency}</span> / للفرد
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">تفاصيل الباقة غير متوفرة.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">معلومات الرحلة</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">تاريخ السفر</span><span className="font-medium">{formatDateAr(booking.travelDate)}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">عدد المسافرين</span><span className="font-medium">{booking.travelersCount}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">رقم للتواصل</span><span className="font-medium" dir="ltr">{booking.phone}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">البريد الإلكتروني</span><span className="font-medium">{booking.email}</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">المسافرين ({booking.travelerNames.length})</h4>
                <div className="space-y-3">
                  {booking.travelerNames.map((name, idx) => (
                    <div key={idx} className="flex flex-col gap-1 p-3 rounded-md bg-muted/20 border border-border/50">
                      <span className="font-medium text-sm flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </div>
                        {name}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono ms-7">
                        جواز السفر: {booking.passportNumbers[idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {booking.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">طلبات خاصة</h4>
                  <div className="p-4 rounded-md bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400 italic">
                    "{booking.notes}"
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusUpdater({ booking }: { booking: PackageBooking }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdatePackageBookingStatus();

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate(
      { id: booking.id, data: { status: newStatus as PackageBookingStatus } },
      {
        onSuccess: () => {
          toast({ title: "تم تحديث الحالة", description: `حالة الحجز الآن: ${STATUS_ARABIC[newStatus] || newStatus}` });
          queryClient.setQueryData(
            getListAllPackageBookingsQueryKey(),
            (old: PackageBooking[] | undefined) => {
              if (!old) return old;
              return old.map(b => b.id === booking.id ? { ...b, status: newStatus as PackageBookingStatus } : b);
            }
          );
        },
        onError: (e) => toast({ title: "فشل التحديث", description: e.error, variant: "destructive" })
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={booking.status} onValueChange={handleStatusChange} disabled={updateMutation.isPending}>
        <SelectTrigger className={`w-[160px] h-9 text-xs font-medium ${STATUS_COLORS[booking.status] || ""}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(PackageBookingStatus).map(status => (
            <SelectItem key={status} value={status} className="text-xs">
              {STATUS_ARABIC[status] || status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
