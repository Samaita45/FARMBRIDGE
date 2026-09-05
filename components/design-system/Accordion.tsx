import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { DS } from '@/constants/design-system';
import type { IconName } from '@/types/icons';

export interface AccordionItemProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  children: ReactNode;
  /** Open on first render. Use for the one section most people want. */
  defaultOpen?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A disclosure section.
 *
 * IT MEASURES ITS CONTENT RATHER THAN ANIMATING TO A GUESS. Height is taken
 * from the body's own onLayout, so a section holding two lines and one holding
 * twenty both open to the right size. Animating to a fixed maxHeight is the
 * usual shortcut and it either clips long content or leaves a gap under short
 * content.
 *
 * The content stays mounted once it has been opened, so scroll position and any
 * text field inside survive a collapse. While closed it takes no touches and is
 * hidden from assistive technology — a zero-height clip still exposes its
 * children to VoiceOver and TalkBack otherwise, so a collapsed section would be
 * read out as though it were on screen.
 */
export function AccordionItem({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false,
  style,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [everOpened, setEverOpened] = useState(defaultOpen);
  const [height, setHeight] = useState(0);

  const [anim] = useState(() => new Animated.Value(defaultOpen ? 1 : 0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: DS.animation.normal,
      easing: Easing.out(Easing.cubic),
      // Height is a layout property, so this cannot go on the UI thread.
      useNativeDriver: false,
    }).start();
  }, [open, anim]);

  const toggle = () => {
    if (!open) setEverOpened(true);
    setOpen((v) => !v);
  };

  const chevron = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.item, style]}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        {icon ? (
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={17} color={DS.colors.primary} />
          </View>
        ) : null}

        <View style={styles.headerText}>
          <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Animated.View style={{ transform: [{ rotate: chevron }] }}>
          <Ionicons name="chevron-down" size={18} color={DS.colors.textSoft} />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={[
          styles.bodyClip,
          {
            height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
            opacity: anim,
          },
        ]}>
        {/* Absolutely positioned so its own height is never constrained by the
            clip above it, which is what makes the measurement correct. */}
        <View
          style={styles.bodyMeasure}
          // A clip of zero height still hands its children to screen readers,
          // so the closed state has to say so explicitly on both platforms.
          pointerEvents={open ? 'auto' : 'none'}
          accessibilityElementsHidden={!open}
          importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
          onLayout={(e) => {
            const next = e.nativeEvent.layout.height;
            if (Math.abs(next - height) > 0.5) setHeight(next);
          }}>
          {everOpened ? children : null}
        </View>
      </Animated.View>
    </View>
  );
}

/** Groups items with dividers between them. */
export function Accordion({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.group, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    overflow: 'hidden',
  },
  item: {
    borderBottomWidth: DS.layout.hairline,
    borderBottomColor: DS.colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 2,
    minHeight: DS.layout.touchTarget + 6,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
  },
  pressed: { backgroundColor: DS.colors.surfaceMuted },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primaryBg,
  },
  headerText: { flex: 1, gap: 1 },
  title: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  subtitle: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 17,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  bodyClip: { overflow: 'hidden' },
  bodyMeasure: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: DS.spacing.md,
    paddingBottom: DS.spacing.md,
  },
});
