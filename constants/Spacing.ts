/**
 * @deprecated Import `DS` from `@/constants/design-system`.
 *
 * Compatibility alias. `Spacing.md` was 12 here and 16 in the design system;
 * it now resolves to the design system's value, so the two can no longer
 * disagree.
 */
import { DS } from './design-system';

export const Spacing = {
  xs: DS.spacing.xs,
  sm: DS.spacing.sm,
  md: DS.spacing.md,
  base: DS.spacing.md,
  lg: DS.spacing.lg,
  xl: DS.spacing.lg,
  xxl: DS.spacing.xl,
  xxxl: DS.spacing.xxl,
} as const;

export const Radius = {
  pill: DS.radius.full,
  card: DS.radius.lg,
  modal: DS.radius.xl,
  chip: DS.radius.md,
  avatar: DS.radius.full,
} as const;

export const Shadows = {
  card: DS.shadow.card,
  elevated: DS.shadow.elevated,
} as const;

export default Spacing;
