import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';
import { topChrome } from '@/lib/platform-ui';
import type { IconName } from '@/types/icons';

export interface SidebarItem {
  key: string;
  label: string;
  icon: IconName;
  onPress: () => void;
  /** Reads as the current place rather than somewhere to go. */
  active?: boolean;
  /** Sign out and the like: tinted. */
  destructive?: boolean;
}

export interface SidebarProfile {
  name: string;
  /** The line under the name — a rating, a count. Never invented. */
  meta?: ReactNode;
  avatar: ReactNode;
  onPress?: () => void;
}

export interface SidebarAction {
  label: string;
  icon?: IconName;
  onPress: () => void;
}

export interface SidebarLink {
  key: string;
  icon: IconName;
  url: string;
  accessibilityLabel: string;
}

export interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  items: SidebarItem[];
  profile?: SidebarProfile;
  /** The one highlighted action at the foot of the drawer. */
  primaryAction?: SidebarAction;
  /** Rendered under the action. Pass nothing rather than links that go nowhere. */
  links?: SidebarLink[];
}

/**
 * The navigation drawer, laid out as the inDrive reference lays it out: the
 * person at the top, the destinations as one plain list, and a single
 * highlighted action at the foot.
 *
 * THINGS THE REFERENCE DOES NOT HAVE, SO NEITHER DOES THIS. No close button —
 * the backdrop and the back gesture do that, and a cross competes with the
 * profile row for the top corner. No chevrons on the rows: nine of them turn a
 * list into a wall of arrows. No badges. The current row is marked by a tint
 * running the full width of the panel rather than by a bar inside a margin.
 *
 * WIDTH IS CAPPED AT 320 AND AT 86% OF THE SCREEN, WHICHEVER IS SMALLER. A
 * drawer covering the whole width leaves nothing to tap to dismiss it, and on a
 * small phone a fixed 320 does exactly that — so the strip of visible backdrop
 * is guaranteed rather than assumed. With the close button gone that strip is
 * now the primary way out, which makes the cap load-bearing rather than tidy.
 *
 * The list scrolls and the action stays put, so the action is reachable on a
 * short screen without scrolling to the end of the menu.
 *
 * TWO PLACES WHERE COPYING EXACTLY WOULD MEAN INVENTING SOMETHING.
 *
 * The reference shows a driver's star rating under their name. `meta` is a slot
 * rather than a rating, because most people using FarmBridge have never been
 * rated — printing stars for them would be showing a score nobody gave.
 *
 * The reference has Facebook and Instagram under the action. `links` is empty
 * unless real URLs are configured: two icons that open nothing are worse than
 * no icons, and this app has no social accounts to point at yet.
 */
