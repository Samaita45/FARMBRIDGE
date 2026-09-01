/**
 * @deprecated Import `DS` from `@/constants/design-system`.
 *
 * Compatibility alias. Every value below resolves to a `DS` token, so this file
 * can no longer disagree with the design system. It exists only so the ~40
 * screens still importing `Colors` keep working while they are migrated in the
 * screen sweep; delete it once nothing imports it.
 */
import { DS } from './design-system';

const Colors = {
  primary: DS.colors.primary,
  primaryDark: DS.colors.primaryDark,
  primaryLight: DS.colors.primaryLight,
  primaryBg: DS.colors.background,
  primaryMid: DS.colors.primaryMid,

  accent: DS.colors.accent,
  accentLight: DS.colors.accentLight,

  white: DS.colors.surface,
  black: '#000000',

  inputBg: DS.colors.background,
  inputBorder: DS.colors.border,
  placeholder: DS.colors.textSoft,

  textPrimary: DS.colors.text,
  textSecondary: DS.colors.textMuted,
  textLight: DS.colors.textInverse,

  error: DS.semantic.danger.solid,
  success: DS.semantic.success.solid,
  warning: DS.semantic.warning.solid,

  overlay: DS.colors.overlay,

  surface: DS.colors.background,
  dark: DS.colors.text,
  secondary: DS.colors.primaryDark,

  gray: DS.colors.gray,
} as const;

export default Colors;
export { Colors };
export type ColorKey = keyof typeof Colors;
