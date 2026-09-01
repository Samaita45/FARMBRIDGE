import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonRow } from '@/components/design-system';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { DS } from '@/constants/design-system';
import { useAuthStore } from '@/stores/authStore';

interface HomeHeaderProps {
  locationLabel: string;
  greeting: string;
  notificationCount?: number;
  avatarUri?: string | null;
  avatarInitials?: string;
}

/**
 * The home header.
 *
 * Previously a three-stop gradient carrying four absolutely-positioned
 * decorative "orbs", a pattern-dot row, a translucent glass panel and a
 * floating shadow card — none of which conveyed anything. It also showed a
 * hardcoded "Online" pill that never reflected connectivity; the OfflineBanner
 * in the root layout already reports that honestly.
 *
 * Now a single solid brand band: blue and white, no gradient, nothing
 * decorative. Everything on it is information or a control.
 */
export function HomeHeader({
  locationLabel,
  greeting,
  notificationCount = 0,
  avatarUri = null,
  avatarInitials = 'F',
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'Farmer';
  const locationShort = locationLabel.split('·')[0]?.trim() ?? locationLabel;
  const badge = notificationCount > 99 ? '99+' : String(notificationCount);

  return (
    <View style={[styles.band, { paddingTop: insets.top + DS.spacing.sm }]}>
      <View style={styles.topRow}>
        <ProfileAvatar
          uri={avatarUri}
          initials={avatarInitials}
          size={48}
          embedded
          showCameraBadge={false}
          onPress={user ? () => router.push('/(tabs)/profile') : undefined}
        />

        <View style={styles.identity}>
          <Text style={styles.greeting} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {greeting}
          </Text>
          <Text
            style={styles.name}
            numberOfLines={1}
            maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {firstName}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            notificationCount > 0
              ? `Notifications, ${notificationCount} unread`
              : 'Notifications'
          }
          onPress={() => router.push('/notifications')}
          style={({ pressed }) => [styles.bell, pressed && styles.pressed]}>
          <Ionicons name="notifications-outline" size={22} color={DS.colors.textInverse} />
          {notificationCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={DS.colors.primaryMid} />
        <Text
          style={styles.locationText}
          numberOfLines={1}
          maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {locationShort}
        </Text>
      </View>

      {!user ? (
        <ButtonRow style={styles.authRow}>
          <Link href="/(auth)/login" asChild>
            <Button title="Log in" variant="outline" size="sm" style={styles.authBtn} />
          </Link>
          <Link href="/(auth)/register" asChild>
            <Button title="Register" variant="secondary" size="sm" style={styles.authBtn} />
          </Link>
        </ButtonRow>
      ) : null}
    </View>
  );
}

/** @deprecated Use `HomeHeader`. */
export const PremiumHeroHeader = HomeHeader;

const styles = StyleSheet.create({
  band: {
    backgroundColor: DS.colors.primary,
    paddingHorizontal: DS.spacing.md,
    paddingBottom: DS.spacing.md,
    gap: DS.spacing.sm + 4,
  },
  pressed: { opacity: 0.85 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  identity: { flex: 1 },
  greeting: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.primaryMid,
  },
  name: {
    fontSize: DS.typography.h2.fontSize,
    lineHeight: DS.typography.h2.lineHeight,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.textInverse,
    marginTop: 1,
  },

  bell: {
    width: DS.layout.touchTarget,
    height: DS.layout.touchTarget,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: DS.radius.full,
    backgroundColor: DS.semantic.danger.solid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: DS.colors.primary,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.primaryMid,
  },

  authRow: { marginTop: DS.spacing.xs },
  authBtn: { flex: 1 },
});
