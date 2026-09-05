import { StyleSheet, View } from 'react-native';

import { LocationSearchField } from '@/components/maps/location-search-field';
import { DS } from '@/constants/design-system';
import type { ResolvedPlace } from '@/types/geo';

interface RouteFieldsProps {
  pickup: string;
  destination: string;
  onPickupChange: (text: string) => void;
  onDestinationChange: (text: string) => void;
  onPickupResolved?: (place: ResolvedPlace | null) => void;
  onDestinationResolved?: (place: ResolvedPlace | null) => void;
  pickupError?: string;
  destinationError?: string;
}

/**
 * From and to, joined.
 *
 * The two fields sat as separate rows in a form. Joining them with the dot,
 * line and pin — as inDrive does — is not decoration: it is the only thing on
 * the screen that says these two inputs are one journey rather than two
 * unrelated questions, which matters when the price below depends on the
 * distance between them.
 *
 * The rail is drawn beside the fields rather than between them, so a validation
 * message under either field pushes its own row without breaking the line.
 */
export function RouteFields({
  pickup,
  destination,
  onPickupChange,
  onDestinationChange,
  onPickupResolved,
  onDestinationResolved,
  pickupError,
  destinationError,
}: RouteFieldsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.rail} pointerEvents="none">
        <View style={styles.originDot} />
        <View style={styles.line} />
        <View style={styles.destinationPin} />
      </View>

      <View style={styles.fields}>
        <LocationSearchField
          label="Pick up from"
          value={pickup}
          onChangeText={onPickupChange}
          onResolved={onPickupResolved}
          role="pickup"
          placeholder="Harare, Mbare Musika"
          required
          error={pickupError}
          allowCurrentLocation
        />
        <LocationSearchField
          label="Deliver to"
          value={destination}
          onChangeText={onDestinationChange}
          onResolved={onDestinationResolved}
          role="destination"
          placeholder="Bulawayo, Renkini"
          required
          error={destinationError}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: DS.spacing.sm + 2 },
  rail: {
    width: 14,
    alignItems: 'center',
    // Starts level with the first field rather than its label.
    paddingTop: 34,
    paddingBottom: 22,
  },
  originDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: DS.colors.primary,
    backgroundColor: DS.colors.surface,
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    borderRadius: 1,
    backgroundColor: DS.colors.border,
  },
  destinationPin: {
    width: 11,
    height: 11,
    borderRadius: 2,
    backgroundColor: DS.semantic.success.solid,
  },
  fields: { flex: 1, gap: DS.spacing.sm + 4 },
});
