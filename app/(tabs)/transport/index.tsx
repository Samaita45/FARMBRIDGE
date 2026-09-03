import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/design-system';
import { FadeInView } from '@/components/design-system/FadeInView';
import { matchPlace } from '@/components/forms/place-field';
import { NearbyMap } from '@/components/transport/nearby-map';
import { PriceField } from '@/components/transport/price-field';
import { RouteFields } from '@/components/transport/route-fields';
import { TransportLocked } from '@/components/transport/transport-locked';
import { VEHICLE_LABELS, VehicleIcon } from '@/components/transport/vehicle-icon';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { ScreenImages } from '@/constants/images';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { useLocation, type LocationSource } from '@/hooks/useLocation';
import { asHref } from '@/lib/href';
import { estimateDistanceKm, estimatePrice, getBookings } from '@/services/transportDb';
import { selectIsSubscribed, useAuthStore, type AuthState } from '@/stores/authStore';
import { useTransportStore, type TransportState } from '@/stores/transportStore';
import type { TransportBooking } from '@/types/transport';

const LOCATION_CAPTION: Record<LocationSource, string> = {
  gps: 'YOUR LOCATION',
  profile: 'FROM YOUR PROFILE',
  default: 'DEFAULT LOCATION',
};

/**
 * The transport hub, built around inDrive's idea: you say where, you say what
 * you will pay, and then you go and find someone who will take it.
 *
 * WHAT CHANGED. The hub was a banner and three links, and naming a price
 * happened four screens later — after the app had already quoted one at you.
 * Route and price are the first two things now, because they are the two things
 * a farmer standing beside a loaded bakkie already knows.
 *
 * WHERE IT STOPS SHORT OF inDrive, AND WHY. In inDrive the offer goes out and
 * drivers respond inside the app. FarmBridge has no server and no transporter
 * is signed in, so nothing here can receive a reply. Rather than animate offers
 * arriving from people who have never seen the request, the offer travels with
 * you: the next screens rank transporters by how their own published rate
 * compares to your price, so it is clear who is worth calling, and contacting
 * them carries the number.
 *
 * The truck photograph stays where it was, at the top.
 */
