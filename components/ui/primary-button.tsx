import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { Colors } from '@/constants/colors';

interface PrimaryButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'outline';
}

export function PrimaryButton({
  title,
  loading,
  variant = 'primary',
  disabled,
  ...props
}: PrimaryButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      className={`rounded-2xl py-4 ${isPrimary ? 'bg-primary' : 'border-2 border-primary bg-white'} ${
        disabled || loading ? 'opacity-60' : 'active:opacity-90'
      }`}
      disabled={disabled || loading}
      {...props}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? Colors.white : Colors.primary} />
      ) : (
        <Text
          className={`text-center font-sans-semibold text-lg ${
            isPrimary ? 'text-white' : 'text-primary'
          }`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
