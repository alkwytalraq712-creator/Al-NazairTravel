import React, { useState } from 'react';
import { 
  useListAllFlightBookings, 
  useUpdateFlightBookingStatus,
  FlightBooking,
  FlightBookingStatus
} from '@workspace/api-client-react';
import { getListAllFlightBookingsQueryKey } from '@workspace/api-client-react';
import { Loader2, Search, Filter, Plane, Clock, ExternalLink, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { STATUS_ARABIC, CABIN_CLASS_ARABIC, formatDateAr, formatDateTimeAr } from '@/lib/translations';

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ticketed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  completed: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  held: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  expired_hold: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export function FlightBookings() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  const { data: bookings, isLoading } = useListAllFlightBookings({
    status: statusFilter !== 'all' ? (statusFilter as FlightBookingStatus) : undefined
  });

  const filteredBookings = bookings?.filter(b => 
    b.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase()) ||
    b.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">حجوزات الطيران</h1>
          <p className="text-muted-foreground mt-1">مراجعة وإدارة حجوزات تذاكر الطيران.</p>
        </div>
      </div>

      <Card className="border-border/50">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/10">
          <div className="relative w-full sm:w-80">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="البحث بالمرجع، الإيميل، أو رقم الهاتف..." 
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
                {Object.values(FlightBookingStatus).map(status => (
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
              <Plane className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">لم يتم العثور على حجوزات طيران</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                لا توجد حجوزات تطابق عوامل التصفية الحالية.
              </p>
            </div>
          ) : (
            filteredBookings?.map(booking => (
              <FlightBookingRow key={booking.id} booking={booking} />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function FlightBookingRow({ booking }: { booking: FlightBooking }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <div className="p-4 sm:p-6 hover:bg-muted/10 transition-colors flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex gap-4 items-start w-full lg:w-auto">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
            {booking.offer.airlineLogoUrl ? (
              <img src={booking.offer.airlineLogoUrl} alt="" className="w-8 h-8 object-contain" />
            ) : (
              <Plane className="w-6 h-6 text-purple-500" />
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
            <h3 className="text-base font-semibold text-foreground truncate" dir="ltr">
              {booking.offer.fromAirport} → {booking.offer.toAirport}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {booking.offer.airlineName} ({booking.offer.flightNumber}) • {formatDateTimeAr(booking.offer.departTime)}
            </p>
            <div className="flex items-center text-xs text-muted-foreground mt-2 gap-4">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {booking.passengers.length} مسافرين
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                تم الحجز {formatDateAr(booking.createdAt)}
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
              تفاصيل حجز الطيران
              <span className="font-mono text-xs font-normal px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                {booking.referenceNumber}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">معلومات الرحلة</h4>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={booking.offer.airlineLogoUrl} alt="" className="w-10 h-10 object-contain" />
                        <div>
                          <p className="font-medium text-sm">{booking.offer.airlineName}</p>
                          <p className="text-xs text-muted-foreground">{booking.offer.flightNumber} • <span>{CABIN_CLASS_ARABIC[booking.offer.cabinClass] || booking.offer.cabinClass}</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-lg font-bold" dir="ltr">{formatDateAr(booking.offer.departTime, 'HH:mm')}</p>
                        <p className="text-sm text-muted-foreground font-mono">{booking.offer.fromAirport}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDateAr(booking.offer.departTime, 'd MMM yy')}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-4">
                        <div className="w-full h-[1px] bg-border relative">
                          <Plane className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground rotate-180 transform scale-x-[-1]" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{Math.floor(booking.offer.durationMinutes / 60)}س {booking.offer.durationMinutes % 60}د</p>
                        <p className="text-xs text-muted-foreground">{booking.offer.stops === 0 ? 'مباشر' : `${booking.offer.stops} توقف`}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold" dir="ltr">{formatDateAr(booking.offer.arriveTime, 'HH:mm')}</p>
                        <p className="text-sm text-muted-foreground font-mono">{booking.offer.toAirport}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDateAr(booking.offer.arriveTime, 'd MMM yy')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">معلومات التواصل</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">رقم الهاتف</span><span className="font-medium" dir="ltr">{booking.phone}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">البريد الإلكتروني</span><span className="font-medium">{booking.email}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">السعر الإجمالي</span><span className="font-medium">{booking.offer.price} {booking.offer.currency}</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">المسافرين ({booking.passengers.length})</h4>
                <div className="space-y-3">
                  {booking.passengers.map((passenger, idx) => (
                    <Card key={idx} className="bg-muted/10">
                      <CardContent className="p-4 text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <UserIcon gender={passenger.gender} />
                          <span className="font-medium">{passenger.firstName} {passenger.lastName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pe-7">
                          <div>الجنسية: <span className="text-foreground">{passenger.nationality}</span></div>
                          <div>ت. الميلاد: <span className="text-foreground">{passenger.dob}</span></div>
                          <div>الجواز: <span className="text-foreground font-mono uppercase">{passenger.passportNumber}</span></div>
                          <div>الانتهاء: <span className="text-foreground">{passenger.passportExpiry}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UserIcon({ gender }: { gender: string }) {
  return (
    <div className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
      {gender === 'Male' || gender === 'ذكر' ? 'M' : 'F'}
    </div>
  );
}

function StatusUpdater({ booking }: { booking: FlightBooking }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateFlightBookingStatus();

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate(
      { id: booking.id, data: { status: newStatus as FlightBookingStatus } },
      {
        onSuccess: () => {
          toast({ title: "تم تحديث الحالة", description: `حالة الحجز الآن: ${STATUS_ARABIC[newStatus] || newStatus}` });
          queryClient.setQueryData(
            getListAllFlightBookingsQueryKey(),
            (old: FlightBooking[] | undefined) => {
              if (!old) return old;
              return old.map(b => b.id === booking.id ? { ...b, status: newStatus as FlightBookingStatus } : b);
            }
          );
        },
        onError: (e) => toast({ title: "فشل التحديث", description: (e.data as { error?: string })?.error, variant: "destructive" })
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={booking.status} onValueChange={handleStatusChange} disabled={updateMutation.isPending}>
        <SelectTrigger className={`w-[150px] h-9 text-xs font-medium ${STATUS_COLORS[booking.status] || ""}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(FlightBookingStatus).map(status => (
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
