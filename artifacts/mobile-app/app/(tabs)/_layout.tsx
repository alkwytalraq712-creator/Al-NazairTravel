import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useServiceSettings } from '@/context/ServiceSettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs, router } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── All possible tab definitions ─────────────────────────────────────────────
const ALL_TABS = [
  { name: 'index',    label: 'الرئيسية',  icon: 'home-outline',          activeIcon: 'home',          serviceKey: null              },
  { name: 'visas',    label: 'التأشيرات', icon: 'document-text-outline', activeIcon: 'document-text', serviceKey: 'visasEnabled'    },
  { name: 'packages', label: 'الباقات',   icon: 'map-outline',           activeIcon: 'map',           serviceKey: 'packagesEnabled' },
  { name: 'flights',  label: 'الطيران',   icon: 'paper-plane-outline',   activeIcon: 'paper-plane',   serviceKey: 'flightsEnabled'  },
  { name: 'account',  label: 'حسابي',    icon: 'person-outline',        activeIcon: 'person',        serviceKey: null              },
] as const;

// ─── Premium custom tab bar ───────────────────────────────────────────────────
function PremiumTabBar({ state, navigation }: any) {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const isDark   = useColorScheme() === 'dark';
  const isIOS    = Platform.OS === 'ios';
  const isWeb    = Platform.OS === 'web';
  const services = useServiceSettings();

  // Map service key to enabled flag
  const serviceMap: Record<string, boolean> = {
    visasEnabled:    services.visasEnabled,
    packagesEnabled: services.packagesEnabled,
    flightsEnabled:  services.flightsEnabled,
  };

  return (
    <View
      style={[
        tb.container,
        {
          borderTopColor: colors.border,
          backgroundColor: isIOS ? 'transparent' : colors.card,
          paddingBottom: isWeb ? 8 : insets.bottom + 4,
        },
      ]}
    >
      {isIOS && (
        <BlurView
          intensity={95}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View style={tb.row}>
        {state.routes.map((route: any, index: number) => {
          const tab = ALL_TABS[index];
          if (!tab) return null;

          // Hide tab if its service is disabled
          if (tab.serviceKey && !serviceMap[tab.serviceKey]) return null;

          const isFocused = state.index === index;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => { if (!isFocused) navigation.navigate(route.name); }}
              style={tb.tab}
              activeOpacity={0.65}
            >
              <View style={[tb.iconPill, isFocused && { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons
                  name={(isFocused ? tab.activeIcon : tab.icon) as any}
                  size={22}
                  color={isFocused ? colors.primary : colors.mutedForeground}
                />
              </View>
              <Text
                style={[
                  tb.label,
                  { color: isFocused ? colors.primary : colors.mutedForeground },
                  isFocused && { fontFamily: 'Tajawal_700Bold' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tb = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6 },
  row: { flexDirection: 'row', paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  iconPill: {
    width: 48, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontFamily: 'Tajawal_500Medium', fontSize: 11, marginBottom: 2 },
});

// ─── iOS Liquid Glass native tabs ─────────────────────────────────────────────
function NativeTabLayout() {
  const services = useServiceSettings();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>الرئيسية</Label>
      </NativeTabs.Trigger>
      {services.visasEnabled && (
        <NativeTabs.Trigger name="visas">
          <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
          <Label>التأشيرات</Label>
        </NativeTabs.Trigger>
      )}
      {services.packagesEnabled && (
        <NativeTabs.Trigger name="packages">
          <Icon sf={{ default: 'map', selected: 'map.fill' }} />
          <Label>الباقات</Label>
        </NativeTabs.Trigger>
      )}
      {services.flightsEnabled && (
        <NativeTabs.Trigger name="flights">
          <Icon sf={{ default: 'airplane', selected: 'airplane' }} />
          <Label>الطيران</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="account">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>حسابي</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// ─── Classic layout ───────────────────────────────────────────────────────────
function ClassicTabLayout() {
  'use no memo';
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PremiumTabBar {...props} />}
    >
      <Tabs.Screen name="index"    options={{ title: 'الرئيسية'  }} />
      <Tabs.Screen name="visas"    options={{ title: 'التأشيرات' }} />
      <Tabs.Screen name="packages" options={{ title: 'الباقات'   }} />
      <Tabs.Screen name="flights"  options={{ title: 'الطيران'   }} />
      <Tabs.Screen name="account"  options={{ title: 'حسابي'    }} />
    </Tabs>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const colors = useColors();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!isAuthenticated) return null;
  return <>{children}</>;
}

export default function TabLayout() {
  const layout = isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />;
  return <AuthGuard>{layout}</AuthGuard>;
}
