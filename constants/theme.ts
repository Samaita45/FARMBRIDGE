import { Platform } from 'react-native';

import { Colors as BaseColors } from './colors';

/** Light/dark palette for themed components (`useThemeColor`, `ThemedText`, etc.). */
export const Colors = {
  light: {
    text: BaseColors.black,
    background: BaseColors.surface,
    tint: BaseColors.primary,
    icon: BaseColors.gray[600],
    tabIconDefault: BaseColors.gray[400],
    tabIconSelected: BaseColors.primary,
  },
  dark: {
    text: BaseColors.gray[100],
    background: BaseColors.dark,
    tint: BaseColors.accent,
    icon: BaseColors.gray[400],
    tabIconDefault: BaseColors.gray[500],
    tabIconSelected: BaseColors.accent,
  },
} as const;

export { BaseColors };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadows = {
  card: {
    shadowColor: BaseColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: BaseColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const Typography = {
  display: {
    fontFamily: Platform.select({ ios: 'Fraunces_700Bold', default: 'Fraunces_700Bold' }),
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
  },
  h1: {
    fontFamily: Platform.select({ ios: 'Fraunces_700Bold', default: 'Fraunces_700Bold' }),
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
  },
  h2: {
    fontFamily: Platform.select({ ios: 'PlusJakartaSans_700Bold', default: 'PlusJakartaSans_700Bold' }),
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
  },
  body: {
    fontFamily: Platform.select({ ios: 'PlusJakartaSans_400Regular', default: 'PlusJakartaSans_400Regular' }),
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: Platform.select({ ios: 'PlusJakartaSans_400Regular', default: 'PlusJakartaSans_400Regular' }),
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  button: {
    fontFamily: Platform.select({ ios: 'PlusJakartaSans_600SemiBold', default: 'PlusJakartaSans_600SemiBold' }),
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
};

export const AppTheme = {
  colors: Colors,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  typography: Typography,
} as const;
