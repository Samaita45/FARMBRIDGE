import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import type { IconName } from '@/types/icons';

interface SectionHeaderProps {
  title: string;
  icon?: IconName;
  actionLabel?: string;
  onPress?: () => void;
}

export function PremiumSectionHeader({
  title,
  icon,
  actionLabel = 'View all',
  onPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {icon ? <Ionicons name={icon} size={18} color={DS.colors.primary} /> : null}
        <Text
          style={styles.title}
          numberOfLines={1}
          maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {title}
        </Text>
      </View>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${title}`}
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={13} color={DS.colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
    marginBottom: DS.spacing.sm + 4,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm, flex: 1 },
  title: {
    flex: 1,
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
  pressed: { opacity: 0.7 },
  actionText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },
});
