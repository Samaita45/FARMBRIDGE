import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonRow } from '@/components/design-system';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { DS } from '@/constants/design-system';
import { ScreenImages } from '@/constants/images';
import { asHref } from '@/lib/href';
import { useAuthStore } from '@/stores/authStore';

interface HomeHeaderProps {
  locationLabel: string;
  greeting: string;
  notificationCount?: number;
  avatarUri?: string | null;
  avatarInitials?: string;
  /** How the location was determined, so the header can say rather than imply. */
  locationSource?: 'gps' | 'profile' | 'default';
  onRefreshLocation?: () => void;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

/**
 * The home header, rebuilt to the Farm UI reference: a photograph carrying the
 * greeting, the date, the promise, and the one control people reach for.
 *
 * It has been a gradient with decorative orbs, then a flat brand band. The band
 * was honest but told you nothing — this puts the same information on a
 * photograph of the subject, which is what the reference does and what makes
 * the screen read as a farming product rather than a form.
 *
 * Everything on it still does something. The search pill opens marketplace
 * search; the location chip re-runs the fix and says where the current answer
 * came from, because a saved profile province presented as a live one is the
 * bug this app has already shipped once.
 */
export function HomeHeader({
  locationLabel,
  greeting,
  notificationCount = 0,
  avatarUri = null,
  avatarInitials = 'F',
  locationSource = 'default',
  onRefreshLocation,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'Farmer';
  const locationShort = locationLabel.split('·')[0]?.trim() ?? locationLabel;
  const badge = notificationCount > 99 ? '99+' : String(notificationCount);
  const today = new Date().toLocaleDateString('en-ZW', DATE_FORMAT);

  return (
    <View style={styles.wrap}>
      <Image
        source={ScreenImages.crop}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
      />
      {/* Uniform, not bottom-weighted: text runs the full height of this header. */}
      <View style={styles.scrim} />

      <View style={[styles.content, { paddingTop: insets.top + DS.spacing.sm }]}>
        <View style={styles.topRow}>
          <View style={styles.identity}>
            <Text style={styles.greeting} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {greeting}, {firstName}
            </Text>
            <Text style={styles.date} maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {today}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'
            }
            onPress={() => router.push(asHref('/notifications'))}
            style={({ pressed }) => [styles.bell, pressed && styles.pressed]}>
            <Ionicons name="notifications-outline" size={21} color={DS.colors.textInverse} />
            {notificationCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </Pressable>

          <ProfileAvatar
            uri={avatarUri}
            initials={avatarInitials}
            size={44}
            embedded
            showCameraBadge={false}
            onPress={user ? () => router.push(asHref('/(tabs)/profile')) : undefined}
          />
        </View>

        <Text style={styles.headline} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          Everything your farm needs, in one place
        </Text>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/market/search'))}
            accessibilityRole="search"
            accessibilityLabel="Search the marketplace"
            style={({ pressed }) => [styles.searchPill, pressed && styles.pressed]}>
            <Ionicons name="search" size={18} color={DS.colors.textSoft} />
            <Text style={styles.searchText} numberOfLines={1}>
              Search seeds, produce, equipment
            </Text>
          </Pressable>

          <Pressable
            onPress={onRefreshLocation}
            disabled={!onRefreshLocation}
            accessibilityRole="button"
            accessibilityLabel={`${LOCATION_CAPTION[locationSource]}: ${locationShort}. Tap to locate again.`}
            style={({ pressed }) => [styles.locationBtn, pressed && styles.pressed]}>
            <Ionicons
              name={locationSource === 'gps' ? 'locate' : 'locate-outline'}
              size={20}
              color={DS.colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={13} color={DS.colors.textInverse} />
          <Text
            style={styles.locationText}
            numberOfLines={1}
            maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {locationShort}
          </Text>
          <Text style={styles.locationSource}>{LOCATION_CAPTION[locationSource]}</Text>
        </View>

        {!user ? (
          <ButtonRow style={styles.authRow}>
            <Link href="/(auth)/login" asChild>
              <Button title="Log in" variant="onImage" size="sm" style={styles.authBtn} />
            </Link>
            <Link href="/(auth)/register" asChild>
              <Button title="Register" size="sm" style={styles.authBtn} />
            </Link>
          </ButtonRow>
        ) : null}
      </View>
    </View>
  );
}

const LOCATION_CAPTION: Record<'gps' | 'profile' | 'default', string> = {
  gps: 'your location',
  profile: 'from your profile',
  default: 'default',
};

/** @deprecated Use `HomeHeader`. */
export const PremiumHeroHeader = HomeHeader;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: DS.colors.primaryDark,
    borderBottomLeftRadius: DS.radius.xxl,
    borderBottomRightRadius: DS.radius.xxl,
    overflow: 'hidden',
  },
  // 0.68 over the photograph. Against the brightest frame the image can present
  // that is 6.19:1 for full white and 4.65:1 for the dimmed captions below —
  // 0.62 left those two at 4.15 and 3.89.
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.68)' },
  pressed: { opacity: 0.85 },

  content: {
    paddingHorizontal: DS.spacing.md,
    paddingBottom: DS.spacing.md,
    gap: DS.spacing.sm + 2,
  },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  identity: { flex: 1 },
  greeting: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
  date: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
    opacity: 0.85,
    marginTop: 1,
  },

  bell: {
    width: 44,
    height: 44,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 1,
    minWidth: 18,
    height: 18,
    borderRadius: DS.radius.full,
    backgroundColor: DS.semantic.danger.solid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: DS.colors.primaryDark,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.danger.onSolid,
  },

  headline: {
    fontSize: DS.typography.display.fontSize,
    lineHeight: DS.typography.display.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.textInverse,
    marginTop: DS.spacing.xs,
  },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    minHeight: DS.layout.touchTarget,
    paddingHorizontal: 16,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surface,
  },
  searchText: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  locationBtn: {
    width: DS.layout.touchTarget,
    height: DS.layout.touchTarget,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: {
    flexShrink: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
  locationSource: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
    opacity: 0.8,
  },

  authRow: { marginTop: DS.spacing.xs },
  authBtn: { flex: 1 },
});
