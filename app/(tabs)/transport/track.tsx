import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, LoadingState, SlideToAct, Toggle } from '@/components/design-system';
import { FarmMap, type FarmMapMarker } from '@/components/maps/farm-map';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { useBookingSubscription, useRealtimeEvent, useRealtimeStatus } from '@/hooks/useRealtime';
import { openExternalNavigation } from '@/lib/external-maps';
import { IS_API_ENABLED } from '@/services/api/config';
import {
  isBackgroundSharing,
  startBackgroundSharing,
  stopBackgroundSharing,
} from '@/services/backgroundLocation';
import { transportApi, type TransportBookingDto } from '@/services/api/transport.api';
import type { GeoPoint } from '@/types/geo';
import type { TransportLifecycleStatus } from '@/types/transport';

/**
 * What a driver can do next, and what it is called on the button.
 *
 * This mirrors the server's own transition table. It is duplicated rather than
 * fetched because the server rejects anything it disagrees with — the app is
 * offering the next step, not deciding it — and a step missing here shows no
 * button rather than one that fails.
 */
const NEXT_STEP: Partial<
  Record<TransportLifecycleStatus, { to: TransportLifecycleStatus; label: string }>
> = {
  DRIVER_ASSIGNED: { to: 'GOODS_COLLECTED', label: 'Slide when the goods are loaded' },
  GOODS_COLLECTED: { to: 'IN_TRANSIT', label: 'Slide when you set off' },
  IN_TRANSIT: { to: 'DELIVERED', label: 'Slide when you have delivered' },
};

/** Above the server's 5s floor by a wide margin, and kind to a phone battery. */
const PUBLISH_EVERY_MS = 15_000;
const PUBLISH_EVERY_M = 100;

/** Past this, "live" is a lie and the screen says so instead. */
const STALE_AFTER_MS = 90_000;

/**
 * Following a load, or being followed.
 *
 * ONE SCREEN, TWO JOBS, AND THE SERVER DECIDES WHICH. A transporter publishes
 * their position here; a customer watches it arrive. Which one you get comes
 * from `booking.viewer`, computed on the server — the app's own user model has
 * no transporter role, and deciding it on the device would mean shipping both
 * parties' ids to both parties to answer a question the server already knows.
 *
 * TWO LEVELS OF SHARING, AND THE DRIVER PICKS. With the screen open, positions
 * go out every fifteen seconds; that needs no special permission and starts by
 * itself. Sharing with the screen off is a toggle, off by default, and asks for
 * the "Always" permission at the moment it is turned on rather than at startup
 * — a dialog that arrives with a reason attached is one people say yes to, and
 * both stores expect it that way round. Either way it stops at delivery.
 *
 * A POSITION HAS AN AGE. A map pin with no timestamp is the most confident
 * possible way to show something an hour out of date. If nothing has arrived
 * for ninety seconds the screen stops claiming to be live and says when the
 * last fix came in.
 */
