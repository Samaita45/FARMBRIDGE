/**
 * Light/dark palette for the themed primitives (`useThemeColor`, `ThemedText`).
 *
 * Derived from `DS` rather than defining its own values. The dark palette is a
 * placeholder: FarmBridge ships light-only today, and a real dark theme needs
 * its own contrast pass rather than an inversion.
 */
import { DS } from './design-system';
import BaseColors from './colors';

export const Colors = {
  light: {
    text: DS.colors.text,
    background: DS.colors.background,
    tint: DS.colors.primary,
    icon: DS.colors.textMuted,
    tabIconDefault: DS.colors.textFaint,
    tabIconSelected: DS.colors.primary,
  },
  dark: {
    text: DS.colors.gray[100],
    background: DS.colors.gray[900],
    tint: DS.colors.primaryLight,
    icon: DS.colors.gray[400],
    tabIconDefault: DS.colors.gray[500],
    tabIconSelected: DS.colors.primaryLight,
  },
} as const;

export { BaseColors };

/** @deprecated Use `DS.spacing`. */
export const Spacing = DS.spacing;
/** @deprecated Use `DS.radius`. */
export const BorderRadius = {
  sm: DS.radius.sm,
  md: DS.radius.md,
  lg: DS.radius.lg,
  xl: DS.radius.xl,
  full: DS.radius.full,
} as const;
/** @deprecated Use `DS.shadow`. */
export const Shadows = { card: DS.shadow.card, elevated: DS.shadow.elevated } as const;
/** @deprecated Use `DS.typography`. */
export const Typography = DS.typography;

export const AppTheme = {
  colors: Colors,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  typography: Typography,
} as const;
