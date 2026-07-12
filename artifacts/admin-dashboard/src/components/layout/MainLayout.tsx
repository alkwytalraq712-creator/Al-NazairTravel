import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PermissionsProvider } from '@/context/PermissionsContext';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    }
  });

  useEffect(() => {
    const role = user?.role as string | undefined;
    if (!isLoading && (!user || (role !== 'admin' && role !== 'staff'))) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const role = user?.role as string | undefined;
  if (!user || (role !== 'admin' && role !== 'staff')) {
    return null;
  }

  return (
    <PermissionsProvider>
      <div className="flex min-h-[100dvh] bg-background text-foreground overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header user={user} />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
