/**
 * PushNotificationProvider — Registers Expo push token & handles notification taps.
 * Only active on real native devices (not web, not simulators).
 * Integrates silently: no UI, just side-effects.
 */
import React, { useEffect, useRef, createContext, useContext } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';
import { customFetch } from '@workspace/api-client-react';

// ─── Safe dynamic imports ─────────────────────────────────────────────────────
// We guard every expo-notifications call because the module may not be available
// in the Expo Go web preview.
async function getNotificationsModule() {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

async function getDeviceModule() {
  try {
    return await import('expo-device');
  } catch {
    return null;
  }
}

// ─── Register push token with server ─────────────────────────────────────────
async function registerPushToken() {
  if (Platform.OS === 'web') return; // Push not supported on web

  const Notifications = await getNotificationsModule();
  const Device = await getDeviceModule();
  if (!Notifications || !Device) return;

  // Only works on physical devices
  if (!Device.default.isDevice) return;

  // Request permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'الإشعارات الافتراضية',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A060',
    });
  }

  try {
    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_REPL_ID ?? 'qema-travel',
    });
    const token = tokenData.data;
    if (!token) return;

    // Send to server
    await customFetch('/api/notifications/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  } catch (e) {
    console.log('[push] Token registration failed (expected in dev):', e);
  }
}

// ─── Context (no-op; used only for tree structure) ───────────────────────────
const PushContext = createContext(null);

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const listenerRef = useRef<any>(null);

  // Register token when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      registerPushToken();
    }
  }, [isAuthenticated]);

  // Handle notification tap (deep link to correct screen)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let sub: any;
    (async () => {
      const Notifications = await getNotificationsModule();
      if (!Notifications) return;

      // Foreground notification handler — show notification as alert
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Tap listener — navigate when user taps notification
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as any;
        const route = data?.route as string | undefined;
        if (route) {
          try {
            router.push(route as any);
          } catch {}
        } else {
          // Default: open notifications screen
          router.push('/notifications' as any);
        }
      });

      listenerRef.current = sub;
    })();

    return () => {
      listenerRef.current?.remove?.();
    };
  }, []);

  return <PushContext.Provider value={null}>{children}</PushContext.Provider>;
}
