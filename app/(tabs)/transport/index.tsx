import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NearbyMap } from '@/components/transport/nearby-map';
import { TransportLocked } from '@/components/transport/transport-locked';
import { VEHICLE_LABELS, VehicleIcon } from '@/components/transport/vehicle-icon';
import { DS } from '@/constants/design-system';
import { ScreenImages } from '@/constants/images';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { useLocation } from '@/hooks/useLocation';
import { asHref } from '@/lib/href';
import { getBookings } from '@/services/transportDb';
import { selectIsSubscribed, useAuthStore, type AuthState } from '@/stores/authStore';
import type { IconName } from '@/types/icons';
import type { TransportBooking } from '@/types/transport';

/**
 * The transport hub, laid out to the reference: where you are, the banner, a
 * map of who is around, then the two things you can do here.
 *
 * It replaces three identical chevron rows that gave no sense of whether
 * anyone was actually available before you filled in a form.
 */
export default function TransportHubScreen() {
  const isSubscribed = useAuthStore(selectIsSubscribed);
  const user = useAuthStore((s: AuthState) => s.user);
  const { location } = useLocation();
  const [activeTrips, setActiveTrips] = useState<TransportBooking[]>([]);

  const loadTrips = useCallback(async () => {
    const trips = await getBookings(user?.id ?? 'guest');
    setActiveTrips(trips.filter((t) => ['pending', 'confirmed', 'in_transit'].includes(t.status)));
  }, [user?.id]);

  // Refreshes on focus, so returning from a booking shows it straight away.
  useFocusEffect(
    useCallback(() => {
      if (isSubscribed) void loadTrips();
    }, [isSubscribed, loadTrips])
  );

  if (!isSubscribed) return <TransportLocked />;

  const available = TRANSPORT_PROVIDERS.filter((t) => t.isAvailable);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.locationRow}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={16} color={DS.colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.locationLabel}>Your location</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              {location.label}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/trips'))}
            accessibilityRole="button"
            accessibilityLabel={
              activeTrips.length > 0
                ? `My trips, ${activeTrips.length} active`
                : 'My trips'
            }
            style={styles.tripsBtn}>
            <Ionicons name="cube-outline" size={20} color={DS.colors.text} />
            {activeTrips.length > 0 ? (
              <View style={styles.tripsBadge}>
                <Text style={styles.tripsBadgeText}>
                  {activeTrips.length > 9 ? '9+' : activeTrips.length}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push(asHref('/(tabs)/transport/request'))}
          accessibilityRole="button"
          accessibilityLabel="Find transport for a load"
          style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
          <Image
            source={ScreenImages.transport}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={220}
          />
          {/* Bottom-weighted scrim: the photograph stays clear, the words stay legible. */}
          <View style={styles.bannerScrim} />
          <View style={styles.bannerBody}>
            <Text style={styles.bannerTitle}>Got a harvest to move?</Text>
            <Text style={styles.bannerSub}>
              Tell us the load and the route, and see what it costs.
            </Text>
            <View style={styles.bannerCta}>
              <Text style={styles.bannerCtaText}>Find transport</Text>
              <Ionicons name="arrow-forward" size={14} color={DS.colors.textInverse} />
            </View>
          </View>
        </Pressable>

        <NearbyMap centre={location} providers={available} />

        <View style={styles.panel}>
          <Text style={styles.panelGreeting}>Hi {firstName},</Text>
          <Text style={styles.panelQuestion}>where are you moving goods?</Text>

          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/request'))}
            accessibilityRole="button"
            accessibilityLabel="Enter pickup and destination"
            style={styles.fakeField}>
            <Ionicons name="search" size={17} color={DS.colors.textSoft} />
            <Text style={styles.fakeFieldText}>Pickup and destination</Text>
          </Pressable>

          <View style={styles.modes}>
            <ModeCard
              icon="cube-outline"
              title="Find transport"
              subtitle="Get quotes for a load"
              onPress={() => router.push(asHref('/(tabs)/transport/request'))}
            />
            <ModeCard
              icon="car-outline"
              title="Offer transport"
              subtitle="Register your vehicle"
              onPress={() => router.push(asHref('/(tabs)/transport/register'))}
            />
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Transporters nearby</Text>
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/transport/providers'))}
            accessibilityRole="button"
            accessibilityLabel="See all transporters"
            hitSlop={8}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>

        {available.slice(0, 4).map((provider) => (
          <Pressable
            key={provider.id}
            onPress={() => router.push(asHref('/(tabs)/transport/providers'))}
            accessibilityRole="button"
            accessibilityLabel={`${provider.name}, ${VEHICLE_LABELS[provider.vehicleType]}, ${provider.capacity} tonnes, $${provider.pricePerKm} per kilometre. Available.`}
            style={({ pressed }) => [styles.provider, pressed && styles.pressedRow]}>
            <View style={styles.providerAvatar}>
              <VehicleIcon type={provider.vehicleType} size={20} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.providerName} numberOfLines={1}>
                {provider.name}
              </Text>
              <Text style={styles.providerMeta}>
                {VEHICLE_LABELS[provider.vehicleType]} · {provider.capacity}t · {provider.location}
              </Text>
            </View>
            <View style={styles.providerRight}>
              <Text style={styles.providerRate}>${provider.pricePerKm}/km</Text>
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>Available</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [styles.mode, pressed && styles.pressed]}>
      <View style={styles.modeIcon}>
        <Ionicons name={icon} size={22} color={DS.colors.primary} />
      </View>
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeSub} numberOfLines={2}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.92 },
  pressedRow: { backgroundColor: DS.colors.surfaceMuted },

  body: {
    padding: DS.spacing.md,
    paddingBottom: DS.spacing.xl,
    gap: DS.spacing.md,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 2 },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primaryBg,
  },
  locationLabel: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  locationValue: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  tripsBtn: {
    width: 42,
    height: 42,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
  },
  tripsBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    minWidth: 18,
    height: 18,
    borderRadius: DS.radius.full,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.semantic.danger.solid,
    borderWidth: 2,
    borderColor: DS.colors.background,
  },
  tripsBadgeText: {
    fontSize: 9,
    fontFamily: DS.fontFamily.bold,
    color: DS.semantic.danger.onSolid,
  },

  banner: {
    height: 168,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: DS.colors.surfaceMuted,
  },
  bannerScrim: {
    ...StyleSheet.absoluteFillObject,
    top: '30%',
    // 0.68, not 0.62: against a blown-out sky the lighter scrim left the
    // subtitle at 4.33:1. The photograph above the band stays untouched.
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
  },
  bannerBody: { padding: DS.spacing.md, gap: 4 },
  bannerTitle: {
    fontSize: DS.typography.h2.fontSize,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.textInverse,
  },
  bannerSub: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    // Full white, distinguished from the title by size rather than by opacity —
    // dimming it is what put it under the contrast floor.
    color: DS.colors.textInverse,
  },
  bannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: DS.spacing.sm,
    backgroundColor: DS.colors.primary,
    borderRadius: DS.radius.full,
    paddingHorizontal: 16,
    height: 38,
  },
  bannerCtaText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },

  panel: {
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.xl,
    padding: DS.spacing.md,
    gap: 2,
  },
  panelGreeting: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primaryDark,
  },
  panelQuestion: {
    fontSize: DS.typography.h2.fontSize,
    lineHeight: DS.typography.h2.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  fakeField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    marginTop: DS.spacing.sm + 4,
    minHeight: DS.layout.touchTarget,
    paddingHorizontal: 14,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surface,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.borderControl,
  },
  fakeFieldText: {
    flex: 1,
    fontSize: DS.typography.body.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  modes: { flexDirection: 'row', gap: DS.spacing.sm + 4, marginTop: DS.spacing.sm + 4 },
  mode: {
    flex: 1,
    gap: 3,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 4,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primaryBg,
    marginBottom: 6,
  },
  modeTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  modeSub: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: DS.spacing.xs,
  },
  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  link: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
    paddingVertical: 6,
  },

  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 4,
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  providerMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
  providerRight: { alignItems: 'flex-end', gap: 4 },
  providerRate: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DS.semantic.success.solid,
  },
  availableText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.success.fg,
  },
});
