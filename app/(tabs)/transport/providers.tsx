import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState } from '@/components/design-system';
import { RouteMap } from '@/components/transport/route-map';
import { TransporterRow } from '@/components/transport/transporter-row';
import { DS } from '@/constants/design-system';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
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
 */
export default function ProvidersScreen() {
  const request = useTransportStore((s: TransportState) => s.request);
  const distanceKm = useTransportStore((s: TransportState) => s.distanceKm);
  const selectedId = useTransportStore((s: TransportState) => s.selectedProviderId);
  const selectProvider = useTransportStore((s: TransportState) => s.selectProvider);

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
        return a.price - b.price;
      }),
    [distanceKm]
  );

  const [choice, setChoice] = useState<Quote | null>(
    () => quotes.find((q) => q.provider.id === selectedId) ?? null
  );

  const availableCount = quotes.filter((q) => q.provider.isAvailable).length;

  const renderQuote = useCallback(
    ({ item }: { item: Quote }) => (
      <TransporterRow
        provider={item.provider}
        estimatedPrice={item.price}
        selected={choice?.provider.id === item.provider.id}
        onPress={() => setChoice(item)}
      />
    ),
    [choice]
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
              distanceKm={distanceKm}
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

            <Text style={styles.sectionTitle}>Choose a transporter</Text>
            <Text style={styles.sectionNote}>
              {availableCount} of {quotes.length} are free for this route.
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
            {choice ? `$${choice.price} estimated` : 'Pick one to continue'}
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
