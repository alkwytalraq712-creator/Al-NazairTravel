import React, { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/tajawal';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '@/context/AuthContext';
import { FlightBookingProvider } from '@/context/FlightBookingContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { PushNotificationProvider } from '@/context/PushNotificationProvider';
import { ServiceSettingsProvider } from '@/context/ServiceSettingsContext';
import Constants from 'expo-constants';
import { customFetch } from '@workspace/api-client-react';

// Set base URL at module level so all hooks reach the correct server
if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

// CRITICAL: register a persistent token getter at module-level so it survives
// Hot Reload / Fast Refresh (which resets module-level variables in custom-fetch).
// AuthContext also calls setAuthTokenGetter after login — that call overwrites this
// with an in-memory getter, which is fine and faster. This acts as the fallback
// that keeps all requests authenticated even immediately after a module reload.
setAuthTokenGetter(() => AsyncStorage.getItem('@qema_auth_token'));

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="visa/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="apply-visa/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="apply-visa/terms/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="visa-application/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="visa-success" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="package/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="book-package/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="flight-results" options={{ headerShown: false }} />
      <Stack.Screen name="flight-details" options={{ headerShown: false }} />
      <Stack.Screen name="flight-seats" options={{ headerShown: false }} />
      <Stack.Screen name="flight-travelers" options={{ headerShown: false }} />
      <Stack.Screen name="flight-review" options={{ headerShown: false }} />
      <Stack.Screen name="flight-success" options={{ headerShown: false }} />
      <Stack.Screen name="bookings" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="auth/verify-email" options={{ headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="legal/terms" options={{ headerShown: false }} />
      <Stack.Screen name="legal/privacy" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
    Ionicons: Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const currentVersion = Constants.expoConfig?.version ?? '1.0.0';
    const seenKey = '@qema_seen_app_update';
    void customFetch<{ updateAvailable: boolean; release?: { version: string; downloadUrl: string; releaseNotes: string; isMandatory: boolean } }>(
      `/api/app-updates/latest?platform=android&version=${encodeURIComponent(currentVersion)}`,
    ).then(async (result) => {
      if (!result.updateAvailable || !result.release) return;
      const seenVersion = await AsyncStorage.getItem(seenKey);
      if (!result.release.isMandatory && seenVersion === result.release.version) return;
      const openDownload = () => { void Linking.openURL(result.release!.downloadUrl); };
      const buttons = result.release.isMandatory
        ? [{ text: 'تحديث الآن', onPress: openDownload }]
        : [{ text: 'لاحقاً', style: 'cancel' as const }, { text: 'تحميل التحديث', onPress: openDownload }];
      Alert.alert(`تحديث جديد ${result.release.version}`, result.release.releaseNotes || 'يتوفر إصدار جديد من التطبيق.', buttons);
      await AsyncStorage.setItem(seenKey, result.release.version);
    }).catch(() => {
      // Update checks are best-effort and must never block app startup.
    });
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ServiceSettingsProvider>
                <PushNotificationProvider>
                  <FlightBookingProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <KeyboardProvider>
                        <RootLayoutNav />
                      </KeyboardProvider>
                    </GestureHandlerRootView>
                  </FlightBookingProvider>
                </PushNotificationProvider>
              </ServiceSettingsProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
