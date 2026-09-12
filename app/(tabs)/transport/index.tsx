import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Sidebar, type SidebarItem } from '@/components/design-system';
import { LocationSearchField } from '@/components/maps/location-search-field';
import { BottomPanel } from '@/components/transport/bottom-panel';
import { FullMap } from '@/components/transport/full-map';
import { VehicleIcon } from '@/components/transport/vehicle-icon';
import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { DS } from '@/constants/design-system';
import { ScreenImages } from '@/constants/images';
import { SOCIAL_LINKS, whatsAppUrl } from '@/constants/support';
import { distanceKmBetween, nearestPlace, PLACES } from '@/constants/zimbabwe-data/places';
import { useLocation } from '@/hooks/useLocation';
import { useProfileAvatar } from '@/hooks/useProfileAvatar';
import { asHref } from '@/lib/href';
import { topChrome } from '@/lib/platform-ui';
import { getBookings } from '@/services/transportDb';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import type { TransportBooking } from '@/types/transport';

const MENU_SIZE = 48;

type HubMode = 'haul' | 'offer';

function openRequest(to?: string) {
  if (to) {
    router.push(asHref({ pathname: '/(tabs)/transport/request', params: { to } }));
    return;
  }
  router.push(asHref('/(tabs)/transport/request'));
}

/**
 * Transport home, laid out as the inDrive reference: a map, a short sheet, a
 * pill that asks where, and recents as a pin beside a name.
 *
 * The Scania photograph is the Haul chip's vehicle — the same job the car
 * illustration does on Ride — not a banner. A banner stole the map, which is
 * the point of this screen.
 */
