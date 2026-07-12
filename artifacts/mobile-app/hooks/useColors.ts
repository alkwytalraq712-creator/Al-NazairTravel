import colors from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

/**
 * Returns design tokens for the active color scheme.
 * Resolves the scheme through ThemeContext (light | dark | system-follow).
 */
export function useColors() {
  const { colorScheme } = useTheme();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
