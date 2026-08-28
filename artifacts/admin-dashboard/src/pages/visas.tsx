import React, { useCallback, useRef, useState } from 'react';
import { 
  useListVisas, 
  useCreateVisa, 
  useUpdateVisa, 
  useDeleteVisa,
  useListVisaEligibilityRules,
  useCreateVisaEligibilityRule,
  useUpdateVisaEligibilityRule,
  useDeleteVisaEligibilityRule,
  getListVisaEligibilityRulesQueryKey,
  Visa,
  VisaType,
  type VisaEligibilityRule,
} from '@workspace/api-client-react';
import { Loader2, Plus, Edit, Trash2, Clock, Filter, ShieldCheck, Users, Globe, CheckCircle2, XCircle, Search, Upload, X, ImageIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListVisasQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { VISA_TYPE_ARABIC } from '@/lib/translations';
import { COUNTRIES, getFlagUrl, type Country } from '@/lib/countries';

// ─── Country Picker ───────────────────────────────────────────────────────────

function CountryPicker({ value, onChange }: { value: string; onChange: (c: Country) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = COUNTRIES.find(c => c.code === value);
  const filtered = search.length > 0
    ? COUNTRIES.filter(c =>
        c.nameAr.includes(search) ||
        c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  return (
    <div className="space-y-1.5">
      <div
        className="flex items-center gap-3 border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <>
            <img src={getFlagUrl(selected.code)} alt={selected.nameEn} className="w-7 h-5 rounded-sm object-cover flex-shrink-0" />
            <span className="flex-1 text-sm">{selected.nameAr}</span>
            <span className="text-xs text-muted-foreground">{selected.nameEn}</span>
          </>
        ) : (
          <>
            <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground flex-1">اختر الدولة...</span>
          </>
        )}
        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm max-h-[80dvh] flex flex-col p-0">
          <div className="p-4 pb-2 border-b">
            <Input
              autoFocus
              placeholder="بحث عن دولة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-right"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(c => (
              <div
                key={c.code}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/60 transition-colors ${c.code === value ? 'bg-primary/10' : ''}`}
                onClick={() => { onChange(c); setSearch(''); setOpen(false); }}
              >
                <img src={getFlagUrl(c.code)} alt={c.nameEn} className="w-7 h-5 rounded-sm object-cover flex-shrink-0" />
                <span className="flex-1 text-sm">{c.nameAr}</span>
                <span className="text-xs text-muted-foreground">{c.nameEn}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">لا توجد نتائج</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Cover Image Upload ───────────────────────────────────────────────────────

function CoverImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({ title: 'نوع ملف غير مدعوم', description: 'يدعم النظام: JPG, PNG, WEBP', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      const response = await fetch('/api/storage/uploads/cloudinary', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.publicUrl) {
        throw new Error(payload.error || 'Upload failed');
      }
      onChange(payload.publicUrl as string);
      toast({ title: 'تم رفع الصورة بنجاح' });
    } catch {
      toast({ title: 'فشل رفع الصورة', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [toast, onChange]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden border aspect-video bg-muted max-h-48">
          <img src={value} alt="صورة الغلاف" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              تغيير
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onChange('')}>
              <X className="w-3.5 h-3.5" />
              حذف
            </Button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">جارٍ الرفع...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">📤 رفع صورة الغلاف</p>
            <p className="text-xs text-muted-foreground mt-1">اسحب الصورة هنا أو انقر للاختيار</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP</p>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Zod schema ──────────────────────────────────────────────────────────────

const visaSchema = z.object({
  countryCode: z.string().min(2, 'اختر الدولة'),
  countryName: z.string().min(1, 'اسم الدولة مطلوب'),
  countryFlagUrl: z.string().min(1),
  countryImageUrl: z.string().min(1, 'صورة الغلاف مطلوبة'),
  visaType: z.nativeEnum(VisaType),
  processingTime: z.string().min(1, 'مطلوب'),
  stayDuration: z.string().min(1, 'مطلوب'),
  price: z.coerce.number().min(0),
  currency: z.string().min(1, 'مطلوب'),
  description: z.string().min(1, 'مطلوب'),
  requiredDocuments: z.string(),
  entriesAllowed: z.string().min(1, 'مطلوب'),
  validity: z.string().min(1, 'مطلوب'),
  isFeatured: z.boolean().default(false),
  requiresGulfResidence:   z.boolean().default(false),
  requiresPersonalPhoto:   z.boolean().default(true),
  requiresPassportImage:   z.boolean().default(true),
  requiresBankStatement:   z.boolean().default(false),
  requiresFlightBooking:   z.boolean().default(false),
  requiresHotelBooking:    z.boolean().default(false),
  requiresTravelInsurance: z.boolean().default(false),
  requiresAdditionalDocs:  z.boolean().default(false),
  requiresInvitationLetter:z.boolean().default(false),
});

type VisaFormValues = z.infer<typeof visaSchema>;

// ─── Requirement flag labels ─────────────────────────────────────────────────

const REQUIREMENT_FLAGS: Array<{ field: keyof VisaFormValues; label: string; description: string }> = [
  { field: 'requiresGulfResidence',    label: 'إقامة خليجية سارية',    description: 'يشترط وجود إقامة سارية في دولة خليجية' },
  { field: 'requiresPersonalPhoto',    label: 'صورة شخصية',            description: 'صورة شخصية حديثة بخلفية بيضاء' },
  { field: 'requiresPassportImage',    label: 'صورة الجواز',            description: 'الصفحة الرئيسية من جواز السفر' },
  { field: 'requiresBankStatement',    label: 'كشف حساب بنكي',         description: '3 أشهر الأخيرة على الأقل' },
  { field: 'requiresFlightBooking',    label: 'حجز طيران',              description: 'تذكرة طيران مؤكدة أو حجز مؤقت' },
  { field: 'requiresHotelBooking',     label: 'حجز فندق',               description: 'حجز إقامة مؤكد طوال فترة الرحلة' },
  { field: 'requiresTravelInsurance',  label: 'تأمين سفر',              description: 'بوليصة تأمين سفر سارية' },
  { field: 'requiresAdditionalDocs',   label: 'مستندات إضافية',         description: 'مستندات خاصة بهذه الوجهة' },
  { field: 'requiresInvitationLetter', label: 'خطاب تعريف',             description: 'خطاب تعريف من جهة العمل أو الجهة الداعية' },
];

// ─── Visa Rules Manager ───────────────────────────────────────────────────────

const VALID_VISA_OPTIONS = [
  { value: 'schengen', label: 'دول الشنغن' },
  { value: 'uk',       label: 'المملكة المتحدة' },
  { value: 'us',       label: 'الولايات المتحدة' },
  { value: 'canada',   label: 'كندا' },
  { value: 'australia',label: 'أستراليا' },
  { value: 'japan',    label: 'اليابان' },
  { value: 'newzealand',  label: 'نيوزيلندا' },
  { value: 'southkorea',  label: 'كوريا الجنوبية' },
];

const EMPTY_RULE = {
  name: '',
  isDefault: false,
  nationalities: [] as string[],   // array of Arabic country names
  allowDirect: false,
  requiresGulfResidence: false,
  requiresValidVisaCountries: [] as string[],
  requiresInvitationLetter: false,
  sortOrder: 0,
};

// ─── Nationality Multi-Select ─────────────────────────────────────────────────
function NationalityMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? COUNTRIES.filter(
        c =>
          c.nameAr.includes(search) ||
          c.nameEn.toLowerCase().includes(search.toLowerCase()),
      )
    : COUNTRIES;

  const toggle = (nameAr: string) => {
    onChange(
      selected.includes(nameAr)
        ? selected.filter(n => n !== nameAr)
        : [...selected, nameAr],
    );
  };

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(n => {
            const c = COUNTRIES.find(x => x.nameAr === n);
            return (
              <span
                key={n}
                className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-full px-2.5 py-1"
              >
                {c && (
                  <img
                    src={getFlagUrl(c.code)}
                    alt=""
                    className="w-4 h-3 rounded-sm object-cover"
                  />
                )}
                {n}
                <button
                  onClick={() => toggle(n)}
                  className="hover:text-blue-600 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Toggle button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-between text-sm"
        onClick={() => setOpen(true)}
      >
        <span className="text-muted-foreground">
          {selected.length === 0
            ? 'اختر الجنسيات المشمولة بهذه القاعدة...'
            : `${selected.length} جنسية محددة`}
        </span>
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
      </Button>

      {/* Dialog picker */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm max-h-[80dvh] flex flex-col p-0">
          <div className="p-4 border-b space-y-1">
            <p className="text-sm font-semibold">اختر الجنسيات</p>
            <Input
              autoFocus
              placeholder="بحث عن دولة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-right"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(c => (
              <div
                key={c.code}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/60 transition-colors ${selected.includes(c.nameAr) ? 'bg-primary/8' : ''}`}
                onClick={() => toggle(c.nameAr)}
              >
                <Checkbox
                  checked={selected.includes(c.nameAr)}
                  onCheckedChange={() => toggle(c.nameAr)}
                />
                <img
                  src={getFlagUrl(c.code)}
                  alt={c.nameEn}
                  className="w-6 h-4 rounded-sm object-cover flex-shrink-0"
                />
                <span className="flex-1 text-sm">{c.nameAr}</span>
                <span className="text-xs text-muted-foreground">{c.nameEn}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">لا توجد نتائج</p>
            )}
          </div>
          <div className="p-3 border-t flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{selected.length} محددة</span>
            <Button size="sm" onClick={() => setOpen(false)}>تم</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RuleDialog({
  open, onClose, rule, visaId,
}: { open: boolean; onClose: () => void; rule: VisaEligibilityRule | null; visaId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVisaEligibilityRule();
  const updateMutation = useUpdateVisaEligibilityRule();

  const [form, setForm] = useState<typeof EMPTY_RULE>(
    rule ? {
      name: rule.name,
      isDefault: rule.isDefault,
      nationalities: [...rule.nationalities],
      allowDirect: rule.allowDirect,
      requiresGulfResidence: rule.requiresGulfResidence,
      requiresValidVisaCountries: [...rule.requiresValidVisaCountries],
      requiresInvitationLetter: rule.requiresInvitationLetter,
      sortOrder: rule.sortOrder,
    } : EMPTY_RULE
  );

  const set = (key: keyof typeof EMPTY_RULE) => (val: any) => setForm(f => ({ ...f, [key]: val }));

  const toggleCountry = (c: string) => setForm(f => ({
    ...f,
    requiresValidVisaCountries: f.requiresValidVisaCountries.includes(c)
      ? f.requiresValidVisaCountries.filter(x => x !== c)
      : [...f.requiresValidVisaCountries, c],
  }));

  const handleSave = () => {
    const data = {
      ...form,
      nationalities: form.isDefault ? [] : form.nationalities,
    };
    const opts = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVisaEligibilityRulesQueryKey(visaId) });
        toast({ title: rule ? 'تم تحديث القاعدة' : 'تم إنشاء القاعدة' });
        onClose();
      },
      onError: (e: any) => toast({ title: 'خطأ', description: e?.data?.error ?? e?.message, variant: 'destructive' }),
    };
    if (rule) {
      updateMutation.mutate({ id: visaId, ruleId: rule.id, data: data as any }, opts);
    } else {
      createMutation.mutate({ id: visaId, data: data as any }, opts);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'تعديل القاعدة' : 'إضافة قاعدة أهلية'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">اسم القاعدة</label>
            <Input value={form.name} onChange={e => set('name')(e.target.value)} placeholder="مثال: قاعدة اليمن والهند" />
          </div>

          {/* Default rule toggle */}
          <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
            <Checkbox id="isDefault" checked={form.isDefault} onCheckedChange={v => set('isDefault')(v)} />
            <div>
              <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">قاعدة افتراضية</label>
              <p className="text-xs text-muted-foreground">تطبق على جميع الجنسيات غير المذكورة في قواعد أخرى</p>
            </div>
          </div>

          {/* Nationalities */}
          {!form.isDefault && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الجنسيات المشمولة بهذه القاعدة</label>
              <NationalityMultiSelect
                selected={form.nationalities}
                onChange={set('nationalities')}
              />
              <p className="text-xs text-muted-foreground">
                حدد الجنسيات التي تنطبق عليها هذه القاعدة — تُطابق مع جنسية المستخدم المسجلة في ملفه الشخصي.
              </p>
            </div>
          )}

          {/* Allow direct */}
          <div className="flex items-center gap-3 p-3 rounded-md border bg-green-50 dark:bg-green-950">
            <Checkbox id="allowDirect" checked={form.allowDirect} onCheckedChange={v => set('allowDirect')(v)} />
            <div>
              <label htmlFor="allowDirect" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                يسمح بالتقديم مباشرة (بدون شروط)
              </label>
              <p className="text-xs text-muted-foreground">المستخدمون الذين تنطبق عليهم هذه القاعدة مؤهلون تلقائياً</p>
            </div>
          </div>

          {!form.allowDirect && (
            <>
              {/* OR conditions */}
              <div className="space-y-2 p-3 rounded-md border">
                <p className="text-sm font-medium">شروط الأهلية (يكفي استيفاء شرط واحد)</p>

                <div className="flex items-center gap-3">
                  <Checkbox id="gulf" checked={form.requiresGulfResidence} onCheckedChange={v => set('requiresGulfResidence')(v)} />
                  <label htmlFor="gulf" className="text-sm cursor-pointer">إقامة سارية في إحدى دول مجلس التعاون الخليجي</label>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">أو: تأشيرة سارية لإحدى الدول التالية</p>
                  <div className="grid grid-cols-2 gap-2">
                    {VALID_VISA_OPTIONS.map(({ value, label }) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`vvc-${value}`}
                          checked={form.requiresValidVisaCountries.includes(value)}
                          onCheckedChange={() => toggleCountry(value)}
                        />
                        <label htmlFor={`vvc-${value}`} className="text-sm cursor-pointer">{label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AND conditions */}
              <div className="flex items-center gap-3">
                <Checkbox id="invite" checked={form.requiresInvitationLetter} onCheckedChange={v => set('requiresInvitationLetter')(v)} />
                <label htmlFor="invite" className="text-sm cursor-pointer">يشترط خطاب تعريف (إضافي)</label>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">ترتيب العرض</label>
            <Input type="number" value={form.sortOrder} onChange={e => set('sortOrder')(Number(e.target.value))} className="w-24" dir="ltr" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            {rule ? 'تحديث' : 'إنشاء'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VisaRulesManager({ visaId }: { visaId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useListVisaEligibilityRules(visaId);
  const deleteMutation = useDeleteVisaEligibilityRule();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VisaEligibilityRule | null>(null);

  const handleDelete = (rule: VisaEligibilityRule) => {
    if (!confirm(`حذف القاعدة "${rule.name}"؟`)) return;
    deleteMutation.mutate({ id: visaId, ruleId: rule.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVisaEligibilityRulesQueryKey(visaId) });
        toast({ title: 'تم حذف القاعدة' });
      },
      onError: (e: any) => toast({ title: 'خطأ', description: e?.data?.error ?? e?.message, variant: 'destructive' }),
    });
  };

  const ruleList = rules as VisaEligibilityRule[];

  const getRuleSummary = (rule: VisaEligibilityRule) => {
    if (rule.allowDirect) return 'يسمح بالتقديم مباشرة';
    const parts: string[] = [];
    if (rule.requiresGulfResidence) parts.push('إقامة خليجية');
    if (rule.requiresValidVisaCountries.length > 0) {
      const labels = rule.requiresValidVisaCountries.map(c => VALID_VISA_OPTIONS.find(x => x.value === c)?.label ?? c).join(' / ');
      parts.push(`تأشيرة: ${labels}`);
    }
    if (rule.requiresInvitationLetter) parts.push('خطاب تعريف');
    return parts.length > 0 ? parts.join(' أو ') : 'لا شروط محددة';
  };

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <p className="font-semibold text-sm">قواعد الأهلية حسب الجنسية</p>
        </div>
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-3.5 h-3.5" />
          إضافة قاعدة
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        حدد شروطاً مختلفة لكل جنسية أو مجموعة جنسيات. يبحث النظام عن القاعدة المطابقة لجنسية العميل وإلا يطبق القاعدة الافتراضية.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-12">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        </div>
      ) : ruleList.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-md">
          لا توجد قواعد مضافة — جميع الجنسيات مقبولة بدون قيود
        </div>
      ) : (
        <div className="space-y-2">
          {ruleList.map(rule => (
            <div key={rule.id} className="flex items-start gap-3 p-3 rounded-md border bg-muted/20 group">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{rule.name || '(بدون اسم)'}</span>
                  {rule.isDefault && (
                    <Badge variant="secondary" className="text-[10px] px-1.5">افتراضية</Badge>
                  )}
                  {rule.allowDirect && (
                    <Badge className="text-[10px] px-1.5 bg-green-100 text-green-800 border-green-300">
                      <CheckCircle2 className="w-2.5 h-2.5 me-1" /> مباشر
                    </Badge>
                  )}
                </div>
                {!rule.isDefault && rule.nationalities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rule.nationalities.slice(0, 5).map(n => (
                      <span key={n} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">{n}</span>
                    ))}
                    {rule.nationalities.length > 5 && (
                      <span className="text-[10px] text-muted-foreground">+{rule.nationalities.length - 5} أخرى</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{getRuleSummary(rule)}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(rule); setDialogOpen(true); }}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(rule)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RuleDialog open={dialogOpen} onClose={() => setDialogOpen(false)} rule={editing} visaId={visaId} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Visas() {
  const { data: visas, isLoading } = useListVisas();
  const [filterType, setFilterType] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<Visa | null>(null);

  const filteredVisas = visas?.filter(v => filterType === 'all' || v.visaType === filterType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">عروض التأشيرات</h1>
          <p className="text-muted-foreground mt-1">إدارة وجهات الدول وأنواع التأشيرات ومتطلباتها.</p>
        </div>
        <Button onClick={() => { setEditingVisa(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة تأشيرة
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 flex flex-wrap gap-4 items-center bg-muted/20">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">تصفية حسب النوع:</span>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="جميع أنواع التأشيرات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع أنواع التأشيرات</SelectItem>
              {Object.values(VisaType).map(type => (
                <SelectItem key={type} value={type}>
                  {VISA_TYPE_ARABIC[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>الوجهة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المعالجة</TableHead>
                <TableHead>الصلاحية / الإقامة</TableHead>
                <TableHead>المتطلبات</TableHead>
                <TableHead className="text-end">السعر</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredVisas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    لم يتم العثور على تأشيرات. قم بإنشاء واحدة للبدء.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisas?.map(visa => {
                  const v = visa as any;
                  const reqCount = REQUIREMENT_FLAGS.filter(r => v[r.field]).length;
                  return (
                    <TableRow key={visa.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img 
                            src={visa.countryFlagUrl} 
                            alt={visa.countryName} 
                            className="w-8 h-6 object-cover rounded shadow-sm"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-2">
                              {visa.countryName}
                              {visa.isFeatured && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">مميزة</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{visa.entriesAllowed}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {VISA_TYPE_ARABIC[visa.visaType] || visa.visaType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Clock className="w-3.5 h-3.5 me-1.5 text-muted-foreground" />
                          {visa.processingTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{visa.validity}</p>
                          <p className="text-xs text-muted-foreground">{visa.stayDuration}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{reqCount} متطلبات</span>
                          {v.requiresGulfResidence && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-400 text-amber-600">خليجية</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-end font-medium">
                        {visa.price} {visa.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setEditingVisa(visa); setIsFormOpen(true); }}
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <DeleteVisaButton visa={visa} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVisa ? 'تعديل عرض التأشيرة' : 'إنشاء عرض تأشيرة'}</DialogTitle>
          </DialogHeader>
          <VisaForm 
            visa={editingVisa} 
            onSuccess={() => setIsFormOpen(false)} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Delete Button ────────────────────────────────────────────────────────────

function DeleteVisaButton({ visa }: { visa: Visa }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteVisa();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteMutation.mutate({ id: visa.id }, {
      onSuccess: () => {
        toast({ title: "تم حذف التأشيرة بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListVisasQueryKey() });
        setOpen(false);
      },
      onError: (error: any) => {
        toast({ title: "خطأ في حذف التأشيرة", description: error?.data?.error ?? error?.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حذف تأشيرة {visa.countryName}؟</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف عرض التأشيرة بشكل دائم.</p>
        <DialogFooter className="mt-4 flex-row justify-end space-x-0 gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 ms-2 animate-spin" /> : <Trash2 className="w-4 h-4 ms-2" />}
            حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Visa Form ────────────────────────────────────────────────────────────────

function VisaForm({ visa, onSuccess, onCancel }: { visa: Visa | null; onSuccess: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVisa();
  const updateMutation = useUpdateVisa();

  const v = visa as any;

  const form = useForm<VisaFormValues>({
    resolver: zodResolver(visaSchema),
    defaultValues: visa ? {
      ...visa,
      countryCode: v?.countryCode ?? '',
      price: Number(visa.price),
      requiredDocuments: visa.requiredDocuments.join('\n'),
      requiresGulfResidence:    v?.requiresGulfResidence    ?? false,
      requiresPersonalPhoto:    v?.requiresPersonalPhoto    ?? true,
      requiresPassportImage:    v?.requiresPassportImage    ?? true,
      requiresBankStatement:    v?.requiresBankStatement    ?? false,
      requiresFlightBooking:    v?.requiresFlightBooking    ?? false,
      requiresHotelBooking:     v?.requiresHotelBooking     ?? false,
      requiresTravelInsurance:  v?.requiresTravelInsurance  ?? false,
      requiresAdditionalDocs:   v?.requiresAdditionalDocs   ?? false,
      requiresInvitationLetter: v?.requiresInvitationLetter ?? false,
    } : {
      countryCode: '',
      countryName: '',
      countryFlagUrl: '',
      countryImageUrl: '',
      visaType: VisaType.tourism,
      processingTime: '3-5 أيام عمل',
      stayDuration: '30 يوماً',
      price: 0,
      currency: 'USD',
      description: '',
      requiredDocuments: 'جواز السفر\nصورة شخصية',
      entriesAllowed: 'دخول لمرة واحدة',
      validity: '90 يوماً',
      isFeatured: false,
      requiresGulfResidence:    false,
      requiresPersonalPhoto:    true,
      requiresPassportImage:    true,
      requiresBankStatement:    false,
      requiresFlightBooking:    false,
      requiresHotelBooking:     false,
      requiresTravelInsurance:  false,
      requiresAdditionalDocs:   false,
      requiresInvitationLetter: false,
    }
  });

  const onSubmit = (values: VisaFormValues) => {
    const data = {
      ...values,
      requiredDocuments: values.requiredDocuments.split('\n').map(s => s.trim()).filter(Boolean),
    };

    if (visa) {
      updateMutation.mutate({ id: visa.id, data }, {
        onSuccess: () => {
          toast({ title: "تم تحديث التأشيرة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListVisasQueryKey() });
          onSuccess();
        },
        onError: (e: any) => toast({ title: "خطأ", description: e?.data?.error ?? e?.message, variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "تم إنشاء التأشيرة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListVisasQueryKey() });
          onSuccess();
        },
        onError: (e: any) => toast({ title: "خطأ", description: e?.data?.error ?? e?.message, variant: "destructive" })
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Country + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="countryCode" render={({ field }) => (
            <FormItem>
              <FormLabel>الدولة *</FormLabel>
              <FormControl>
                <CountryPicker
                  value={field.value}
                  onChange={c => {
                    form.setValue('countryCode', c.code);
                    form.setValue('countryName', c.nameAr);
                    form.setValue('countryFlagUrl', getFlagUrl(c.code));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="visaType" render={({ field }) => (
            <FormItem>
              <FormLabel>نوع التأشيرة</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                <SelectContent>
                  {Object.values(VisaType).map(type => (
                    <SelectItem key={type} value={type}>{VISA_TYPE_ARABIC[type] || type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Cover Image */}
        <FormField control={form.control} name="countryImageUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>صورة الغلاف *</FormLabel>
            <FormControl>
              <CoverImageUpload value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-4 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem className="col-span-2"><FormLabel>السعر</FormLabel><FormControl><Input type="number" dir="ltr" className="text-end" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem className="col-span-2"><FormLabel>العملة</FormLabel><FormControl><Input dir="ltr" className="text-end" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="processingTime" render={({ field }) => (
            <FormItem><FormLabel>وقت المعالجة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="stayDuration" render={({ field }) => (
            <FormItem><FormLabel>مدة الإقامة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="validity" render={({ field }) => (
            <FormItem><FormLabel>الصلاحية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="entriesAllowed" render={({ field }) => (
            <FormItem><FormLabel>مرات الدخول المسموحة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea className="resize-none" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField control={form.control} name="requiredDocuments" render={({ field }) => (
          <FormItem>
            <FormLabel>المستندات المطلوبة (كل مستند في سطر)</FormLabel>
            <FormControl><Textarea className="resize-none" rows={4} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="isFeatured" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 gap-3">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>تأشيرة مميزة</FormLabel>
              <p className="text-sm text-muted-foreground mt-1">أظهر هذه التأشيرة بشكل بارز في الصفحة الرئيسية.</p>
            </div>
          </FormItem>
        )} />

        {/* ── Requirement Flags ─────────────────────────────────────────────── */}
        <div className="rounded-md border p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">متطلبات التأشيرة</p>
          </div>
          <p className="text-xs text-muted-foreground -mt-1 mb-3">
            حدد الوثائق والشروط التي يحتاجها المتقدم لهذه التأشيرة. سيتم عرضها للمستخدم عند التقديم.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {REQUIREMENT_FLAGS.map(({ field, label, description }) => (
              <FormField
                key={field}
                control={form.control}
                name={field as any}
                render={({ field: f }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={!!f.value}
                        onCheckedChange={f.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-0.5 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">{label}</FormLabel>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* ── Eligibility Rules ──────────────────────────────────────────────── */}
        {visa ? (
          <VisaRulesManager visaId={visa.id} />
        ) : (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            <Users className="w-5 h-5 mx-auto mb-2 opacity-50" />
            احفظ التأشيرة أولاً لإضافة قواعد الأهلية حسب الجنسية
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
            {visa ? 'تحديث التأشيرة' : 'إنشاء التأشيرة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
