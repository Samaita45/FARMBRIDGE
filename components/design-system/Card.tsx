import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { DS } from '@/constants/design-system';

/**
 * The surface primitive.
 *
 * `outlined` is the default and should stay that way: a hairline border reads
 * as structure, where a drop shadow on every card reads as noise. Reach for
 * `raised` only when a surface genuinely floats above the page — a sheet, a
 * menu, a sticky action bar.
 */
export type CardVariant = 'outlined' | 'flat' | 'raised';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  /** `DS.spacing` value. Pass 0 for edge-to-edge content such as an image header. */
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  variant = 'outlined',
  padding = DS.spacing.md,
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        { padding },
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        variant === 'raised' && styles.raised,
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}

/** A divider between rows inside a card. */
export function CardDivider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  flat: {
    backgroundColor: DS.colors.surfaceMuted,
  },
  raised: {
    ...DS.shadow.card,
    borderWidth: 1,
    borderColor: DS.colors.borderLight,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DS.colors.border,
    marginVertical: DS.spacing.sm,
  },
});
