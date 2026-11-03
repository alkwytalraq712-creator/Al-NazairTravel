import React from 'react';
import { useGetAdminDashboardSummary } from '@workspace/api-client-react';
import { 
  Users, 
  FileText, 
  Plane, 
  Map, 
  Clock, 
  Activity,
  ArrowUpLeft,
  Bell,
  Briefcase,
  Ticket
} from 'lucide-react';
import { CircleDollarSign, TrendingUp, UserRound, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { formatDateTimeAr } from '@/lib/translations';
import { Skeleton } from '@/components/ui/skeleton';

const PACKAGE_STATUS_AR: Record<string, string> = {
  received: 'تم الاستلام',
  reviewing: 'قيد المراجعة',
  confirmed: 'مؤكد',
  awaiting_payment: 'بانتظار الدفع',
  paid: 'مدفوع',
  vouchers_issued: 'القسائم صادرة',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const formatNumber = (value: number) => value.toLocaleString('ar-IQ');
const formatMonth = (value: string) => value.slice(5);

export function Dashboard() {
  const { data: summary, isLoading } = useGetAdminDashboardSummary();

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">نظرة عامة</h1>
          <p className="text-muted-foreground mt-1">جاري تحميل بيانات مركز التحكم...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-24" /></CardTitle>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي العملاء",
      value: summary.totalCustomers,
      icon: Users,
      description: "المستخدمين المسجلين",
      link: "/customers",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "طلبات التأشيرات",
      value: summary.totalVisaApplications,
      pending: summary.pendingVisaApplications,
      icon: FileText,
      description: `${summary.pendingVisaApplications} طلب يتطلب الاهتمام`,
      link: "/visa-applications",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      title: "حجوزات الباقات",
      value: summary.totalPackageBookings,
      pending: summary.pendingPackageBookings,
      icon: Map,
      description: `${summary.pendingPackageBookings} حجز يتطلب الاهتمام`,
      link: "/package-bookings",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      title: "حجوزات الطيران",
      value: summary.totalFlightBookings,
      pending: summary.pendingFlightBookings,
      icon: Plane,
      description: `${summary.pendingFlightBookings} حجز يتطلب الاهتمام`,
      link: "/flight-bookings",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    }
  ];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">نظرة عامة</h1>
        <p className="text-muted-foreground mt-1">المقاييس في الوقت الفعلي والنشاطات الأخيرة عبر المنصة.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-border/50 hover-elevate transition-all overflow-hidden relative group">
            <div className={`absolute top-0 end-0 w-32 h-32 -me-8 -mt-8 rounded-full ${stat.bgColor} blur-2xl group-hover:scale-150 transition-transform duration-700 ease-out`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${stat.bgColor} ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{stat.value.toLocaleString('ar-IQ')}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {stat.pending !== undefined && stat.pending > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
                {stat.description}
              </p>
              <div className="mt-4">
                <Link href={stat.link}>
                  <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-secondary/50">
                    عرض التفاصيل
                    <ArrowUpLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-6" aria-labelledby="package-sales-report">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 id="package-sales-report" className="text-xl font-bold">تقارير مبيعات الباقات السياحية</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            قراءة سريعة لأداء الحجوزات خلال آخر ستة أشهر. الإيرادات تقديرية حسب سعر الباقة وعدد المسافرين.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Ticket className="w-5 h-5" /></div>
              <div><p className="text-xs text-muted-foreground">إجمالي حجوزات الباقات</p><p className="text-2xl font-bold mt-1">{formatNumber(summary.packageSales.totalBookings)}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><UserRound className="w-5 h-5" /></div>
              <div><p className="text-xs text-muted-foreground">إجمالي المسافرين</p><p className="text-2xl font-bold mt-1">{formatNumber(summary.packageSales.totalTravelers)}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><RefreshCw className="w-5 h-5" /></div>
              <div><p className="text-xs text-muted-foreground">حجوزات مؤكدة أو مدفوعة</p><p className="text-2xl font-bold mt-1">{formatNumber(summary.packageSales.confirmedBookings)}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center"><CircleDollarSign className="w-5 h-5" /></div>
              <div><p className="text-xs text-muted-foreground">الإيرادات التقديرية</p><div className="flex flex-wrap gap-1 mt-1">{summary.packageSales.estimatedRevenueByCurrency.length === 0 ? <span className="text-2xl font-bold">—</span> : summary.packageSales.estimatedRevenueByCurrency.map(item => <span key={item.currency} className="text-lg font-bold">{formatNumber(item.amount)} {item.currency}</span>)}</div></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader>
              <CardTitle>اتجاه الحجوزات الشهري</CardTitle>
              <CardDescription>عدد الحجوزات والمسافرين خلال آخر ستة أشهر</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px] ps-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.packageSales.monthlyTrend} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={34} />
                  <Tooltip labelFormatter={(label) => `شهر ${String(label)}`} formatter={(value, name) => [formatNumber(Number(value)), name === 'bookings' ? 'الحجوزات' : 'المسافرون']} />
                  <Bar dataKey="bookings" name="bookings" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="travelers" name="travelers" fill="#d4a72c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>توزيع حالات الحجوزات</CardTitle>
              <CardDescription>الحالة الحالية لكل طلب باقة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary.packageSales.statusBreakdown.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات بعد.</p> : summary.packageSales.statusBreakdown.map(item => {
                const percentage = summary.packageSales.totalBookings ? Math.round((item.count / summary.packageSales.totalBookings) * 100) : 0;
                return <div key={item.status} className="space-y-1.5"><div className="flex justify-between text-sm"><span>{PACKAGE_STATUS_AR[item.status] || item.status}</span><span className="font-semibold">{formatNumber(item.count)} ({percentage}٪)</span></div><div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} /></div></div>;
              })}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>أفضل الباقات مبيعاً</CardTitle>
            <CardDescription>مرتبة حسب عدد الحجوزات، مع استبعاد الحجوزات الملغاة من التقدير المالي</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.packageSales.topPackages.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">لا توجد حجوزات باقات حتى الآن.</p> : <div className="divide-y divide-border/50">{summary.packageSales.topPackages.map((item, index) => <div key={item.packageId} className="py-3 flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{index + 1}</span><div className="flex-1 min-w-0"><p className="font-medium truncate">{item.packageName}</p><p className="text-xs text-muted-foreground mt-1">{formatNumber(item.bookings)} حجوزات · {formatNumber(item.travelers)} مسافرين</p></div><div className="text-end"><p className="font-semibold">{formatNumber(item.estimatedRevenue)} {item.currency}</p><p className="text-xs text-muted-foreground">تقديري</p></div></div>)}</div>}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle>أحدث النشاطات</CardTitle>
            </div>
            <CardDescription>أحدث الإجراءات التي اتخذها العملاء</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {summary.recentActivity.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">لا يوجد نشاط حديث.</div>
              ) : (
                summary.recentActivity.map((activity, i) => (
                  <div key={i} className="p-4 flex gap-4 hover:bg-muted/10 transition-colors items-start">
                    <div className="mt-0.5 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/50">
                          {activity.type.replace('_', ' ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTimeAr(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm bg-primary text-primary-foreground border-primary-border overflow-hidden relative">
          <div className="absolute top-0 end-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -me-20 -mt-20 pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-primary-foreground">إجراءات سريعة</CardTitle>
            <CardDescription className="text-primary-foreground/80">الأدوات الأكثر استخداماً</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <Link href="/notifications">
              <Button variant="secondary" className="w-full justify-start font-semibold">
                <Bell className="w-4 h-4 me-2" /> إرسال إشعار للجميع
              </Button>
            </Link>
            <Link href="/visas">
              <Button variant="secondary" className="w-full justify-start font-semibold">
                <Briefcase className="w-4 h-4 me-2" /> إضافة عرض تأشيرة
              </Button>
            </Link>
            <Link href="/packages">
              <Button variant="secondary" className="w-full justify-start font-semibold">
                <Ticket className="w-4 h-4 me-2" /> إنشاء باقة سياحية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
