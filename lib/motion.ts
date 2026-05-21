import { DS } from '@/constants/design-system';

export const MOTI_TRANSITION = {
  type: 'timing' as const,
  duration: DS.animation.normal / 1000,
};

export const MOTI_SPRING = {
  type: 'spring' as const,
  damping: DS.animation.spring.damping,
  stiffness: DS.animation.spring.stiffness,
};

export const STAGGER_DELAY = 0.06;
