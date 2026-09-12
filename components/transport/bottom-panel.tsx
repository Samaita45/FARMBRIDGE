import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  /**
   * Height of the scene this panel sits in — the tab page, not the phone.
   * Window height includes the status bar and the tab bar, so a ratio of that
   * makes the sheet cover the menu.
   */
  sceneHeight?: number;
  /** Pixels that must stay clear at the top (status bar + menu + recenter). */
  reserveTop?: number;
}

/** Shared with the hub so the recenter button sits just above the sheet. */
export function computeSheetHeights(
  sceneHeight: number,
  peekRatio: number,
  maxRatio: number,
  reserveTop: number
) {
  const available = Math.max(sceneHeight, 1);
  const cap = Math.max(200, available - reserveTop);
  const maxHeight = Math.min(Math.round(available * maxRatio), cap);
  const peekHeight = Math.min(Math.round(available * peekRatio), maxHeight);
  return { peekHeight, maxHeight };
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
  sceneHeight,
  reserveTop = 0,
}: BottomPanelProps) {
  const { height: windowHeight } = useWindowDimensions();
  const { peekHeight, maxHeight } = computeSheetHeights(
    sceneHeight && sceneHeight > 0 ? sceneHeight : windowHeight,
    peekRatio,
    maxRatio,
    reserveTop
  );

  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  // The panel never grows past what it holds, so a short sheet does not open
  // onto empty space.
  const openHeight = Math.min(maxHeight, Math.max(peekHeight, contentHeight));
  const collapsedHeight =
    contentHeight > 0 ? Math.min(peekHeight, contentHeight) : peekHeight;

  const [height] = useState(() => new Animated.Value(collapsedHeight));
  const start = useRef(collapsedHeight);

  useEffect(() => {
    if (expanded) return;
    height.setValue(collapsedHeight);
    start.current = collapsedHeight;
  }, [collapsedHeight, expanded, height]);

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
    expanded ? settle(collapsedHeight, false) : settle(openHeight, true);

  /*
    The rule below fires because this factory mentions refs and the compiler
    cannot tell when they are read. Every read here happens inside a gesture
    callback, which cannot run until a finger is on the sheet — long after render.
    Rebuilding the responder instead would be worse: a PanResponder replaced
    mid-drag drops the gesture.
  */
  const responder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
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
          const next = Math.min(openHeight, Math.max(collapsedHeight * 0.7, start.current - g.dy));
          height.setValue(next);
        },
        onPanResponderRelease: (_e, g) => {
          const current = start.current - g.dy;
          const midpoint = (collapsedHeight + openHeight) / 2;
          if (g.vy < -0.5) return settle(openHeight, true);
          if (g.vy > 0.5) return settle(collapsedHeight, false);
          settle(current > midpoint ? openHeight : collapsedHeight, current > midpoint);
        },
        onPanResponderTerminate: () =>
          settle(expanded ? openHeight : collapsedHeight, expanded),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openHeight, collapsedHeight, expanded]
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
        <View onLayout={onContentLayout} style={styles.body}>
          {children}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    zIndex: 20,
    elevation: 20,
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
  scroll: { paddingHorizontal: DS.spacing.md, paddingBottom: DS.spacing.sm },
  body: { gap: DS.spacing.md },
});
