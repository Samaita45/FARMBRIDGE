import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DS } from '@/constants/design-system';
import { ScreenImages } from '@/constants/images';
import { topChrome } from '@/lib/platform-ui';

interface ProfileScreenHeaderProps {
  label?: string;
  name: string;
  subtitle: string;
  roleLabel: string;
  avatar: ReactNode;
  stats: ReactNode;
  /** Sits at the top-right — settings, or anything screen-specific. */
  action?: ReactNode;
}

/**
 * The profile header.
 *
 * It has been a gradient, then a plain white band. The gradient put the name,
 * the role and three statistics on a shifting colour, so every one of them was
 * set in translucent white and none held a fixed contrast ratio. The white band
 * fixed that and read as a form.
 *
 * This keeps the fix and gets the warmth back a different way: a photograph
 * behind a fixed scrim carries the top, and the statistics sit on their own
 * solid card lifted over the seam. The numbers are the thing people come here
 * to check, so they get a surface with predictable contrast rather than being
 * laid over a picture.
 *
 * The avatar carries a ring so a dark profile photograph never blends into the
 * scrim behind it.
 */
export function ProfileScreenHeader({
  label = 'Profile',
  name,
  subtitle,
  roleLabel,
  avatar,
  stats,
  action,
}: ProfileScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap}>
      <View style={styles.photo}>
        <Image
          source={ScreenImages.community}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={280}
          cachePolicy="memory-disk"
        />
        {/* 0.68: white clears 6.19:1 against the brightest frame. */}
        <View style={styles.scrim} />

        <View style={[styles.photoBody, { paddingTop: topChrome(insets.top) + DS.spacing.sm }]}>
          <View style={styles.topRow}>
            <Text style={styles.label}>{label.toUpperCase()}</Text>
            {action}
          </View>

          <View style={styles.identity}>
            <View style={styles.avatarRing}>{avatar}</View>

            <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {name}
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {subtitle}
            </Text>

            <View style={styles.rolePill}>
              <Ionicons name="person-circle-outline" size={12} color={DS.colors.primaryDark} />
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lifted over the seam, so the numbers sit on a known surface. */}
      <View style={styles.statsCard}>{stats}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: DS.colors.background },

  photo: {
    backgroundColor: DS.colors.primaryDark,
    borderBottomLeftRadius: DS.radius.xxl,
    borderBottomRightRadius: DS.radius.xxl,
    overflow: 'hidden',
    paddingBottom: DS.spacing.xl + DS.spacing.md,
  },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 42, 0.68)' },
  photoBody: { paddingHorizontal: DS.spacing.lg },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  label: {
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
    letterSpacing: 1,
  },

  identity: { alignItems: 'center', marginTop: DS.spacing.sm },
  // Keeps a dark profile photograph from merging with the scrim behind it.
  avatarRing: {
    padding: 3,
    borderRadius: DS.radius.full,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  name: {
    fontSize: DS.typography.h1.fontSize,
    lineHeight: DS.typography.h1.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.textInverse,
    marginTop: DS.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
    marginTop: 2,
    textAlign: 'center',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: DS.spacing.sm,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  roleText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primaryDark,
  },

  statsCard: {
    marginTop: -DS.spacing.xl,
    marginHorizontal: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.xl,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    paddingVertical: DS.spacing.md,
    paddingHorizontal: DS.spacing.sm,
    ...DS.shadow.card,
  },
});
