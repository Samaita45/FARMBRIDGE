import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState } from '@/components/design-system';
import { RouteMap } from '@/components/transport/route-map';
import { TransporterRow } from '@/components/transport/transporter-row';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import { IS_API_ENABLED } from '@/services/api/config';
import { transportApi } from '@/services/api/transport.api';
import { estimatePrice } from '@/services/transportDb';
import { useTransportStore, type TransportState } from '@/stores/transportStore';
import type { TransportProvider } from '@/types';

interface Quote {
  provider: TransportProvider;
  price: number;
}

/**
 * Choosing a transporter.
 *
 * WHAT CHANGED AND WHY. Every card used to carry its own Negotiate and Request
 * buttons, so fifteen transporters meant thirty buttons and a decision you made
 * by pressing rather than by comparing. Following the reference, a row is now
 * selected and a single bar at the bottom acts on that selection — the price
 * you are committing to is visible in the same place as the button that
 * commits to it.
 *
 * Nothing was dropped: negotiating still exists, one step further in, where
 * there is room to show what you are negotiating over.
 *
 * RANKED AGAINST YOUR OFFER, which is the inDrive part. Once you have named a
 * price, the useful question is not "who is cheapest" but "who would take
 * this". Transporters whose own published rate for this distance is at or below
 * your offer come first and are marked; the rest show how far above they are,
 * so the choice is between calling someone likely to say yes and calling
 * someone you will have to talk round.
 *
 * Nobody here has seen your offer. There is no server, and the marking is
 * arithmetic on each transporter's own rate — the screen says so rather than
 * implying anyone has responded.
 *
 * THE TWO PATHS ARE NOW A CHOICE, NOT A SIDE EFFECT. This list is the offline
 * path: known transporters, their published rates, and a phone call. The other
 * path posts the load to the server and waits for real offers. Until now the
 * app quietly did both — you picked a transporter here, and the confirm screen
 * also posted the load to every transporter in the country, whose bids nothing
 * would ever show you. One button, one outcome: ask the marketplace from here,
 * or call somebody from below.
 */
