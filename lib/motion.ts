import { Easing, ReduceMotion } from 'react-native-reanimated';

import { DS } from '@/constants/design-system';

/**
 * Motion for the whole app.
 *
 * THE DURATION WAS WRONG. `MOTI_TRANSITION` used `DS.animation.normal / 1000`,
 * and Moti — like Reanimated underneath it — takes milliseconds. Every
 * entrance in the app was running for 0.24 of a millisecond, which is to say
 * not running at all. Screens appeared fully formed and the whole product felt
 * static. The divide is gone.
 *
 * EVERYTHING HERE RESPECTS THE SYSTEM SETTING. `ReduceMotion.System` makes
 * Reanimated fall straight to the end value when someone has asked their phone
 * to reduce motion — which people do because movement makes them ill, not
 * because they dislike it. Nothing below needs a separate check.
 */

/** The default entrance: a short fade with a small rise. */
export const MOTI_TRANSITION = {
  type: 'timing' as const,
  duration: DS.animation.normal,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

/**
 * The spring everything that moves between two places uses — a selected pill
 * sliding to a new chip, a sheet settling. Slightly under-damped so it arrives
 * with a little weight rather than stopping dead.
 */
export const MOTI_SPRING = {
  type: 'spring' as const,
  damping: DS.animation.spring.damping,
  stiffness: DS.animation.spring.stiffness,
  mass: 0.9,
  reduceMotion: ReduceMotion.System,
};

/** For Reanimated's own `withSpring`, which takes the same shape. */
export const SPRING_CONFIG = {
  damping: DS.animation.spring.damping,
  stiffness: DS.animation.spring.stiffness,
  mass: 0.9,
  reduceMotion: ReduceMotion.System,
};

/** For Reanimated's `withTiming`. */
export const TIMING_CONFIG = {
  duration: DS.animation.normal,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

export const TIMING_FAST = {
  duration: DS.animation.fast,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

/**
 * Seconds between staggered children, in milliseconds.
 *
 * 60ms: enough that the eye reads the sequence as one movement rather than a
 * queue, and short enough that the last card in a list of eight is not still
 * arriving half a second after the first.
 */
export const STAGGER_DELAY = 60;
