import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';
import type { IconName } from '@/types/icons';

export interface SidebarItem {
  key: string;
  label: string;
  icon: IconName;
  /** Shown on the right — a count, or a word like "New". */
  badge?: string;
  onPress: () => void;
  /** Reads as the current place rather than somewhere to go. */
  active?: boolean;
  /** Sign out and the like: separated, and tinted. */
  destructive?: boolean;
}

export interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  items: SidebarItem[];
  /** Rendered above the list — an identity block, usually. */
  header?: ReactNode;
  footer?: ReactNode;
}

/**
 * A drawer that slides in from the left.
 *
 * WIDTH IS CAPPED AT 320 AND AT 86% OF THE SCREEN, WHICHEVER IS SMALLER. A
 * drawer that covers the whole width has nothing left to tap to dismiss it, and
 * on a small phone a fixed 320 does exactly that — so the strip of visible
 * backdrop is guaranteed rather than assumed.
 *
 * Closing is the same contract as every other overlay here: the backdrop, the
 * close button, and Android's hardware back. Choosing an item closes the drawer
 * before its action runs, so the destination is not revealed behind a panel
 * that is still sliding away.
 *
 * The panel honours the safe area on all four sides. It sits under the status
 * bar, so without the top inset the first row lands beneath the clock.
 */
export function Sidebar({ visible, onClose, items, header, footer }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get('window').width;
  const width = Math.min(320, screenWidth * 0.86);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? DS.animation.normal : DS.animation.fast,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close the menu"
        />

        <Animated.View
          style={[
            styles.panel,
            {
              width,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateX }],
            },
          ]}>
          <View style={styles.headerRow}>
            <View style={styles.flex}>{header}</View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close the menu"
              hitSlop={8}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={DS.colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  // Close first: the destination should not appear behind a
                  // panel that is still on screen.
                  onClose();
                  item.onPress();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: Boolean(item.active) }}
                accessibilityLabel={item.badge ? `${item.label}, ${item.badge}` : item.label}
                style={({ pressed }) => [
                  styles.item,
                  item.active && styles.itemActive,
                  pressed && styles.pressedRow,
                ]}>
                <Ionicons
                  name={item.icon}
                  size={19}
                  color={
                    item.destructive
                      ? DS.semantic.danger.fg
                      : item.active
                        ? DS.colors.primary
                        : DS.colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.itemLabel,
                    item.active && styles.itemLabelActive,
                    item.destructive && styles.itemLabelDestructive,
                  ]}
                  numberOfLines={1}>
                  {item.label}
                </Text>
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: DS.colors.overlay },
  flex: { flex: 1 },
  panel: {
    height: '100%',
    backgroundColor: DS.colors.surface,
    borderTopRightRadius: DS.radius.xxl,
    borderBottomRightRadius: DS.radius.xxl,
    overflow: 'hidden',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.md,
    paddingBottom: DS.spacing.sm,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surfaceMuted,
  },
  pressed: { opacity: 0.7 },
  pressedRow: { backgroundColor: DS.colors.surfaceMuted },

  list: { paddingHorizontal: DS.spacing.sm, paddingBottom: DS.spacing.md, gap: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    minHeight: DS.layout.touchTarget,
    paddingHorizontal: DS.spacing.sm + 4,
    borderRadius: DS.radius.md,
  },
  itemActive: { backgroundColor: DS.colors.primaryBg },
  itemLabel: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },
  itemLabelActive: { fontFamily: DS.fontFamily.semibold, color: DS.colors.primaryDark },
  itemLabelDestructive: { color: DS.semantic.danger.fg },

  badge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DS.radius.full,
    backgroundColor: DS.semantic.danger.solid,
  },
  badgeText: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: DS.fontFamily.bold,
    color: DS.semantic.danger.onSolid,
  },

  footer: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.border,
  },
});
