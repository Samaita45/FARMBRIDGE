import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { DS } from '@/constants/design-system';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
export type BadgeVariant = 'soft' | 'solid' | 'outline';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  /** A count badge on an icon — small, round, no label wrap. */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A short status label.
 *
 * ONE COMPONENT, BECAUSE THERE WERE EIGHT. Badges were being assembled inline
 * on every screen that needed one, and each did its own colour maths — one
 * concatenated "22" onto a hex string to fake an alpha channel, which produced
 * a different opacity for every tone it was given. Every pairing here comes
 * from the semantic table, where the foreground is already proven against its
 * own background.
 *
 * `solid` takes `onSolid` rather than white, because white on the amber
 * measures 3.19:1 and on the success green 3.30:1. That is the whole reason
 * `onSolid` exists.
 */
export function Badge({
  label,
  tone = 'neutral',
  variant = 'soft',
  icon,
  dot,
  style,
}: BadgeProps) {
  const role = toneRole(tone);

  const background =
    variant === 'solid' ? role.solid : variant === 'outline' ? 'transparent' : role.bg;
  const foreground = variant === 'solid' ? role.onSolid : role.fg;

  return (
    <View
      style={[
        styles.base,
        dot && styles.dot,
        { backgroundColor: background },
        variant === 'outline' && { borderWidth: DS.layout.hairline, borderColor: role.border },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      {icon && !dot ? <Ionicons name={icon} size={11} color={foreground} /> : null}
      <Text
        style={[styles.label, dot && styles.dotLabel, { color: foreground }]}
        numberOfLines={1}
        maxFontSizeMultiplier={DS.layout.maxFontScale}>
        {label}
      </Text>
    </View>
  );
}

function toneRole(tone: BadgeTone) {
  if (tone === 'accent') {
    // The accent is the one role outside the semantic table, and it carries its
    // own foregrounds for the same reason: white on it measures 3.56:1.
    return {
      fg: DS.colors.accentText,
      bg: DS.colors.accentBg,
      border: DS.colors.accentBorder,
      solid: DS.colors.accent,
      onSolid: DS.colors.accentOn,
    };
  }
  return DS.semantic[tone];
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: DS.radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  dot: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    letterSpacing: 0.2,
  },
  dotLabel: { fontSize: 10, fontFamily: DS.fontFamily.bold, textAlign: 'center' },
});
