import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sidebar, type SidebarItem } from '@/components/design-system';
import { BottomPanel } from '@/components/transport/bottom-panel';
import { FullMap } from '@/components/transport/full-map';
import { TransportLocked } from '@/components/transport/transport-locked';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { DS } from '@/constants/design-system';
import { ScreenImages } from '@/constants/images';
import { SOCIAL_LINKS, whatsAppUrl } from '@/constants/support';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { useLocation, type LocationSource } from '@/hooks/useLocation';
import { useProfileAvatar } from '@/hooks/useProfileAvatar';
import { asHref } from '@/lib/href';
import { getBookings } from '@/services/transportDb';
import { selectIsSubscribed, useAuthStore, type AuthState } from '@/stores/authStore';
import type { TransportBooking } from '@/types/transport';

const LOCATION_CAPTION: Record<LocationSource, string> = {
  gps: 'Your location',
  profile: 'From your profile',
  default: 'Default location',
};

/**
 * The transport home, laid out as inDrive lays out its own: the map is the
 * screen, a menu button sits over it, and everything you do lives in a sheet
 * along the bottom.
 *
 * WHY THE FORM WENT AWAY. The previous version put the route, the price and a
 * note straight onto the home screen. That is the whole order on a page you
 * arrive at, which is a lot to face before you have decided you want anything.
 * inDrive asks one question — "Where to & for how much?" — and opens the form
 * once you have answered it, and the reason it works is that the question is
 * also the answer to "what is this app for". The order form still exists; it is
 * one tap in.
 *
 * THE TRUCK PHOTOGRAPH STAYS. inDrive has no photograph here, but you asked for
 * it kept, so it heads the sheet — which is also the one place on a map-first
 * screen where an image does not fight the map for attention.
 *
 * RECENT DESTINATIONS ARE REAL TRIPS. inDrive lists saved and recent places
 * under the search field. These come from bookings actually made on this
 * device, most recent first, deduplicated. When there are none the row is
 * absent rather than filled with suggestions nobody asked for.
 */
