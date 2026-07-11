import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Loader2, Building2, Phone, Globe, Clock, Star, MapPin } from 'lucide-react';
import {
  useGetCompanySettings, useUpdateCompanySettings, getGetCompanySettingsQueryKey,
  useListBranches, useCreateBranch, useUpdateBranch, useDeleteBranch, getListBranchesQueryKey,
  type CompanySettings, type Branch,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', multiline = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {multiline ? (
        <Textarea rows={3} className="resize-none" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} dir={type === 'url' || type === 'tel' ? 'ltr' : undefined} />
      )}
    </div>
  );
}

// ─── Company Settings Form ───────────────────────────────────────────────────
function CompanySettingsForm({ settings }: { settings: CompanySettings }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateCompanySettings();

  const s = settings as any;
  const [form, setForm] = useState({
    companyName: s.companyName ?? '',
    logoUrl: s.logoUrl ?? '',
    about: s.about ?? '',
    address: s.address ?? '',
    websiteUrl: s.websiteUrl ?? '',
    googleMapsUrl: s.googleMapsUrl ?? '',
    phonePrimary: s.phonePrimary ?? '',
    phoneSecondary: s.phoneSecondary ?? '',
    whatsapp: s.whatsapp ?? '',
    emailSupport: s.emailSupport ?? '',
    emailOfficial: s.emailOfficial ?? '',
    instagram: s.instagram ?? '',
    tiktok: s.tiktok ?? '',
    facebook: s.facebook ?? '',
    twitter: s.twitter ?? '',
    snapchat: s.snapchat ?? '',
    youtube: s.youtube ?? '',
    linkedin: s.linkedin ?? '',
    telegram: s.telegram ?? '',
    workDays: s.workDays ?? '',
    workHours: s.workHours ?? '',
    weeklyOff: s.weeklyOff ?? '',
  });

  const set = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    const data: Record<string, string | null> = {};
    for (const [key, val] of Object.entries(form)) {
      data[key] = val.trim() || null;
    }
    updateMutation.mutate({ data: data as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCompanySettingsQueryKey() });
        toast({ title: 'تم الحفظ بنجاح' });
      },
      onError: (e: any) => toast({ title: 'خطأ', description: e?.data?.error ?? e?.message, variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">بيانات الشركة</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="اسم الشركة" value={form.companyName} onChange={set('companyName')} placeholder="قمة النظائر" />
          <Field label="رابط الشعار" value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." type="url" />
        </div>
        <Field label="نبذة عن الشركة" value={form.about} onChange={set('about')} multiline placeholder="وصف مختصر..." />
        <Field label="العنوان الرئيسي" value={form.address} onChange={set('address')} placeholder="الرياض، المملكة العربية السعودية" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="الموقع الإلكتروني" value={form.websiteUrl} onChange={set('websiteUrl')} type="url" placeholder="https://..." />
          <Field label="رابط خرائط Google" value={form.googleMapsUrl} onChange={set('googleMapsUrl')} type="url" placeholder="https://maps.google.com/..." />
        </div>
      </Card>

      {/* Contact */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">أرقام التواصل</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="رقم الهاتف الرئيسي" value={form.phonePrimary} onChange={set('phonePrimary')} type="tel" placeholder="+966..." />
          <Field label="رقم الهاتف البديل" value={form.phoneSecondary} onChange={set('phoneSecondary')} type="tel" placeholder="+966..." />
          <Field label="رقم الواتساب" value={form.whatsapp} onChange={set('whatsapp')} type="tel" placeholder="+966..." />
          <Field label="البريد الإلكتروني لخدمة العملاء" value={form.emailSupport} onChange={set('emailSupport')} type="email" placeholder="support@..." />
          <Field label="البريد الإلكتروني الرسمي" value={form.emailOfficial} onChange={set('emailOfficial')} type="email" placeholder="info@..." />
        </div>
      </Card>

      {/* Social Media */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">مواقع التواصل الاجتماعي</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            ['instagram', 'إنستغرام', 'https://instagram.com/...'],
            ['tiktok', 'تيك توك', 'https://tiktok.com/...'],
            ['facebook', 'فيسبوك', 'https://facebook.com/...'],
            ['twitter', 'منصة X (تويتر)', 'https://x.com/...'],
            ['snapchat', 'سناب شات', 'https://snapchat.com/...'],
            ['youtube', 'يوتيوب', 'https://youtube.com/...'],
            ['linkedin', 'لينكدإن', 'https://linkedin.com/...'],
            ['telegram', 'تيليجرام', 'https://t.me/...'],
          ] as [keyof typeof form, string, string][]).map(([key, label, ph]) => (
            <Field key={key} label={label} value={form[key] as string} onChange={set(key)} type="url" placeholder={ph} />
          ))}
        </div>
      </Card>

      {/* Work Hours */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">أوقات العمل</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="أيام العمل" value={form.workDays} onChange={set('workDays')} placeholder="الأحد – الخميس" />
          <Field label="ساعات العمل" value={form.workHours} onChange={set('workHours')} placeholder="9:00 ص – 6:00 م" />
          <Field label="الإجازة الأسبوعية" value={form.weeklyOff} onChange={set('weeklyOff')} placeholder="الجمعة والسبت" />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 min-w-[140px]">
          {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}

// ─── Branch Form ──────────────────────────────────────────────────────────────
const EMPTY_BRANCH = {
  name: '', country: '', city: '', address: '', googleMapsUrl: '', phone: '',
  whatsapp: '', email: '', workHours: '', workDays: '', imageUrl: '',
  status: 'open', isVisible: true, isMain: false, sortOrder: 0,
};

function BranchDialog({
  open, onClose, branch,
}: { open: boolean; onClose: () => void; branch: Branch | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const [form, setForm] = useState<typeof EMPTY_BRANCH>(
    branch ? {
      name: branch.name, country: branch.country, city: branch.city,
      address: branch.address, googleMapsUrl: branch.googleMapsUrl ?? '',
      phone: branch.phone ?? '', whatsapp: branch.whatsapp ?? '',
      email: branch.email ?? '', workHours: branch.workHours ?? '',
      workDays: branch.workDays ?? '', imageUrl: branch.imageUrl ?? '',
      status: branch.status, isVisible: branch.isVisible,
      isMain: branch.isMain, sortOrder: branch.sortOrder,
    } : EMPTY_BRANCH
  );

  const set = (key: keyof typeof EMPTY_BRANCH) => (val: string | boolean | number) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    const data = { ...form };
    const opts = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        toast({ title: branch ? 'تم تحديث الفرع' : 'تم إنشاء الفرع' });
        onClose();
      },
      onError: (e: any) => toast({ title: 'خطأ', description: e?.data?.error ?? e?.message, variant: 'destructive' }),
    };
    if (branch) {
      updateMutation.mutate({ id: branch.id, data: data as any }, opts);
    } else {
      createMutation.mutate({ data: data as any }, opts);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{branch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="اسم الفرع *" value={form.name} onChange={set('name') as (v: string) => void} placeholder="الفرع الرئيسي - الرياض" />
            </div>
            <Field label="الدولة" value={form.country} onChange={set('country') as (v: string) => void} placeholder="المملكة العربية السعودية" />
            <Field label="المدينة" value={form.city} onChange={set('city') as (v: string) => void} placeholder="الرياض" />
            <div className="col-span-2">
              <Field label="العنوان التفصيلي" value={form.address} onChange={set('address') as (v: string) => void} placeholder="حي المنار، شارع الملك فهد" />
            </div>
            <div className="col-span-2">
              <Field label="رابط خرائط Google" value={form.googleMapsUrl} onChange={set('googleMapsUrl') as (v: string) => void} type="url" placeholder="https://maps.google.com/..." />
            </div>
            <Field label="رقم الهاتف" value={form.phone} onChange={set('phone') as (v: string) => void} type="tel" />
            <Field label="رقم الواتساب" value={form.whatsapp} onChange={set('whatsapp') as (v: string) => void} type="tel" />
            <Field label="البريد الإلكتروني" value={form.email} onChange={set('email') as (v: string) => void} type="email" />
            <Field label="ساعات العمل" value={form.workHours} onChange={set('workHours') as (v: string) => void} placeholder="9:00 ص – 6:00 م" />
            <div className="col-span-2">
              <Field label="أيام العمل" value={form.workDays} onChange={set('workDays') as (v: string) => void} placeholder="الأحد – الخميس" />
            </div>
            <div className="col-span-2">
              <Field label="رابط صورة الفرع (اختياري)" value={form.imageUrl} onChange={set('imageUrl') as (v: string) => void} type="url" placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label>حالة الفرع</Label>
              <div className="flex gap-2">
                {['open', 'closed'].map(s => (
                  <button key={s} type="button"
                    onClick={() => set('status')(s)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${form.status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                  >
                    {s === 'open' ? 'مفتوح' : 'مغلق مؤقتاً'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch checked={form.isVisible} onCheckedChange={v => set('isVisible')(v)} id="visible" />
                <Label htmlFor="visible">مرئي في التطبيق</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isMain} onCheckedChange={v => set('isMain')(v)} id="main" />
                <Label htmlFor="main">الفرع الرئيسي</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={isPending || !form.name}>
            {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            {branch ? 'تحديث' : 'إنشاء'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Branches Tab ─────────────────────────────────────────────────────────────
function BranchesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: branches = [], isLoading } = useListBranches();
  const deleteMutation = useDeleteBranch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const handleDelete = (branch: Branch) => {
    if (!confirm(`حذف فرع "${branch.name}"؟`)) return;
    deleteMutation.mutate({ id: branch.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        toast({ title: 'تم حذف الفرع' });
      },
      onError: (e: any) => toast({ title: 'خطأ', description: e?.data?.error ?? e?.message, variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          إدارة جميع فروع الشركة. الفروع المرئية تظهر في تطبيق العميل.
        </p>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة فرع
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : branches.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPin className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا توجد فروع مضافة بعد.</p>
          <Button className="mt-4 gap-2" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4" /> إضافة أول فرع
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(branches as Branch[]).map(branch => (
            <Card key={branch.id} className="p-4">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{branch.name}</span>
                    {branch.isMain && (
                      <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                        <Star className="w-2.5 h-2.5" /> رئيسي
                      </Badge>
                    )}
                    <Badge variant={branch.status === 'open' ? 'default' : 'secondary'} className="text-[10px]">
                      {branch.status === 'open' ? 'مفتوح' : 'مغلق'}
                    </Badge>
                    {!branch.isVisible && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">مخفي</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {[branch.city, branch.country].filter(Boolean).join('، ')}
                  </p>
                  {branch.address && (
                    <p className="text-xs text-muted-foreground truncate">{branch.address}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {branch.phone && <span>📞 {branch.phone}</span>}
                    {branch.workHours && <span>🕐 {branch.workHours}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(branch); setDialogOpen(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(branch)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <BranchDialog open={dialogOpen} onClose={() => setDialogOpen(false)} branch={editing} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function CompanySettings() {
  const { data: settings, isLoading } = useGetCompanySettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إعدادات التواصل</h1>
        <p className="text-muted-foreground mt-1">
          بيانات الشركة ووسائل التواصل والفروع — تنعكس تلقائياً في جميع أجزاء التطبيق.
        </p>
      </div>

      <Tabs defaultValue="company" dir="rtl">
        <TabsList className="mb-4">
          <TabsTrigger value="company">بيانات الشركة</TabsTrigger>
          <TabsTrigger value="branches">إدارة الفروع</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          {isLoading ? (
            <div className="flex items-center justify-center h-60">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : settings ? (
            <CompanySettingsForm settings={settings as CompanySettings} />
          ) : null}
        </TabsContent>

        <TabsContent value="branches">
          <BranchesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
