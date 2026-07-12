import React, { useState } from 'react';
import {
  useListAllVisaApplications,
  useUpdateVisaApplicationStatus,
  VisaApplication,
  VisaApplicationStatus
} from '@workspace/api-client-react';
import { getListAllVisaApplicationsQueryKey } from '@workspace/api-client-react';
import {
  Loader2, Search, Filter, FileText, CheckCircle2, XCircle,
  Clock, ExternalLink, Download, AlertCircle, Plus, X, FolderOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { STATUS_ARABIC, VISA_TYPE_ARABIC, formatDateAr } from '@/lib/translations';

// ─── Document photo with lightbox ──────────────────────────────────────────────
function AppDocumentPhoto({ src, label }: { src: string; label: string }) {
  const [open, setOpen] = React.useState(false);
  function handleDownload() {
    const a = document.createElement('a');
    a.href = src;
    a.download = label.replace(/\s+/g, '_') + '.jpg';
    a.target = '_blank';
    a.click();
  }
  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <button onClick={handleDownload} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <Download className="w-3 h-3" />تنزيل
          </button>
        </div>
        <img
          src={src}
          alt={label}
          className="w-full h-36 object-cover rounded-lg cursor-pointer border border-border hover:opacity-90 transition-opacity"
          onClick={() => setOpen(true)}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setOpen(false)}>
          <div className="relative max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <img src={src} alt={label} className="w-full rounded-xl max-h-[80vh] object-contain" />
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded border border-border bg-background text-sm hover:bg-muted">إغلاق</button>
              <button onClick={handleDownload} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Download className="w-3 h-3" />تنزيل
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Status colors ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  filling_data:          "bg-gray-500/10 text-gray-500 border-gray-500/20",
  received:              "bg-blue-500/10 text-blue-500 border-blue-500/20",
  reviewing:             "bg-amber-500/10 text-amber-500 border-amber-500/20",
  awaiting_documents:    "bg-orange-500/10 text-orange-500 border-orange-500/20",
  submitted_to_embassy:  "bg-purple-500/10 text-purple-500 border-purple-500/20",
  processing:            "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  approved:              "bg-teal-500/10 text-teal-600 border-teal-500/20",
  issued:                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  completed:             "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  rejected:              "bg-red-500/10 text-red-500 border-red-500/20",
  cancelled:             "bg-gray-400/10 text-gray-400 border-gray-400/20",
};

// ─── Pre-defined common documents ──────────────────────────────────────────────
const PRESET_DOCS = [
  'كشف حساب بنكي (3 أشهر)',
  'خطاب عمل / تعريف وظيفي',
  'كشف راتب',
  'عقد الإيجار أو سند الملكية',
  'تصريح إقامة ساري',
  'بطاقة هوية وطنية',
  'صور شخصية إضافية',
  'تذكرة عودة مؤكدة',
  'تأمين سفر',
  'حجز فندق مؤكد',
  'عقد زواج / شهادة ميلاد',
  'وثيقة كفالة مالية',
  'إفادة قنصلية',
  'رخصة قيادة سارية',
  'شهادة مدرسية / جامعية',
];