export default function TransportHubScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s: AuthState) => s.user);
  const { location, refresh, loading: locating, permission } = useLocation();
  const { avatarUri, initials } = useProfileAvatar();

  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const [sceneHeight, setSceneHeight] = useState(0);
  const [mode, setMode] = useState<HubMode>('haul');
  const [destination, setDestination] = useState('');

  const mapState = locating
    ? 'loading'
    : permission === 'denied' || permission === 'unavailable'
      ? 'unavailable'
      : 'ready';

  const top = topChrome(insets.top);

  const loadTrips = useCallback(async () => {
    setBookings(await getBookings(user?.id ?? 'guest'));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadTrips();
    }, [loadTrips])
  );

  const shortcuts = useMemo(() => {
    const seen: string[] = [];
    for (const b of bookings) {
      if (b.destination && !seen.includes(b.destination)) seen.push(b.destination);
      if (seen.length === 2) break;
    }
    if (seen.length >= 2) return seen;

    const here = nearestPlace(location).place.name;
    const nearby = [...PLACES]
      .filter((p) => p.name !== here && !seen.includes(p.name))
      .sort(
        (a, b) =>
          distanceKmBetween(location, a) - distanceKmBetween(location, b)
      );
    for (const p of nearby) {
      seen.push(p.name);
      if (seen.length === 2) break;
    }
    return seen;
  }, [bookings, location]);

  const menuItems: SidebarItem[] = [
    {
      key: 'haul',
      label: 'Request a truck',
      icon: 'navigate-outline',
      onPress: () => openRequest(),
    },
    {
      key: 'history',
      label: 'Request history',
      icon: 'time-outline',
      onPress: () => router.push(asHref('/(tabs)/transport/trips')),
    },
    {
      key: 'transporters',
      label: 'Transporters',
      icon: 'car-outline',
      onPress: () => router.push(asHref('/(tabs)/transport/providers')),
    },
    {
      key: 'loads',
      label: 'Loads near you',
      icon: 'cube-outline',
      onPress: () => router.push(asHref('/(tabs)/transport/jobs')),
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
      key: 'help',
      label: 'Help',
      icon: 'information-circle-outline',
      onPress: () =>
        void Linking.openURL(whatsAppUrl('Hi, I need help with FarmBridge transport.')),
    },
  ];

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const next = e.nativeEvent.layout.height;
        if (Math.abs(next - sceneHeight) > 1) setSceneHeight(next);
      }}>
      <View style={styles.mapBox}>
        <FullMap centre={location} focusKey={focusKey} state={mapState} />

        <View
          style={[styles.mapChrome, { paddingTop: top + DS.spacing.sm }]}
          pointerEvents="box-none">
          <Pressable
            onPress={() => setMenuOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open the transport menu"
            style={({ pressed }) => [styles.circle, pressed && styles.pressed]}>
            <Ionicons name="menu" size={22} color={DS.colors.text} />
          </Pressable>
        </View>

        <View style={styles.calloutWrap} pointerEvents="none">
          <View style={styles.callout}>
            <Text style={styles.calloutCaption}>Pickup point</Text>
            <Text style={styles.calloutPlace} numberOfLines={1}>
              {location.label}
            </Text>
          </View>
          <View style={styles.calloutArrow} />
        </View>

        <Pressable
          onPress={() => {
            setFocusKey((k) => k + 1);
            void refresh();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Centre the map on my location"
          style={({ pressed }) => [styles.circle, styles.recentre, pressed && styles.pressed]}>
          <Ionicons name="navigate" size={18} color={DS.colors.text} />
        </Pressable>
      </View>

      <BottomPanel
        peekRatio={0.34}
        maxRatio={0.62}
        sceneHeight={sceneHeight}
        reserveTop={top + MENU_SIZE + 80}
        paddingBottom={DS.spacing.sm}>
        <View style={styles.modes}>
          <Pressable
            onPress={() => setMode('haul')}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'haul' }}
            accessibilityLabel="Haul"
            style={({ pressed }) => [
              styles.mode,
              mode === 'haul' && styles.modeOn,
              pressed && styles.pressed,
            ]}>
            <Image
              source={ScreenImages.transport}
              style={styles.modePhoto}
              contentFit="cover"
              accessibilityElementsHidden
            />
            <Text style={[styles.modeLabel, mode === 'haul' && styles.modeLabelOn]}>Haul</Text>
          </Pressable>

          <Pressable
            onPress={() => setMode('offer')}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'offer' }}
            accessibilityLabel="Offer"
            style={({ pressed }) => [
              styles.mode,
              mode === 'offer' && styles.modeOn,
              pressed && styles.pressed,
            ]}>
            <View style={styles.modeGlyph}>
              <VehicleIcon type="truck" size={28} color={DS.colors.text} />
            </View>
            <Text style={[styles.modeLabel, mode === 'offer' && styles.modeLabelOn]}>Offer</Text>
          </Pressable>
        </View>

        {mode === 'haul' ? (
          <View>
            <LocationSearchField
              label="Where to?"
              value={destination}
              onChangeText={setDestination}
              role="destination"
              placeholder="Town, market, or farm"
            />
            {destination.trim() ? (
              <Button
                title="Request this trip"
                size="sm"
                onPress={() => openRequest(destination.trim())}
                accessibilityLabel="Open the transport order for this destination"
                style={styles.requestBtn}
              />
            ) : null}
          </View>
        ) : (
          <View>
            {/*
              A transporter opens this app to find work, not to fill in a form.
              Registering the vehicle is a one-off and sits below as the outline;
              the loads are the reason they came.
            */}
            <Pressable
              onPress={() => router.push(asHref('/(tabs)/transport/jobs'))}
              accessibilityRole="button"
              accessibilityLabel="Find loads near you"
              style={({ pressed }) => [styles.search, pressed && styles.searchPressed]}>
              <Ionicons name="search" size={22} color={DS.colors.text} />
              <Text style={styles.searchText}>Find loads near you</Text>
            </Pressable>
            <Button
              title="Offer a vehicle"
              variant="outline"
              size="sm"
              onPress={() => router.push(asHref('/(tabs)/transport/register'))}
              accessibilityLabel="Register a vehicle to carry loads"
              style={styles.requestBtn}
            />
          </View>
        )}

        {/*
          Towns you have sent loads to. They were shown in Offer mode too, where
          tapping "Gweru" opened the vehicle registration form instead — a row
          that named one thing and did another.
        */}
        {mode === 'haul' ? (
          <View style={styles.recents}>
            {shortcuts.map((place, i) => (
              <Pressable
                key={place}
                onPress={() => openRequest(place)}
                accessibilityRole="button"
                accessibilityLabel={`Send a load to ${place}`}
                style={({ pressed }) => [
                  styles.recent,
                  i > 0 && styles.recentDivider,
                  pressed && styles.pressedRow,
                ]}>
                <Ionicons name="location-outline" size={20} color={DS.colors.textSoft} />
                <Text style={styles.recentText} numberOfLines={1}>
                  {place}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
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
          meta: (
            <Text style={styles.menuMeta}>
              {bookings.length} {bookings.length === 1 ? 'trip' : 'trips'}
            </Text>
          ),
          onPress: () => router.push(asHref('/(tabs)/profile')),
        }}
        primaryAction={{
          label: 'Transporter mode',
          icon: 'car-outline',
          onPress: () => router.push(asHref('/(tabs)/transport/register')),
        }}
        links={SOCIAL_LINKS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.surfaceMuted },
  pressed: { opacity: 0.85 },
  pressedRow: { backgroundColor: DS.colors.surfaceMuted },

  mapBox: { flex: 1, minHeight: 220, backgroundColor: DS.colors.surfaceMuted },
  mapChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: DS.spacing.md,
  },
  circle: {
    width: MENU_SIZE,
    height: MENU_SIZE,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
    ...DS.shadow.elevated,
  },
  recentre: {
    position: 'absolute',
    right: DS.spacing.md,
    bottom: DS.spacing.md,
  },

  calloutWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '36%',
    alignItems: 'center',
  },
  callout: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: '70%',
    ...DS.shadow.card,
  },
  calloutCaption: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  calloutPlace: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  calloutArrow: {
    width: 10,
    height: 10,
    marginTop: -5,
    backgroundColor: DS.colors.surface,
    transform: [{ rotate: '45deg' }],
  },

  modes: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: DS.spacing.sm + 4,
  },
  mode: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: DS.spacing.sm + 2,
    borderRadius: DS.radius.lg,
    // The idle chip still has an edge, so the pair reads as two options rather
    // than one button beside a label.
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  /*
    THE HIGHLIGHT HAS TO BE VISIBLE. This was `primaryBg`, which measures
    1.10:1 against the sheet behind it — a tint that is technically present and
    practically invisible, which is why the selected mode did not read. The
    fill moves to primaryMid and takes a border in the brand green at 7.68:1
    against the surface, so the edge carries the state even where the fill
    cannot. The label bolds and darkens as well: three cues, only one of them a
    fill.
  */
  modeOn: {
    backgroundColor: DS.colors.primaryMid,
    borderColor: DS.colors.primary,
  },
  modePhoto: {
    width: 56,
    height: 36,
    borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.surfaceMuted,
  },
  modeGlyph: {
    width: 56,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  modeLabelOn: { fontFamily: DS.fontFamily.bold, color: DS.colors.primaryDark },

  /*
    Fully round, as the reference has it. The hairline is what makes it read as
    a box you can type in rather than a grey band across the sheet — the fill
    alone is 1.10:1 against the panel.
  */
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 22,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surfaceMuted,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
  },
  requestBtn: { marginTop: DS.spacing.sm },
  searchPressed: { backgroundColor: DS.colors.primaryMid },
  searchText: {
    flex: 1,
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },

  recents: {},
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
    minHeight: 52,
    paddingHorizontal: 6,
  },
  // A rule between rows rather than a gap: the reference's list is continuous.
  recentDivider: {
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.borderLight,
  },
  recentText: {
    flex: 1,
    fontSize: DS.typography.body.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  menuMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