export default function TrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const realtime = useRealtimeStatus();
  const { showToast } = useToast();

  const [booking, setBooking] = useState<TransportBookingDto | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [driver, setDriver] = useState<GeoPoint | null>(null);
  const [driverAt, setDriverAt] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  /*
    A ticking clock, so "updated 2 min ago" ages on screen.

    Reading Date.now() during render is impure — the React Compiler rejects it —
    but the reason to keep a clock in state is simpler than the rule: without
    something to re-render on, a position that went stale while the farmer was
    watching would carry on saying "just now" until an unrelated event happened
    to repaint the screen.
  */
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  useBookingSubscription(id ?? null);

  useEffect(() => {
    if (!id || !IS_API_ENABLED) return;
    let cancelled = false;
    void transportApi.activeBookings().then((rows) => {
      if (cancelled) return;
      setBooking(rows.find((b) => b.id === id) ?? null);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loading = IS_API_ENABLED && !!id && !loaded;
  const isDriver = booking?.viewer === 'transporter';
  /*
    A finished trip stops broadcasting.

    The server would refuse the post anyway — location is only accepted on an
    active booking — but a watcher left running after delivery keeps waking the
    GPS to be told no, and keeps the screen saying the farmer can see where you
    are when they no longer can or should.
  */
  const publishable =
    isDriver && booking?.status !== 'DELIVERED' && booking?.status !== 'CANCELLED';

  /*
    Sharing with the screen off.

    Off by default and asked for only here, on a trip that is already running:
    the "Always" location dialog is refused far more often when it arrives
    without a reason attached, and both stores expect the request to come from
    the feature that needs it rather than from startup.
  */
  const [background, setBackground] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isBackgroundSharing().then((on) => {
      if (!cancelled) setBackground(on);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleBackground = async (next: boolean) => {
    if (!id) return;
    setSwitching(true);
    try {
      if (!next) {
        await stopBackgroundSharing();
        setBackground(false);
        return;
      }
      const result = await startBackgroundSharing(id);
      setBackground(result.ok);
      if (!result.ok) {
        showToast(
          result.reason === 'permission'
            ? 'Allow location "all the time" in Settings to keep sharing with the screen off.'
            : 'Background sharing could not start on this device.',
          'error'
        );
      }
    } finally {
      setSwitching(false);
    }
  };

  /*
    A finished trip must not keep a foreground service alive. The server would
    refuse the uploads, but Android would go on showing a notification claiming
    the customer can see this driver — long after the load was delivered.
  */
  useEffect(() => {
    if (publishable) return;
    void stopBackgroundSharing().then(() => setBackground(false));
  }, [publishable]);

  // The customer's side: positions arrive on the booking's room.
  useRealtimeEvent('transport:driver:location', (payload) => {
    if (!id || payload.bookingId !== id) return;
    setDriver({ latitude: payload.latitude, longitude: payload.longitude });
    setDriverAt(payload.at);
  });

  // A status change can end the trip out from under this screen.
  useRealtimeEvent('transport:status:updated', (payload) => {
    if (!id || payload.bookingId !== id) return;
    setBooking((prev) => (prev ? { ...prev, status: payload.status } : prev));
  });

  /*
    Advancing the trip.

    This is the last transport endpoint the app never called: a driver carrying
    a FarmBridge booking had no way to say they had collected the goods, so the
    farmer watching this trip saw the status it was accepted at until delivery.

    The server is the authority on whether a transition is allowed — it refuses
    a repeat and it refuses running backwards — so a rejection is reported as
    the trip having moved on rather than swallowed.
  */
  const [advancing, setAdvancing] = useState(false);

  const advance = async (to: TransportLifecycleStatus) => {
    if (!id) return;
    setAdvancing(true);
    try {
      const updated = await transportApi.updateStatus(id, to);
      if (!updated) throw new Error('refused');
      setBooking(updated);
      showToast(
        to === 'DELIVERED' ? 'Delivered — thank you' : `Marked ${label(to)}`,
        'success'
      );
    } catch {
      showToast('That could not be recorded. Check the trip has not already moved on.', 'error');
    } finally {
      setAdvancing(false);
    }
  };

  /*
    The driver's side.

    `watchPositionAsync` is given the distance and time filters rather than
    throttling in the handler, so the OS decides when to wake us — the cheapest
    place for that decision to be made. Foreground permission only: this stops
    when the app is backgrounded, which is exactly what the copy below promises.
  */
  const subscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!id || !publishable) return;
    let cancelled = false;

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setPublishError('Location permission is off, so the farmer cannot see where you are.');
        return;
      }
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: PUBLISH_EVERY_MS,
          distanceInterval: PUBLISH_EVERY_M,
        },
        (fix) => {
          void transportApi
            .updateDriverLocation(id, fix.coords.latitude, fix.coords.longitude)
            .then(() => {
              setPublishError(null);
              setDriver({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
              setDriverAt(Date.now());
            })
            .catch(() => {
              // One failed post is not worth a banner — the next fix retries.
            });
        }
      );
      if (cancelled) {
        sub.remove();
        return;
      }
      subscription.current = sub;
      setPublishing(true);
    };

    void start();

    // Stop while backgrounded. A watcher the OS has suspended reports nothing,
    // and leaving it armed would let the screen claim to be sharing when it is
    // not.
    const appState = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        subscription.current?.remove();
        subscription.current = null;
        setPublishing(false);
      } else if (!subscription.current) {
        void start();
      }
    });

    return () => {
      cancelled = true;
      appState.remove();
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [id, publishable]);

  if (!IS_API_ENABLED) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centre}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Tracking needs a connection"
            description="A position has to travel between two phones, so this screen needs the FarmBridge server."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingState title="Loading the trip" />;

  if (!booking) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centre}>
          <EmptyState
            icon="checkmark-done-outline"
            title="This trip is not active"
            description="Tracking runs from acceptance until delivery. Finished trips are under My trips."
          />
        </View>
      </SafeAreaView>
    );
  }

  const stale = driverAt != null && now - driverAt > STALE_AFTER_MS;
  const step = NEXT_STEP[booking.status];
  const next = step?.to;
  const markers: FarmMapMarker[] = [
    {
      id: 'pickup',
      kind: 'pickup',
      latitude: booking.pickupLat,
      longitude: booking.pickupLng,
      title: 'Pickup',
      description: booking.pickupAddress,
    },
    {
      id: 'destination',
      kind: 'destination',
      latitude: booking.destinationLat,
      longitude: booking.destinationLng,
      title: 'Destination',
      description: booking.destinationAddress,
    },
  ];
  if (driver) {
    markers.push({
      id: 'driver',
      kind: 'transporter',
      latitude: driver.latitude,
      longitude: driver.longitude,
      title: isDriver ? 'You' : 'The truck',
    });
  }

  const centre = driver ?? { latitude: booking.pickupLat, longitude: booking.pickupLng };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.mapBox}>
        <FarmMap
          centre={centre}
          markers={markers}
          showsUserLocation={isDriver}
          accessibilityLabel={`Map of the trip from ${booking.pickupAddress} to ${booking.destinationAddress}`}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.headRow}>
          <Text style={styles.route} numberOfLines={1}>
            {booking.pickupAddress} → {booking.destinationAddress}
          </Text>
          <Badge label={label(booking.status)} tone="info" />
        </View>

        <Text style={styles.meta}>
          ${(booking.agreedPriceUsdCents / 100).toFixed(2)} ·{' '}
          {Math.round(booking.distanceMeters / 1000)} km
        </Text>

        {isDriver ? (
          <View style={styles.note}>
            <Ionicons
              name={publishing ? 'radio-outline' : 'pause-circle-outline'}
              size={16}
              color={publishing ? DS.semantic.success.fg : DS.colors.textSoft}
            />
            <Text style={styles.noteText}>
              {publishError
                ? publishError
                : background
                  ? 'The farmer can see where you are, and will keep seeing it with your screen off.'
                  : publishing
                    ? 'The farmer can see where you are while this screen is open.'
                    : 'Sharing is paused. Open this screen to let the farmer see where you are.'}
            </Text>
          </View>
        ) : (
          <View style={styles.note}>
            <Ionicons
              name={driver && !stale ? 'navigate-circle-outline' : 'time-outline'}
              size={16}
              color={driver && !stale ? DS.semantic.success.fg : DS.colors.textSoft}
            />
            <Text style={styles.noteText}>
              {!driver
                ? 'Waiting for the transporter. Their position appears once they open their trip.'
                : stale
                  ? `Last seen ${describeAge(driverAt, now)}. The transporter may have closed the app.`
                  : `Updated ${describeAge(driverAt, now)}.`}
            </Text>
          </View>
        )}

        {realtime !== 'connected' ? (
          <Text style={styles.offline}>
            Not connected — positions will not arrive until the connection returns.
          </Text>
        ) : null}

        {isDriver && publishable ? (
          <Toggle
            value={background}
            onValueChange={(next) => void toggleBackground(next)}
            disabled={switching}
            label="Keep sharing with my screen off"
            description="Your position keeps reaching the farmer while you drive. Android shows a notification the whole time it is on, and it stops by itself when you mark the trip delivered."
            accessibilityLabel="Keep sharing my position when the screen is off"
            style={styles.bgToggle}
          />
        ) : null}

        {isDriver ? (
          <View style={styles.driverActions}>
            {/*
              Navigation goes out to Google Maps or Apple Maps rather than being
              reinvented in here. Turn-by-turn on a truck is not something to
              approximate, and the driver already knows how to use theirs.
            */}
            <Pressable
              onPress={() =>
                void openExternalNavigation(
                  next === 'GOODS_COLLECTED'
                    ? { latitude: booking.pickupLat, longitude: booking.pickupLng }
                    : { latitude: booking.destinationLat, longitude: booking.destinationLng },
                  next === 'GOODS_COLLECTED' ? booking.pickupAddress : booking.destinationAddress
                )
              }
              accessibilityRole="button"
              accessibilityLabel={
                next === 'GOODS_COLLECTED'
                  ? `Navigate to the pickup at ${booking.pickupAddress}`
                  : `Navigate to ${booking.destinationAddress}`
              }
              style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}>
              <Ionicons name="navigate-outline" size={16} color={DS.colors.primary} />
              <Text style={styles.navText} numberOfLines={1}>
                Directions to{' '}
                {next === 'GOODS_COLLECTED' ? booking.pickupAddress : booking.destinationAddress}
              </Text>
            </Pressable>

            {/*
              A slide, not a tap. These four words are what the farmer is
              watching for, and a driver holding a phone in a moving cab should
              not be able to mark a load delivered with a stray thumb.
            */}
            {step && !advancing ? (
              <SlideToAct
                label={step.label}
                icon="arrow-forward"
                onComplete={() => void advance(step.to)}
                accessibilityLabel={`Mark this trip ${label(step.to)}`}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

/** GOODS_COLLECTED reads as "goods collected" to everyone except a database. */
function label(status: TransportLifecycleStatus): string {
  return status.replace(/_/g, ' ').toLowerCase();
}

/** "just now", "4 min ago" — a pin without an age is a confident lie. */
function describeAge(at: number | null, now: number): string {
  if (at == null) return 'never';
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} h ago`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  centre: { flex: 1, justifyContent: 'center' },
  mapBox: { flex: 1, minHeight: 240 },

  panel: {
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.surface,
    borderTopLeftRadius: DS.radius.xxl,
    borderTopRightRadius: DS.radius.xxl,
    padding: DS.spacing.md,
    marginTop: -DS.spacing.md,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  route: {
    flex: 1,
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  meta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.sm },
  noteText: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 18,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  driverActions: { gap: DS.spacing.sm, marginTop: 2 },
  bgToggle: {
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.md,
    paddingHorizontal: DS.spacing.sm + 4,
    paddingVertical: DS.spacing.sm,
  },
  pressed: { opacity: 0.85 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: DS.layout.touchTarget,
  },
  navText: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },
  offline: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.warning.fg,
  },
});
