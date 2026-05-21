import { MotiView } from 'moti';
import type { ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { MOTI_TRANSITION, STAGGER_DELAY } from '@/lib/motion';

interface FadeInViewProps {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  from?: 'bottom' | 'none';
}

export function FadeInView({ children, delay = 0, style, from = 'bottom' }: FadeInViewProps) {
  return (
    <MotiView
      from={{
        opacity: 0,
        translateY: from === 'bottom' ? 14 : 0,
      }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        ...MOTI_TRANSITION,
        delay: delay * STAGGER_DELAY,
      }}
      style={style}>
      {children}
    </MotiView>
  );
}
