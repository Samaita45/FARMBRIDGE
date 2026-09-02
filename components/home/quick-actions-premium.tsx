import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { DS } from '@/constants/design-system';
import { ScreenImages } from '@/constants/images';
import type { IconName } from '@/types/icons';

interface QuickAction {
  label: string;
  sub: string;
  icon: IconName;
  href: string;
  image: ImageSourcePropType;
}

/**
 * The four places worth going from the dashboard.
 *
 * Two of the original tiles ("Find Buyers" and "Community Tips") pointed at the
 * same /community route under different names. Those were replaced by Crop
 * Management and Financials, which together hold eleven screens otherwise
 * reachable only by scrolling past them.
 *
 * They are photographs now rather than tinted icon squares, following the
 * reference. The pictures are the bundled screen images — the same photograph
 * that heads each destination — so the tile previews where you are going
 * instead of decorating the trip. The icon stays as a second cue, because four
 * green fields at thumbnail size are not distinguishable at a glance.
 */
const ACTIONS: QuickAction[] = [
  {
    label: 'Marketplace',
    sub: 'Buy and sell produce',
    icon: 'storefront-outline',
    href: '/(tabs)/market',
    image: ScreenImages.market,
  },
  {
    label: 'Transport',
    sub: 'Move your harvest',
    icon: 'bus-outline',
    href: '/(tabs)/transport',
    image: ScreenImages.transport,
  },
  {
    label: 'Crop management',
    sub: 'Plans, tasks and health',
    icon: 'leaf-outline',
    href: '/crop-management',
    image: ScreenImages.crop,
  },
  {
    label: 'Financials',
    sub: 'Income, costs and profit',
    icon: 'wallet-outline',
    href: '/financials',
    image: ScreenImages.community,
  },
];

export function QuickActionsPremium() {
  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => (
        <Link key={action.label} href={action.href as Href} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`${action.label}. ${action.sub}`}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <Image
              source={action.image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <View style={styles.scrim} />

            <View style={styles.iconWrap}>
              <Ionicons name={action.icon} size={18} color={DS.colors.primary} />
            </View>

            <View style={styles.body}>
              <Text style={styles.label} maxFontSizeMultiplier={DS.layout.maxFontScale}>
                {action.label}
              </Text>
              <Text
                style={styles.sub}
                numberOfLines={2}
                maxFontSizeMultiplier={DS.layout.maxFontScale}>
                {action.sub}
              </Text>
            </View>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm + 4 },
  card: {
    width: '47.5%',
    flexGrow: 1,
    minWidth: 148,
    height: 132,
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surfaceMuted,
  },
  pressed: { opacity: 0.9 },
  // Uniform 0.6: these tiles are small and the label sits low, so a gradient
  // band would leave the second line on unpredictable ground.
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.66)' },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
  },
  body: { gap: 1 },
  label: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
  sub: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
  },
});
