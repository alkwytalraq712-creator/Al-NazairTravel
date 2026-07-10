import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { Globe2, Loader2, Lock, Mail, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const ADMIN_TOKEN_KEY = 'qema_admin_token';

const loginSchema = z.object({
  identifier: z.string().min(1, 'البريد الإلكتروني أو رقم الهاتف مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال' })) as { error?: string };
        toast({
          title: "فشل تسجيل الدخول",
          description: err.error === 'Invalid credentials'
            ? 'بيانات الاعتماد غير صالحة. يرجى المحاولة مرة أخرى.'
            : (err.error ?? 'حدث خطأ غير متوقع'),
          variant: "destructive",
        });
        return;
      }
      const data = await res.json() as { role: string; token?: string; fullName: string };
      if (data.role !== 'admin') {
        toast({
          title: "تم رفض الوصول",
          description: "يحق لمديري النظام فقط الوصول إلى لوحة التحكم هذه.",
          variant: "destructive",
        });
        return;
      }
      if (data.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setAuthTokenGetter(() => data.token!);
      }
      await queryClient.invalidateQueries();
      toast({
        title: "مرحباً بك مجدداً",
        description: `تم تسجيل الدخول بنجاح، ${data.fullName}`,
      });
      setLocation('/');
    } catch {
      toast({ title: "خطأ في الاتصال", description: "تعذر الوصول إلى الخادم.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Left Branding Panel */}
      <div className="hidden md:flex flex-1 bg-sidebar text-sidebar-foreground flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 C30,80 70,80 100,100 L100,0 L0,0 Z" fill="currentColor"/>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
            <Globe2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">
            قمة النظائر
            <br />
            <span className="text-sidebar-foreground/70 text-3xl font-medium mt-2 block">مركز التحكم</span>
          </h1>
          <p className="text-lg text-sidebar-foreground/60 max-w-md">
            النظام المركزي لمعالجة طلبات التأشيرات والبرامج السياحية وحجوزات الطيران بسرعة وموثوقية.
          </p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 xl:px-32 relative bg-card">
        <div className="md:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Globe2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">إدارة قمة النظائر</span>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">بوابة الموظفين</h2>
            <p className="text-muted-foreground">قم بتسجيل الدخول للوصول إلى مركز التحكم.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني أو رقم الهاتف</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          placeholder="staff@qema.com" 
                          className="ps-10 h-12 bg-input/50 focus:bg-background transition-colors text-base" 
                          dir="ltr"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>كلمة المرور</FormLabel>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="ps-10 h-12 bg-input/50 focus:bg-background transition-colors text-base" 
                          dir="ltr"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold mt-4 shadow-md hover:shadow-lg transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    تسجيل الدخول
                    <ArrowLeft className="w-5 h-5 ms-2" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
