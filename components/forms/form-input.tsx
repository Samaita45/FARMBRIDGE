/**
 * @deprecated Import `Input` from `@/components/design-system`.
 *
 * Compatibility wrapper. It kept its own pill-shaped field (50px radius) and
 * its own error styling; it now delegates to the one Input so the auth screens
 * match every other form without being rewritten in the same commit.
 *
 * The password reveal is handled here because `Input` exposes a generic
 * trailing action rather than knowing about passwords.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import type { TextInputProps } from 'react-native';

import { Input } from '@/components/design-system';

interface FormInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function FormInput({ label, error, icon, isPassword, ...props }: FormInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Input
      label={label}
      error={error}
      icon={icon}
      secureTextEntry={isPassword && !revealed}
      rightIcon={isPassword ? (revealed ? 'eye-off-outline' : 'eye-outline') : undefined}
      rightIconLabel={revealed ? 'Hide password' : 'Show password'}
      onRightIconPress={isPassword ? () => setRevealed((v) => !v) : undefined}
      {...props}
    />
  );
}
