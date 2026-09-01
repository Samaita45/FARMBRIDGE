import { Ionicons } from '@expo/vector-icons';
import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import type { IconName } from '@/types/icons';

interface QuickAction {
  label: string;
  sub: string;
  icon: IconName;
  href: string;
  tone: keyof typeof DS.semantic;
}

/**
 * Two of the previous four tiles ("Find Buyers" and "Community Tips") pointed
 * at the same /community route under different names. Those are replaced by
 * Crop Management and Financials, which together hold eleven screens that were
 * otherwise reachable only by scrolling past them on this dashboard.
 */
const ACTIONS: QuickAction[] = [
  {
    label: 'Marketplace',
    sub: 'Buy and sell produce',
    icon: 'storefront-outline',
    href: '/(tabs)/market',
    tone: 'info',
  },
  {
    label: 'Transport',
    sub: 'Move your harvest',
    icon: 'bus-outline',
    href: '/(tabs)/transport',
    tone: 'success',
  },
  {
    label: 'Crop management',
    sub: 'Plans, tasks and health',
    icon: 'leaf-outline',
    href: '/crop-management',
    tone: 'success',
  },
  {
    label: 'Financials',
    sub: 'Income, costs and profit',
    icon: 'wallet-outline',
    href: '/financials',
    tone: 'warning',
  },
];

export function QuickActionsPremium() {
  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => {
        const tone = DS.semantic[action.tone];
        return (
          <Link key={action.label} href={action.href as Href} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${action.label}. ${action.sub}`}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
                <Ionicons name={action.icon} size={20} color={tone.fg} />
              </View>
              <Text style={styles.label} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                {action.label}
              </Text>
              <Text
                style={styles.sub}
                numberOfLines={2}
                maxFontSizeMultiplier={DS.layout.maxFontScale}>
                {action.sub}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm + 4 },
  card: {
    width: '47.5%',
    flexGrow: 1,
    minWidth: 148,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: DS.spacing.md,
    gap: 3,
  },
  pressed: { backgroundColor: DS.colors.surfaceMuted },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  sub: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
