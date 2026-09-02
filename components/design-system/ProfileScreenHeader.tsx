import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';

interface ProfileScreenHeaderProps {
  label?: string;
  name: string;
  subtitle: string;
  roleLabel: string;
  avatar: ReactNode;
  stats: ReactNode;
}

/**
 * The profile header.
 *
 * The gradient version put the name, the role and three statistics on a
 * shifting colour, so every one of them was set in translucent white and none
 * of them held a fixed contrast ratio. Here the person's own photograph is the
 * only colour that needs to carry, and the numbers sit on a plain inset panel
 * where they can be read.
 *
 * The screen's SafeAreaView owns the top inset.
 */
export function ProfileScreenHeader({
  label = 'Profile',
  name,
  subtitle,
  roleLabel,
  avatar,
  stats,
}: ProfileScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>

      <View style={styles.identity}>
        {avatar}
        <Text style={styles.name} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {name}
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {subtitle}
        </Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.statsWrap}>{stats}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: DS.colors.surface,
    borderBottomWidth: DS.layout.hairline,
    borderBottomColor: DS.colors.border,
    paddingHorizontal: DS.spacing.lg,
    paddingTop: DS.spacing.sm,
    paddingBottom: DS.spacing.lg,
  },
  label: {
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textSoft,
    letterSpacing: 1,
  },
  identity: { alignItems: 'center', marginTop: DS.spacing.md },
  name: {
    fontSize: DS.typography.h1.fontSize,
    lineHeight: DS.typography.h1.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
    marginTop: DS.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  rolePill: {
    marginTop: DS.spacing.sm,
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  roleText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primaryDark,
  },
  statsWrap: {
    width: '100%',
    marginTop: DS.spacing.lg,
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    paddingVertical: DS.spacing.md,
    paddingHorizontal: DS.spacing.sm,
  },
});
