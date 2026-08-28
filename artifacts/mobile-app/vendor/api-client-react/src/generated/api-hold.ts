/**
 * Hold Booking API hooks — manually authored (not orval-generated).
 * Extends the generated api.ts with hold-booking specific mutations/queries.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';

import type { FlightBooking, FlightBookingInput, HoldSettings, HoldSettingsUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

function withQueryKey<T, E>(query: UseQueryResult<T, E>, key: QueryKey): UseQueryResult<T, E> & { queryKey: QueryKey } {
  (query as any).queryKey = key;
  return query as UseQueryResult<T, E> & { queryKey: QueryKey };
}

// ─── GET /api/settings/hold ────────────────────────────────────────────────────

export const getGetHoldSettingsUrl = () => `/api/settings/hold`;

export const getHoldSettings = async (options?: RequestInit): Promise<HoldSettings> => {
  return customFetch<HoldSettings>(getGetHoldSettingsUrl(), { ...options, method: 'GET' });
};

export const getGetHoldSettingsQueryKey = () => [`/api/settings/hold`] as const;

export const getGetHoldSettingsQueryOptions = <
  TData = Awaited<ReturnType<typeof getHoldSettings>>,
  TError = ErrorType<unknown>,
>(
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getHoldSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetHoldSettingsQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getHoldSettings>>> = ({ signal }) =>
    getHoldSettings({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getHoldSettings>>, TError, TData> & { queryKey: QueryKey };
};

export type GetHoldSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getHoldSettings>>>;
export type GetHoldSettingsQueryError = ErrorType<unknown>;

export function useGetHoldSettings<TData = Awaited<ReturnType<typeof getHoldSettings>>, TError = ErrorType<unknown>>(
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getHoldSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetHoldSettingsQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

// ─── PATCH /api/admin/settings/hold ───────────────────────────────────────────

export const getUpdateHoldSettingsUrl = () => `/api/admin/settings/hold`;

export const updateHoldSettings = async (
  data: BodyType<HoldSettingsUpdate>,
  options?: RequestInit,
): Promise<HoldSettings> => {
  return customFetch<HoldSettings>(getUpdateHoldSettingsUrl(), {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(data),
  });
};

export const getUpdateHoldSettingsMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<HoldSettings, TError, { data: BodyType<HoldSettingsUpdate> }, TContext>;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationOptions<HoldSettings, TError, { data: BodyType<HoldSettingsUpdate> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<HoldSettings, { data: BodyType<HoldSettingsUpdate> }> = ({ data }) =>
    updateHoldSettings(data, requestOptions);
  return { mutationFn, ...mutationOptions };
};

export type UpdateHoldSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateHoldSettings>>>;
export type UpdateHoldSettingsMutationError = ErrorType<unknown>;

export const useUpdateHoldSettings = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateHoldSettings>>, TError, { data: BodyType<HoldSettingsUpdate> }, TContext>;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationResult<Awaited<ReturnType<typeof updateHoldSettings>>, TError, { data: BodyType<HoldSettingsUpdate> }, TContext> => {
  return useMutation(getUpdateHoldSettingsMutationOptions(options));
};

// ─── POST /api/flight-bookings/hold ───────────────────────────────────────────

export const getCreateHoldBookingUrl = () => `/api/flight-bookings/hold`;

export const createHoldBooking = async (
  data: BodyType<FlightBookingInput>,
  options?: RequestInit,
): Promise<FlightBooking> => {
  return customFetch<FlightBooking>(getCreateHoldBookingUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(data),
  });
};

export const getCreateHoldBookingMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<FlightBooking, TError, { data: BodyType<FlightBookingInput> }, TContext>;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationOptions<FlightBooking, TError, { data: BodyType<FlightBookingInput> }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<FlightBooking, { data: BodyType<FlightBookingInput> }> = ({ data }) =>
    createHoldBooking(data, requestOptions);
  return { mutationFn, ...mutationOptions };
};

export type CreateHoldBookingMutationResult = NonNullable<Awaited<ReturnType<typeof createHoldBooking>>>;
export type CreateHoldBookingMutationError = ErrorType<unknown>;

export const useCreateHoldBooking = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createHoldBooking>>, TError, { data: BodyType<FlightBookingInput> }, TContext>;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationResult<Awaited<ReturnType<typeof createHoldBooking>>, TError, { data: BodyType<FlightBookingInput> }, TContext> => {
  return useMutation(getCreateHoldBookingMutationOptions(options));
};

// ─── POST /api/flight-bookings/:id/complete ───────────────────────────────────

export const getCompleteHoldBookingUrl = (id: number) => `/api/flight-bookings/${id}/complete`;

export const completeHoldBooking = async (id: number, options?: RequestInit): Promise<FlightBooking> => {
  return customFetch<FlightBooking>(getCompleteHoldBookingUrl(id), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
};

export const getCompleteHoldBookingMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<FlightBooking, TError, { id: number }, TContext>;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationOptions<FlightBooking, TError, { id: number }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<FlightBooking, { id: number }> = ({ id }) =>
    completeHoldBooking(id, requestOptions);
  return { mutationFn, ...mutationOptions };
};

export type CompleteHoldBookingMutationResult = NonNullable<Awaited<ReturnType<typeof completeHoldBooking>>>;
export type CompleteHoldBookingMutationError = ErrorType<unknown>;

export const useCompleteHoldBooking = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeHoldBooking>>, TError, { id: number }, TContext>;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationResult<Awaited<ReturnType<typeof completeHoldBooking>>, TError, { id: number }, TContext> => {
  return useMutation(getCompleteHoldBookingMutationOptions(options));
};
