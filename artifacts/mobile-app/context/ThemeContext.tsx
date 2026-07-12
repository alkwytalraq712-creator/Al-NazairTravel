/**
 * ThemeContext — Light / Dark / System preference with AsyncStorage persistence.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedScheme = 'light' | 'dark';

const THEME_KEY = '@qema_theme';

interface ThemeContextValue {
  theme: ThemePreference;
  colorScheme: ResolvedScheme;
  setTheme: (t: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  colorScheme: 'dark',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? 'dark';
  const [theme, setThemeState] = useState<ThemePreference>('system');

  // Load persisted preference once on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setThemeState(val);
      }
    });
  }, []);

  const setTheme = async (t: ThemePreference) => {
    setThemeState(t);
    await AsyncStorage.setItem(THEME_KEY, t);
  };

  const colorScheme: ResolvedScheme = theme === 'system' ? systemScheme : theme;

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
