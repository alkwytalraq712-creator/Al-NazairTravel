import React, { createContext, useCallback, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
  useLogin,
  useLogout,
  useSignup,
} from '@workspace/api-client-react';
import type { LoginInput, SignupInput, User } from '@workspace/api-client-react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: SignupInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetCurrentUser({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false, staleTime: 60_000 } as any,
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const signupMutation = useSignup();

  const login = useCallback(
    async (data: LoginInput) => {
      await loginMutation.mutateAsync({ data });
      await queryClient.invalidateQueries();
    },
    [loginMutation, queryClient],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    queryClient.clear();
  }, [logoutMutation, queryClient]);

  const register = useCallback(
    async (data: SignupInput) => {
      await signupMutation.mutateAsync({ data });
      await queryClient.invalidateQueries();
    },
    [signupMutation, queryClient],
  );

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
