import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { VEHICLE_LABELS, VehicleIcon } from '@/components/transport/vehicle-icon';
import { DS } from '@/constants/design-system';
import type { TransportProvider } from '@/types';

interface TransporterRowProps {
  provider: TransportProvider;
  estimatedPrice: number;
  selected?: boolean;
  onPress?: () => void;
  /** Renders without the press behaviour, for a summary of an already-made choice. */
  static?: boolean;
}

/**
 * One transporter, as a row you choose between.
 *
 * The reference puts a photograph of each vehicle here. FarmBridge has no
 * photographs of these transporters' actual trucks, and a stock picture beside
 * a named person reads as a picture of that person's vehicle — so the tile
 * carries the vehicle-type glyph, which is a claim the app can actually back.
 *
 * Selection is shown by fill, border AND the tick, never by colour alone.
 */
export function TransporterRow({
  provider,
  estimatedPrice,
  selected,
  onPress,
  static: isStatic,
}: TransporterRowProps) {
  const unavailable = !provider.isAvailable;

  const body = (
    <>
      <View style={[styles.tile, selected && styles.tileSelected]}>
        <VehicleIcon
          type={provider.vehicleType}
          size={24}
          color={selected ? DS.colors.textInverse : DS.colors.primary}
        />
      </View>

      <View style={styles.identity}>
        <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {provider.name}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={11} color={DS.colors.textSoft} />
          <Text style={styles.meta} numberOfLines={1}>
            {VEHICLE_LABELS[provider.vehicleType]} · {provider.capacity}t · {provider.location}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={11} color={DS.semantic.warning.solid} />
          <Text style={styles.meta}>
            {provider.rating} · {provider.totalTrips} trips
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.price} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          ${estimatedPrice}
        </Text>
        {unavailable ? (
          <Text style={styles.busy}>Busy</Text>
        ) : selected ? (
          <Ionicons name="checkmark-circle" size={18} color={DS.colors.primary} />
        ) : null}
      </View>
    </>
  );

  if (isStatic) {
    return <View style={[styles.row, selected && styles.rowSelected]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={unavailable}
      accessibilityRole="radio"
      accessibilityState={{ selected: Boolean(selected), disabled: unavailable }}
      accessibilityLabel={`${provider.name}, ${VEHICLE_LABELS[provider.vehicleType]}, ${provider.capacity} tonne capacity, based in ${provider.location}. Rated ${provider.rating} over ${provider.totalTrips} trips. Estimated $${estimatedPrice}.${unavailable ? ' Currently busy.' : ''}`}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        unavailable && styles.rowBusy,
        pressed && styles.pressed,
      ]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 2,
  },
  rowSelected: {
    backgroundColor: DS.colors.primaryBg,
    borderColor: DS.colors.primary,
    borderWidth: 1.5,
  },
  rowBusy: { opacity: 0.55 },
  pressed: { opacity: 0.9 },

  tile: {
    width: 52,
    height: 52,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.primaryBg,
  },
  tileSelected: { backgroundColor: DS.colors.primary },

  identity: { flex: 1, gap: 2 },
  name: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: {
    flex: 1,
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  right: { alignItems: 'flex-end', gap: 4 },
  price: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  busy: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.neutral.fg,
  },
});
