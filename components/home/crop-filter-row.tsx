import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import { imageSourceFor } from '@/constants/produce-imagery';
import type { Crop } from '@/types';

/** `null` is "everything", which is the row's first chip. */
export type CropCategory = Crop['category'] | null;

interface CropFilterRowProps {
  categories: Crop['category'][];
  value: CropCategory;
  onChange: (next: CropCategory) => void;
  /** A representative crop name per category, so each chip shows real produce. */
  sampleFor: (category: Crop['category']) => string;
}

/**
 * The crop chips from the Farm UI reference — a round photograph and a label,
 * with the selected one filled.
 *
 * IT FILTERS. The reference's row is decoration; this one drives the demand
 * list underneath it, because a control that looks like a filter and changes
 * nothing is worse than no control. Selecting the active chip again clears it.
 *
 * The photographs come from the produce imagery table, so each chip shows the
 * crop it names rather than a generic basket.
 */
export function CropFilterRow({ categories, value, onChange, sampleFor }: CropFilterRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      <Chip label="All crops" active={value === null} onPress={() => onChange(null)} />

      {categories.map((c) => {
        const active = value === c;
        return (
          <Chip
            key={c}
            label={LABELS[c] ?? c}
            image={sampleFor(c)}
            active={active}
            // Pressing the active chip clears the filter, so there is always a
            // way back without hunting for the "All" chip.
            onPress={() => onChange(active ? null : c)}
          />
        );
      })}
    </ScrollView>
  );
}

function Chip({
  label,
  image,
  active,
  onPress,
}: {
  label: string;
  image?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={active ? `${label}, showing. Tap to show all.` : `Show ${label}`}
      style={[styles.chip, active && styles.chipActive]}>
      {image ? (
        <Image
          source={imageSourceFor(image)}
          style={styles.chipImage}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : (
        <View style={[styles.chipImage, styles.chipImageEmpty]} />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const LABELS: Partial<Record<Crop['category'], string>> = {
  vegetable: 'Vegetables',
  grain: 'Grains',
  'cash crop': 'Cash crops',
  legume: 'Legumes',
  fruit: 'Fruit',
};

const styles = StyleSheet.create({
  row: { gap: DS.spacing.sm, paddingRight: DS.spacing.md },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingLeft: 5,
    paddingRight: 16,
    borderRadius: DS.radius.full,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
  // Fill and border move together with the text weight, so selection never
  // rests on colour alone.
  chipActive: { backgroundColor: DS.colors.accent, borderColor: DS.colors.accent },

  chipImage: {
    width: 34,
    height: 34,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surfaceMuted,
  },
  chipImageEmpty: { width: 10, height: 34, backgroundColor: 'transparent' },

  chipText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },
  chipTextActive: { fontFamily: DS.fontFamily.bold, color: DS.colors.accentOn },
});
