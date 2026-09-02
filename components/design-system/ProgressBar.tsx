import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { DS } from '@/constants/design-system';

export interface ProgressBarProps {
  /** 0 to 1. Values outside are clamped rather than allowed to overflow the track. */
  value: number;
  label?: string;
  /** Shown at the right of the label row, e.g. "3/12" or "45%". */
  valueLabel?: string;
  tone?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  height?: number;
  style?: StyleProp<ViewStyle>;
  /** Announced instead of the raw percentage when the number needs context. */
  accessibilityLabel?: string;
}

/**
 * A determinate progress bar.
 *
 * IT CLAMPS. Callers pass ratios computed from counts, and a count that goes
 * wrong — a completed list longer than the list itself, a divide by zero —
 * produced a fill that ran outside its own track or a NaN width that silently
 * collapsed the row. Both are clamped here so a bad number is visibly full or
 * visibly empty rather than visibly broken.
 *
 * The fill animates from wherever it was, so a value arriving after a fetch
 * grows into place instead of appearing complete. `useNativeDriver` is off
 * because width is a layout property; the bars are short-lived and few.
 */
export function ProgressBar({
  value,
  label,
  valueLabel,
  tone = 'primary',
  height = 8,
  style,
  accessibilityLabel,
}: ProgressBarProps) {
  const safe = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const pct = Math.round(safe * 100);

  const width = useRef(new Animated.Value(safe)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: safe,
      duration: DS.animation.normal,
      useNativeDriver: false,
    }).start();
  }, [safe, width]);

  return (
    <View
      style={style}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      accessibilityLabel={accessibilityLabel ?? label}>
      {label || valueLabel ? (
        <View style={styles.labelRow}>
          {label ? (
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          ) : null}
          {valueLabel ? <Text style={styles.value}>{valueLabel}</Text> : null}
        </View>
      ) : null}

      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              borderRadius: height / 2,
              backgroundColor: FILL[tone],
              width: width.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const FILL: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  primary: DS.colors.primary,
  accent: DS.colors.accent,
  success: DS.semantic.success.solid,
  warning: DS.semantic.warning.solid,
  danger: DS.semantic.danger.solid,
};

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
    marginBottom: 6,
  },
  label: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  value: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  track: {
    width: '100%',
    backgroundColor: DS.colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
});
