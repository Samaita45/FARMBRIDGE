import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import Colors from '@/constants/colors';
import Typography from '@/constants/Typography';

export type ButtonVariant = 'primary' | 'outline' | 'text';

export interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  leftIcon,
  rightIcon,
  style,
  fullWidth = true,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'text'    && styles.textVariant,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && variant === 'primary' && styles.primaryPressed,
        pressed && !isDisabled && variant === 'outline' && styles.outlinePressed,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.primary}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.label,
              variant === 'primary' && styles.labelPrimary,
              variant === 'outline' && styles.labelOutline,
              variant === 'text'    && styles.labelText,
            ]}>
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  fullWidth: {
    width: '100%',
  },
  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  primaryPressed: {
    backgroundColor: Colors.primaryDark,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  outlinePressed: {
    backgroundColor: Colors.primaryMid,
  },
  textVariant: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginTop: 0,
  },
  disabled: {
    opacity: 0.55,
  },
  // Labels
  label: {
    ...Typography.button,
  },
  labelPrimary: {
    color: Colors.white,
  },
  labelOutline: {
    color: Colors.primary,
  },
  labelText: {
    color: Colors.accent,
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
