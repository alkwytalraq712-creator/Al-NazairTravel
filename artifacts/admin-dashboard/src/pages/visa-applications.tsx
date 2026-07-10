import React, { useState } from 'react';
import { 
  useListAllVisaApplications, 
  useUpdateVisaApplicationStatus,
  VisaApplication,
  VisaApplicationStatus
} from '@workspace/api-client-react';
import { getListAllVisaApplicationsQueryKey } from '@workspace/api-client-react';
import { Loader2, Search, Filter, FileText, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { STATUS_ARABIC, VISA_TYPE_ARABIC, formatDateAr } from '@/lib/translations';

const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  reviewing: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  awaiting_documents: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  submitted_to_embassy: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  processing: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  issued: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  completed: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20"
};

export function VisaApplications() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  const { data: applications, isLoading } = useListAllVisaApplications({
    status: statusFilter !== 'all' ? (statusFilter as VisaApplicationStatus) : undefined
  });

  const filteredApps = applications?.filter(app => 
    app.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
    app.fullName.toLowerCase().includes(search.toLowerCase()) ||
    app.passportNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">طلبات التأشيرات</h1>
          <p className="text-muted-foreground mt-1">مراجعة ومعالجة طلبات التأشيرات الخاصة بالعملاء.</p>
        </div>
      </div>

      <Card className="border-border/50">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/10">
          <div className="relative w-full sm:w-80">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="البحث برقم المرجع، الاسم، أو الجواز..." 
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
                {Object.values(VisaApplicationStatus).map(status => (
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
          ) : filteredApps?.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">لم يتم العثور على طلبات</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                لا توجد طلبات تأشيرة تطابق عوامل التصفية الحالية.
              </p>
            </div>
          ) : (
            filteredApps?.map(app => (
              <ApplicationRow key={app.id} application={app} />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function ApplicationRow({ application }: { application: VisaApplication }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <div className="p-4 sm:p-6 hover:bg-muted/10 transition-colors flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex gap-4 items-start w-full lg:w-auto">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
            {application.visa?.countryFlagUrl ? (
              <img src={application.visa.countryFlagUrl} alt="" className="w-6 h-4 object-cover shadow-sm" />
            ) : (
              <FileText className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                {application.referenceNumber}
              </span>
              <Badge variant="outline" className={STATUS_COLORS[application.status] || ""}>
                {STATUS_ARABIC[application.status] || application.status}
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-foreground truncate">
              {application.fullName}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {application.visa?.countryName || 'دولة غير معروفة'} • {application.visa ? (VISA_TYPE_ARABIC[application.visa.visaType] || application.visa.visaType) : 'تأشيرة'} • {application.passportNumber}
            </p>
            <div className="flex items-center text-xs text-muted-foreground mt-2 gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                تم التقديم في {formatDateAr(application.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0">
          <StatusUpdater application={application} />
          <Button variant="outline" onClick={() => setIsDetailsOpen(true)} className="gap-2">
            عرض التفاصيل
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              تفاصيل الطلب
              <span className="font-mono text-xs font-normal px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                {application.referenceNumber}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">معلومات مقدم الطلب</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">الاسم الكامل</span><span className="font-medium">{application.fullName}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">رقم الهاتف</span><span className="font-medium" dir="ltr">{application.phone}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">البريد الإلكتروني</span><span className="font-medium">{application.email}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">الجنس / تاريخ الميلاد</span><span className="font-medium">{application.gender} • {application.dob}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">الجنسية</span><span className="font-medium">{application.nationality}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">المهنة</span><span className="font-medium">{application.occupation}</span></div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">تفاصيل جواز السفر</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">رقم الجواز</span><span className="font-medium font-mono uppercase">{application.passportNumber}</span></div>
                  <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">تاريخ الانتهاء</span><span className="font-medium">{application.passportExpiry}</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">التأشيرة المطلوبة</h4>
                {application.visa ? (
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 flex gap-3 items-center">
                      <img src={application.visa.countryFlagUrl} alt="" className="w-10 h-7 object-cover rounded shadow-sm" />
                      <div>
                        <p className="font-medium">{application.visa.countryName} - <span className="capitalize">{VISA_TYPE_ARABIC[application.visa.visaType] || application.visa.visaType}</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">{application.visa.validity} • {application.visa.entriesAllowed}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">تفاصيل التأشيرة غير متوفرة.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">المستندات</h4>
                <div className="grid grid-cols-2 gap-3">
                  {application.passportImageUrl ? (
                    <a href={application.passportImageUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 border rounded-md hover:bg-muted transition-colors">
                      <FileText className="w-8 h-8 text-primary mb-2" />
                      <span className="text-xs font-medium">صورة الجواز</span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-md text-muted-foreground">
                      <XCircle className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-xs">لا يوجد جواز</span>
                    </div>
                  )}
                  {application.personalPhotoUrl ? (
                    <a href={application.personalPhotoUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 border rounded-md hover:bg-muted transition-colors">
                      <FileText className="w-8 h-8 text-primary mb-2" />
                      <span className="text-xs font-medium">صورة شخصية</span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-md text-muted-foreground">
                      <XCircle className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-xs">لا توجد صورة</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusUpdater({ application }: { application: VisaApplication }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateVisaApplicationStatus();

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate(
      { id: application.id, data: { status: newStatus as VisaApplicationStatus } },
      {
        onSuccess: () => {
          toast({ title: "تم تحديث الحالة", description: `حالة الطلب الآن: ${STATUS_ARABIC[newStatus] || newStatus}` });
          queryClient.setQueryData(
            getListAllVisaApplicationsQueryKey(),
            (old: VisaApplication[] | undefined) => {
              if (!old) return old;
              return old.map(app => app.id === application.id ? { ...app, status: newStatus as VisaApplicationStatus } : app);
            }
          );
        },
        onError: (e) => toast({ title: "فشل التحديث", description: e.error, variant: "destructive" })
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={application.status} onValueChange={handleStatusChange} disabled={updateMutation.isPending}>
        <SelectTrigger className={`w-[180px] h-9 text-xs font-medium ${STATUS_COLORS[application.status] || ""}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(VisaApplicationStatus).map(status => (
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