export default function ProvidersScreen() {
  const request = useTransportStore((s: TransportState) => s.request);
  const distanceKm = useTransportStore((s: TransportState) => s.distanceKm);
  const selectedId = useTransportStore((s: TransportState) => s.selectedProviderId);
  const selectProvider = useTransportStore((s: TransportState) => s.selectProvider);
  const offer = useTransportStore((s: TransportState) => s.offeredPriceUSD);

  // Sorted cheapest first, but availability is not a filter here: seeing that a
  // transporter exists and is busy is information, and hiding them made the
  // list look emptier than the network is.
  const quotes = useMemo<Quote[]>(
    () =>
      TRANSPORT_PROVIDERS.map((provider) => ({
        provider,
        price: estimatePrice(provider, distanceKm),
      })).sort((a, b) => {
        if (a.provider.isAvailable !== b.provider.isAvailable) {
          return a.provider.isAvailable ? -1 : 1;
        }
        // With an offer on the table, the ones who would take it come first.
        if (offer !== null) {
          const aFits = a.price <= offer;
          const bFits = b.price <= offer;
          if (aFits !== bFits) return aFits ? -1 : 1;
        }
        return a.price - b.price;
      }),
    [distanceKm, offer]
  );

  const [choice, setChoice] = useState<Quote | null>(
    () => quotes.find((q) => q.provider.id === selectedId) ?? null
  );
  const [posting, setPosting] = useState(false);
  const { showToast } = useToast();

  /*
    The load can only go to the marketplace if we know where it starts and ends
    as coordinates. A typed town name that matched nothing in the gazetteer
    leaves no point to search around, and transporters find work by distance.
  */
  const canPost =
    IS_API_ENABLED &&
    request != null &&
    request.pickupLat != null &&
    request.pickupLng != null &&
    request.destinationLat != null &&
    request.destinationLng != null;

  const postToMarketplace = async () => {
    if (!request || !canPost) return;
    setPosting(true);
    try {
      const created = await transportApi.createRequest({
        pickupAddress: request.pickup,
        pickupLat: request.pickupLat as number,
        pickupLng: request.pickupLng as number,
        destinationAddress: request.destination,
        destinationLat: request.destinationLat as number,
        destinationLng: request.destinationLng as number,
        goodsDescription: request.goodsDescription,
        goodsType: request.category,
        weightKg: request.weightKg,
        extras: request.specialRequirements,
        preferredAt: `${request.preferredDate}T${request.preferredTime}:00`,
      });
      if (!created) throw new Error('no request');
      router.push(asHref({ pathname: '/(tabs)/transport/bids', params: { id: created.id } }));
    } catch {
      showToast('Could not post the load. Choose a transporter below instead.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const availableCount = quotes.filter((q) => q.provider.isAvailable).length;
  const withinOffer =
    offer === null
      ? 0
      : quotes.filter((q) => q.provider.isAvailable && q.price <= offer).length;

  const renderQuote = useCallback(
    ({ item }: { item: Quote }) => (
      <TransporterRow
        provider={item.provider}
        estimatedPrice={item.price}
        offeredPrice={offer}
        selected={choice?.provider.id === item.provider.id}
        onPress={() => setChoice(item)}
      />
    ),
    [choice, offer]
  );

  if (!request) {
    return (
      <View style={styles.centre}>
        <EmptyState
          icon="clipboard-outline"
          title="No transport request"
          description="Fill in your pickup, destination and load first, and quotes will appear here."
          actionLabel="Start a request"
          onAction={() => router.replace(asHref('/(tabs)/transport/request'))}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <FlatList
        data={quotes}
        keyExtractor={(q) => q.provider.id}
        renderItem={renderQuote}
        contentContainerStyle={[styles.list, quotes.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.header}>
            <RouteMap
              pickup={request.pickup}
              destination={request.destination}
              pickupCoord={
                request.pickupLat != null && request.pickupLng != null
                  ? { latitude: request.pickupLat, longitude: request.pickupLng }
                  : undefined
              }
              destinationCoord={
                request.destinationLat != null && request.destinationLng != null
                  ? { latitude: request.destinationLat, longitude: request.destinationLng }
                  : undefined
              }
              routePolyline={request.routePolyline}
              distanceKm={distanceKm}
              durationSeconds={request.durationSeconds}
            />

            <View style={styles.load}>
              <Text style={styles.loadLabel}>LOAD</Text>
              <Text style={styles.loadMeta}>
                {request.weightKg} kg · {request.category}
              </Text>
              {/*
                Distance is estimated, not measured. Saying so keeps the quotes
                below honest until a routing service replaces the estimator.
              */}
              <Text style={styles.loadCaveat}>
                Distance and prices are estimates. Confirm with the transporter.
              </Text>
            </View>

            {canPost ? (
              <View style={styles.market}>
                <Text style={styles.marketTitle}>Let transporters name their price</Text>
                <Text style={styles.marketText}>
                  Post this load and transporters near {request.pickup} send you offers.
                  You choose, and nothing is agreed until you accept one.
                </Text>
                <Button
                  title="Ask for offers"
                  variant="outline"
                  size="sm"
                  loading={posting}
                  onPress={() => void postToMarketplace()}
                  accessibilityLabel="Post this load and ask transporters for offers"
                />
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>
              {canPost ? 'Or call a transporter yourself' : 'Choose a transporter'}
            </Text>
            <Text style={styles.sectionNote}>
              {offer !== null
                ? `${withinOffer} of ${availableCount} available transporters usually charge $${offer} or less for this trip. None of them has seen your offer — this is their own rate.`
                : `${availableCount} of ${quotes.length} are free for this route.`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="bus-outline"
            title="No transporters listed"
            description="Nobody covers this route yet. Try again shortly, or adjust your date."
          />
        }
      />

      <View style={styles.bar}>
        <View style={styles.barText}>
          <Text style={styles.barLabel} numberOfLines={1}>
            {choice ? choice.provider.name : 'No transporter chosen'}
          </Text>
          <Text style={styles.barPrice}>
            {choice
              ? offer !== null
                ? `Their rate $${choice.price} · your offer $${offer}`
                : `$${choice.price} estimated`
              : 'Pick one to continue'}
          </Text>
        </View>

        <Button
          title="Continue"
          size="lg"
          disabled={!choice}
          accessibilityLabel={
            choice
              ? `Continue with ${choice.provider.name} at $${choice.price}`
              : 'Continue. Choose a transporter first.'
          }
          onPress={() => {
            if (!choice) return;
            selectProvider(choice.provider.id, choice.price);
            router.push(asHref('/(tabs)/transport/quote'));
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  centre: { flex: 1, justifyContent: 'center', backgroundColor: DS.colors.background },
  list: { padding: DS.spacing.md, paddingBottom: DS.spacing.lg, gap: DS.spacing.sm + 2 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },

  header: { gap: DS.spacing.md, marginBottom: DS.spacing.xs },
  load: {
    gap: 3,
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.sm + 4,
  },
  loadLabel: {
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textSoft,
    letterSpacing: 0.5,
  },
  loadMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  loadCaveat: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  market: {
    gap: 6,
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.primaryMid,
    padding: DS.spacing.md,
  },
  marketTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  marketText: {
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 18,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: DS.typography.h2.fontSize,
    lineHeight: DS.typography.h2.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  sectionNote: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: -DS.spacing.sm - 2,
  },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm + 4,
  },
  barText: { flex: 1 },
  barLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  barPrice: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
});
