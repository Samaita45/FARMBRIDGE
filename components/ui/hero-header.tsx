import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';
import type { IconName } from '@/types/icons';
import { topChrome } from '@/lib/platform-ui';

interface HeroHeaderProps {
  title: string;
  subtitle?: string;
  image: ImageSourcePropType;
  /** Chips of live context — availability, counts, location. */
  meta?: { icon: IconName; label: string }[];
  showBack?: boolean;
  onBack?: () => void;
  /** Rendered at the bottom-right, e.g. a primary action. */
  action?: ReactNode;
  height?: number;
}

/**
 * A photographic screen header.
 *
 * The design sweep stripped these out along with the decorative gradients, and
 * that was an over-correction: a photograph of crates of produce or a truck on
 * a farm road is subject matter, not ornament. It tells a farmer what a screen
 * is for faster than a title does, and it is most of what made the app feel
 * like a product rather than a form.
 *
 * What does not come back is the old treatment — a flat `rgba(15,23,42,0.65)`
 * wash over the whole image, which muddied the photograph and still left white
 * text sitting on unpredictable contrast. This uses a bottom-weighted scrim
 * instead: the image stays clear at the top, and the text sits on a band dark
 * enough to be legible over any frame.
 */
export function HeroHeader({
  title,
  subtitle,
  image,
  meta,
  showBack,
  onBack,
  action,
  height = 190,
}: HeroHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { height: height + topChrome(insets.top) }]}>
      <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />

      {/*
        Three stacked bands rather than one flat wash. The image reads at the
        top; the text sits on progressively darker ground toward the bottom.
      */}
      <View style={styles.scrimTop} pointerEvents="none" />
      <View style={styles.scrimMid} pointerEvents="none" />
      <View style={styles.scrimBottom} pointerEvents="none" />

      {showBack ? (
        <View style={[styles.backRow, { top: topChrome(insets.top) + DS.spacing.sm }]}>
          <Pressable
            onPress={onBack ?? (() => router.back())}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
            <Ionicons name="arrow-back" size={20} color={DS.colors.textInverse} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={styles.subtitle}
              numberOfLines={2}
              maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {subtitle}
            </Text>
          ) : null}

          {meta && meta.length > 0 ? (
            <View style={styles.metaRow}>
              {meta.map((item) => (
                <View key={item.label} style={styles.metaChip}>
                  <Ionicons name={item.icon} size={12} color={DS.colors.textInverse} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    backgroundColor: DS.colors.gray[800],
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },

  // Light enough that the photograph is still visible behind the status bar.
  scrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(15, 23, 42, 0.30)',
  },
  scrimMid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '62%',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '34%',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },

  backRow: { position: 'absolute', left: DS.spacing.md },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
  },
  backBtnPressed: { backgroundColor: 'rgba(15, 23, 42, 0.78)' },

  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: DS.spacing.sm + 4,
    paddingHorizontal: DS.spacing.md,
    paddingBottom: DS.spacing.md,
  },
  textBlock: { flex: 1, gap: 3 },
  title: {
    fontSize: DS.typography.h1.fontSize,
    lineHeight: DS.typography.h1.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.textInverse,
  },
  subtitle: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 19,
    fontFamily: DS.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.88)',
  },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: DS.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },

  action: { paddingBottom: 2 },
});
