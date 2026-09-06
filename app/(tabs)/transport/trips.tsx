import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, LoadingState } from '@/components/design-system';
import { VEHICLE_LABELS, VehicleIcon } from '@/components/transport/vehicle-icon';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { useRealtimeEvent } from '@/hooks/useRealtime';
import { openExternalNavigation } from '@/lib/external-maps';
import { asHref } from '@/lib/href';
import {
  transportApi,
  type ServerTransportRequest,
  type TransportBookingDto,
} from '@/services/api/transport.api';
import { getBookings, updateBookingStatus } from '@/services/transportDb';
import { useAuthStore } from '@/stores/authStore';
import type { BookingStatus, TransportBooking } from '@/types/transport';

type TripTab = 'active' | 'history';

const STATUS_TONE: Record<BookingStatus, keyof typeof DS.semantic> = {
  pending: 'warning',
  confirmed: 'success',
  in_transit: 'info',
  delivered: 'neutral',
  cancelled: 'danger',
};

const NEXT_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  pending: 'confirmed',
  confirmed: 'in_transit',
  in_transit: 'delivered',
};

/**
 * Loads posted to the marketplace that have not become a booking yet.
 *
 * Returns nothing at all when the API is off or unreachable — this section is
 * an addition to a screen that has always worked offline, and it must not be
 * able to break it.
 */
async function openRequests(): Promise<ServerTransportRequest[]> {
  try {
    const rows = await transportApi.listMine();
    return rows.filter((r) => r.status === 'REQUESTED' || r.status === 'BIDDING');
  } catch {
    return [];
  }
}

/** Bookings the server holds for this account. Silent when it is unreachable. */
async function serverBookings(): Promise<TransportBookingDto[]> {
  try {
    return await transportApi.activeBookings();
  } catch {
    return [];
  }
}

