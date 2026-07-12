/**
 * Manual hooks for notification endpoints not covered by orval codegen:
 * - registerPushToken
 * - deleteNotification
 * - markAllNotificationsRead
 * - deleteAllNotifications
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '../custom-fetch';
import { getListMyNotificationsQueryKey } from './api';

// ─── Register Expo Push Token ─────────────────────────────────────────────────
export function useRegisterPushToken() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await customFetch('/api/notifications/push-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }) as Response;
      if (!res.ok) throw new Error('Failed to register push token');
      return res.json();
    },
  });
}

// ─── Delete a notification ────────────────────────────────────────────────────
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await customFetch(`/api/notifications/${id}`, { method: 'DELETE' }) as Response;
      if (!res.ok) throw new Error('Failed to delete notification');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListMyNotificationsQueryKey() });
    },
  });
}

// ─── Mark all notifications read ──────────────────────────────────────────────
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await customFetch('/api/notifications/read-all', { method: 'POST' }) as Response;
      if (!res.ok) throw new Error('Failed to mark all read');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListMyNotificationsQueryKey() });
    },
  });
}

// ─── Delete all notifications ─────────────────────────────────────────────────
export function useDeleteAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await customFetch('/api/notifications/delete-all', { method: 'DELETE' }) as Response;
      if (!res.ok) throw new Error('Failed to delete all notifications');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListMyNotificationsQueryKey() });
    },
  });
}
