import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { DS } from '@/constants/design-system';

interface RangeSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  /** Rounds each value; 1 for whole units, 0.5 for halves. */
  step?: number;
  /** Formats the value labels, e.g. `(v) => \`$${v}\``. */
  format?: (value: number) => string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const THUMB = 22;
const TRACK = 4;

/**
 * A two-thumb range slider.
 *
 * Built on PanResponder rather than react-native-gesture-handler: this lives
 * inside a modal that sits over a scroll view, and the core responder system
 * negotiates that nesting without extra configuration.
 *
 * The thumbs cannot cross — dragging the low thumb past the high one clamps it
 * — so the range is always valid and the caller never has to sort the pair.
 */
export function RangeSlider({
  min,
  max,
  low,
  high,
  onChange,
  step = 1,
  format = (v) => String(Math.round(v)),
  label,
  style,
}: RangeSliderProps) {
  const [width, setWidth] = useState(0);

  /*
    The responders are created once and never rebuilt — a PanResponder swapped
    mid-drag loses the gesture — so they cannot close over props directly or
    they would read whatever the values were on first render. Everything they
    need lives in a ref that is refreshed after each commit.

    The refresh is an effect, not a bare assignment during render. Writing to a
    ref while rendering is what the React Compiler rejects, and it is right to:
    render must be free of side effects for it to be safely re-run. Running
    after commit is soon enough, because a gesture can only arrive after paint.
  */
  const bounds = useRef({ min, max, low, high, width: 0 });
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    bounds.current = { min, max, low, high, width };
    onChangeRef.current = onChange;
  });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const usable = Math.max(1, width - THUMB);

  /*
    Pure, and takes its bounds as arguments. It used to read `bounds.current`,
    which was a genuine ref read during render — this function positions the
    thumbs on every frame as well as being used inside the gesture. Render
    passes the props; the gesture passes the ref's snapshot.
  */
  const ratio = (value: number, lo: number, hi: number) => {
    const span = hi - lo;
    return span <= 0 ? 0 : (value - lo) / span;
  };

  // Both are only ever called from inside a gesture handler, and take the
  // snapshot the handler already read rather than reaching for the ref again.
  const snap = (value: number, lo: number, hi: number) => {
    const stepped = Math.round(value / step) * step;
    return Math.min(hi, Math.max(lo, stepped));
  };

  const valueAt = (x: number, b: { min: number; max: number; width: number }) => {
    const pct = Math.min(1, Math.max(0, x / Math.max(1, b.width - THUMB)));
    return snap(b.min + pct * (b.max - b.min), b.min, b.max);
  };

  const makeResponder = (which: 'low' | 'high') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Claim the gesture so the surrounding scroll view does not steal it.
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_evt, gesture) => {
        const b = bounds.current;
        const startX = ratio(which === 'low' ? b.low : b.high, b.min, b.max) * (b.width - THUMB);
        const next = valueAt(startX + gesture.dx, b);

        // Through the ref, so a re-rendered parent's newer handler is used
        // rather than the one captured when the responder was built.
        if (which === 'low') {
          onChangeRef.current(Math.min(next, b.high), b.high);
        } else {
          onChangeRef.current(b.low, Math.max(next, b.low));
        }
      },
    });

  /*
    Built once. A PanResponder replaced mid-drag loses the gesture, so these
    must not be rebuilt on re-render.

    The rule below fires because `makeResponder` mentions refs, and the compiler
    cannot tell when they are read. Here they are only read inside
    `onPanResponderMove`, which cannot run until a finger is on the screen —
    long after render. The initialiser itself touches no ref.
  */
  // eslint-disable-next-line react-hooks/refs
  const [lowResponder] = useState(() => makeResponder('low'));
  // eslint-disable-next-line react-hooks/refs
  const [highResponder] = useState(() => makeResponder('high'));

  // Positioned from props, not from the ref.
  const lowX = ratio(low, min, max) * usable;
  const highX = ratio(high, min, max) * usable;

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.trackArea} onLayout={onLayout}>
        <View style={styles.track} />
        <View
          style={[styles.trackActive, { left: lowX + THUMB / 2, width: Math.max(0, highX - lowX) }]}
        />

        <View
          {...lowResponder.panHandlers}
          style={[styles.thumb, { left: lowX }]}
          accessibilityRole="adjustable"
          accessibilityLabel={`${label ?? 'Range'} minimum`}
          accessibilityValue={{ min, max, now: low }}
        />
        <View
          {...highResponder.panHandlers}
          style={[styles.thumb, { left: highX }]}
          accessibilityRole="adjustable"
          accessibilityLabel={`${label ?? 'Range'} maximum`}
          accessibilityValue={{ min, max, now: high }}
        />
      </View>

      <View style={styles.values}>
        <Text style={styles.value}>{format(low)}</Text>
        <Text style={styles.value}>{format(high)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  trackArea: { height: THUMB, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    height: TRACK,
    borderRadius: TRACK,
    backgroundColor: DS.colors.border,
  },
  trackActive: {
    position: 'absolute',
    height: TRACK,
    borderRadius: TRACK,
    backgroundColor: DS.colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: DS.colors.surface,
    borderWidth: 2,
    borderColor: DS.colors.primary,
    ...DS.shadow.soft,
  },
  values: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  value: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
