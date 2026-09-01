import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button, ButtonRow, Card } from '@/components/design-system';
import { VEHICLE_LABELS, VehicleIcon } from '@/components/transport/vehicle-icon';
import { DS } from '@/constants/design-system';
import type { TransportProvider } from '@/types';

interface TransporterCardProps {
  provider: TransportProvider;
  estimatedPrice: number;
  onRequest: () => void;
  onNegotiate: () => void;
}

export function TransporterCard({
  provider,
  estimatedPrice,
  onRequest,
  onNegotiate,
}: TransporterCardProps) {
  const unavailable = !provider.isAvailable;

  return (
    <Card
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`${provider.name}, ${VEHICLE_LABELS[provider.vehicleType]}, ${provider.capacity} tonne capacity. Rated ${provider.rating} over ${provider.totalTrips} trips. Based in ${provider.location}. Estimated $${estimatedPrice}.`}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <VehicleIcon type={provider.vehicleType} size={22} />
        </View>

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {provider.name}
          </Text>
          <Text style={styles.meta}>
            {VEHICLE_LABELS[provider.vehicleType]} · {provider.capacity}t
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={DS.semantic.warning.solid} />
            <Text style={styles.rating}>
              {provider.rating} · {provider.totalTrips} trips
            </Text>
          </View>
        </View>

        {unavailable ? (
          <View style={styles.busy}>
            <Text style={styles.busyText}>Busy</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={13} color={DS.colors.textSoft} />
        <Text style={styles.location} numberOfLines={1}>
          {provider.location}
        </Text>
      </View>

      <View style={styles.areas}>
        {provider.coverageAreas.slice(0, 3).map((area) => (
          <View key={area} style={styles.areaChip}>
            <Text style={styles.areaText}>{area}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Estimated</Text>
          <Text style={styles.price}>${estimatedPrice}</Text>
        </View>

        <ButtonRow>
          <Button
            title="Negotiate"
            variant="outline"
            size="sm"
            disabled={unavailable}
            onPress={onNegotiate}
            accessibilityLabel={`Negotiate the price with ${provider.name}`}
          />
          <Button
            title="Request"
            size="sm"
            disabled={unavailable}
            onPress={onRequest}
            accessibilityLabel={`Request ${provider.name} at $${estimatedPrice}`}
          />
        </ButtonRow>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: DS.spacing.sm + 4, gap: DS.spacing.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.sm + 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1, gap: 1 },
  name: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  meta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: {
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  busy: {
    backgroundColor: DS.semantic.neutral.bg,
    borderRadius: DS.radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  busyText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.neutral.fg,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: {
    flex: 1,
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  areas: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  areaChip: {
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  areaText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
    paddingTop: DS.spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  price: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
});
