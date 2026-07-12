import React from 'react';
import { useListCustomers, type User } from '@workspace/api-client-react';
import { Loader2, Search, Mail, Phone, Calendar, Download, FileText, CheckCircle, Clock, ChevronLeft, Home, IdCard, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateAr } from '@/lib/translations';

type Customer = User;

const RESIDENCE_LABELS: Record<string, string> = {
  none:      'لا',
  gcc:       'دول مجلس التعاون الخليجي',
  schengen:  'دول شنغن',
  uk:        'المملكة المتحدة',
  usa:       'الولايات المتحدة الأمريكية',
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  try {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
  } catch {
    return iso;
  }
}

function profilePct(c: Customer): number {
  const u = c as any;
  const fields = [u.avatarUrl, u.fullName, u.dob, u.passportNumber, u.passportIssueDate, u.passportExpiry, u.passportImageUrl];
  const residenceType = u.residenceType ?? 'none';
  if (residenceType !== 'none') {
    fields.push(u.gulfResidenceFrontUrl, u.gulfResidenceBackUrl);
  }
  const filled = fields.filter(f => f && f !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function DownloadImageButton({ url, label }: { url: string; label: string }) {
  function handleDownload() {
    const a = document.createElement('a');
    a.href = url;
    a.download = label.replace(/\s+/g, '_') + '.jpg';
    a.target = '_blank';
    a.click();
  }
  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <Download className="w-3 h-3" />
      تنزيل
    </button>
  );
}

function DocumentPhoto({ src, label }: { src: string; label: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <DownloadImageButton url={src} label={label} />
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
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>إغلاق</Button>
              <DownloadImageButton url={src} label={label} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CustomerDetail({ customer, onBack }: { customer: Customer; onBack: () => void }) {
  const u = customer as any;
  const pct = profilePct(customer);
  const isComplete = pct === 100;
  const residenceType = u.residenceType ?? 'none';
  const hasResidence = residenceType !== 'none';

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" />
        العودة إلى العملاء
      </button>

      {/* Hero card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar className="w-20 h-20 border-2 border-primary/20 shadow">
              <AvatarImage src={u.avatarUrl || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                {u.fullName?.charAt(0) ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h2 className="text-xl font-bold">{u.fullName || '—'}</h2>
                {isComplete ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                    <CheckCircle className="w-3 h-3" /> مكتمل
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="w-3 h-3" /> {pct}% مكتمل
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                {u.phone && <span dir="ltr" className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{u.phone}</span>}
                {u.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{u.email}</span>}
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />انضم {formatDateAr(u.createdAt)}</span>
              </div>
              {/* Completion bar */}
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>اكتمال الملف</span>
                  <span className={isComplete ? 'text-green-600 font-semibold' : 'text-primary font-semibold'}>{pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: isComplete ? '#22c55e' : pct >= 60 ? '#f59e0b' : 'hsl(var(--primary))' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Passport info */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <IdCard className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">بيانات جواز السفر</h3>
            </div>
            <div className="divide-y divide-border text-sm">
              {[
                ['رقم الجواز', u.passportNumber],
                ['تاريخ الميلاد', formatDate(u.dob)],
                ['تاريخ الإصدار', formatDate(u.passportIssueDate)],
                ['تاريخ الانتهاء', formatDate(u.passportExpiry)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-end">{value || '—'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Residence */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">حالة الإقامة</h3>
            </div>
            <div className="text-sm">
              <div className="flex justify-between py-2.5 border-b border-border">
                <span className="text-muted-foreground">نوع الإقامة</span>
                <span className="font-medium">{RESIDENCE_LABELS[residenceType] ?? '—'}</span>
              </div>
              {!hasResidence && (
                <p className="text-muted-foreground text-xs mt-3">لا توجد إقامة خارج بلد الجنسية</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photos */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">الصور والوثائق</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {u.avatarUrl && (
              <DocumentPhoto src={u.avatarUrl} label="الصورة الشخصية" />
            )}
            {u.passportImageUrl && (
              <DocumentPhoto src={u.passportImageUrl} label="صورة جواز السفر" />
            )}
            {hasResidence && u.gulfResidenceFrontUrl && (
              <DocumentPhoto src={u.gulfResidenceFrontUrl} label="الإقامة/التأشيرة (أمامي)" />
            )}
            {hasResidence && u.gulfResidenceBackUrl && (
              <DocumentPhoto src={u.gulfResidenceBackUrl} label="الإقامة/التأشيرة (خلفي)" />
            )}
            {!u.avatarUrl && !u.passportImageUrl && !u.gulfResidenceFrontUrl && !u.gulfResidenceBackUrl && (
              <div className="col-span-3 text-center py-8 text-muted-foreground text-sm">
                لم يتم رفع أي صور بعد
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Customers() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selected, setSelected] = React.useState<Customer | null>(null);
  const { data: customers, isLoading } = useListCustomers();

  const filteredCustomers = customers?.filter(c =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.phone.includes(searchTerm)
  );

  if (selected) {
    return <CustomerDetail customer={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">العملاء</h1>
          <p className="text-muted-foreground mt-1">إدارة العملاء المسجلين وعرض ملفاتهم الشخصية.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن العملاء..."
            className="ps-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredCustomers?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">لم يتم العثور على عملاء</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
              لا يوجد عملاء يطابقون معايير البحث. جرب اسماً أو بريداً إلكترونياً أو رقم هاتف آخر.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCustomers?.map((customer) => {
            const pct = profilePct(customer);
            const isComplete = pct === 100;
            return (
              <Card
                key={customer.id}
                className="hover-elevate transition-all border-border/50 group cursor-pointer hover:border-primary/30"
                onClick={() => setSelected(customer)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 border border-border/50 shadow-sm">
                      <AvatarImage src={customer.avatarUrl || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {customer.fullName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors flex-1">
                          {customer.fullName}
                        </h3>
                        {isComplete ? (
                          <span className="text-green-500 shrink-0"><CheckCircle className="w-4 h-4" /></span>
                        ) : (
                          <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center text-sm text-muted-foreground truncate" dir="ltr">
                          <Phone className="w-3.5 h-3.5 ms-2 flex-shrink-0" />
                          <span className="truncate w-full text-end">{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center text-sm text-muted-foreground truncate">
                            <Mail className="w-3.5 h-3.5 me-2 flex-shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3.5 h-3.5 me-2 flex-shrink-0" />
                          انضم {formatDateAr(customer.createdAt)}
                        </div>
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: isComplete ? '#22c55e' : pct >= 60 ? '#f59e0b' : 'hsl(var(--primary))' }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
