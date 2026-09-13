import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
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

import { BUTTON_VARIANTS } from '@/constants/button-variants';
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
  | 'success'
  /** Over photography — see VARIANTS.onImage. */
  | 'onImage';

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

/*
  The table lives in constants/button-variants.js so that
  scripts/contrast-check.mjs can measure exactly what this renders. A checker
  with its own copy of these colours keeps passing while the component drifts
  away from it, which is worse than having no checker at all.
*/
const VARIANTS = BUTTON_VARIANTS as Record<ButtonVariant, VariantTokens & { stroked: boolean }>;

/** Every height clears `DS.layout.touchTarget` (48). */
const SIZES: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; fontSize: number; iconSize: number; gap: number }
> = {
  sm: { height: 40, paddingHorizontal: 14, fontSize: 14, iconSize: 16, gap: 6 },
  md: { height: 48, paddingHorizontal: 20, fontSize: 15, iconSize: 18, gap: 8 },
  lg: { height: 54, paddingHorizontal: 24, fontSize: 16, iconSize: 20, gap: 8 },
};

/*
 * The scale animation lives on a wrapping Animated.View rather than on the
 * Pressable itself.
 *
 * Animated.createAnimatedComponent(Pressable) silently discards a *function*
 * style — the `({ pressed }) => [...]` form Pressable needs for its pressed
 * state. The result was a button with no height, no padding and no background:
 * present in the tree, laid out as a zero-height box, and invisible on screen.
 * Every Button in the app was affected, which meant screens appeared to be
 * missing their primary action entirely.
 *
 * Keeping the two concerns in separate components means Pressable gets its
 * function style and Reanimated gets a plain animated style, and neither has to
 * accommodate the other.
 */

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

  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shouldHaptic = haptic ?? (variant === 'primary' || variant === 'danger');

  const press = (next: number) => {
    if (reducedMotion || isDisabled) return;
    // `.set()` rather than assigning `.value`: same effect, and it is the
    // API the React Compiler recognises as a legitimate write.
    scale.set(withTiming(next, { duration: DS.motion.fast }));
  };

  return (
    <Animated.View style={[animatedStyle, stretches && styles.fullWidth, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPressIn={() => {
          setPressed(true);
          press(0.97);
        }}
        onPressOut={() => {
          setPressed(false);
          press(1);
        }}
        onPress={(event) => {
          if (shouldHaptic && Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress?.(event);
        }}
        /*
          A PLAIN ARRAY, NOT `({ pressed }) => [...]`.

          Pressable's function style is the documented way to tint a press, and
          it is also the single most fragile prop in this component: anything
          that wraps Pressable has to know to call it. This file already carries
          the scar — Animated.createAnimatedComponent(Pressable) silently
          discarded it, and every Button in the app rendered with no height, no
          padding and no background. Pressable is now wrapped a second time, by
          NativeWind's jsx runtime, which swaps it for `CssInterop.Pressable`
          for every element in the app.

          When that form is dropped the button does not degrade, it disappears:
          the background, the size and the border all live inside the function.
          The press tint is the only thing worth that risk, and it is not worth
          it. Tracking `pressed` in state costs one re-render per touch and
          makes the array plain, which is the form every wrapper handles.
        */
        style={[
          styles.base,
          {
            height: dims.height,
            paddingHorizontal: dims.paddingHorizontal,
            gap: dims.gap,
            backgroundColor:
              pressed && !isDisabled ? tokens.pressedBackground : tokens.background,
            borderColor: tokens.border,
          },
          tokens.stroked && styles.outlineBorder,
          stretches && styles.fill,
          isDisabled && styles.disabled,
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
      </Pressable>
    </Animated.View>
  );
}

/**
 * A square icon-only button. Separate from `Button` because it must always
 * carry an explicit label — an icon alone announces nothing to a screen reader.
 */
export interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  variant?: Extract<ButtonVariant, 'primary' | 'outline' | 'ghost' | 'danger' | 'onImage'>;
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
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      // Keeps the tappable area at the minimum even when the glyph is smaller.
      hitSlop={Math.max(0, (DS.layout.touchTarget - dims.height) / 2)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      // A plain array for the same reason as Button above: this is the back
      // arrow on the auth screens, and it sits on a photograph. If the style is
      // dropped there is no scrim disc behind the glyph and no way back.
      style={[
        styles.base,
        {
          width: dims.height,
          height: dims.height,
          paddingHorizontal: 0,
          backgroundColor: pressed && !disabled ? tokens.pressedBackground : tokens.background,
          borderColor: tokens.border,
        },
        tokens.stroked && styles.outlineBorder,
        variant === 'onImage' && styles.round,
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
    // Pill, matching the reference designs. The restrained radii elsewhere
    // (cards, chips, inputs) still hold — a fully rounded *button* reads as
    // the primary thing to press, which is exactly what it is.
    borderRadius: DS.radius.full,
    borderWidth: 0,
  },
  outlineBorder: {
    borderWidth: 1,
  },
  round: {
    borderRadius: DS.radius.full,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  // The Pressable fills the wrapper, so a stretched wrapper yields a
  // full-width control rather than a full-width box with a small button in it.
  fill: {
    width: '100%',
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
