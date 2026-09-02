/**
 * FarmBridge design system — the typed surface over `design-tokens.js`.
 *
 * `DS` is the only token object screens should import. The other token modules
 * in this folder (`colors`, `theme`, `Typography`, `Spacing`) are compatibility
 * aliases that resolve to these same values and are being retired.
 *
 * Values live in `./design-tokens.js` because `tailwind.config.js` reads that
 * file too — one palette, two consumers, no drift.
 */
import type { TextStyle, ViewStyle } from 'react-native';

import tokens from './design-tokens';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

type TypeStyle = Required<Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontFamily'>>;

export interface SemanticRole {
  /** Text and icon colour. Passes 4.5:1 on `bg`. */
  fg: string;
  /** Tinted surface for the state. */
  bg: string;
  border: string;
  /** Filled treatment — badges, solid buttons, chart marks. */
  solid: string;
  /**
   * Text and icon colour for use ON `solid`. Not always white: white measures
   * 3.19:1 on the amber. Take this rather than assuming a foreground.
   */
  onSolid: string;
}

export const DS = {
  colors: tokens.colors as typeof tokens.colors,
  semantic: tokens.semantic as Record<
    'success' | 'warning' | 'danger' | 'info' | 'neutral',
    SemanticRole
  >,
  chart: tokens.chart,
  spacing: tokens.spacing,
  radius: tokens.radius,
  shadow: tokens.shadow as Record<'soft' | 'card' | 'elevated', ShadowStyle>,
  fontFamily: tokens.fontFamily,
  typography: tokens.typography as Record<keyof typeof tokens.typography, TypeStyle>,
  motion: tokens.motion,
  layout: tokens.layout,

  /** @deprecated Use `DS.motion`. */
  animation: tokens.motion,
};

export type SemanticState = keyof typeof DS.semantic;
export type TypographyVariant = keyof typeof DS.typography;

/**
 * @deprecated Import `DS`. Retained so the home dashboard and its cards keep
 * working while they are migrated in the screen sweep.
 */
export const Premium = {
  primary: DS.colors.primary,
  primaryBg: DS.colors.primaryBg,
  primaryDark: DS.colors.primaryDark,
  primaryLight: DS.colors.primaryLight,
  green: DS.colors.accent,
  greenLight: DS.colors.accentLight,
  background: DS.colors.background,
  surface: DS.colors.surface,
  surfaceGlass: DS.colors.surfaceGlass,
  surfaceGlassBorder: DS.colors.surfaceGlassBorder,
  text: DS.colors.text,
  textMuted: DS.colors.textMuted,
  textSoft: DS.colors.textSoft,
  orange: DS.colors.orange,
  purple: DS.colors.purple,
  red: DS.semantic.danger.solid,
  cream: DS.semantic.warning.bg,
  creamBorder: DS.semantic.warning.border,
  radiusXl: DS.radius.xxl,
  radiusLg: DS.radius.xl,
  radiusMd: DS.radius.lg,
  radiusSm: DS.radius.md,
  shadow: DS.shadow.elevated,
  shadowSoft: DS.shadow.card,
};
