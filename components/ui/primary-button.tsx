import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type ViewStyle } from 'react-native';

import Colors from '@/constants/colors';
import { Typography } from '@/constants/Typography';
import { cardShadow } from '@/lib/platform-ui';

interface PrimaryButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
}

export function PrimaryButton({
  title,
  loading,
  variant = 'primary',
  disabled,
  style: containerStyle,
  ...rest
}: PrimaryButtonProps) {
  const { style: _ignored, ...props } = rest as PressableProps;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.base,
        isPrimary ? s.primary : s.outline,
        (disabled || loading) && s.disabled,
        pressed && s.pressed,
        containerStyle,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? Colors.white : Colors.primary} />
      ) : (
        <Text style={[s.text, isPrimary ? s.textPrimary : s.textOutline]}>{title}</Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...cardShadow(),
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  outline: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.88 },
  text: {
    ...Typography.button,
    textAlign: 'center',
  },
  textPrimary: { color: Colors.white },
  textOutline: { color: Colors.primary },
});
