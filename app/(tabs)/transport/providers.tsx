import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState } from '@/components/design-system';
import { TransporterCard } from '@/components/transport/transporter-card';
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

export default function ProvidersScreen() {
  const request = useTransportStore((s: TransportState) => s.request);
  const distanceKm = useTransportStore((s: TransportState) => s.distanceKm);
  const selectProvider = useTransportStore((s: TransportState) => s.selectProvider);

  const quotes = useMemo<Quote[]>(
    () =>
      TRANSPORT_PROVIDERS.filter((p) => p.isAvailable)
        .map((provider) => ({ provider, price: estimatePrice(provider, distanceKm) }))
        .sort((a, b) => a.price - b.price),
    [distanceKm]
  );

  const renderQuote = useCallback(
    ({ item }: { item: Quote }) => (
      <TransporterCard
        provider={item.provider}
        estimatedPrice={item.price}
        onRequest={() => {
          selectProvider(item.provider.id, item.price);
          router.push(
            asHref({
              pathname: '/(tabs)/transport/confirm',
              params: { mode: 'direct', price: String(item.price) },
            })
          );
        }}
        onNegotiate={() => {
          selectProvider(item.provider.id, item.price);
          router.push(asHref('/(tabs)/transport/negotiate'));
        }}
      />
    ),
    [selectProvider]
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
    <FlatList
      style={styles.root}
      data={quotes}
      keyExtractor={(q) => q.provider.id}
      renderItem={renderQuote}
      contentContainerStyle={[styles.list, quotes.length === 0 && styles.listEmpty]}
      showsVerticalScrollIndicator={false}
      initialNumToRender={6}
      windowSize={7}
      ListHeaderComponent={
        <View style={styles.header}>
          <Card variant="flat" style={styles.route}>
            <Text style={styles.routeLabel}>Route</Text>
            <View style={styles.routeRow}>
              <Text style={styles.routeText} numberOfLines={1}>
                {request.pickup}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={DS.colors.textSoft} />
              <Text style={styles.routeText} numberOfLines={1}>
                {request.destination}
              </Text>
            </View>
            <Text style={styles.routeMeta}>
              About {distanceKm} km · {request.weightKg} kg · {request.category}
            </Text>
            {/*
              Distance is estimated, not measured. Saying so keeps the quotes
              below honest until a routing service replaces the estimator.
            */}
            <Text style={styles.routeCaveat}>
              Distance and prices are estimates. Confirm with the transporter.
            </Text>
          </Card>

          <Text style={styles.sectionTitle}>
            {quotes.length} transporter{quotes.length === 1 ? '' : 's'} available
          </Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="bus-outline"
          title="No transporters available"
          description="Nobody is free for this route right now. Try again shortly, or adjust your date."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  centre: { flex: 1, justifyContent: 'center', backgroundColor: DS.colors.background },
  list: { padding: DS.spacing.md, paddingBottom: DS.spacing.lg },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },

  header: { gap: DS.spacing.md, marginBottom: DS.spacing.md },
  route: { gap: 4 },
  routeLabel: {
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  routeText: {
    flexShrink: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  routeMeta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 2,
  },
  routeCaveat: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
});
