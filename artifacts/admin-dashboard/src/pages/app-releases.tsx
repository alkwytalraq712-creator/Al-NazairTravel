import React, { useEffect, useState } from 'react';
import { customFetch } from '@workspace/api-client-react';
import { Download, ExternalLink, Loader2, PackageCheck, Plus, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDateTimeAr } from '@/lib/translations';

type AppRelease = {
  id: number;
  platform: string;
  version: string;
  versionCode: number;
  downloadUrl: string;
  releaseNotes: string;
  isMandatory: boolean;
  isActive: boolean;
  createdAt: string;
};

type ReleaseForm = {
  version: string;
  versionCode: string;
  downloadUrl: string;
  releaseNotes: string;
  isMandatory: boolean;
};

const emptyForm: ReleaseForm = { version: '', versionCode: '', downloadUrl: '', releaseNotes: '', isMandatory: false };

export function AppReleases() {
  const { toast } = useToast();
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [form, setForm] = useState<ReleaseForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadReleases = async () => {
    setLoading(true);
    try {
      setReleases(await customFetch<AppRelease[]>('/api/admin/app-releases'));
    } catch (error: any) {
      toast({ title: 'تعذر تحميل الإصدارات', description: error?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReleases(); }, []);

  const updateForm = (key: keyof ReleaseForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const createRelease = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d+\.\d+\.\d+$/.test(form.version)) {
      toast({ title: 'صيغة الإصدار غير صحيحة', description: 'استخدم صيغة مثل 1.0.1', variant: 'destructive' });
      return;
    }
    if (!Number.isInteger(Number(form.versionCode)) || Number(form.versionCode) <= 0) {
      toast({ title: 'رقم البناء غير صحيح', description: 'أدخل رقمًا صحيحًا موجبًا مثل 2', variant: 'destructive' });
      return;
    }
    try { new URL(form.downloadUrl); } catch {
      toast({ title: 'رابط APK غير صحيح', description: 'أدخل رابط التنزيل الكامل الذي يبدأ بـ https://', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await customFetch<AppRelease>('/api/admin/app-releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'android', version: form.version, versionCode: Number(form.versionCode), downloadUrl: form.downloadUrl, releaseNotes: form.releaseNotes, isMandatory: form.isMandatory, isActive: true }),
      });
      toast({ title: 'تم تسجيل الإصدار', description: 'تم إنشاء تنبيه تحديث للمستخدمين.' });
      setForm(emptyForm);
      setShowForm(false);
      await loadReleases();
    } catch (error: any) {
      toast({ title: 'تعذر حفظ الإصدار', description: error?.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const toggleRelease = async (release: AppRelease) => {
    try {
      const updated = await customFetch<AppRelease>(`/api/admin/app-releases/${release.id}/active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !release.isActive }) });
      setReleases((items) => items.map((item) => item.id === updated.id ? updated : item));
      toast({ title: updated.isActive ? 'تم تفعيل الإصدار' : 'تم إيقاف الإصدار' });
    } catch (error: any) { toast({ title: 'تعذر تحديث حالة الإصدار', description: error?.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إصدارات التطبيق</h1>
          <p className="text-muted-foreground mt-1">إدارة إصدارات Android وإرسال تنبيه تلقائي للمستخدمين.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadReleases()}><RefreshCw className="w-4 h-4 me-2" /> تحديث</Button>
          <Button onClick={() => setShowForm((value) => !value)}><Plus className="w-4 h-4 me-2" /> تسجيل إصدار</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5 flex items-center gap-3"><PackageCheck className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">عدد الإصدارات</p><p className="text-2xl font-bold">{releases.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3"><Download className="w-8 h-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">الإصدار النشط</p><p className="text-2xl font-bold">{releases.find((release) => release.isActive)?.version || '—'}</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3"><Send className="w-8 h-8 text-amber-500" /><div><p className="text-xs text-muted-foreground">التنبيه</p><p className="text-sm font-semibold">يظهر داخل التطبيق</p></div></CardContent></Card>
      </div>

      {showForm && <Card className="border-primary/30 shadow-sm"><CardHeader><CardTitle>تسجيل إصدار Android جديد</CardTitle><CardDescription>بعد الحفظ سيظهر تنبيه داخل التطبيق للمستخدمين الذين يملكون إصدارًا أقدم.</CardDescription></CardHeader><CardContent><form onSubmit={createRelease} className="grid gap-4 md:grid-cols-2"><div><label className="text-sm font-medium">رقم الإصدار</label><Input className="mt-1.5" placeholder="1.0.1" value={form.version} onChange={(e) => updateForm('version', e.target.value)} /></div><div><label className="text-sm font-medium">رقم البناء الداخلي</label><Input className="mt-1.5" type="number" min="1" placeholder="2" value={form.versionCode} onChange={(e) => updateForm('versionCode', e.target.value)} /></div><div className="md:col-span-2"><label className="text-sm font-medium">رابط APK المباشر</label><Input className="mt-1.5" type="url" placeholder="https://expo.dev/artifacts/eas/...apk" value={form.downloadUrl} onChange={(e) => updateForm('downloadUrl', e.target.value)} /></div><div className="md:col-span-2"><label className="text-sm font-medium">ملاحظات التحديث</label><Textarea className="mt-1.5" rows={4} placeholder="تحسينات وإصلاحات جديدة..." value={form.releaseNotes} onChange={(e) => updateForm('releaseNotes', e.target.value)} /></div><label className="md:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isMandatory} onChange={(e) => updateForm('isMandatory', e.target.checked)} /> تحديث إلزامي</label><div className="md:col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />} حفظ وإرسال التنبيه</Button></div></form></CardContent></Card>}

      <Card><CardHeader><CardTitle>سجل الإصدارات</CardTitle><CardDescription>الإصدارات المسجلة وروابط التنزيل وحالة التنبيه.</CardDescription></CardHeader><CardContent>{loading ? <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : releases.length === 0 ? <div className="py-12 text-center text-muted-foreground">لم يتم تسجيل إصدارات بعد.</div> : <div className="space-y-3">{releases.map((release) => <div key={release.id} className="rounded-xl border border-border/60 p-4 flex flex-col lg:flex-row lg:items-center gap-4"><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold">Android {release.version}</h3><Badge variant={release.isActive ? 'default' : 'secondary'}>{release.isActive ? 'نشط' : 'متوقف'}</Badge>{release.isMandatory && <Badge variant="destructive"><ShieldAlert className="w-3 h-3 me-1" /> إلزامي</Badge>}</div><p className="text-sm text-muted-foreground mt-1">Build {release.versionCode} · {formatDateTimeAr(release.createdAt)}</p>{release.releaseNotes && <p className="text-sm mt-2 whitespace-pre-wrap">{release.releaseNotes}</p>}</div><div className="flex gap-2 flex-wrap"><Button size="sm" variant="outline" onClick={() => void toggleRelease(release)}>{release.isActive ? 'إيقاف التنبيه' : 'تفعيل الإصدار'}</Button><a href={release.downloadUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><ExternalLink className="w-4 h-4 me-2" /> فتح APK</Button></a></div></div>)}</div>}</CardContent></Card>
    </div>
  );
}
