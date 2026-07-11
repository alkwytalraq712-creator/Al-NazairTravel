import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs, router } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>الرئيسية</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="visas">
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>التأشيرات</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="packages">
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <Label>الباقات</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="flights">
        <Icon sf={{ default: 'airplane', selected: 'airplane' }} />
        <Label>الطيران</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>حسابي</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  "use no memo";
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: isWeb ? 0 : safeAreaInsets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="visas"
        options={{
          title: 'التأشيرات',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="doc.text.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="file-text" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="packages"
        options={{
          title: 'الباقات',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="map" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="flights"
        options={{
          title: 'الطيران',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="airplane" tintColor={color} size={22} />
            ) : (
              <Feather name="send" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.fill" tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const colors = useColors();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
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
