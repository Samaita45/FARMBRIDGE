import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DS } from '@/constants/design-system';

export interface SlideToActHandle {
  /** Return the control to its resting state, ready to be slid again. */
  reset: () => void;
}

interface SlideToActProps {
  label: string;
  onComplete: () => void;
  accessibilityLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Fraction of the track that counts as done. */
  threshold?: number;
  /** Fired while the knob is being dragged, so a parent pager can lock. */
  onSlidingChange?: (sliding: boolean) => void;
}

const KNOB = 52;
const PADDING = 5;
const TRACK_HEIGHT = KNOB + PADDING * 2;

/** Springs. The knob answers the thumb; the fill follows a beat behind it. */
const KNOB_SPRING = { damping: 18, stiffness: 240, mass: 0.7 } as const;
const FILL_SPRING = { damping: 15, stiffness: 150, mass: 0.9 } as const;

/**
 * Slide to act — the gesture used to answer a call.
 *
 * WHY IT MOVES ON THE UI THREAD NOW. This was built on React Native's Animated
 * with `useNativeDriver: false`, because it animated the fill's `width` and
 * width cannot be native-driven. Every frame of every drag therefore crossed
 * the bridge, and the app logged `Style property 'width' is not supported by
 * native animated module` for its trouble. The fill is full width now and
 * translated into place, so everything here is a transform and the whole
 * gesture runs as a worklet — the knob keeps up with a thumb even while the JS
 * thread is busy bundling or fetching.
 *
 * WHAT MAKES IT FEEL LIQUID. Two springs rather than one. The knob is stiff and
 * tracks the thumb exactly; the fill is slacker and arrives a moment later, so
 * the colour flows after the handle instead of being welded to it. The knob
 * swells slightly while held and relaxes on release, and a failed slide falls
 * back with a little bounce rather than snapping.
 *
 * WHY IT CAN BE SLID AGAIN. `finished` used to latch true forever, so a person
 * who slid through to register and came back to this screen found a dead
 * control — the screen was still mounted, so nothing reset it. The parent calls
 * `reset()` when the screen regains focus and the slide works as it did the
 * first time.
 *
 * Reduced motion is honoured: the idle hint never runs, and movements settle
 * immediately rather than springing.
 */
