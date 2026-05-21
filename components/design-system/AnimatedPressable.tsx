import * as Haptics from 'expo-haptics';
import { MotiPressable } from 'moti/interactions';
import type { ReactNode } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

import { DS } from '@/constants/design-system';

interface AnimatedPressableProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
}

export function AnimatedPressable({
  onPress,
  children,
  style,
  disabled,
  haptic = true,
}: AnimatedPressableProps) {
  const handlePress = () => {
    if (haptic && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <MotiPressable
      onPress={handlePress}
      disabled={disabled}
      animate={({ pressed }) => ({
        scale: pressed ? 0.97 : 1,
        opacity: pressed ? 0.92 : 1,
      })}
      transition={{ type: 'timing', duration: DS.animation.fast / 1000 }}
      style={style}>
      {children}
    </MotiPressable>
  );
}