export default function TransportHubScreen() {
  const isSubscribed = useAuthStore(selectIsSubscribed);
  const user = useAuthStore((s: AuthState) => s.user);
  const { showToast } = useToast();
  const { location, source, permission, refresh } = useLocation();

  const setRequest = useTransportStore((s: TransportState) => s.setRequest);
  const setOffer = useTransportStore((s: TransportState) => s.setOffer);
  const storedRequest = useTransportStore((s: TransportState) => s.request);
  const storedOffer = useTransportStore((s: TransportState) => s.offeredPriceUSD);

  const [activeTrips, setActiveTrips] = useState<TransportBooking[]>([]);
  const [pickup, setPickup] = useState(storedRequest?.pickup ?? location.label);
  const [destination, setDestination] = useState(storedRequest?.destination ?? '');
  const [price, setPrice] = useState<number | null>(storedOffer);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  const loadTrips = useCallback(async () => {
    const trips = await getBookings(user?.id ?? 'guest');
    setActiveTrips(trips.filter((t) => ['pending', 'confirmed', 'in_transit'].includes(t.status)));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (isSubscribed) void loadTrips();
    }, [isSubscribed, loadTrips])
  );

  const available = useMemo(() => TRANSPORT_PROVIDERS.filter((t) => t.isAvailable), []);
  const distanceKm = useMemo(
    () => estimateDistanceKm(pickup, destination),
    [pickup, destination]
  );

  /*
    The mean of what the available transporters would charge for this distance
    at their own published rates. Arithmetic on numbers already in the app, not
    a figure tuned to move the offer one way or the other.
  */
  const suggested = useMemo(() => {
    if (distanceKm === null || available.length === 0) return null;
    const total = available.reduce((sum, p) => sum + estimatePrice(p, distanceKm), 0);
    return Math.round(total / available.length);
  }, [distanceKm, available]);

  if (!isSubscribed) return <TransportLocked />;

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const errors = {
    pickup: !pickup.trim()
      ? 'Where is the load now?'
      : !matchPlace(pickup)
        ? 'Include a town we know'
        : undefined,
    destination: !destination.trim()
      ? 'Where is it going?'
      : !matchPlace(destination)
        ? 'Include a town we know'
        : undefined,
    price: price !== null && price > 0 ? undefined : 'Name a price',
  };
  const valid = Object.values(errors).every((e) => !e);

  const findTransporters = () => {
    setTouched(true);
    if (!valid || distanceKm === null || price === null) {
      showToast('Fill in the route and your price', 'warning');
      return;
    }

    // Carries what has been entered so far; the load details are still asked
    // for on the next screen, and nothing gets typed twice.
    setRequest(
      {
        pickup: pickup.trim(),
        destination: destination.trim(),
        goodsDescription: storedRequest?.goodsDescription ?? '',
        weightKg: storedRequest?.weightKg ?? 500,
        category: storedRequest?.category ?? 'Fresh Produce',
        preferredDate: storedRequest?.preferredDate ?? new Date().toISOString().slice(0, 10),
        preferredTime: storedRequest?.preferredTime ?? '08:00',
        loads: storedRequest?.loads ?? 1,
        specialRequirements: storedRequest?.specialRequirements ?? [],
      },
      distanceKm
    );
    setOffer(price, note.trim());
    router.push(asHref('/(tabs)/transport/request'));
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.locationRow}>
            <Pressable
              onPress={() => void refresh()}
              accessibilityRole="button"
              accessibilityLabel={`${LOCATION_CAPTION[source]}: ${location.label}. Tap to locate again.`}
              style={styles.locationPress}>
              <View style={styles.locationIcon}>
                <Ionicons
                  name={source === 'gps' ? 'location' : 'location-outline'}
                  size={16}
                  color={DS.colors.primary}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.locationLabel}>
                  {LOCATION_CAPTION[source]}
                  {permission === 'denied' && source !== 'gps' ? ' · no permission' : ''}
                </Text>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {location.label}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push(asHref('/(tabs)/transport/trips'))}
              accessibilityRole="button"
              accessibilityLabel={
                activeTrips.length > 0 ? `My trips, ${activeTrips.length} active` : 'My trips'
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

          {/* The truck photograph, kept where it was. */}
          <FadeInView delay={0}>
            <View style={styles.banner}>
              <Image
                source={ScreenImages.transport}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={220}
              />
              <View style={styles.bannerScrim} />
              <View style={styles.bannerBody}>
                <Text style={styles.bannerTitle} numberOfLines={2}>
                  Hi {firstName}, moving a harvest?
                </Text>
                <Text style={styles.bannerSub}>Set your route and name your price.</Text>
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={1}>
            <View style={styles.composer}>
              <RouteFields
                pickup={pickup}
                destination={destination}
                onPickupChange={setPickup}
                onDestinationChange={setDestination}
                pickupError={touched ? errors.pickup : undefined}
                destinationError={touched ? errors.destination : undefined}
              />

              {distanceKm !== null ? (
                <View style={styles.distance}>
                  <Ionicons name="navigate-outline" size={15} color={DS.colors.primary} />
                  <Text style={styles.distanceText}>
                    About {distanceKm} km by road — an estimate between town centres.
                  </Text>
                </View>
              ) : null}

              <View style={styles.divider} />

              <PriceField
                value={price}
                onChange={setPrice}
                suggested={suggested}
                error={touched ? errors.price : undefined}
              />

              <View>
                <Text style={styles.noteLabel}>Anything they should know</Text>
                <TextInput
                  style={styles.note}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Loading at the gate, needs a tarpaulin, ready from 7am…"
                  placeholderTextColor={DS.colors.textMuted}
                  multiline
                  maxLength={200}
                  accessibilityLabel="A note for the transporter"
                  maxFontSizeMultiplier={DS.layout.maxFontScale}
                />
              </View>

              <Button title="Find transporters" size="lg" onPress={findTransporters} />
            </View>
          </FadeInView>

          <FadeInView delay={2}>
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Who is around</Text>
                <Text style={styles.sectionCount}>{available.length} free now</Text>
              </View>
              <NearbyMap centre={location} providers={available} />
            </View>
          </FadeInView>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Transporters nearby</Text>
            <Pressable
              onPress={() => router.push(asHref('/(tabs)/transport/register'))}
              accessibilityRole="button"
              accessibilityLabel="Offer transport with your own vehicle"
              hitSlop={8}>
              <Text style={styles.link}>Offer transport</Text>
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
                <Text style={styles.providerMeta} numberOfLines={1}>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  flex: { flex: 1 },
  pressedRow: { backgroundColor: DS.colors.surfaceMuted },

  body: {
    padding: DS.spacing.md,
    paddingBottom: DS.spacing.xl,
    gap: DS.spacing.md,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  locationPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 2,
  },
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
    height: 132,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: DS.colors.surfaceMuted,
  },
  bannerScrim: {
    ...StyleSheet.absoluteFillObject,
    top: '30%',
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
  },
  bannerBody: { padding: DS.spacing.md, gap: 2 },
  bannerTitle: {
    fontSize: DS.typography.h2.fontSize,
    lineHeight: DS.typography.h2.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.textInverse,
  },
  bannerSub: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
  },

  composer: {
    gap: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.xl,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.md,
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.md,
    paddingHorizontal: DS.spacing.sm + 4,
    paddingVertical: DS.spacing.sm,
  },
  distanceText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.primaryDark,
  },
  divider: { height: DS.layout.hairline, backgroundColor: DS.colors.borderLight },

  noteLabel: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: 8,
  },
  note: {
    minHeight: 76,
    textAlignVertical: 'top',
    borderRadius: DS.radius.md,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.borderControl,
    padding: DS.spacing.sm + 4,
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },

  section: { gap: DS.spacing.sm },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
  },
  sectionCount: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
    marginTop: DS.spacing.xs,
  },
  sectionTitle: {
    flexShrink: 1,
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
