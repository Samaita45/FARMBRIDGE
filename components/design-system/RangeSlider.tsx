import { useCallback, useRef, useState } from 'react';
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

  // Kept in refs so the responder closures always read current values without
  // being recreated on every render.
  const bounds = useRef({ min, max, low, high, width: 0 });
  bounds.current = { min, max, low, high, width };

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const usable = Math.max(1, width - THUMB);
  const ratio = (value: number) => {
    const span = bounds.current.max - bounds.current.min;
    return span <= 0 ? 0 : (value - bounds.current.min) / span;
  };

  const snap = (value: number) => {
    const stepped = Math.round(value / step) * step;
    return Math.min(bounds.current.max, Math.max(bounds.current.min, stepped));
  };

  const valueAt = (x: number) => {
    const b = bounds.current;
    const pct = Math.min(1, Math.max(0, x / Math.max(1, b.width - THUMB)));
    return snap(b.min + pct * (b.max - b.min));
  };

  const makeResponder = (which: 'low' | 'high') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Claim the gesture so the surrounding scroll view does not steal it.
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_evt, gesture) => {
        const b = bounds.current;
        const startX = ratio(which === 'low' ? b.low : b.high) * (b.width - THUMB);
        const next = valueAt(startX + gesture.dx);

        if (which === 'low') {
          onChange(Math.min(next, b.high), b.high);
        } else {
          onChange(b.low, Math.max(next, b.low));
        }
      },
    });

  const lowResponder = useRef(makeResponder('low')).current;
  const highResponder = useRef(makeResponder('high')).current;

  const lowX = ratio(low) * usable;
  const highX = ratio(high) * usable;

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