export default function TransportHubScreen() {
  const insets = useSafeAreaInsets();
  const isSubscribed = useAuthStore(selectIsSubscribed);
  const user = useAuthStore((s: AuthState) => s.user);
  const { location, source, refresh } = useLocation();
  const { avatarUri, initials } = useProfileAvatar();

  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadTrips = useCallback(async () => {
    setBookings(await getBookings(user?.id ?? 'guest'));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (isSubscribed) void loadTrips();
    }, [isSubscribed, loadTrips])
  );

  const available = useMemo(() => TRANSPORT_PROVIDERS.filter((t) => t.isAvailable), []);
  const activeTrips = useMemo(
    () => bookings.filter((t) => ['pending', 'confirmed', 'in_transit'].includes(t.status)),
    [bookings]
  );

  /** Destinations from trips actually booked here, newest first, no repeats. */
  const recentDestinations = useMemo(() => {
    const seen: string[] = [];
    for (const b of bookings) {
      if (b.destination && !seen.includes(b.destination)) seen.push(b.destination);
      if (seen.length === 3) break;
    }
    return seen;
  }, [bookings]);

  if (!isSubscribed) return <TransportLocked />;

  const menuItems: SidebarItem[] = [
    {
      key: 'move',
      label: 'Move a load',
      icon: 'cube-outline',
      active: true,
      onPress: () => router.push(asHref('/(tabs)/transport/request')),
    },
    {
      key: 'trips',
      label: 'My trips',
      icon: 'time-outline',
      onPress: () => router.push(asHref('/(tabs)/transport/trips')),
    },
    {
      key: 'transporters',
      label: 'All transporters',
      icon: 'people-outline',
      onPress: () => router.push(asHref('/(tabs)/transport/providers')),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => router.push(asHref('/notifications')),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'settings-outline',
      onPress: () => router.push(asHref('/settings')),
    },
    {
      key: 'support',
      label: 'Help and support',
      icon: 'logo-whatsapp',
      onPress: () =>
        void Linking.openURL(whatsAppUrl('Hi, I need help with FarmBridge transport.')),
    },
  ];

  return (
    <View style={styles.root}>
      <FullMap centre={location} providers={available} />

      {/* Over the map: the menu, the location pill, and the recentre control. */}
      <View style={[styles.overlay, { paddingTop: insets.top + DS.spacing.sm }]} pointerEvents="box-none">
        <View style={styles.overlayTop} pointerEvents="box-none">
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open the transport menu"
            style={({ pressed }) => [styles.circle, pressed && styles.pressed]}>
            <Ionicons name="menu" size={22} color={DS.colors.text} />
          </Pressable>

          <View style={styles.pill}>
            <Text style={styles.pillLabel}>{LOCATION_CAPTION[source]}</Text>
            <Text style={styles.pillValue} numberOfLines={1}>
              {location.label}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => void refresh()}
          accessibilityRole="button"
          accessibilityLabel="Centre the map on my location"
          style={({ pressed }) => [styles.circle, styles.recentre, pressed && styles.pressed]}>
          <Ionicons name="navigate" size={20} color={DS.colors.primary} />
        </Pressable>
      </View>

      <BottomPanel paddingBottom={insets.bottom + DS.spacing.sm}>
        {/*
          The truck photograph, kept — and doing a job here rather than only
          being present: it is the strip that says how many transporters are
          free, which is the first thing worth knowing on this screen.
        */}
        <View style={styles.banner}>
          <Image
            source={ScreenImages.transport}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={220}
          />
          <View style={styles.bannerScrim} />
          <View style={styles.bannerRow}>
            <View style={styles.bannerDot} />
            <Text style={styles.bannerText} numberOfLines={1}>
              {available.length} transporters free now
            </Text>
          </View>
        </View>

        {/* The one question. Sized to be the obvious thing to press. */}
        <Pressable
          onPress={() => router.push(asHref('/(tabs)/transport/request'))}
          accessibilityRole="button"
          accessibilityLabel="Where to, and for how much? Opens the order form."
          style={({ pressed }) => [styles.search, pressed && styles.pressed]}>
          <View style={styles.searchIcon}>
            <Ionicons name="search" size={19} color={DS.colors.textInverse} />
          </View>
          <Text style={styles.searchText} numberOfLines={1}>
            Where to & for how much?
          </Text>
          <Ionicons name="arrow-forward" size={18} color={DS.colors.textSoft} />
        </Pressable>

        {recentDestinations.length > 0 ? (
          <View style={styles.recents}>
            {recentDestinations.map((place, i) => (
              <Pressable
                key={place}
                onPress={() =>
                  router.push(
                    asHref({ pathname: '/(tabs)/transport/request', params: { to: place } })
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={`Send another load to ${place}`}
                style={({ pressed }) => [
                  styles.recent,
                  i > 0 && styles.recentDivider,
                  pressed && styles.pressedRow,
                ]}>
                <View style={styles.recentIcon}>
                  <Ionicons name="time-outline" size={16} color={DS.colors.textMuted} />
                </View>
                <Text style={styles.recentText} numberOfLines={1}>
                  {place}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={DS.colors.textFaint} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.modes}>
          <ModeCard
            image={ScreenImages.transport}
            icon="cube"
            label="Move a load"
            caption={`${available.length} available`}
            onPress={() => router.push(asHref('/(tabs)/transport/request'))}
          />
          <ModeCard
            image={ScreenImages.crop}
            icon="car-outline"
            label="Offer transport"
            caption="Register a vehicle"
            onPress={() => router.push(asHref('/(tabs)/transport/register'))}
          />
        </View>

        {activeTrips.length > 0 ? (
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/trips'))}
            accessibilityRole="button"
            accessibilityLabel={`${activeTrips.length} active ${activeTrips.length === 1 ? 'trip' : 'trips'}. Open my trips.`}
            style={({ pressed }) => [styles.active, pressed && styles.pressed]}>
            <View style={styles.activeIcon}>
              <Ionicons name="cube" size={16} color={DS.semantic.warning.onSolid} />
            </View>
            <Text style={styles.activeText} numberOfLines={1}>
              {activeTrips.length} trip{activeTrips.length === 1 ? '' : 's'} in progress
            </Text>
            <Ionicons name="chevron-forward" size={16} color={DS.semantic.warning.fg} />
          </Pressable>
        ) : null}

        <Text style={styles.caveat}>
          Pins show the town each transporter works from, not where their vehicle is now.
        </Text>
      </BottomPanel>

      <Sidebar
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
        profile={{
          name: user?.name ?? 'Guest',
          avatar: (
            <ProfileAvatar
              uri={avatarUri}
              initials={initials}
              size={52}
              embedded
              showCameraBadge={false}
            />
          ),
          /*
            The reference prints a star rating here. Most people using this app
            have never been rated, and stars for them would be a score nobody
            gave — so this is the count of trips they have actually booked.
          */
          meta: (
            <>
              <Ionicons name="cube-outline" size={13} color={DS.colors.textMuted} />
              <Text style={styles.menuMeta}>
                {bookings.length} {bookings.length === 1 ? 'trip' : 'trips'} booked
              </Text>
            </>
          ),
          onPress: () => router.push(asHref('/(tabs)/profile')),
        }}
        primaryAction={{
          label: 'Transporter mode',
          icon: 'car-sport-outline',
          onPress: () => router.push(asHref('/(tabs)/transport/register')),
        }}
        links={SOCIAL_LINKS}
      />
    </View>
  );
}

function ModeCard({
  image,
  icon,
  label,
  caption,
  onPress,
}: {
  image: ImageSourcePropType;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${caption}`}
      style={({ pressed }) => [styles.mode, pressed && styles.pressed]}>
      <Image
        source={image}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <View style={styles.modeScrim} />

      <View style={styles.modeIcon}>
        <Ionicons name={icon} size={17} color={DS.colors.primary} />
      </View>

      <View>
        <Text style={styles.modeLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.modeCaption} numberOfLines={1}>
          {caption}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.surfaceMuted },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  pressedRow: { backgroundColor: DS.colors.surfaceMuted },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: DS.spacing.md,
    // Clears the panel at its resting height, so the recentre control is never
    // underneath it.
    paddingBottom: '48%',
  },
  overlayTop: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  circle: {
    width: 44,
    height: 44,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
    ...DS.shadow.card,
  },
  recentre: { alignSelf: 'flex-end' },
  pill: {
    flexShrink: 1,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    ...DS.shadow.card,
  },
  pillLabel: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  pillValue: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  banner: {
    height: 76,
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: DS.colors.surfaceMuted,
  },
  // 0.62, not 0.55: against the brightest frame of the photograph the label
  // measured 4.00:1 at 0.55, and 5.03 here.
  bannerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: DS.spacing.sm + 4,
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: DS.semantic.success.solid,
  },
  bannerText: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 2,
    minHeight: 64,
    paddingLeft: 6,
    paddingRight: DS.spacing.md,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surfaceMuted,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
  },
  searchIcon: {
    width: 52,
    height: 52,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primary,
  },
  searchText: {
    flex: 1,
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  recents: {
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    overflow: 'hidden',
  },
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 2,
    minHeight: DS.layout.touchTarget,
    paddingHorizontal: DS.spacing.sm + 4,
  },
  recentDivider: {
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.borderLight,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surfaceMuted,
  },
  recentText: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  modes: { flexDirection: 'row', gap: DS.spacing.sm + 4 },
  mode: {
    flex: 1,
    height: 116,
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: DS.spacing.sm + 2,
    backgroundColor: DS.colors.surfaceMuted,
  },
  // 0.66 gives white 5.75:1 against the brightest frame either photograph can
  // present, which is what the two lines here need.
  modeScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.66)',
  },
  modeIcon: {
    width: 34,
    height: 34,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
  },
  modeLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
  modeCaption: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
    marginTop: 1,
  },

  active: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    backgroundColor: DS.semantic.warning.bg,
    borderRadius: DS.radius.md,
    borderWidth: DS.layout.hairline,
    borderColor: DS.semantic.warning.border,
    padding: DS.spacing.sm + 2,
  },
  activeIcon: {
    width: 28,
    height: 28,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.semantic.warning.solid,
  },
  activeText: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.warning.fg,
  },

  caveat: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  menuMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },

});
