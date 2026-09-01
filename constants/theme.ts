/**
 * Light/dark palette for the themed primitives (`useThemeColor`, `ThemedText`).
 *
 * Derived from `DS` rather than defining its own values. The dark palette is a
 * placeholder: FarmBridge ships light-only today, and a real dark theme needs
 * its own contrast pass rather than an inversion.
 */
import { DS } from './design-system';

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

/**
 * This module now owns exactly one thing: the light/dark map that
 * `useThemeColor` and the themed primitives read. Everything else it used to
 * re-export lives on `DS`.
 */
