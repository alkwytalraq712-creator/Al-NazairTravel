/**
 * PermissionsContext — surfaces the current user's staff module permissions.
 * Admin (permissions === null) has full access to everything.
 * Staff employees see only the modules assigned by the admin.
 *
 * Supports both legacy module-root keys ('visa_applications') and new
 * granular dot-notation keys ('visa_applications.view').
 */
import React, { createContext, useContext } from 'react';
import { useGetCurrentUser } from '@workspace/api-client-react';
import { canAccess } from '@/lib/staff-modules';

interface PermissionsContextValue {
  /** null = admin/full access; string[] = staff permissions list */
  permissions: string[] | null;
  isAdmin: boolean;
  isStaff: boolean;
  /** Check a specific permission key (module root or granular dot-key) */
  can: (permKey: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: null,
  isAdmin: false,
  isStaff: false,
  can: () => false,
});

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetCurrentUser();

  const perms = (user as any)?.permissions as string[] | null | undefined;
  const isAdmin = user?.role === 'admin' && perms == null;
  const isStaff = !isAdmin && !!user;

  const value: PermissionsContextValue = {
    permissions: perms ?? null,
    isAdmin,
    isStaff,
    can: (key) => canAccess(isAdmin ? null : (perms ?? []), key),
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
