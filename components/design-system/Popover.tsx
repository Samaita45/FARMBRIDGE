import { useRef, useState, type ReactNode } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type LayoutRectangle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { DS } from '@/constants/design-system';

export interface PopoverProps {
  /** The control the popover hangs off. Rendered in place. */
  anchor: (open: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
  /** Fixed width, so the panel never grows past a phone's edge. */
  width?: number;
  style?: StyleProp<ViewStyle>;
}

const MARGIN = DS.spacing.sm;
const ARROW = 9;

/**
 * A small panel anchored to the control that opened it.
 *
 * IT IS CLAMPED TO THE SCREEN. The anchor is measured in window coordinates and
 * the panel is placed against it, then pulled back inside the viewport on every
 * side. A popover hanging off a control near the right edge is the usual way
 * this component breaks — it either runs off the screen or gets squashed to a
 * few characters wide — so the position is corrected rather than the width.
 *
 * It flips above the anchor when there is not enough room below, which is what
 * happens to anything in the bottom third of a phone once the panel is more
 * than a couple of rows tall.
 *
 * Dismissal is the same contract as the sheet: tapping outside closes it,
 * Android's back closes it, and the backdrop announces itself as a control
 * rather than being an invisible catcher.
 */
export function Popover({ anchor, children, width = 240, style }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<LayoutRectangle | null>(null);
  const ref = useRef<View>(null);

  const show = () => {
    ref.current?.measureInWindow((x, y, w, h) => {
      setRect({ x, y, width: w, height: h });
      setOpen(true);
    });
  };

  const close = () => setOpen(false);

  const screen = Dimensions.get('window');
  const placement = rect ? place(rect, width, screen) : null;

  return (
    <>
      <View ref={ref} collapsable={false} style={style}>
        {anchor(show)}
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}>
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        {placement ? (
          <View
            style={[
              styles.panel,
              { width, left: placement.left, top: placement.top },
            ]}
            accessibilityViewIsModal>
            {placement.below ? (
              <View style={[styles.arrow, styles.arrowUp, { left: placement.arrowLeft }]} />
            ) : null}
            {children(close)}
            {!placement.below ? (
              <View style={[styles.arrow, styles.arrowDown, { left: placement.arrowLeft }]} />
            ) : null}
          </View>
        ) : null}
      </Modal>
    </>
  );
}

/**
 * Places the panel against the anchor and then inside the screen.
 *
 * The estimate of 260 for the panel's height is deliberately generous: getting
 * the flip wrong upward is a panel that opens above with room to spare, and
 * getting it wrong downward is a panel with its content off the bottom of the
 * screen.
 */
function place(
  rect: LayoutRectangle,
  width: number,
  screen: { width: number; height: number }
) {
  const ESTIMATED_HEIGHT = 260;
  const below = rect.y + rect.height + ESTIMATED_HEIGHT < screen.height - MARGIN;

  const anchorCentre = rect.x + rect.width / 2;
  const rawLeft = anchorCentre - width / 2;
  const left = Math.min(
    Math.max(MARGIN, rawLeft),
    Math.max(MARGIN, screen.width - width - MARGIN)
  );

  const top = below
    ? rect.y + rect.height + ARROW
    : Math.max(MARGIN, rect.y - ESTIMATED_HEIGHT - ARROW);

  // The arrow follows the anchor even when the panel itself has been pushed in.
  const arrowLeft = Math.min(
    Math.max(ARROW * 2, anchorCentre - left - ARROW),
    width - ARROW * 3
  );

  return { left, top, below, arrowLeft };
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: DS.colors.overlay },
  panel: {
    position: 'absolute',
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 4,
    ...DS.shadow.elevated,
  },
  arrow: {
    position: 'absolute',
    width: ARROW * 2,
    height: ARROW * 2,
    backgroundColor: DS.colors.surface,
    borderColor: DS.colors.border,
    transform: [{ rotate: '45deg' }],
  },
  arrowUp: {
    top: -ARROW,
    borderTopWidth: DS.layout.hairline,
    borderLeftWidth: DS.layout.hairline,
  },
  arrowDown: {
    bottom: -ARROW,
    borderBottomWidth: DS.layout.hairline,
    borderRightWidth: DS.layout.hairline,
  },
});
