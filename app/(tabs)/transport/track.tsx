import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, LoadingState } from '@/components/design-system';
import { FarmMap, type FarmMapMarker } from '@/components/maps/farm-map';
import { DS } from '@/constants/design-system';
import { useBookingSubscription, useRealtimeEvent, useRealtimeStatus } from '@/hooks/useRealtime';
import { IS_API_ENABLED } from '@/services/api/config';
import { transportApi, type TransportBookingDto } from '@/services/api/transport.api';
import type { GeoPoint } from '@/types/geo';

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
 * WHILE THE SCREEN IS OPEN, AND IT SAYS SO. This does not track a driver in the
 * background. Background location needs a native rebuild, a foreground service
 * on Android and a Play Store declaration, none of which are in place — so
 * rather than a switch that quietly stops working the moment the phone locks,
 * the driver is told plainly that the screen has to stay open. Publishing stops
 * when the app goes to the background and resumes when it returns.
 *
 * A POSITION HAS AN AGE. A map pin with no timestamp is the most confident
 * possible way to show something an hour out of date. If nothing has arrived
 * for ninety seconds the screen stops claiming to be live and says when the
 * last fix came in.
 */
export default function TrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const realtime = useRealtimeStatus();

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
    The driver's side.

    `watchPositionAsync` is given the distance and time filters rather than
    throttling in the handler, so the OS decides when to wake us — the cheapest
    place for that decision to be made. Foreground permission only: this stops
    when the app is backgrounded, which is exactly what the copy below promises.
  */
  const subscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!id || !isDriver) return;
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
  }, [id, isDriver]);

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
          <Badge label={booking.status.replace(/_/g, ' ').toLowerCase()} tone="info" />
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
                : publishing
                  ? 'The farmer can see where you are. Keep this screen open — sharing stops when you leave the app.'
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
      </View>
    </SafeAreaView>
  );
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
  offline: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.warning.fg,
  },
});
