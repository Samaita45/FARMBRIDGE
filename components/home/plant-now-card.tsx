import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import type { Crop } from '@/types';
import type { IconName } from '@/types/icons';
import { getCropImage } from '@/utils/crop-emoji';

interface PlantNowCardProps {
  crop: Crop;
  onPress: () => void;
}

/**
 * A crop whose planting window is open this month.
 *
 * The badge used to read "AI recommendation". The list comes from
 * `getCropsForMonth` — a lookup against each crop's `bestPlantingMonths`. It
 * now says what that is.
 */
export function PlantNowCard({ crop, onPress }: PlantNowCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${crop.name}. In season. ${crop.harvestDays} days to harvest, ${crop.waterRequirements} water. Around $${crop.currentPriceUSD.toFixed(2)} per kilogram. Open the planner.`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image
        source={getCropImage(crop.id, crop.category)}
        style={styles.image}
        contentFit="cover"
        transition={150}
      />

      <View style={styles.body}>
        <View style={styles.badge}>
          <Ionicons name="calendar-outline" size={10} color={DS.semantic.success.fg} />
          <Text style={styles.badgeText}>In season</Text>
        </View>

        <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {crop.name}
        </Text>

        <View style={styles.metaRow}>
          <MetaChip icon="time-outline" text={`${crop.harvestDays} days`} />
          <MetaChip icon="water-outline" text={`${crop.waterRequirements} water`} />
        </View>

        <Text style={styles.value} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          ${crop.currentPriceUSD.toFixed(2)}
          <Text style={styles.valueUnit}>/kg market price</Text>
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={DS.colors.textFaint} />
    </Pressable>
  );
}

function MetaChip({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={11} color={DS.colors.textSoft} />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm + 2,
    marginBottom: DS.spacing.sm + 2,
  },
  pressed: { backgroundColor: DS.colors.surfaceMuted },
  image: {
    width: 64,
    height: 64,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.surfaceMuted,
  },
  body: { flex: 1, gap: 3 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: DS.semantic.success.bg,
    borderRadius: DS.radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.semantic.success.fg,
  },
  name: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  metaRow: { flexDirection: 'row', gap: DS.spacing.sm + 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  value: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
    marginTop: 1,
  },
  valueUnit: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
