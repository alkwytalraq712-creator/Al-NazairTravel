import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
  useLogout,
  setAuthTokenGetter,
} from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';

const TOKEN_KEY = '@qema_auth_token';

interface LoginInput {
  identifier: string;
  password: string;
}

interface SignupInput {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: SignupInput) => Promise<void>;
  tryRestoreFromBiometric: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Token helpers ─────────────────────────────────────────────────────────

let _cachedToken: string | null | undefined = undefined;

async function loadToken(): Promise<string | null> {
  if (_cachedToken !== undefined) return _cachedToken;
  _cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return _cachedToken;
}

async function saveToken(token: string): Promise<void> {
  _cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

async function clearToken(): Promise<void> {
  _cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * Read the current auth token for manual fetch() calls that bypass the
 * shared api-client-react instance (e.g. multipart/base64 uploads).
 */
export async function getAuthToken(): Promise<string | null> {
  return loadToken();
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return '';
}

// ─── Raw API calls that return the token ───────────────────────────────────

async function apiLogin(data: LoginInput): Promise<{ token: string }> {
  const res = await fetch(`${getApiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال' })) as { error?: string };
    throw new Error(err.error ?? 'بيانات خاطئة');
  }
  return res.json() as Promise<{ token: string }>;
}

async function apiSignup(data: SignupInput): Promise<{ token: string }> {
  const res = await fetch(`${getApiBase()}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال' })) as { error?: string };
    throw new Error(err.error ?? 'خطأ في التسجيل');
  }
  return res.json() as Promise<{ token: string }>;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const tokenReadyRef = useRef(false);

  // Restore token from storage on first mount
  useEffect(() => {
    (async () => {
      const token = await loadToken();
      setAuthTokenGetter(token ? () => token : null);
      tokenReadyRef.current = true;
      // Re-fetch current user now that the token is ready
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: user, isLoading } = useGetCurrentUser({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false, staleTime: 60_000 } as any,
  });

  const logoutMutation = useLogout();

  const login = useCallback(
    async (data: LoginInput) => {
      const result = await apiLogin(data);
      if (result.token) {
        await saveToken(result.token);
        setAuthTokenGetter(() => result.token);
      }
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync().catch(() => {});
    await clearToken();
    setAuthTokenGetter(null);
    queryClient.clear();
  }, [logoutMutation, queryClient]);

  const register = useCallback(
    async (data: SignupInput) => {
      const result = await apiSignup(data);
      if (result.token) {
        await saveToken(result.token);
        setAuthTokenGetter(() => result.token);
      }
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  /**
   * After a successful biometric challenge, reload the stored token and try
   * to re-hydrate the session without asking for the password again.
   * Returns true if the session was restored successfully.
   */
  const tryRestoreFromBiometric = useCallback(async (): Promise<boolean> => {
    const token = await loadToken();
    if (!token) return false;
    setAuthTokenGetter(() => token);
    try {
      await queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      return true;
    } catch {
      return false;
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        tryRestoreFromBiometric,
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
