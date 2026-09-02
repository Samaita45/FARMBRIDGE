import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, Link } from 'expo-router';
import { MotiView } from 'moti';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { DS } from '@/constants/design-system';
import { ScreenImages } from '@/constants/images';
import { MOTI_SPRING, STAGGER_DELAY } from '@/lib/motion';
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
 * ORDER AND SIZE CARRY MEANING NOW. Four identical squares said all four were
 * equally likely, which is not true: the marketplace is why most people open
 * this app, and financials is where they end up occasionally. The marketplace
 * gets a full-width tile at the top and the other three share a row beneath it,
 * so the grid reads in the order people actually use it rather than as a set of
 * options to scan.
 *
 * Two of the original tiles ("Find Buyers" and "Community Tips") pointed at the
 * same /community route under different names. Those were replaced by Crop
 * Management and Financials, which together hold eleven screens otherwise
 * reachable only by scrolling past them.
 *
 * The pictures are the bundled screen images — the same photograph that heads
 * each destination — so a tile previews where you are going instead of
 * decorating the trip. The icon stays as a second cue, because four green
 * fields at thumbnail size are not distinguishable at a glance.
 */
const LEAD: QuickAction = {
  label: 'Marketplace',
  sub: 'Buy seed and inputs, sell what you have grown',
  icon: 'storefront-outline',
  href: '/(tabs)/market',
  image: ScreenImages.market,
};

const REST: QuickAction[] = [
  {
    label: 'Transport',
    sub: 'Move your harvest',
    icon: 'bus-outline',
    href: '/(tabs)/transport',
    image: ScreenImages.transport,
  },
  {
    label: 'Crops',
    sub: 'Plans and tasks',
    icon: 'leaf-outline',
    href: '/crop-management',
    image: ScreenImages.crop,
  },
  {
    label: 'Money',
    sub: 'Income and costs',
    icon: 'wallet-outline',
    href: '/financials',
    image: ScreenImages.community,
  },
];

export function QuickActionsPremium() {
  return (
    <View style={styles.wrap}>
      <Tile action={LEAD} lead index={0} />

      <View style={styles.row}>
        {REST.map((action, i) => (
          <Tile key={action.label} action={action} index={i + 1} />
        ))}
      </View>
    </View>
  );
}

function Tile({
  action,
  lead,
  index,
}: {
  action: QuickAction;
  lead?: boolean;
  index: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ ...MOTI_SPRING, delay: index * STAGGER_DELAY }}
      style={lead ? undefined : styles.flex}>
      <Link href={action.href as Href} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${action.label}. ${action.sub}`}
          style={({ pressed }) => [
            styles.card,
            lead ? styles.cardLead : styles.cardSmall,
            pressed && styles.pressed,
          ]}>
          <Image
            source={action.image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={220}
            cachePolicy="memory-disk"
          />
          <View style={styles.scrim} />

          <View style={[styles.iconWrap, lead && styles.iconWrapLead]}>
            <Ionicons name={action.icon} size={lead ? 20 : 16} color={DS.colors.primary} />
          </View>

          <View style={styles.body}>
            <Text
              style={[styles.label, lead && styles.labelLead]}
              numberOfLines={1}
              maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {action.label}
            </Text>
            <Text
              style={styles.sub}
              numberOfLines={2}
              maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {action.sub}
            </Text>
          </View>

          {lead ? (
            <View style={styles.leadArrow}>
              <Ionicons name="arrow-forward" size={16} color={DS.colors.primary} />
            </View>
          ) : null}
        </Pressable>
      </Link>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: DS.spacing.sm + 4 },
  row: { flexDirection: 'row', gap: DS.spacing.sm + 4 },
  flex: { flex: 1 },
  pressed: { opacity: 0.9 },

  card: {
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    backgroundColor: DS.colors.surfaceMuted,
  },
  cardLead: {
    height: 122,
    justifyContent: 'flex-end',
    padding: DS.spacing.md,
  },
  cardSmall: {
    height: 116,
    justifyContent: 'space-between',
    padding: DS.spacing.sm + 2,
  },
  // Uniform rather than bottom-weighted: these tiles are short and the label
  // sits low, so a gradient band would leave the second line on unpredictable
  // ground. 0.66 gives white 5.75:1 against the brightest frame.
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.66)' },

  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
  },
  iconWrapLead: {
    position: 'absolute',
    top: DS.spacing.md,
    left: DS.spacing.md,
    width: 40,
    height: 40,
  },

  body: { gap: 1 },
  label: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
  labelLead: {
    fontSize: DS.typography.h2.fontSize,
    lineHeight: DS.typography.h2.lineHeight,
    fontFamily: DS.fontFamily.display,
  },
  sub: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
  },

  leadArrow: {
    position: 'absolute',
    top: DS.spacing.md,
    right: DS.spacing.md,
    width: 40,
    height: 40,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
  },
});
