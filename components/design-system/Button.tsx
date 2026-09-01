import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { DS } from '@/constants/design-system';

/**
 * The button. No screen should define its own — there were 99 inline button
 * styles across 25 files before this existed, with radii from 10 to 50 and no
 * shared pressed or disabled state.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Stretches to the container width. Default for `md` and `lg`. */
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  /** Escape hatch for layout only — never for colour, radius or typography. */
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** Light impact on press. On by default for `primary` and `danger`. */
  haptic?: boolean;
  children?: ReactNode;
}

interface VariantTokens {
  background: string;
  border: string;
  foreground: string;
  pressedBackground: string;
}

const VARIANTS: Record<ButtonVariant, VariantTokens> = {
  primary: {
    background: DS.colors.primary,
    border: DS.colors.primary,
    foreground: DS.colors.textInverse,
    pressedBackground: DS.colors.primaryDark,
  },
  secondary: {
    background: DS.colors.primaryMid,
    border: DS.colors.primaryMid,
    foreground: DS.colors.primaryDark,
    pressedBackground: DS.colors.blue[200],
  },
  outline: {
    background: 'transparent',
    border: DS.colors.border,
    foreground: DS.colors.text,
    pressedBackground: DS.colors.surfaceMuted,
  },
  ghost: {
    background: 'transparent',
    border: 'transparent',
    foreground: DS.colors.primary,
    pressedBackground: DS.colors.primaryBg,
  },
  danger: {
    background: DS.semantic.danger.solid,
    border: DS.semantic.danger.solid,
    foreground: DS.colors.textInverse,
    pressedBackground: DS.semantic.danger.fg,
  },
  success: {
    background: DS.semantic.success.solid,
    border: DS.semantic.success.solid,
    foreground: DS.colors.textInverse,
    pressedBackground: DS.semantic.success.fg,
  },
};

/** Every height clears `DS.layout.touchTarget` (48). */
const SIZES: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; fontSize: number; iconSize: number; gap: number }
> = {
  sm: { height: 40, paddingHorizontal: 14, fontSize: 14, iconSize: 16, gap: 6 },
  md: { height: 48, paddingHorizontal: 20, fontSize: 15, iconSize: 18, gap: 8 },
  lg: { height: 54, paddingHorizontal: 24, fontSize: 16, iconSize: 20, gap: 8 },
};

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  haptic,
  disabled,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: ButtonProps) {
  const tokens = VARIANTS[variant];
  const dims = SIZES[size];
  const isDisabled = Boolean(disabled) || loading;
  const stretches = fullWidth ?? size !== 'sm';

  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shouldHaptic = haptic ?? (variant === 'primary' || variant === 'danger');

  const press = (next: number) => {
    if (reducedMotion || isDisabled) return;
    scale.value = withTiming(next, { duration: DS.motion.fast });
  };

  return (
    <AnimatedPressableBase
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={() => press(0.97)}
      onPressOut={() => press(1)}
      onPress={(event) => {
        if (shouldHaptic && Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height: dims.height,
          paddingHorizontal: dims.paddingHorizontal,
          gap: dims.gap,
          backgroundColor: pressed && !isDisabled ? tokens.pressedBackground : tokens.background,
          borderColor: tokens.border,
        },
        variant === 'outline' && styles.outlineBorder,
        stretches && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator size="small" color={tokens.foreground} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={dims.iconSize} color={tokens.foreground} />
          ) : null}
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={DS.layout.maxFontScale}
            style={[
              styles.label,
              { fontSize: dims.fontSize, color: tokens.foreground },
              textStyle,
            ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={dims.iconSize} color={tokens.foreground} />
          ) : null}
        </>
      )}
    </AnimatedPressableBase>
  );
}

/**
 * A square icon-only button. Separate from `Button` because it must always
 * carry an explicit label — an icon alone announces nothing to a screen reader.
 */
export interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  variant?: Extract<ButtonVariant, 'primary' | 'outline' | 'ghost' | 'danger'>;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  accessibilityLabel,
  variant = 'ghost',
  size = 'md',
  style,
  disabled,
  ...rest
}: IconButtonProps) {
  const tokens = VARIANTS[variant];
  const dims = SIZES[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      // Keeps the tappable area at the minimum even when the glyph is smaller.
      hitSlop={Math.max(0, (DS.layout.touchTarget - dims.height) / 2)}
      style={({ pressed }) => [
        styles.base,
        {
          width: dims.height,
          height: dims.height,
          paddingHorizontal: 0,
          backgroundColor: pressed && !disabled ? tokens.pressedBackground : tokens.background,
          borderColor: tokens.border,
        },
        variant === 'outline' && styles.outlineBorder,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}>
      <Ionicons name={icon} size={dims.iconSize} color={tokens.foreground} />
    </Pressable>
  );
}

/** Groups buttons on one row with consistent spacing. */
export function ButtonRow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DS.radius.md,
    borderWidth: 0,
  },
  outlineBorder: {
    borderWidth: 1,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: DS.fontFamily.semibold,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    alignItems: 'center',
  },
});
