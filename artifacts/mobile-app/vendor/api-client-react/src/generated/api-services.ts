/**
 * Service Settings API hooks — manually authored.
 * Lets admin enable/disable flights, packages, visas from the dashboard.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { customFetch } from '../custom-fetch';
import type { ErrorType } from '../custom-fetch';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ServiceSettings {
  id: number;
  flightsEnabled: boolean;
  packagesEnabled: boolean;
  visasEnabled: boolean;
  updatedAt: string;
}

export type ServiceSettingsUpdate = Partial<
  Pick<ServiceSettings, 'flightsEnabled' | 'packagesEnabled' | 'visasEnabled'>
>;

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

// ── GET /api/settings/services ─────────────────────────────────────────────────

export const getGetServiceSettingsUrl = () => `/api/settings/services`;

export const getServiceSettings = async (options?: RequestInit): Promise<ServiceSettings> =>
  customFetch<ServiceSettings>(getGetServiceSettingsUrl(), { ...options, method: 'GET' });

export const getGetServiceSettingsQueryKey = () => [`/api/settings/services`] as const;

export const getGetServiceSettingsQueryOptions = <
  TData = Awaited<ReturnType<typeof getServiceSettings>>,
  TError = ErrorType<unknown>,
>(
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getServiceSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetServiceSettingsQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getServiceSettings>>> = ({ signal }) =>
    getServiceSettings({ signal, ...requestOptions });
  return {
    queryKey,
    queryFn,
    staleTime: 30_000,
    ...queryOptions,
  } as UseQueryOptions<Awaited<ReturnType<typeof getServiceSettings>>, TError, TData> & { queryKey: QueryKey };
};

export type GetServiceSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getServiceSettings>>>;
export type GetServiceSettingsQueryError = ErrorType<unknown>;

export function useGetServiceSettings<
  TData = Awaited<ReturnType<typeof getServiceSettings>>,
  TError = ErrorType<unknown>,
>(
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getServiceSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetServiceSettingsQueryOptions(options);
  const query = useQuery(queryOptions);
  (query as any).queryKey = queryOptions.queryKey;
  return query as UseQueryResult<TData, TError> & { queryKey: QueryKey };
}

// ── PATCH /api/admin/settings/services ────────────────────────────────────────

export const updateServiceSettings = async (
  body: ServiceSettingsUpdate,
  options?: SecondParameter<typeof customFetch>,
): Promise<ServiceSettings> =>
  customFetch<ServiceSettings>('/api/admin/settings/services', {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(options as any)?.headers },
    body: JSON.stringify(body),
  });

export type UpdateServiceSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateServiceSettings>>>;
export type UpdateServiceSettingsMutationError = ErrorType<unknown>;

export function useUpdateServiceSettings<TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof updateServiceSettings>>,
      TError,
      ServiceSettingsUpdate,
      TContext
    >;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationResult<
  Awaited<ReturnType<typeof updateServiceSettings>>,
  TError,
  ServiceSettingsUpdate,
  TContext
> {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updateServiceSettings>>,
    ServiceSettingsUpdate
  > = (vars) => updateServiceSettings(vars, requestOptions);

  return useMutation<
    Awaited<ReturnType<typeof updateServiceSettings>>,
    TError,
    ServiceSettingsUpdate,
    TContext
  >({ mutationFn, ...mutationOptions });
}
