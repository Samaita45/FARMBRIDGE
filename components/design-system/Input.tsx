import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { DS } from '@/constants/design-system';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Shown under the field and announced with it. Puts the field in the error state. */
  error?: string;
  /** Shown under the field when there is no error. */
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Trailing affordance. Needs a label — it is a control, not decoration. */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  rightIconLabel?: string;
  /** Trailing icon colour. A validity tick is green; a reveal toggle is not. */
  rightIconColor?: string;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * `outlined` is the form field used across the app. `filled` is the soft
   * tinted pill the auth screens use — no border, the placeholder carrying the
   * label, and a leading icon. It exists as a variant rather than a second
   * component so validation, focus, error and accessibility stay in one place.
   */
  variant?: 'outlined' | 'filled';
}

/**
 * The text field. Handles its own focus and error styling so screens do not
 * reimplement it, and wires the label, error and required state through to
 * assistive technology.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    hint,
    icon,
    rightIcon,
    onRightIconPress,
    rightIconLabel,
    rightIconColor,
    required,
    containerStyle,
    variant = 'outlined',
    onFocus,
    onBlur,
    editable = true,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(false);

  const filled = variant === 'filled';

  /*
    A filled field shows focus with its border rather than a colour change, so
    it needs a visible ring when focused and an invisible one otherwise —
    transparent, not zero-width, so the field does not resize as you tab
    through it.
  */
  const borderColor = error
    ? DS.semantic.danger.solid
    : focused
      ? DS.colors.primary
      : filled
        ? 'transparent'
        : DS.colors.borderControl;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          filled && styles.fieldFilled,
          { borderColor },
          !editable && styles.fieldDisabled,
          error ? styles.fieldError : null,
        ]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={
              error
                ? DS.semantic.danger.solid
                : focused || filled
                  ? DS.colors.primary
                  : DS.colors.textSoft
            }
          />
        ) : null}

        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={DS.colors.textSoft}
          editable={editable}
          maxFontSizeMultiplier={DS.layout.maxFontScale}
          accessibilityLabel={label ?? props.placeholder}
          accessibilityHint={error ?? hint}
          aria-invalid={Boolean(error)}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            accessibilityRole="button"
            accessibilityLabel={rightIconLabel ?? 'Toggle'}
            hitSlop={12}>
            <Ionicons name={rightIcon} size={18} color={rightIconColor ?? DS.colors.textSoft} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  required: {
    color: DS.semantic.danger.solid,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    minHeight: DS.layout.touchTarget,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.surface,
  },
  fieldFilled: {
    backgroundColor: DS.colors.forest[100],
    borderRadius: DS.radius.lg,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  fieldError: {
    backgroundColor: DS.semantic.danger.bg,
  },
  fieldDisabled: {
    backgroundColor: DS.colors.surfaceMuted,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: DS.typography.body.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },
  error: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.danger.fg,
  },
  hint: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
});
