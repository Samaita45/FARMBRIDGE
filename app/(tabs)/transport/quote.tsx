import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState } from '@/components/design-system';
import { RouteMap } from '@/components/transport/route-map';
import { TransporterRow } from '@/components/transport/transporter-row';
import { VEHICLE_LABELS } from '@/components/transport/vehicle-icon';
import { DS } from '@/constants/design-system';
import { TRANSPORT_PROVIDERS } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import { useTransportStore, type TransportState } from '@/stores/transportStore';

/**
 * The transporter you picked, before you commit to them.
 *
 * The reference calls this "Ride Information" and lists the price, the pickup
 * time and the seats. The equivalents here are the things that decide whether a
 * harvest arrives: what the vehicle can carry against what you are sending, how
 * far it is, and where this person actually works.
 *
 * WHAT IT DOES NOT PROMISE. There is no pickup time, because nothing in
 * FarmBridge schedules one — the transporter agrees that with you directly. The
 * screen names the date you asked for and says so, rather than showing a
 * confident "12 min" the app cannot honour.
 */
export default function QuoteScreen() {
  const request = useTransportStore((s: TransportState) => s.request);
  const distanceKm = useTransportStore((s: TransportState) => s.distanceKm);
  const selectedId = useTransportStore((s: TransportState) => s.selectedProviderId);
  const askingPriceUSD = useTransportStore((s: TransportState) => s.askingPriceUSD);

  const provider = TRANSPORT_PROVIDERS.find((p) => p.id === selectedId) ?? null;

  if (!request || !provider) {
    return (
      <View style={styles.centre}>
        <EmptyState
          icon="clipboard-outline"
          title="No transporter chosen"
          description="Pick a transporter from the quotes first."
          actionLabel="Back to quotes"
          onAction={() => router.replace(asHref('/(tabs)/transport/providers'))}
        />
      </View>
    );
  }

  const loadTonnes = request.weightKg / 1000;
  // A load heavier than the vehicle carries is the one thing on this screen
  // that can waste somebody's day, so it is called out rather than left to be
  // worked out from two numbers in a table.
  const overCapacity = loadTonnes > provider.capacity;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <RouteMap
          pickup={request.pickup}
          destination={request.destination}
          distanceKm={distanceKm}
        />

        <TransporterRow provider={provider} estimatedPrice={askingPriceUSD} selected static />

        <Text style={styles.sectionTitle}>Transporter information</Text>

        <View style={styles.table}>
          <Row label="Estimated price" value={`$${askingPriceUSD}`} strong />
          <Row label="Rate" value={`$${provider.pricePerKm}/km + $${provider.basePrice} base`} />
          <Row label="Distance" value={`~${distanceKm} km`} />
          <Row label="Vehicle" value={VEHICLE_LABELS[provider.vehicleType]} />
          <Row
            label="Capacity"
            value={`${provider.capacity}t · your load ${loadTonnes.toFixed(2)}t`}
            tone={overCapacity ? 'danger' : undefined}
          />
          <Row label="Based in" value={provider.location} />
          <Row label="Covers" value={provider.coverageAreas.join(', ')} />
          <Row label="Rating" value={`${provider.rating} over ${provider.totalTrips} trips`} />
          <Row label="Requested date" value={request.preferredDate} last />
        </View>

        {overCapacity ? (
          <View style={styles.warning}>
            <Ionicons name="warning-outline" size={16} color={DS.semantic.warning.fg} />
            <Text style={styles.warningText}>
              Your load is {loadTonnes.toFixed(2)}t and this vehicle carries {provider.capacity}t.
              It will take more than one trip, and the estimate below covers one.
            </Text>
          </View>
        ) : null}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={14} color={DS.colors.textSoft} />
          <Text style={styles.noteText}>
            FarmBridge does not schedule the pickup or take payment. Requesting sends your details
            to {provider.name}, who confirms the time and price with you directly.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Negotiate the price"
          variant="outline"
          size="lg"
          onPress={() => router.push(asHref('/(tabs)/transport/negotiate'))}
          accessibilityLabel={`Negotiate the price with ${provider.name}`}
        />
        <Button
          title={`Request at $${askingPriceUSD}`}
          size="lg"
          onPress={() =>
            router.push(
              asHref({
                pathname: '/(tabs)/transport/confirm',
                params: { mode: 'direct', price: String(askingPriceUSD) },
              })
            )
          }
          accessibilityLabel={`Request ${provider.name} at $${askingPriceUSD}`}
        />
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  strong,
  last,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  last?: boolean;
  tone?: 'danger';
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          strong && styles.rowValueStrong,
          tone === 'danger' && styles.rowValueDanger,
        ]}
        numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  centre: { flex: 1, justifyContent: 'center', backgroundColor: DS.colors.background },
  body: { padding: DS.spacing.md, paddingBottom: DS.spacing.lg, gap: DS.spacing.md },

  sectionTitle: {
    fontSize: DS.typography.h2.fontSize,
    lineHeight: DS.typography.h2.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },

  table: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: DS.spacing.md,
    paddingVertical: DS.spacing.sm + 4,
  },
  rowDivider: {
    borderBottomWidth: DS.layout.hairline,
    borderBottomColor: DS.colors.borderLight,
  },
  rowLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  rowValueStrong: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
  },
  rowValueDanger: { color: DS.semantic.danger.fg },

  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.sm,
    backgroundColor: DS.semantic.warning.bg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.semantic.warning.border,
    borderRadius: DS.radius.md,
    padding: DS.spacing.sm + 4,
  },
  warningText: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    lineHeight: 17,
    fontFamily: DS.fontFamily.regular,
    color: DS.semantic.warning.fg,
  },

  note: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.sm },
  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  actions: {
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.surface,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.border,
    padding: DS.spacing.md,
  },
});