export function Sidebar({
  visible,
  onClose,
  items,
  profile,
  primaryAction,
  links,
}: SidebarProps) {
  const insets = useSafeAreaInsets();
  const [anim] = useState(() => new Animated.Value(0));
  const pending = useRef<(() => void) | null>(null);

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

  /**
   * Closing a Modal and pushing a route in the same tick is a no-op: the
   * navigator is still covered, so every row looks dead. Hold the destination
   * and run it after the fade — `onDismiss` on iOS, a short wait on Android.
   */
  const flush = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  const go = (action?: () => void) => {
    pending.current = action ?? null;
    onClose();
  };

  useEffect(() => {
    if (visible || !pending.current) return;
    const t = setTimeout(flush, DS.motion.slow);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onDismiss={flush}
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
            { width, paddingTop: topChrome(insets.top), transform: [{ translateX }] },
          ]}>
          {profile ? (
            <>
              <Pressable
                onPress={() => go(profile.onPress)}
                disabled={!profile.onPress}
                accessibilityRole={profile.onPress ? 'button' : 'summary'}
                accessibilityLabel={profile.name}
                style={({ pressed }) => [styles.profile, pressed && styles.pressedRow]}>
                {profile.avatar}
                <View style={styles.profileText}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {profile.name}
                  </Text>
                  {profile.meta ? <View style={styles.profileMeta}>{profile.meta}</View> : null}
                </View>
                {profile.onPress ? (
                  <Ionicons name="chevron-forward" size={20} color={DS.colors.textMuted} />
                ) : null}
              </Pressable>
              <View style={styles.rule} />
            </>
          ) : null}

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => go(item.onPress)}
                accessibilityRole="button"
                accessibilityState={{ selected: Boolean(item.active) }}
                accessibilityLabel={item.label}
                style={({ pressed }) => [
                  styles.item,
                  item.active && styles.itemActive,
                  pressed && styles.pressedRow,
                ]}>
                {/*
                  A FIXED-WIDTH SLOT, NOT A BARE GLYPH.

                  Ionicons renders as text, and its glyphs are not the same
                  width — a navigate arrow is narrow, a settings cog is wide.
                  Placed directly in the row, each icon took whatever width its
                  glyph happened to need and every label started at a different
                  x, so "Request a truck" and "Transporters" sat a few pixels
                  apart down a list that should read as one column.

                  The slot fixes the width and centres the glyph inside it, so
                  the icons line up with each other and the labels line up with
                  each other.
                */}
                <View style={styles.itemIcon}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={
                      item.destructive
                        ? DS.semantic.danger.fg
                        : item.active
                          ? DS.colors.primaryDark
                          : DS.colors.textMuted
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.itemLabel,
                    item.active && styles.itemLabelActive,
                    item.destructive && styles.itemLabelDestructive,
                  ]}
                  numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {primaryAction || (links && links.length > 0) ? (
            <View style={[styles.footer, { paddingBottom: insets.bottom + DS.spacing.md }]}>
              <View style={styles.rule} />

              {primaryAction ? (
                <Pressable
                  onPress={() => go(primaryAction.onPress)}
                  accessibilityRole="button"
                  accessibilityLabel={primaryAction.label}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                  {primaryAction.icon ? (
                    <Ionicons name={primaryAction.icon} size={19} color={DS.colors.accentOn} />
                  ) : null}
                  <Text style={styles.actionText}>{primaryAction.label}</Text>
                </Pressable>
              ) : null}

              {links && links.length > 0 ? (
                <View style={styles.links}>
                  {links.map((link) => (
                    <Pressable
                      key={link.key}
                      onPress={() => void Linking.openURL(link.url)}
                      accessibilityRole="link"
                      accessibilityLabel={link.accessibilityLabel}
                      hitSlop={10}
                      style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                      <Ionicons name={link.icon} size={22} color={DS.colors.text} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: DS.colors.overlay },
  // Square edges, as the reference has them: the panel is a wall, not a card.
  panel: { height: '100%', backgroundColor: DS.colors.surface },
  pressed: { opacity: 0.85 },
  pressedRow: { backgroundColor: DS.colors.surfaceMuted },

  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.md,
  },
  profileText: { flex: 1, gap: 3 },
  profileName: {
    fontSize: DS.typography.h2.fontSize,
    lineHeight: DS.typography.h2.lineHeight,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  rule: { height: DS.layout.hairline, backgroundColor: DS.colors.border },

  list: { paddingVertical: DS.spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
    minHeight: 54,
    // Edge to edge, so the active tint spans the panel as it does in the
    // reference rather than sitting inside a margin.
    paddingHorizontal: DS.spacing.md,
  },
  itemActive: { backgroundColor: DS.colors.primaryBg },
  // 24 is the widest Ionicons glyph at size 22, so nothing is ever clipped and
  // every label starts at the same place.
  itemIcon: { width: 24, alignItems: 'center', justifyContent: 'center' },
  itemLabel: {
    flex: 1,
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  /*
    The reference marks the current row with a very pale tint — theirs measures
    about 1.05 against white, ours 1.10 — which is a fine background and a poor
    signal on its own. The weight changes too, so the state survives a screen
    where the tint is washed out by sunlight or by anyone who cannot pick it
    out. Two cues, one of which is not colour.
  */
  itemLabelActive: {
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.primaryDark,
  },
  itemLabelDestructive: { color: DS.semantic.danger.fg },

  footer: { gap: DS.spacing.md },
  /*
    The reference's action is lime with black text. This is the accent, which
    plays the same part in our palette — the one bright colour, taking near
    black — rather than importing a lime that would put three greens on one
    screen.
  */
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    minHeight: 56,
    marginHorizontal: DS.spacing.md,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.accent,
  },
  actionText: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.accentOn,
  },

  links: { flexDirection: 'row', justifyContent: 'center', gap: DS.spacing.lg },
  link: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
