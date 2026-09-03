import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { DS } from '@/constants/design-system';

interface BottomPanelProps {
  children: ReactNode;
  /** How much of the screen the panel covers when open. */
  maxRatio?: number;
  /** How much it covers when resting. The rest is map. */
  peekRatio?: number;
  paddingBottom?: number;
}

/**
 * The sheet along the bottom of the map, which can be dragged.
 *
 * WHY IT DRAGS. A fixed panel forces one compromise for everybody: tall enough
 * to show the order controls means the map is a strip, and short enough to see
 * the map means the transporters below the fold are invisible. inDrive's sheet
 * moves, so the person decides which they want to look at. Two rests rather
 * than free positioning — resting anywhere is a state nobody chose and the
 * panel never looks settled.
 *
 * BUILT ON PanResponder for the same reason the slide control is: gesture
 * handler's detector needs a `GestureHandlerRootView` above it or its gestures
 * silently never fire, and there is none in this app. The responder is claimed
 * only on the grabber and only for a clearly vertical drag, so the list inside
 * keeps its own scrolling.
 *
 * The grabber is also a button. Dragging is not available to anyone using a
 * screen reader, and it should never be the only way to reach half the content.
 */
export function BottomPanel({
  children,
  maxRatio = 0.72,
  peekRatio = 0.46,
  paddingBottom = 0,
}: BottomPanelProps) {
  const { height: screenHeight } = useWindowDimensions();
  const maxHeight = Math.round(screenHeight * maxRatio);
  const peekHeight = Math.round(screenHeight * peekRatio);

  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  // The panel never grows past what it holds, so a short sheet does not open
  // onto empty space.
  const openHeight = Math.min(maxHeight, Math.max(peekHeight, contentHeight));

  const height = useRef(new Animated.Value(peekHeight)).current;
  const start = useRef(peekHeight);

  const settle = (to: number, nextExpanded: boolean) => {
    setExpanded(nextExpanded);
    start.current = to;
    Animated.spring(height, {
      toValue: to,
      useNativeDriver: false,
      speed: 16,
      bounciness: 3,
    }).start();
  };

  const toggle = () =>
    expanded ? settle(peekHeight, false) : settle(openHeight, true);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderGrant: () => {
          height.stopAnimation((v: number) => {
            start.current = v;
          });
        },
        onPanResponderMove: (_e, g) => {
          // Dragging up grows the panel, so the delta is inverted.
          const next = Math.min(openHeight, Math.max(peekHeight * 0.7, start.current - g.dy));
          height.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const current = start.current - g.dy;
          const midpoint = (peekHeight + openHeight) / 2;
          // A flick decides regardless of where it ended.
          if (g.vy < -0.5) return settle(openHeight, true);
          if (g.vy > 0.5) return settle(peekHeight, false);
          settle(current > midpoint ? openHeight : peekHeight, current > midpoint);
        },
        onPanResponderTerminate: () => settle(expanded ? openHeight : peekHeight, expanded),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openHeight, peekHeight, expanded]
  );

  const onContentLayout = (e: LayoutChangeEvent) => {
    const next = Math.ceil(e.nativeEvent.layout.height) + paddingBottom + 28;
    if (Math.abs(next - contentHeight) > 1) setContentHeight(next);
  };

  return (
    <Animated.View style={[styles.panel, { height, paddingBottom }]}>
      <Pressable
        {...responder.panHandlers}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? 'Collapse the panel' : 'Expand the panel'}
        accessibilityHint="Drag up or down, or activate to switch between the map and the full panel"
        style={styles.grabArea}>
        <View style={styles.grabber} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View onLayout={onContentLayout}>{children}</View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DS.colors.surface,
    borderTopLeftRadius: DS.radius.xxl,
    borderTopRightRadius: DS.radius.xxl,
    ...DS.shadow.elevated,
  },
  // A generous grab area: the visible bar is 4pt tall and nobody can hit that.
  grabArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: DS.colors.borderStrong,
  },
  scroll: { paddingHorizontal: DS.spacing.md, paddingBottom: DS.spacing.md },
});
