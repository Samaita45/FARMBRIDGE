import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState, LoadingState } from '@/components/design-system';
import { BidSheet } from '@/components/transport/bid-sheet';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { useLocation } from '@/hooks/useLocation';
import { useRealtimeEvent, useRealtimeStatus } from '@/hooks/useRealtime';
import { asHref } from '@/lib/href';
import { IS_API_ENABLED } from '@/services/api/config';
import { transportApi, type NearbyTransportRequest } from '@/services/api/transport.api';

/**
 * Work available near a transporter, and the place they bid on it.
 *
 * WHY THIS SCREEN HAD TO EXIST. The backend has carried a complete bid
 * marketplace for some time — nearby requests, bids, acceptance, the lifecycle —
 * and the app called two of its eleven endpoints. A farmer could post a job and
 * no transporter had any way to see it, which made the whole flow unreachable
 * from the product it was built for.
 *
 * IT NEEDS THE API, AND SAYS SO. Everything else in FarmBridge works on the
 * device; this cannot, because a marketplace is other people. Rather than an
 * empty list that looks like "no work today", an install with no backend gets
 * told plainly that jobs live on the server.
 *
 * NEW WORK ARRIVES WITHOUT A PULL. `transport:request:created` refetches the
 * list. The event is the signal, not the payload — a request carries a route,
 * a price and a weight, and inserting one from a socket message is how a list
 * starts disagreeing with the database.
 */
export default function TransporterJobsScreen() {
  const { showToast } = useToast();
  const { location } = useLocation();
  const realtime = useRealtimeStatus();

  const [jobs, setJobs] = useState<NearbyTransportRequest[]>([]);
  /*
    Loaded, not loading. Whether the spinner shows is derived below rather than
    switched off inside the effect — with no API there is nothing to wait for,
    and setting state in an effect body to say so is both a cascading render and
    the React Compiler's complaint.
  */
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bidding, setBidding] = useState<NearbyTransportRequest | null>(null);

  const lat = location.latitude;
  const lng = location.longitude;

  const load = useCallback(async () => {
    const rows = await transportApi.nearby(lat, lng);
    setJobs(rows);
  }, [lat, lng]);

  useEffect(() => {
    if (!IS_API_ENABLED) return;
    let cancelled = false;
    void transportApi.nearby(lat, lng).then((rows) => {
      if (cancelled) return;
      setJobs(rows);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const loading = IS_API_ENABLED && !loaded;

  // Somebody posted a load. Refetch rather than splice the payload in.
  useRealtimeEvent('transport:request:created', () => {
    void load();
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const submitBid = useCallback(
    async (amountUsd: number, note: string, etaMinutes?: number) => {
      if (!bidding) return;
      try {
        const bid = await transportApi.bid(
          bidding.id,
          Math.round(amountUsd * 100),
          note || undefined,
          etaMinutes
        );
        if (!bid) throw new Error('no bid');
        setBidding(null);
        showToast('Your offer has been sent', 'success');
        // The farmer decides from here; the list drops requests already taken.
        await load();
      } catch {
        showToast('Could not send that offer. Try again.', 'error');
      }
    },
    [bidding, load, showToast]
  );

  if (!IS_API_ENABLED) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centre}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Jobs need a connection"
            description="Loads posted by farmers live on the FarmBridge server. Everything else in the app works offline, but a marketplace is other people — so this screen needs the API to be reachable."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingState title="Finding work near you" />;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <FlatList
        data={jobs}
        keyExtractor={(job) => job.id}
        contentContainerStyle={[styles.list, jobs.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={DS.colors.primary}
          />
        }
        ListHeaderComponent={
          jobs.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.count}>
                {jobs.length} load{jobs.length === 1 ? '' : 's'} near {location.label}
              </Text>
              {realtime !== 'connected' ? (
                <Text style={styles.stale}>
                  Not live — pull down to check for new work.
                </Text>
              ) : null}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <JobCard job={item} onBid={() => setBidding(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title="No loads near you right now"
            description="Farmers post work as they need it. Pull down to check again."
          />
        }
      />

      <BidSheet
        job={bidding}
        onClose={() => setBidding(null)}
        onSubmit={submitBid}
      />
    </SafeAreaView>
  );
}

function JobCard({ job, onBid }: { job: NearbyTransportRequest; onBid: () => void }) {
  const km = Math.round(job.distanceMeters / 1000);
  const minutes = Math.round(job.durationSeconds / 60);
  const suggested = (job.estimatedPriceUsdCents / 100).toFixed(0);

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.flex}>
          <Text style={styles.goods} numberOfLines={1}>
            {job.goodsDescription}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {job.goodsType} · {(job.weightKg / 1000).toFixed(2)}t
          </Text>
        </View>
        <View style={styles.guide}>
          <Text style={styles.guideLabel}>GUIDE</Text>
          <Text style={styles.guideValue}>${suggested}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.rail}>
          <View style={styles.originDot} />
          <View style={styles.railLine} />
          <View style={styles.destPin} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.place} numberOfLines={1}>
            {job.pickupAddress}
          </Text>
          <Text style={styles.place} numberOfLines={1}>
            {job.destinationAddress}
          </Text>
        </View>
      </View>

      <View style={styles.facts}>
        <Fact icon="navigate-outline" text={`${km} km`} />
        <Fact icon="time-outline" text={`~${formatDuration(minutes)}`} />
        {job.distanceFromYouKm != null ? (
          <Fact icon="locate-outline" text={`${Math.round(job.distanceFromYouKm)} km away`} />
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          title="View route"
          variant="outline"
          size="sm"
          style={styles.action}
          onPress={() =>
            router.push(asHref({ pathname: '/(tabs)/transport/job', params: { id: job.id } }))
          }
          accessibilityLabel={`View the route for ${job.goodsDescription}`}
        />
        <Button
          title="Make an offer"
          size="sm"
          style={styles.action}
          onPress={onBid}
          accessibilityLabel={`Make an offer on ${job.goodsDescription}`}
        />
      </View>
    </View>
  );
}

function Fact({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={13} color={DS.colors.textSoft} />
      <Text style={styles.factText}>{text}</Text>
    </View>
  );
}

/** "3 h 20 min" reads better than "200 min" on a long haul. */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  centre: { flex: 1, justifyContent: 'center' },
  flex: { flex: 1 },
  list: { padding: DS.spacing.md, gap: DS.spacing.sm + 4 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },

  header: { gap: 2, marginBottom: DS.spacing.xs },
  count: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  stale: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.warning.fg,
  },

  card: {
    gap: DS.spacing.sm + 2,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.sm },
  goods: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  meta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
  guide: { alignItems: 'flex-end' },
  guideLabel: {
    fontSize: 9,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textSoft,
    letterSpacing: 0.6,
  },
  guideValue: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },

  route: { flexDirection: 'row', gap: DS.spacing.sm + 2 },
  rail: { width: 11, alignItems: 'center', paddingVertical: 5 },
  originDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2.5,
    borderColor: DS.colors.primary,
    backgroundColor: DS.colors.surface,
  },
  railLine: { flex: 1, width: 2, marginVertical: 3, backgroundColor: DS.colors.border },
  destPin: { width: 9, height: 9, borderRadius: 2, backgroundColor: DS.semantic.success.solid },
  place: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 22,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },

  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.md },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  factText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  actions: { flexDirection: 'row', gap: DS.spacing.sm },
  action: { flex: 1 },
});
