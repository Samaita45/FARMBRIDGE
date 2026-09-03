import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sidebar, type SidebarItem } from '@/components/design-system';
import { FullMap } from '@/components/transport/full-map';
import { TransportLocked } from '@/components/transport/transport-locked';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { DS } from '@/constants/design-system';
import { ScreenImages } from '@/constants/images';
import { whatsAppUrl } from '@/constants/support';
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
      badge: activeTrips.length > 0 ? String(activeTrips.length) : undefined,
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

      <View style={[styles.sheet, { paddingBottom: insets.bottom + DS.spacing.sm }]}>
        <View style={styles.grabber} />

        <ScrollView
          contentContainerStyle={styles.sheetBody}
          showsVerticalScrollIndicator={false}>
          {/* The truck photograph, kept. */}
          <View style={styles.banner}>
            <Image
              source={ScreenImages.transport}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={220}
            />
            <View style={styles.bannerScrim} />
            <Text style={styles.bannerText} numberOfLines={1}>
              {available.length} transporters free now
            </Text>
          </View>

          <View style={styles.modes}>
            <ModeTab
              icon="cube"
              label="Move a load"
              caption={`${available.length} available`}
              active
              onPress={() => router.push(asHref('/(tabs)/transport/request'))}
            />
            <ModeTab
              icon="car-outline"
              label="Offer transport"
              caption="Register a vehicle"
              onPress={() => router.push(asHref('/(tabs)/transport/register'))}
            />
          </View>

          {/* inDrive's one question, and the reason the form is not on this screen. */}
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/request'))}
            accessibilityRole="button"
            accessibilityLabel="Where to, and for how much? Opens the order form."
            style={({ pressed }) => [styles.search, pressed && styles.pressed]}>
            <Ionicons name="search" size={20} color={DS.colors.text} />
            <Text style={styles.searchText}>Where to & for how much?</Text>
          </Pressable>

          {recentDestinations.map((place) => (
            <Pressable
              key={place}
              onPress={() =>
                router.push(
                  asHref({ pathname: '/(tabs)/transport/request', params: { to: place } })
                )
              }
              accessibilityRole="button"
              accessibilityLabel={`Send another load to ${place}`}
              style={({ pressed }) => [styles.recent, pressed && styles.pressedRow]}>
              <Ionicons name="location-outline" size={19} color={DS.colors.textMuted} />
              <Text style={styles.recentText} numberOfLines={1}>
                {place}
              </Text>
            </Pressable>
          ))}

          {activeTrips.length > 0 ? (
            <Pressable
              onPress={() => router.push(asHref('/(tabs)/transport/trips'))}
              accessibilityRole="button"
              accessibilityLabel={`${activeTrips.length} active ${activeTrips.length === 1 ? 'trip' : 'trips'}. Open my trips.`}
              style={({ pressed }) => [styles.active, pressed && styles.pressed]}>
              <Ionicons name="cube" size={17} color={DS.semantic.warning.fg} />
              <Text style={styles.activeText}>
                {activeTrips.length} trip{activeTrips.length === 1 ? '' : 's'} in progress
              </Text>
              <Ionicons name="chevron-forward" size={16} color={DS.semantic.warning.fg} />
            </Pressable>
          ) : null}

          <Text style={styles.caveat}>
            Pins show the town each transporter works from, not where their vehicle is now.
          </Text>
        </ScrollView>
      </View>

      <Sidebar
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
        header={
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/profile'))}
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            style={styles.menuHeader}>
            <ProfileAvatar uri={avatarUri} initials={initials} size={46} embedded showCameraBadge={false} />
            <View style={styles.flex}>
              <Text style={styles.menuName} numberOfLines={1}>
                {user?.name ?? 'Guest'}
              </Text>
              <Text style={styles.menuMeta} numberOfLines={1}>
                {bookings.length} {bookings.length === 1 ? 'trip' : 'trips'} booked
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS.colors.textFaint} />
          </Pressable>
        }
        footer={
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.push(asHref('/(tabs)/transport/register'));
            }}
            accessibilityRole="button"
            accessibilityLabel="Transporter mode: register your vehicle and take jobs"
            style={({ pressed }) => [styles.driverMode, pressed && styles.pressed]}>
            <Ionicons name="car-sport-outline" size={19} color={DS.colors.textInverse} />
            <Text style={styles.driverModeText}>Transporter mode</Text>
          </Pressable>
        }
      />
    </View>
  );
}

function ModeTab({
  icon,
  label,
  caption,
  active,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  caption: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      accessibilityLabel={`${label}. ${caption}`}
      style={({ pressed }) => [styles.mode, active && styles.modeActive, pressed && styles.pressed]}>
      <View style={styles.modeTop}>
        <Ionicons
          name={icon}
          size={20}
          color={active ? DS.colors.primaryDark : DS.colors.textMuted}
        />
        {active ? (
          <Ionicons name="checkmark-circle" size={14} color={DS.colors.primary} />
        ) : null}
      </View>
      <Text style={[styles.modeLabel, active && styles.modeLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.modeCaption} numberOfLines={1}>
        {caption}
      </Text>
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
    // Clears the sheet below.
    paddingBottom: 300,
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

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '62%',
    backgroundColor: DS.colors.surface,
    borderTopLeftRadius: DS.radius.xxl,
    borderTopRightRadius: DS.radius.xxl,
    ...DS.shadow.elevated,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: DS.colors.borderStrong,
    marginTop: DS.spacing.sm,
  },
  sheetBody: {
    padding: DS.spacing.md,
    paddingTop: DS.spacing.sm + 4,
    gap: DS.spacing.sm + 4,
  },

  banner: {
    height: 68,
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
  bannerText: {
    padding: DS.spacing.sm + 2,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },

  modes: { flexDirection: 'row', gap: DS.spacing.sm },
  mode: {
    flex: 1,
    gap: 1,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 2,
  },
  modeActive: { backgroundColor: DS.colors.primaryBg, borderColor: DS.colors.primary },
  modeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modeLabel: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  modeLabelActive: { color: DS.colors.primaryDark },
  modeCaption: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 2,
    minHeight: 56,
    paddingHorizontal: DS.spacing.md,
    borderRadius: DS.radius.lg,
    backgroundColor: DS.colors.surfaceMuted,
  },
  searchText: {
    flex: 1,
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 2,
    minHeight: DS.layout.touchTarget,
    paddingHorizontal: DS.spacing.xs,
    borderRadius: DS.radius.md,
  },
  recentText: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
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

  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 2 },
  menuName: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  menuMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },

  driverMode: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    minHeight: 52,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.primary,
    marginVertical: DS.spacing.sm,
  },
  driverModeText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },
});
