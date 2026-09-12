import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import type { Crop } from '@/types';
import { getCropImage } from '@/utils/crop-emoji';

interface PlantNowCardProps {
  crop: Crop;
  onPress: () => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * A crop whose planting window is open this month, as the reference's field
 * card: the photograph carries the tile, and the facts sit on it.
 *
 * This was a 64px thumbnail beside three lines of text, repeated four times
 * down the page — accurate, and completely inert. A farmer deciding what to put
 * in the ground recognises the crop by sight long before they read its name,
 * so the picture gets the space.
 *
 * THE HARVEST DATE IS DERIVED, NOT PROMISED. It is today plus the crop's
 * `harvestDays`, which assumes planting today and ideal conditions. The card
 * says "if planted now" rather than printing a date as though it were a
 * commitment.
 *
 * The badge used to read "AI recommendation". The list comes from
 * `getCropsForMonth`, a lookup against each crop's `bestPlantingMonths`, and it
 * now says so.
 */
export function PlantNowCard({ crop, onPress }: PlantNowCardProps) {
  const harvest = new Date();
  harvest.setDate(harvest.getDate() + crop.harvestDays);
  const harvestLabel = `${MONTHS[harvest.getMonth()]} ${harvest.getDate()}`;

  const window = crop.bestPlantingMonths.map((m) => MONTHS[m - 1]).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${crop.name}. Planting window ${window}. About ${crop.harvestDays} days to harvest, around ${harvestLabel} if planted now. ${crop.waterRequirements} water. Market price $${crop.currentPriceUSD.toFixed(2)} per kilogram. Open the planner.`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image
        source={getCropImage(crop.id, crop.category)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={220}
        cachePolicy="memory-disk"
      />
      {/* Bottom-weighted: the crop stays visible at the top, the words stay
          readable at the bottom over any frame. */}
      <View style={styles.scrim} />

      <View style={styles.top}>
        <View style={styles.seasonBadge}>
          <Ionicons name="leaf" size={10} color={DS.semantic.success.onSolid} />
          <Text style={styles.seasonText}>In season</Text>
        </View>

        <View style={styles.waterBadge}>
          <Ionicons name="water-outline" size={10} color={DS.colors.text} />
          <Text style={styles.waterText}>{crop.waterRequirements}</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.window} numberOfLines={1}>
          Plant {window}
        </Text>

        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <Text
              style={styles.name}
              numberOfLines={1}
              maxFontSizeMultiplier={DS.layout.maxFontScale}>
              {crop.name}
            </Text>
            <Text style={styles.harvest} numberOfLines={1}>
              ~{crop.harvestDays} days · {harvestLabel} if planted now
            </Text>
          </View>

          <View style={styles.arrow}>
            <Ionicons name="arrow-forward" size={16} color={DS.colors.primary} />
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>${crop.currentPriceUSD.toFixed(2)}</Text>
          <Text style={styles.priceUnit}>per kg market price</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 272,
    height: 236,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    justifyContent: 'space-between',
    backgroundColor: DS.colors.surfaceMuted,
  },
  pressed: { opacity: 0.92 },
  scrim: {
    ...StyleSheet.absoluteFill,
    top: '35%',
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
  },

  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: DS.spacing.sm + 2,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DS.semantic.success.solid,
    borderRadius: DS.radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  seasonText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.success.onSolid,
  },
  waterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  waterText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    textTransform: 'capitalize',
  },

  bottom: { padding: DS.spacing.sm + 4, gap: 3 },
  window: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: DS.spacing.sm },
  titleText: { flex: 1 },
  name: {
    fontSize: DS.typography.h1.fontSize,
    lineHeight: DS.typography.h1.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.textInverse,
  },
  harvest: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
    marginTop: 1,
  },
  arrow: {
    width: 38,
    height: 38,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
  },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 2 },
  price: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.textInverse,
  },
  priceUnit: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textInverse,
  },
});
