import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  Plane, 
  FileText, 
  Map, 
  Briefcase, 
  Ticket,
  Bell,
  Image as ImageIcon,
  MessageSquare,
  LogOut,
  UserCog,
  Wallet,
  Receipt,
  Building2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogout } from '@workspace/api-client-react';
import logo from '@/assets/logo_final.png';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'لوحة القيادة', path: '/' },
  { icon: Users, label: 'العملاء', path: '/customers' },
  { icon: UserCog, label: 'الموظفين', path: '/employees' },
  { icon: Plane, label: 'حجوزات الطيران', path: '/flight-bookings' },
  { icon: Clock, label: 'الحجوزات المؤقتة', path: '/hold-settings' },
  { icon: FileText, label: 'طلبات التأشيرات', path: '/visa-applications' },
  { icon: Briefcase, label: 'عروض التأشيرات', path: '/visas' },
  { icon: Map, label: 'حجوزات الباقات', path: '/package-bookings' },
  { icon: Ticket, label: 'الباقات السياحية', path: '/packages' },
  { icon: Wallet, label: 'المدفوعات', path: '/payments' },
  { icon: Receipt, label: 'الفواتير', path: '/invoices' },
  { icon: Bell, label: 'الإشعارات', path: '/notifications' },
  { icon: ImageIcon, label: 'اللافتات الترويجية', path: '/banners' },
  { icon: MessageSquare, label: 'الآراء والتقييمات', path: '/testimonials' },
  { icon: Building2, label: 'إعدادات التواصل', path: '/company-settings' },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation('/login')
    });
  };

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-e border-sidebar-border hidden md:flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border gap-2">
        <img src={logo} alt="QEMA AL NATHAIR" className="w-14 h-14 object-contain flex-shrink-0" />
        <span className="font-bold text-lg tracking-tight">قمة النظائر</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group relative",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}>
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
              )} />
              {item.label}
              {isActive && (
                <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-e-full" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground w-full transition-colors"
        >
          <LogOut className="w-5 h-5 text-sidebar-foreground/50 rotate-180" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