// ─── Request Documents Dialog ──────────────────────────────────────────────────
function RequestDocumentsDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (docs: Array<{ name: string }>) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customInput, setCustomInput] = useState('');

  const toggle = (doc: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(doc) ? next.delete(doc) : next.add(doc);
      return next;
    });

  const addCustom = () => {
    const doc = customInput.trim();
    if (!doc) return;
    setSelected(prev => new Set(prev).add(doc));
    setCustomInput('');
  };

  const handleConfirm = () => {
    const docs = Array.from(selected).map(name => ({ name }));
    onConfirm(docs);
    setSelected(new Set());
    setCustomInput('');
  };

  const handleCancel = () => {
    setSelected(new Set());
    setCustomInput('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && handleCancel()}>
      <DialogContent className="max-w-md max-h-[85dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-orange-500" />
            تحديد المستندات المطلوبة من العميل
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-1">
          حدد المستندات المطلوبة — ستظهر للعميل في التطبيق مع إمكانية رفعها.
        </p>

        {/* Selected badges */}
        {selected.size > 0 && (
          <div className="flex flex-wrap gap-1.5 p-3 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
            {Array.from(selected).map(doc => (
              <span
                key={doc}
                className="inline-flex items-center gap-1 text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 rounded-full px-2.5 py-1 border border-orange-300 dark:border-orange-700"
              >
                {doc}
                <button onClick={() => toggle(doc)} className="hover:text-orange-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Preset list */}
        <div className="overflow-y-auto flex-1 space-y-1 border rounded-md p-2">
          {PRESET_DOCS.map(doc => (
            <div key={doc} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => toggle(doc)}>
              <Checkbox checked={selected.has(doc)} onCheckedChange={() => toggle(doc)} id={`doc-${doc}`} />
              <label htmlFor={`doc-${doc}`} className="text-sm cursor-pointer flex-1">{doc}</label>
            </div>
          ))}
        </div>

        {/* Custom document input */}
        <div className="flex gap-2 pt-1">
          <Input
            placeholder="مستند مخصص..."
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            className="text-right flex-1"
            onKeyDown={e => e.key === 'Enter' && addCustom()}
          />
          <Button type="button" variant="outline" size="icon" onClick={addCustom} disabled={!customInput.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <DialogFooter className="gap-2 flex-row justify-end">
          <Button variant="outline" onClick={handleCancel}>إلغاء</Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            تأكيد وإرسال الطلب ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
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

// ─── ApplicationRow ─────────────────────────────────────────────────────────────
function ApplicationRow({ application }: { application: VisaApplication }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const app = application as any;
  const requestedDocs: Array<{ name: string }> = app.requestedDocuments ?? [];
  const uploadedDocs: Array<{ name: string; url: string }> = app.additionalDocumentUrls ?? [];
  const pendingCount = requestedDocs.filter(d => !uploadedDocs.find(u => u.name === d.name)).length;

  return (
    <>
      <div className="p-4 sm:p-6 hover:bg-muted/10 transition-colors flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex gap-4 items-start w-full lg:w-auto">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
            {app.visa?.countryFlagUrl ? (
              <img src={app.visa.countryFlagUrl} alt="" className="w-6 h-4 object-cover shadow-sm" />
            ) : (
              <FileText className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                {application.referenceNumber}
              </span>
              <Badge variant="outline" className={STATUS_COLORS[application.status] || ""}>
                {STATUS_ARABIC[application.status] || application.status}
              </Badge>
              {/* Pending documents badge */}
              {application.status === 'awaiting_documents' && pendingCount > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 bg-orange-50 text-orange-700 border-orange-300">
                  <AlertCircle className="w-2.5 h-2.5 me-1" />
                  {pendingCount} مستند معلق
                </Badge>
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground truncate">{application.fullName}</h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {app.visa?.countryName || 'دولة غير معروفة'} •{' '}
              {app.visa ? (VISA_TYPE_ARABIC[app.visa.visaType] || app.visa.visaType) : 'تأشيرة'} •{' '}
              {application.passportNumber}
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

      {/* Details dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              تفاصيل الطلب
              <span className="font-mono text-xs font-normal px-2 py-0.5 rounded bg-muted text-muted-foreground border">
                {application.referenceNumber}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {/* Left column */}
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

              {/* Requested additional documents */}
              {requestedDocs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    المستندات الإضافية المطلوبة
                  </h4>
                  <div className="space-y-2">
                    {requestedDocs.map((doc, i) => {
                      const uploaded = uploadedDocs.find(u => u.name === doc.name);
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md border text-sm ${
                            uploaded
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
                              : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                          }`}
                        >
                          {uploaded
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            : <XCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          }
                          <span className="flex-1 text-right font-medium">{doc.name}</span>
                          {uploaded && (
                            <a
                              href={uploaded.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              عرض
                            </a>
                          )}
                          {!uploaded && (
                            <span className="text-xs text-orange-500">لم يُرفع</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">التأشيرة المطلوبة</h4>
                {app.visa ? (
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 flex gap-3 items-center">
                      <img src={app.visa.countryFlagUrl} alt="" className="w-10 h-7 object-cover rounded shadow-sm" />
                      <div>
                        <p className="font-medium">{app.visa.countryName} - <span className="capitalize">{VISA_TYPE_ARABIC[app.visa.visaType] || app.visa.visaType}</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">{app.visa.validity} • {app.visa.entriesAllowed}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">تفاصيل التأشيرة غير متوفرة.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">المستندات والصور</h4>
                <div className="grid grid-cols-2 gap-3">
                  {application.passportImageUrl ? (
                    <AppDocumentPhoto src={application.passportImageUrl} label="صورة جواز السفر" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-md text-muted-foreground">
                      <XCircle className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-xs">لا توجد صورة جواز</span>
                    </div>
                  )}
                  {application.personalPhotoUrl ? (
                    <AppDocumentPhoto src={application.personalPhotoUrl} label="الصورة الشخصية" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-md text-muted-foreground">
                      <XCircle className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-xs">لا توجد صورة شخصية</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded additional documents */}
              {uploadedDocs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    ملفات رُفعت من العميل
                  </h4>
                  <div className="space-y-2">
                    {uploadedDocs.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 hover:opacity-80 transition-opacity"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium text-right">{doc.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      </a>
                    ))}
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

// ─── StatusUpdater ──────────────────────────────────────────────────────────────
function StatusUpdater({ application }: { application: VisaApplication }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateVisaApplicationStatus();
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const submitStatus = (status: string, requestedDocuments?: Array<{ name: string }>) => {
    const data: any = { status };
    if (requestedDocuments && requestedDocuments.length > 0) {
      data.requestedDocuments = requestedDocuments;
    }
    updateMutation.mutate(
      { id: application.id, data: data as any },
      {
        onSuccess: (updated) => {
          toast({
            title: "تم تحديث الحالة",
            description: `حالة الطلب الآن: ${STATUS_ARABIC[status] || status}`,
          });
          queryClient.setQueryData(
            getListAllVisaApplicationsQueryKey(),
            (old: VisaApplication[] | undefined) => {
              if (!old) return old;
              return old.map(app =>
                app.id === application.id ? { ...app, ...updated } : app
              );
            },
          );
        },
        onError: (e: any) =>
          toast({ title: "فشل التحديث", description: e?.data?.error ?? e?.message, variant: "destructive" }),
      },
    );
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'awaiting_documents') {
      setPendingStatus(newStatus);
      setDocsDialogOpen(true);
    } else {
      submitStatus(newStatus);
    }
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

      <RequestDocumentsDialog
        open={docsDialogOpen}
        onConfirm={(docs) => {
          setDocsDialogOpen(false);
          if (pendingStatus) submitStatus(pendingStatus, docs);
          setPendingStatus(null);
        }}
        onCancel={() => {
          setDocsDialogOpen(false);
          setPendingStatus(null);
        }}
      />
    </div>
  );
}
