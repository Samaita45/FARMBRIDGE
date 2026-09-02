import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { DS } from '@/constants/design-system';
import type { IconName } from '@/types/icons';

export interface WidgetProps {
  label: string;
  value: string;
  icon: IconName;
  /** Context under the value — a source, a change, a date. Never invented. */
  caption?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  onPress?: () => void;
  /** Fills the row it is in rather than sitting at its natural width. */
  stretch?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A single figure, with its label and where it came from.
 *
 * THE CAPTION IS THE POINT. A number on a dashboard is read as authoritative,
 * and most of the numbers in this app are estimates, cached values or seed
 * data. The caption is where that gets said — "indicative", "as of Tuesday",
 * "estimated" — and it is deliberately part of the component rather than
 * something a screen may or may not remember to add.
 *
 * The value is capped at one line and shrinks rather than wrapping, because a
 * figure that wraps to two lines pushes the caption out of the card and takes
 * the qualifier with it.
 */
export function Widget({
  label,
  value,
  icon,
  caption,
  tone = 'neutral',
  onPress,
  stretch,
  style,
}: WidgetProps) {
  const role = DS.semantic[tone];

  const content = (
    <>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: role.bg }]}>
          <Ionicons name={icon} size={16} color={role.fg} />
        </View>
        {onPress ? (
          <Ionicons name="chevron-forward" size={15} color={DS.colors.textFaint} />
        ) : null}
      </View>

      <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={DS.layout.maxFontScale}>
        {label}
      </Text>

      <Text
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        maxFontSizeMultiplier={DS.layout.maxFontScale}>
        {value}
      </Text>

      {caption ? (
        <Text style={styles.caption} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </>
  );

  const shell = [styles.card, stretch && styles.stretch, style];
  const a11y = caption ? `${label}: ${value}. ${caption}` : `${label}: ${value}`;

  if (!onPress) {
    return (
      <View style={shell} accessibilityRole="summary" accessibilityLabel={a11y}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [shell, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 132,
    gap: 2,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 4,
  },
  stretch: { flex: 1 },
  pressed: { backgroundColor: DS.colors.surfaceMuted },

  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: DS.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  value: {
    fontSize: DS.typography.h2.fontSize,
    lineHeight: DS.typography.h2.lineHeight,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  caption: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
    marginTop: 1,
  },
});