export default function TripsScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<TripTab>('active');
  const [trips, setTrips] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);
  /*
    Loads posted to the marketplace that nobody has been booked for yet.

    They are not trips — there is no transporter and no price — but they are the
    only trace of a load you posted, and without them here you could post one,
    close the app, and never find your way back to the offers.
  */
  const [awaiting, setAwaiting] = useState<ServerTransportRequest[]>([]);
  /*
    Bookings that came from accepting an offer.

    They are not in the local database — nobody typed them into this device —
    so without this the farmer accepts a bid, is sent here, and finds the screen
    empty. Kept as a separate list rather than mapped into TransportBooking,
    because a server booking has no payment method and no vehicle type, and
    filling those in with defaults would be inventing them.
  */
  const [booked, setBooked] = useState<TransportBookingDto[]>([]);

  // Hoisted so the declared dependency matches the one the compiler infers.
  const uid = user?.id ?? 'guest';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrips(await getBookings(uid));
      const [posted, remote] = await Promise.all([openRequests(), serverBookings()]);
      setAwaiting(posted);
      setBooked(remote);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  /*
    `load` stays for the realtime handlers below and for pull-to-refresh. The
    mount read runs here so no state-setting callback is invoked straight from
    an effect, and the guard stops a write landing after the screen has gone.
  */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await getBookings(uid);
      if (!cancelled) {
        setTrips(rows);
        setLoading(false);
      }
      // After the local rows, so a slow or absent network never delays the
      // list that works offline.
      const [posted, remote] = await Promise.all([openRequests(), serverBookings()]);
      if (!cancelled) {
        setAwaiting(posted);
        setBooked(remote);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // A bid landing on a posted load changes what the row below should say.
  useRealtimeEvent('transport:bid:created', () => {
    void openRequests().then(setAwaiting);
  });

  /*
    A status change on the server means this list is stale.

    It reloads rather than patching the row from the payload: the socket carries
    the new status, but a booking also changes other things when it advances —
    an assigned transporter, a collection time — and trusting one field from a
    socket is how a list ends up disagreeing with the database. The event is the
    signal to refetch, not the new state.
  */
  useRealtimeEvent('transport:status:updated', () => {
    void load();
  });

  // Someone accepting a bid creates the booking this screen exists to show.
  useRealtimeEvent('transport:booking:accepted', () => {
    void load();
  });

  const active = trips.filter((t) => ['pending', 'confirmed', 'in_transit'].includes(t.status));
  const history = trips.filter((t) => ['delivered', 'cancelled'].includes(t.status));
  const shown = tab === 'active' ? active : history;

  // Memoised: without this it is a new function every render, which
  // invalidates renderTrip's useCallback and re-renders every row in the list.
  const advanceStatus = useCallback(
    async (trip: TransportBooking) => {
      const next = NEXT_STATUS[trip.status];
      if (!next) return;
      await updateBookingStatus(trip.id, next);
      showToast(`Trip marked ${next.replace('_', ' ')}`, 'success');
      await load();
    },
    [showToast, load]
  );

  const renderTrip = useCallback(
    ({ item }: { item: TransportBooking }) => {
      const tone = DS.semantic[STATUS_TONE[item.status]];
      const next = NEXT_STATUS[item.status];

      return (
        <Card style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.reference} numberOfLines={1}>
              {item.id}
            </Text>
            <View style={[styles.status, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <Text style={[styles.statusText, { color: tone.fg }]}>
                {item.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <View style={styles.providerRow}>
            <VehicleIcon type={item.vehicleType} size={18} color={DS.colors.textMuted} />
            <Text style={styles.provider} numberOfLines={1}>
              {item.providerName}
            </Text>
            <Text style={styles.vehicle}>{VEHICLE_LABELS[item.vehicleType]}</Text>
          </View>

          <View style={styles.routeRow}>
            <Text style={styles.route} numberOfLines={1}>
              {item.pickup}
            </Text>
            <Ionicons name="arrow-forward" size={13} color={DS.colors.textSoft} />
            <Text style={styles.route} numberOfLines={1}>
              {item.destination}
            </Text>
          </View>

          <Text style={styles.meta}>
            {item.preferredDate} · ${item.agreedPriceUSD} · {item.paymentMethod}
            {item.distanceKm ? ` · ~${item.distanceKm} km` : ''}
            {item.durationSeconds
              ? ` · about ${Math.round(item.durationSeconds / 60)} min`
              : ''}
          </Text>

          {tab === 'active' && item.pickupLat != null && item.pickupLng != null ? (
            <Button
              title="Navigate to pickup"
              variant="ghost"
              size="sm"
              icon="navigate-outline"
              onPress={() =>
                void openExternalNavigation(
                  { latitude: item.pickupLat!, longitude: item.pickupLng! },
                  item.pickup
                )
              }
              accessibilityLabel={`Navigate to pickup for trip ${item.id}`}
              style={styles.action}
            />
          ) : null}

          {tab === 'active' && next ? (
            <Button
              title={`Mark ${next.replace('_', ' ')}`}
              variant="outline"
              size="sm"
              onPress={() => void advanceStatus(item)}
              accessibilityLabel={`Mark trip ${item.id} as ${next.replace('_', ' ')}`}
              accessibilityHint="Records the trip's progress on this device"
              style={styles.action}
            />
          ) : null}

          {item.status === 'delivered' ? (
            <View style={styles.pendingFeature}>
              <Ionicons name="star-outline" size={14} color={DS.colors.textSoft} />
              <Text style={styles.pendingText}>
                Ratings arrive with transporter profiles
              </Text>
            </View>
          ) : null}
        </Card>
      );
    },
    [tab, advanceStatus]
  );

  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        {(['active', 'history'] as TripTab[]).map((t) => {
          const selected = tab === t;
          const count = t === 'active' ? active.length : history.length;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t} trips, ${count}`}
              style={[styles.tab, selected && styles.tabSelected]}>
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                {t === 'active' ? 'Active' : 'History'}
                {count > 0 ? ` (${count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(t) => t.id}
        renderItem={renderTrip}
        contentContainerStyle={[styles.list, shown.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={DS.colors.primary} />
        }
        ListHeaderComponent={
          tab === 'active' && (awaiting.length > 0 || booked.length > 0) ? (
            <View style={styles.awaiting}>
              {booked.length > 0 ? (
                <>
                  <Text style={styles.awaitingTitle}>Booked through FarmBridge</Text>
                  {booked.map((b) => (
                    <View key={b.id} style={styles.bookedRow}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color={DS.semantic.success.fg}
                      />
                      <View style={styles.flex}>
                        <Text style={styles.awaitingRoute} numberOfLines={1}>
                          {b.pickupAddress} → {b.destinationAddress}
                        </Text>
                        <Text style={styles.awaitingMeta} numberOfLines={1}>
                          ${(b.agreedPriceUsdCents / 100).toFixed(2)} ·{' '}
                          {Math.round(b.distanceMeters / 1000)} km ·{' '}
                          {b.status.replace(/_/g, ' ').toLowerCase()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : null}

              {awaiting.length > 0 ? (
                <Text style={styles.awaitingTitle}>Waiting for offers</Text>
              ) : null}
              {awaiting.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() =>
                    router.push(asHref({ pathname: '/(tabs)/transport/bids', params: { id: r.id } }))
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`See offers on your load from ${r.pickupAddress} to ${r.destinationAddress}`}
                  style={({ pressed }) => [styles.awaitingRow, pressed && styles.pressed]}>
                  <Ionicons name="megaphone-outline" size={18} color={DS.colors.primary} />
                  <View style={styles.flex}>
                    <Text style={styles.awaitingRoute} numberOfLines={1}>
                      {r.pickupAddress} → {r.destinationAddress}
                    </Text>
                    <Text style={styles.awaitingMeta} numberOfLines={1}>
                      {r.goodsDescription} · {Math.round(r.distanceMeters / 1000)} km
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={DS.colors.textSoft} />
                </Pressable>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState title="Loading trips" />
          ) : tab === 'active' && (awaiting.length > 0 || booked.length > 0) ? (
            /*
              The header above is not empty, so "No active trips" would be
              contradicting what the farmer can see three centimetres higher.
            */
            null
          ) : (
            <EmptyState
              icon="bus-outline"
              title={tab === 'active' ? 'No active trips' : 'No past trips'}
              description={
                tab === 'active'
                  ? 'Book transport and it will appear here so you can follow its progress.'
                  : 'Completed and cancelled trips are kept here for your records.'
              }
            />
          )
        }
        initialNumToRender={6}
        windowSize={7}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },

  tabs: {
    flexDirection: 'row',
    backgroundColor: DS.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
  },
  tab: {
    flex: 1,
    minHeight: DS.layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabSelected: { borderBottomColor: DS.colors.primary },
  tabText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  tabTextSelected: { color: DS.colors.primary },

  list: { padding: DS.spacing.md, paddingBottom: DS.spacing.lg },

  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  awaiting: { gap: 6, marginBottom: DS.spacing.md },
  awaitingTitle: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
    letterSpacing: 0.3,
  },
  awaitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 2,
    minHeight: DS.layout.touchTarget,
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.md,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.primaryMid,
    paddingHorizontal: DS.spacing.sm + 4,
    paddingVertical: DS.spacing.sm,
  },
  bookedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 2,
    minHeight: DS.layout.touchTarget,
    backgroundColor: DS.semantic.success.bg,
    borderRadius: DS.radius.md,
    borderWidth: DS.layout.hairline,
    borderColor: DS.semantic.success.border,
    paddingHorizontal: DS.spacing.sm + 4,
    paddingVertical: DS.spacing.sm,
  },
  awaitingRoute: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  awaitingMeta: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },

  card: { marginBottom: DS.spacing.sm + 4, gap: DS.spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: DS.spacing.sm },
  reference: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  status: {
    borderRadius: DS.radius.xs,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    textTransform: 'capitalize',
  },

  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  provider: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  vehicle: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  route: {
    flexShrink: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  meta: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  action: { marginTop: DS.spacing.xs },

  /*
   * Previously a Pressable reading "Rate & Review (coming soon)" with no
   * onPress at all — a control that could never do anything. It is now plain
   * text, so nothing invites a tap that goes nowhere.
   */
  pendingFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: DS.spacing.xs,
  },
  pendingText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
});
