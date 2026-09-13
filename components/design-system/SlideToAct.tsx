import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { DS } from '@/constants/design-system';

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

/**
 * Slide to act — the gesture used to answer a call.
 *
 * Completes only after the knob is dragged past the threshold (or via an
 * accessibility activate). The knob is absolutely positioned inside the track
 * so padding, label and fill stay aligned while it moves.
 */
export function SlideToAct({
  label,
  onComplete,
  accessibilityLabel,
  icon = 'arrow-forward',
  threshold = 0.72,
  onSlidingChange,
}: SlideToActProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const travel = Math.max(0, trackWidth - KNOB - PADDING * 2);

  const [x] = useState(() => new Animated.Value(0));
  const [hint] = useState(() => new Animated.Value(0));
  const offset = useRef(0);
  const finished = useRef(false);
  const sliding = useRef(false);
  const [nudging, setNudging] = useState(true);
  const travelRef = useRef(travel);
  const thresholdRef = useRef(threshold);
  const onCompleteRef = useRef(onComplete);
  const onSlidingChangeRef = useRef(onSlidingChange);

  /*
    THE LATEST-VALUE REFS ARE WRITTEN AFTER RENDER, NOT DURING IT.

    These four assignments sat in the render body, which the React Compiler
    rejects: a render must be able to run twice with the same result, and
    writing a ref makes it leave a mark. No dependency array on purpose — the
    point is to catch up to whatever the last render's props were, every time,
    so the pan handlers below always call the current onComplete rather than the
    one that existed when the responder was created.
  */
  useEffect(() => {
    travelRef.current = travel;
    thresholdRef.current = threshold;
    onCompleteRef.current = onComplete;
    onSlidingChangeRef.current = onSlidingChange;
  });

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

  const settle = (to: number, then?: () => void) => {
    Animated.spring(x, {
      toValue: to,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4,
    }).start(({ finished: ok }) => {
      offset.current = to;
      if (ok) then?.();
    });
  };

  const responder = useMemo(
    () =>
      /*
        The rule reports on this call rather than on the useMemo above it, and
        it is reporting the ref reads inside the handlers below. Those handlers
        run on touch, long after render, which is exactly what a ref is for —
        the responder is created once and must not be rebuilt mid-gesture.
      */
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => !finished.current && travelRef.current > 0,
        onStartShouldSetPanResponderCapture: () => !finished.current && travelRef.current > 0,
        onMoveShouldSetPanResponder: (_e, g) =>
          !finished.current &&
          travelRef.current > 0 &&
          Math.abs(g.dx) > 2 &&
          Math.abs(g.dx) >= Math.abs(g.dy),
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          !finished.current &&
          travelRef.current > 0 &&
          Math.abs(g.dx) > 2 &&
          Math.abs(g.dx) >= Math.abs(g.dy),
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          setNudging(false);
          setSliding(true);
          if (Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },
        onPanResponderMove: (_e, g) => {
          const max = travelRef.current;
          const next = Math.min(max, Math.max(0, offset.current + g.dx));
          x.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const max = travelRef.current;
          const next = Math.min(max, Math.max(0, offset.current + g.dx));
          setSliding(false);
          if (max > 0 && next >= max * thresholdRef.current) {
            settle(max, finish);
          } else {
            settle(0);
          }
        },
        onPanResponderTerminate: () => {
          setSliding(false);
          settle(0);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!nudging || travel <= 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(hint, {
          toValue: 1,
          duration: 480,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(hint, {
          toValue: 0,
          duration: 480,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [nudging, travel, hint]);

  const nudge = hint.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const knobX = Animated.add(x, nudge);

  const fillWidth =
    travel > 0
      ? x.interpolate({
          inputRange: [0, travel],
          outputRange: [KNOB + PADDING * 2, trackWidth],
          extrapolate: 'clamp',
        })
      : KNOB + PADDING * 2;

  const labelOpacity =
    travel > 0
      ? x.interpolate({
          inputRange: [0, travel * 0.55],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        })
      : 1;

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
        setNudging(false);
        settle(travel, finish);
      }}
      style={styles.track}>
      <Animated.View style={[styles.fill, { width: fillWidth }]} />

      <Animated.View style={[styles.labelWrap, { opacity: labelOpacity }]} pointerEvents="none">
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={DS.colors.textSoft} />
      </Animated.View>

      <Animated.View
        {...responder.panHandlers}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.knob, { transform: [{ translateX: knobX }] }]}>
        <Ionicons name={icon} size={22} color={DS.colors.textInverse} />
      </Animated.View>
    </View>
  );
}

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
