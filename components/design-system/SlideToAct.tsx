import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
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
}

const KNOB = 52;
const PADDING = 6;

/**
 * Slide to act — the gesture used to answer a call.
 *
 * WHY A SLIDE RATHER THAN A BUTTON. It is deliberate in a way a tap is not, and
 * it makes the first thing anyone does in this app feel like something they
 * did rather than something that happened. That argument only holds where the
 * action is worth the ceremony — the way in. It would be an obstacle on a form,
 * which is why it is not one.
 *
 * BUILT ON PanResponder, NOT gesture-handler. `GestureDetector` needs a
 * `GestureHandlerRootView` above it or its gestures silently never fire, and a
 * control that looks real and does nothing is the exact defect this screen has
 * already shipped twice. The core responder system needs no such setup, and it
 * negotiates the horizontal pager this control sits inside: the responder is
 * claimed only once a drag is clearly sideways and has moved past the slop, so
 * the pager keeps ordinary swipes and the knob keeps deliberate ones.
 *
 * IT IS NEVER THE ONLY WAY THROUGH. The track is also a button: a tap anywhere
 * on it completes, and a screen reader activating it completes. Nobody using
 * VoiceOver or TalkBack should have to perform a drag, and someone who does not
 * read the affordance as draggable will tap it — being ignored would teach them
 * the app is broken.
 *
 * The knob rocks gently while it is untouched, which is how the gesture
 * explains itself without a caption. It stops for good on first contact.
 */
export function SlideToAct({
  label,
  onComplete,
  accessibilityLabel,
  icon = 'arrow-forward',
  threshold = 0.7,
}: SlideToActProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const travel = Math.max(0, trackWidth - KNOB - PADDING * 2);

  const [x] = useState(() => new Animated.Value(0));
  const [hint] = useState(() => new Animated.Value(0));
  const offset = useRef(0);
  const finished = useRef(false);
  const [nudging, setNudging] = useState(true);

  const finish = useMemo(
    () => () => {
      if (finished.current) return;
      finished.current = true;
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onComplete();
    },
    [onComplete]
  );

  const settle = (to: number, then?: () => void) => {
    Animated.spring(x, {
      toValue: to,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start(({ finished: ok }) => {
      offset.current = to;
      if (ok) then?.();
    });
  };

  /*
    The rule below fires because this factory mentions refs and the compiler
    cannot tell when they are read. Every read here happens inside a gesture
    callback, which cannot run until a finger is on the knob — long after render.
    Rebuilding the responder instead would be worse: a PanResponder replaced
    mid-drag drops the gesture.
  */
  const responder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        // Not on touch-down: the pager must keep a plain swipe across the page.
        onMoveShouldSetPanResponder: (_e, g) =>
          travel > 0 &&
          !finished.current &&
          Math.abs(g.dx) > 6 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () => setNudging(false),
        onPanResponderMove: (_e, g) => {
          const next = Math.min(travel, Math.max(0, offset.current + g.dx));
          x.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const next = Math.min(travel, Math.max(0, offset.current + g.dx));
          if (next >= travel * threshold) {
            settle(travel, finish);
          } else {
            // Springs back, so a half-drag is never left ambiguous.
            settle(0);
          }
        },
        onPanResponderTerminate: () => settle(0),
      }),
    // `travel` is the only value the responder closes over that changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [travel, threshold, finish]
  );

  // A slow rock while untouched. Stops permanently on first contact, so it
  // never competes with a hand already on the control.
  useEffect(() => {
    if (!nudging || travel <= 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(hint, {
          toValue: 1,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hint, {
          toValue: 0,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [nudging, travel, hint]);

  const nudge = hint.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  const labelOpacity =
    travel > 0
      ? x.interpolate({
          inputRange: [0, travel * 0.6],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        })
      : 1;

  return (
    <Pressable
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      // The track is a button too: taps and screen-reader activation both
      // complete, so the drag is an option rather than a requirement.
      onPress={() => {
        if (finished.current || travel <= 0) return;
        setNudging(false);
        settle(travel, finish);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint="Slide right, or activate to continue"
      style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          { transform: [{ translateX: Animated.subtract(x, travel) }] },
        ]}
      />

      <Animated.View style={[styles.labelWrap, { opacity: labelOpacity }]}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={DS.colors.textSoft} />
      </Animated.View>

      <Animated.View
        {...responder.panHandlers}
        style={[styles.knob, { transform: [{ translateX: Animated.add(x, nudge) }] }]}>
        <Ionicons name={icon} size={22} color={DS.colors.textInverse} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    height: KNOB + PADDING * 2,
    borderRadius: DS.radius.full,
    justifyContent: 'center',
    padding: PADDING,
    overflow: 'hidden',
    // Heavy frosted fill, so the dark label holds over any photograph beneath
    // rather than depending on what the picture is doing.
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  // Slides in behind the knob, so progress is visible rather than implied.
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: DS.colors.primaryBg,
  },
  labelWrap: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingLeft: KNOB,
  },
  label: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primary,
  },
});
