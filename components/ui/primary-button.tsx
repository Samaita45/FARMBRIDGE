/**
 * @deprecated Import `Button` from `@/components/design-system`.
 *
 * Compatibility wrapper. 18 screens still call this; it now delegates to the
 * single Button so they pick up the shared sizing, pressed state, loading
 * state, touch target and accessibility handling without being edited. Migrate
 * call sites in the screen sweep, then delete this file.
 */
import type { PressableProps, ViewStyle } from 'react-native';

import { Button } from '@/components/design-system/Button';

interface PrimaryButtonProps extends Omit<PressableProps, 'style' | 'children'> {
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
  style,
  ...rest
}: PrimaryButtonProps) {
  return (
    <Button
      title={title}
      variant={variant}
      size="lg"
      loading={loading}
      disabled={disabled ?? undefined}
      style={style}
      {...rest}
    />
  );
}
