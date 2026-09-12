import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { DS } from '@/constants/design-system';

export interface ToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label?: string;
  /** A line under the label. Say what turning it ON does, not what the row is. */
  description?: string;
  disabled?: boolean;
  /** Overrides the label for screen readers when the label alone is ambiguous. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const TRACK_W = 50;
const TRACK_H = 30;
const KNOB = 24;

/**
 * A switch, and optionally the row it sits in.
 *
 * WHY NOT React Native's `Switch`. The platform component takes `trackColor`
 * and `thumbColor` and interprets them differently on each platform — on
 * Android the track is tinted at reduced opacity, so a colour proven at 4.5:1
 * arrives on screen at something else entirely. Three screens were passing it
 * three different colour pairs and getting three different results. This is one
 * appearance on both platforms, from the same tokens as everything else.
 *
 * THE STATE IS NOT ONLY COLOUR. The knob moves, and a tick appears when it is
 * on. Green-on-grey is a common confusion for red-green colour vision, and a
 * switch is exactly the control where being unsure is expensive.
 *
 * Pressing anywhere on the row toggles it when a label is given, so the target
 * is the whole row rather than a 50pt sliver at the edge of the screen.
 */
export function Toggle({
  value,
  onValueChange,
  label,
  description,
  disabled,
  accessibilityLabel,
  style,
}: ToggleProps) {
  /*
    A lazy `useState` initialiser, not `useRef(...).current`.

    Reading `.current` during render is what the React Compiler rejects, and it
    is right to: a ref is not part of the render output and reading one is how a
    component ends up not updating when it should. `useState` with an
    initialiser creates the Animated.Value exactly once and hands back the same
    instance every render — stable in the way a ref was being used for, without
    the read. `useMemo` would not do: React is permitted to discard a memo, and
    a new Animated.Value mid-animation would drop the driver.
  */
  const [pos] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.spring(pos, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [value, pos]);

  const translateX = pos.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_W - KNOB - 6],
  });

  const control = (
    <View
      style={[
        styles.track,
        value ? styles.trackOn : styles.trackOff,
        disabled && styles.disabled,
      ]}>
      <Animated.View style={[styles.knob, { transform: [{ translateX }] }]}>
        {value ? (
          <Ionicons name="checkmark" size={14} color={DS.colors.primary} />
        ) : null}
      </Animated.View>
    </View>
  );

  if (!label) {
    return (
      <Pressable
        onPress={() => !disabled && onValueChange(!value)}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        style={style}>
        {control}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={description}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}>
      <View style={styles.rowText}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      {control}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
    minHeight: DS.layout.touchTarget,
    paddingVertical: DS.spacing.sm,
  },
  pressed: { opacity: 0.7 },
  rowText: { flex: 1, gap: 1 },
  label: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  labelDisabled: { color: DS.colors.textSoft },
  description: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 17,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: DS.colors.primary },
  // Not a pale grey: the off state must read as a control, so the track keeps
  // 3:1 against the surface behind it.
  trackOff: { backgroundColor: DS.colors.borderControl },
  disabled: { opacity: 0.45 },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: DS.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...DS.shadow.soft,
  },
});
