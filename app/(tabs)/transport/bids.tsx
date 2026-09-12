import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, EmptyState, LoadingState } from '@/components/design-system';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { useRealtimeEvent, useRealtimeStatus } from '@/hooks/useRealtime';
import { asHref } from '@/lib/href';
import { IS_API_ENABLED } from '@/services/api/config';
import {
  transportApi,
  type ServerTransportRequest,
  type TransportBidDto,
} from '@/services/api/transport.api';

/**
 * The offers on one load, and where the farmer chooses between them.
 *
 * THIS IS THE MISSING HALF OF THE MARKETPLACE. Requests were being posted to the
 * server and transporters can now bid on them, but nothing showed the farmer
 * that anyone had replied. A job went into the system and, as far as the person
 * who posted it could tell, nothing happened.
 *
 * OFFERS ARRIVE WITHOUT A REFRESH. `transport:bid:created` and
 * `transport:bid:updated` both refetch. As everywhere else, the event is the
 * signal rather than the payload — a bid carries a price someone is going to
 * accept, and taking that number from a socket frame instead of the database is
 * not a shortcut worth having.
 *
 * CHEAPEST IS SHOWN FIRST BUT NOT MARKED "BEST". It is sorted by price because
 * that is the comparison people came to make; calling one of them best would be
 * the platform putting its thumb on a negotiation between two other parties.
 */
export default function BidsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const realtime = useRealtimeStatus();

  const [request, setRequest] = useState<ServerTransportRequest | null>(null);
  const [bids, setBids] = useState<TransportBidDto[]>([]);
  // Derived below rather than switched off in the effect — see the note in
  // jobs.tsx; setting state in an effect body is a cascading render.
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await transportApi.getRequest(id);
    if (!data) return;
    setRequest(data.request);
    setBids(data.bids);
  }, [id]);

  useEffect(() => {
    if (!id || !IS_API_ENABLED) return;
    let cancelled = false;
    void transportApi.getRequest(id).then((data) => {
      if (cancelled) return;
      if (data) {
        setRequest(data.request);
        setBids(data.bids);
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loading = IS_API_ENABLED && !!id && !loaded;

  useRealtimeEvent('transport:bid:created', () => void load());
  useRealtimeEvent('transport:bid:updated', () => void load());

  // Sorted by price: the comparison the screen exists for.
  const sorted = useMemo(
    () => [...bids].sort((a, b) => a.amountUsdCents - b.amountUsdCents),
    [bids]
  );

  const accept = useCallback(
    async (bid: TransportBidDto) => {
      setAccepting(bid.id);
      try {
        const booking = await transportApi.acceptBid(bid.id);
        if (!booking) throw new Error('no booking');
        showToast(`${bid.transporterName} is booked`, 'success');
        router.replace(asHref('/(tabs)/transport/trips'));
      } catch {
        showToast('Could not accept that offer. Try again.', 'error');
      } finally {
        setAccepting(null);
      }
    },
    [showToast]
  );

  if (!IS_API_ENABLED) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centre}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Offers need a connection"
            description="Transporters send offers through the FarmBridge server. This screen needs the API to be reachable."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingState title="Loading offers" />;

  const taken = request ? request.status !== 'REQUESTED' && request.status !== 'BIDDING' : false;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <FlatList
        data={sorted}
        keyExtractor={(bid) => bid.id}
        contentContainerStyle={[styles.list, sorted.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
            tintColor={DS.colors.primary}
          />
        }
        ListHeaderComponent={
          request ? (
            <View style={styles.header}>
              <Text style={styles.route} numberOfLines={2}>
                {request.pickupAddress} → {request.destinationAddress}
              </Text>
              <Text style={styles.subtitle}>
                {Math.round(request.distanceMeters / 1000)} km ·{' '}
                {(request.weightKg / 1000).toFixed(2)}t · guide $
                {Math.round(request.estimatedPriceUsdCents / 100)}
              </Text>
              {realtime !== 'connected' ? (
                <Text style={styles.stale}>Not live — pull down to check for new offers.</Text>
              ) : null}
              {taken ? (
                <View style={styles.takenRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={DS.semantic.success.fg}
                  />
                  <Text style={styles.takenText}>
                    This load is booked. The remaining offers are shown for your records.
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <BidCard
            bid={item}
            cheapest={index === 0 && sorted.length > 1}
            disabled={taken}
            busy={accepting === item.id}
            onAccept={() => void accept(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="hourglass-outline"
            title="No offers yet"
            description="Transporters nearby can see your load. Offers appear here as they come in — you do not need to keep this screen open."
          />
        }
      />
    </SafeAreaView>
  );
}

function BidCard({
  bid,
  cheapest,
  disabled,
  busy,
  onAccept,
}: {
  bid: TransportBidDto;
  cheapest: boolean;
  disabled: boolean;
  busy: boolean;
  onAccept: () => void;
}) {
  const price = (bid.amountUsdCents / 100).toFixed(2);
  const accepted = bid.status === 'ACCEPTED';

  return (
    <View style={[styles.card, accepted && styles.cardAccepted]}>
      <View style={styles.cardHead}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color={DS.colors.primary} />
        </View>

        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>
            {bid.transporterName}
          </Text>
          <Text style={styles.since} numberOfLines={1}>
            {bid.transporterSince
              ? `On FarmBridge since ${new Date(bid.transporterSince).toLocaleDateString('en-ZW', { month: 'short', year: 'numeric' })}`
              : 'New to FarmBridge'}
          </Text>
        </View>

        <View style={styles.priceCol}>
          <Text style={styles.price}>${price}</Text>
          {bid.etaMinutes ? (
            <Text style={styles.eta}>can collect in {bid.etaMinutes} min</Text>
          ) : null}
        </View>
      </View>

      {bid.note ? (
        <Text style={styles.note} numberOfLines={3}>
          “{bid.note}”
        </Text>
      ) : null}

      <View style={styles.badges}>
        {/*
          "Lowest offer" is a fact. "Best" would be a judgement the platform has
          no business making on somebody else's negotiation.
        */}
        {cheapest && !accepted ? <Badge label="Lowest offer" tone="success" /> : null}
        {accepted ? <Badge label="Accepted" tone="success" variant="solid" /> : null}
        {bid.status === 'WITHDRAWN' ? <Badge label="Withdrawn" tone="neutral" /> : null}
      </View>

      {!disabled && bid.status === 'OPEN' ? (
        <Button
          title={`Accept $${price}`}
          size="sm"
          loading={busy}
          onPress={onAccept}
          accessibilityLabel={`Accept ${bid.transporterName}'s offer of ${price} dollars`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  centre: { flex: 1, justifyContent: 'center' },
  flex: { flex: 1 },
  list: { padding: DS.spacing.md, gap: DS.spacing.sm + 4 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },

  header: { gap: 3, marginBottom: DS.spacing.xs },
  route: {
    fontSize: DS.typography.h3.fontSize,
    lineHeight: 24,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  subtitle: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  stale: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.warning.fg,
  },
  takenRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: DS.spacing.xs,
  },
  takenText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  card: {
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.md,
  },
  cardAccepted: { borderColor: DS.semantic.success.solid, borderWidth: 1.5 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 2 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primaryBg,
  },
  name: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  since: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
  priceCol: { alignItems: 'flex-end' },
  price: {
    fontSize: DS.typography.h2.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  eta: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  note: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 18,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
