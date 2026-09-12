import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { DS } from '@/constants/design-system';
import { SPRING_CONFIG } from '@/lib/motion';

interface LiquidSelectionProps {
  /** Index of the selected child, or null for none. */
  selected: number | null;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Fill of the moving pill. */
  color?: string;
  radius?: number;
  /** Rendered under the children rather than over them. */
  gap?: number;
}

interface Rect {
  x: number;
  width: number;
}

/**
 * A selection pill that travels between items instead of appearing on one and
 * vanishing from another.
 *
 * WHY IT IS BUILT THIS WAY. The obvious approach — a background colour on the
 * selected chip — gives no sense of movement, so a row of chips reads as a set
 * of independent buttons rather than one control with a current value. Here a
 * single pill is measured onto whichever child is selected and springs to the
 * next one, so the eye follows the selection instead of hunting for it.
 *
 * The children keep their own layout: each reports its position via onLayout
 * and is otherwise untouched, so a row can hold chips of different widths and
 * the pill still fits each exactly.
 *
 * IT IS DECORATION, NOT THE SIGNAL. The selected child must still change its
 * own text weight and colour. Someone with reduce-motion turned on sees the
 * pill jump rather than travel — Reanimated honours the system setting through
 * SPRING_CONFIG — and someone who cannot distinguish the fill needs the label
 * to have changed too.
 */
export function LiquidSelection({
  selected,
  children,
  style,
  color = DS.colors.accent,
  radius = DS.radius.full,
  gap = 0,
}: LiquidSelectionProps) {
  const [rects, setRects] = useState<Record<number, Rect>>({});

  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const opacity = useSharedValue(0);

  const measure = useCallback(
    (index: number, e: LayoutChangeEvent) => {
      const { x: nextX, width: nextWidth } = e.nativeEvent.layout;
      setRects((prev) => {
        const current = prev[index];
        if (current && current.x === nextX && current.width === nextWidth) return prev;
        return { ...prev, [index]: { x: nextX, width: nextWidth } };
      });
    },
    []
  );

  // Driven from render rather than an effect: the target is derived state, and
  // a shared value assignment here is cheaper than a re-render round trip.
  const target = selected !== null ? rects[selected] : undefined;
  if (target) {
    // First placement should not slide in from zero.
    if (opacity.value === 0) {
      x.value = target.x;
      width.value = target.width;
      opacity.value = 1;
    } else {
      x.value = withSpring(target.x, SPRING_CONFIG);
      width.value = withSpring(target.width, SPRING_CONFIG);
    }
  } else if (opacity.value !== 0) {
    opacity.value = 0;
  }

  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.row, { gap }, style]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.pill, { backgroundColor: color, borderRadius: radius }, pill]}
      />
      {mapChildren(children, measure)}
    </View>
  );
}

/** Wraps each child so it reports its own position without changing its layout. */
function mapChildren(
  children: ReactNode,
  measure: (index: number, e: LayoutChangeEvent) => void
) {
  const list = Array.isArray(children) ? children : [children];
  return list.flat().map((child, index) => (
    <View key={index} onLayout={(e) => measure(index, e)}>
      {child}
    </View>
  ));
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  pill: { position: 'absolute', top: 0, bottom: 0, left: 0 },
});