export const SlideToAct = forwardRef<SlideToActHandle, SlideToActProps>(function SlideToAct(
  {
    label,
    onComplete,
    accessibilityLabel,
    icon = 'arrow-forward',
    threshold = 0.72,
    onSlidingChange,
  },
  ref
) {
  const [trackWidth, setTrackWidth] = useState(0);
  const travel = Math.max(0, trackWidth - KNOB - PADDING * 2);
  const reducedMotion = useReducedMotion();

  /** Knob offset in points. The fill and the label are both derived from it. */
  const x = useSharedValue(0);
  /** Trails `x`. This is the whole liquid effect. */
  const trail = useSharedValue(0);
  /** 0 at rest, 1 while held. Drives the knob's swell. */
  const held = useSharedValue(0);
  /** The idle nudge, in points. Stops for good once anyone touches it. */
  const hint = useSharedValue(0);

  const finished = useRef(false);
  const sliding = useRef(false);
  const travelRef = useRef(travel);
  const thresholdRef = useRef(threshold);
  const onCompleteRef = useRef(onComplete);
  const onSlidingChangeRef = useRef(onSlidingChange);
  const reducedMotionRef = useRef(reducedMotion);

  /*
    Latest-value refs written after render, not during it. Writing a ref in the
    render body makes the render leave a mark, which the React Compiler rejects
    — and the pan handlers below are created once, so without this they would
    keep calling whichever onComplete existed when the responder was built.
  */
  useEffect(() => {
    travelRef.current = travel;
    thresholdRef.current = threshold;
    onCompleteRef.current = onComplete;
    onSlidingChangeRef.current = onSlidingChange;
    reducedMotionRef.current = reducedMotion;
  });

  const stopHint = () => {
    cancelAnimation(hint);
    hint.set(withTiming(0, { duration: DS.motion.fast }));
  };

  /** Moves both springs to a position; the fill is deliberately the slower one. */
  const settle = (to: number, then?: () => void) => {
    if (reducedMotionRef.current) {
      x.set(to);
      trail.set(to);
      then?.();
      return;
    }
    /*
      The completion callback is a worklet, so finishing has to be handed back
      to the JS thread explicitly — `then` navigates, and navigation cannot
      happen on the UI thread.
    */
    x.set(
      withSpring(to, KNOB_SPRING, (done) => {
        'worklet';
        if (done && then) runOnJS(then)();
      })
    );
    trail.set(withSpring(to, FILL_SPRING));
  };

  const setSliding = (next: boolean) => {
    if (sliding.current === next) return;
    sliding.current = next;
    onSlidingChangeRef.current?.(next);
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setSliding(false);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onCompleteRef.current();
  };

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        finished.current = false;
        setSliding(false);
        held.set(withTiming(0, { duration: DS.motion.fast }));
        x.set(withSpring(0, KNOB_SPRING));
        trail.set(withSpring(0, FILL_SPRING));
        startHint();
      },
    }),
    // Shared values are stable for the life of the component, so a changing
    // identity here would only rebuild the handle for no gain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const startHint = () => {
    if (reducedMotionRef.current) return;
    cancelAnimation(hint);
    hint.set(0);
    hint.set(
      withRepeat(
        withDelay(
          1400,
          withSequence(
            withTiming(12, { duration: 520, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) })
          )
        ),
        -1,
        false
      )
    );
  };

  // Started once the track has been measured, so the nudge never asks for more
  // room than the control has.
  const measured = travel > 0;
  useEffect(() => {
    if (!measured) return;
    startHint();
    return () => cancelAnimation(hint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !finished.current && travelRef.current > 0,
        onStartShouldSetPanResponderCapture: () => !finished.current && travelRef.current > 0,
        onMoveShouldSetPanResponder: (_e, g) =>
          !finished.current && travelRef.current > 0 && Math.abs(g.dx) > 2,
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          !finished.current && travelRef.current > 0 && Math.abs(g.dx) > 2,
        // Once the thumb is down this gesture owns it: a parent scroller
        // stealing it mid-slide is what made this control feel broken.
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: () => {
          stopHint();
          setSliding(true);
          held.set(withSpring(1, KNOB_SPRING));
        },

        onPanResponderMove: (_e, g) => {
          const next = Math.min(Math.max(g.dx, 0), travelRef.current);
          // The knob is pinned to the thumb with no easing — anything else
          // reads as lag. The fill springs after it.
          x.set(next);
          trail.set(withSpring(next, FILL_SPRING));
        },

        onPanResponderRelease: (_e, g) => {
          held.set(withSpring(0, KNOB_SPRING));
          const next = Math.min(Math.max(g.dx, 0), travelRef.current);
          if (next >= travelRef.current * thresholdRef.current) {
            settle(travelRef.current, finish);
          } else {
            setSliding(false);
            settle(0);
          }
        },

        onPanResponderTerminate: () => {
          held.set(withSpring(0, KNOB_SPRING));
          setSliding(false);
          settle(0);
        },
      }),
    /*
      Built once, on purpose. Everything it reads is either a shared value or a
      latest-value ref, both of which are stable objects — and rebuilding a
      PanResponder while a thumb is down hands the gesture back mid-slide, which
      is the jitter this control used to have.
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value + hint.value },
      // A little wider under the thumb, which reads as give rather than glass.
      { scale: 1 + held.value * 0.06 },
    ],
  }));

  /*
    The fill is the full width of the track and slides in from the left, so the
    only thing animating is a transform. At rest its right edge sits just past
    the knob; at the end it covers the track. Its rounded right edge is a real
    circle rather than a stretched one, which a scaleX would have given.
  */
  const fillStyle = useAnimatedStyle(() => {
    const resting = KNOB + PADDING * 2;
    const hidden = Math.max(0, trackWidth - resting);
    const progress = travel > 0 ? Math.min(Math.max(trail.value / travel, 0), 1) : 0;
    return { transform: [{ translateX: -hidden * (1 - progress) }] };
  });

  const labelStyle = useAnimatedStyle(() => {
    if (travel <= 0) return { opacity: 1 };
    const progress = Math.min(Math.max(x.value / (travel * 0.55), 0), 1);
    return { opacity: 1 - progress };
  });

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint="Slide the handle all the way to the right to continue"
      accessibilityActions={[{ name: 'activate', label: 'Continue' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName !== 'activate') return;
        if (finished.current || travel <= 0) return;
        stopHint();
        settle(travel, finish);
      }}
      style={styles.track}>
      <Animated.View
        style={[styles.fill, { width: Math.max(trackWidth, TRACK_HEIGHT) }, fillStyle]}
      />

      <Animated.View style={[styles.labelWrap, labelStyle]} pointerEvents="none">
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={DS.colors.textSoft} />
      </Animated.View>

      <Animated.View
        {...responder.panHandlers}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.knob, knobStyle]}>
        <Ionicons name={icon} size={22} color={DS.colors.textInverse} />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.94)',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: DS.colors.primaryBg,
  },
  labelWrap: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    // Leave the knob's column clear so the copy sits in the open track.
    paddingLeft: KNOB + PADDING,
    paddingRight: PADDING,
  },
  label: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  knob: {
    position: 'absolute',
    left: PADDING,
    top: PADDING,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primary,
  },
});
