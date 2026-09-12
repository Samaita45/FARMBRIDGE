import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, EmptyState, LoadingState } from '@/components/design-system';
import { BidSheet } from '@/components/transport/bid-sheet';
import { RouteMap } from '@/components/transport/route-map';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { IS_API_ENABLED } from '@/services/api/config';
import {
  transportApi,
  type NearbyTransportRequest,
  type ServerTransportRequest,
  type TransportBidDto,
} from '@/services/api/transport.api';

/**
 * One load, seen by a transporter deciding whether to carry it.
 *
 * WHAT THE ROUTE MAP IS FOR. A price on a haul is a judgement about a road, and
 * "312 km" does not tell a driver whether that is the Harare–Mutare or two
 * hundred kilometres of dirt. The polyline the server stored with the request is
 * drawn when it exists; when it does not, the map says it is showing a straight
 * line rather than pretending otherwise.
 *
 * ONLY THIS TRANSPORTER'S OWN BID COMES BACK. The server returns every bid to
 * the customer and nothing but your own to anyone else, so a transporter cannot
 * read the competition off this screen. That is a server rule and it is not
 * re-checked here — what arrives is what may be shown.
 */
export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();

  const [request, setRequest] = useState<ServerTransportRequest | null>(null);
  const [myBid, setMyBid] = useState<TransportBidDto | null>(null);
  // Derived below rather than switched off in the effect — see the note in
  // jobs.tsx; setting state in an effect body is a cascading render.
  const [loaded, setLoaded] = useState(false);
  const [bidding, setBidding] = useState(false);

  useEffect(() => {
    if (!id || !IS_API_ENABLED) return;
    let cancelled = false;
    void transportApi.getRequest(id).then((data) => {
      if (cancelled) return;
      if (data) {
        setRequest(data.request);
        setMyBid(data.bids[0] ?? null);
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loading = IS_API_ENABLED && !!id && !loaded;

  const submitBid = useCallback(
    async (amountUsd: number, note: string, etaMinutes?: number) => {
      if (!request) return;
      try {
        const bid = await transportApi.bid(
          request.id,
          Math.round(amountUsd * 100),
          note || undefined,
          etaMinutes
        );
        if (!bid) throw new Error('no bid');
        setBidding(false);
        setMyBid(bid);
        showToast('Your offer has been sent', 'success');
      } catch {
        showToast('Could not send that offer. Try again.', 'error');
      }
    },
    [request, showToast]
  );

  if (!IS_API_ENABLED) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centre}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Load details need a connection"
            description="This load was posted by a farmer through the FarmBridge server."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingState title="Loading the load" />;

  if (!request) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centre}>
          <EmptyState
            icon="help-circle-outline"
            title="This load is no longer available"
            description="It may have been booked or withdrawn since you saw it."
          />
        </View>
      </SafeAreaView>
    );
  }

  const km = Math.round(request.distanceMeters / 1000);
  const guide = Math.round(request.estimatedPriceUsdCents / 100);
  const open = request.status === 'REQUESTED' || request.status === 'BIDDING';

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <RouteMap
          pickup={request.pickupAddress}
          destination={request.destinationAddress}
          pickupCoord={{ latitude: request.pickupLat, longitude: request.pickupLng }}
          destinationCoord={{
            latitude: request.destinationLat,
            longitude: request.destinationLng,
          }}
          routePolyline={request.routePolyline}
          distanceKm={km}
          durationSeconds={request.durationSeconds}
          height={220}
        />

        <View style={styles.card}>
          <Text style={styles.goods}>{request.goodsDescription}</Text>
          <View style={styles.badges}>
            <Badge label={request.goodsType} tone="neutral" />
            <Badge label={`${(request.weightKg / 1000).toFixed(2)} tonnes`} tone="neutral" />
            {!open ? <Badge label="Already booked" tone="warning" /> : null}
          </View>

          <View style={styles.rows}>
            <Row icon="navigate-outline" label="Distance" value={`${km} km`} />
            <Row
              icon="time-outline"
              label="Driving time"
              value={formatDuration(request.durationSeconds)}
            />
            <Row icon="cash-outline" label="Guide price" value={`$${guide}`} />
          </View>

          <Text style={styles.guideNote}>
            The guide price is FarmBridge&apos;s estimate from the distance, the weight and
            the goods. What you charge is yours to name.
          </Text>
        </View>

        {myBid ? (
          <View style={styles.mine}>
            <Ionicons name="checkmark-circle" size={16} color={DS.semantic.success.fg} />
            <Text style={styles.mineText}>
              You offered ${(myBid.amountUsdCents / 100).toFixed(2)}
              {myBid.status === 'ACCEPTED'
                ? ' — the farmer accepted. Check My trips.'
                : myBid.status === 'REJECTED'
                  ? ' — the farmer went with someone else.'
                  : '. The farmer decides from here.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {open && !myBid ? (
        <View style={styles.footer}>
          <Button title="Make an offer" size="lg" onPress={() => setBidding(true)} />
        </View>
      ) : null}

      <BidSheet
        job={bidding ? (request as NearbyTransportRequest) : null}
        onClose={() => setBidding(false)}
        onSubmit={submitBid}
      />
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={15} color={DS.colors.textSoft} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  centre: { flex: 1, justifyContent: 'center' },
  scroll: { padding: DS.spacing.md, gap: DS.spacing.md },

  card: {
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.md,
  },
  goods: {
    fontSize: DS.typography.h2.fontSize,
    lineHeight: DS.typography.h2.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  rows: { gap: DS.spacing.sm, marginTop: DS.spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  rowLabel: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  rowValue: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  guideNote: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  mine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.sm,
    backgroundColor: DS.semantic.success.bg,
    borderRadius: DS.radius.md,
    padding: DS.spacing.sm + 4,
  },
  mineText: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 18,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.success.fg,
  },

  footer: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm,
    paddingBottom: DS.spacing.sm,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
});
