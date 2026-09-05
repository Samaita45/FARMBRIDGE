import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, LoadingState } from '@/components/design-system';
import { VEHICLE_LABELS, VehicleIcon } from '@/components/transport/vehicle-icon';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { useRealtimeEvent } from '@/hooks/useRealtime';
import { openExternalNavigation } from '@/lib/external-maps';
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

export default function TripsScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<TripTab>('active');
  const [trips, setTrips] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrips(await getBookings(user?.id ?? 'guest'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

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
        ListEmptyComponent={
          loading ? (
            <LoadingState title="Loading trips" />
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
