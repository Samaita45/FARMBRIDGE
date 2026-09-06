import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton, RangeSlider } from '@/components/design-system';
import { DS } from '@/constants/design-system';

export interface MarketFilters {
  minPrice: number;
  maxPrice: number;
  /** 0 means "any rating". */
  minRating: number;
  category: string;
  organicOnly: boolean;
  inStockOnly: boolean;
}

export const PRICE_FLOOR = 0;
export const PRICE_CEILING = 500;

export const DEFAULT_FILTERS: MarketFilters = {
  minPrice: PRICE_FLOOR,
  maxPrice: PRICE_CEILING,
  minRating: 0,
  category: 'All',
  organicOnly: false,
  inStockOnly: false,
};

export function isDefaultFilters(f: MarketFilters): boolean {
  return (
    f.minPrice === DEFAULT_FILTERS.minPrice &&
    f.maxPrice === DEFAULT_FILTERS.maxPrice &&
    f.minRating === DEFAULT_FILTERS.minRating &&
    f.category === DEFAULT_FILTERS.category &&
    f.organicOnly === DEFAULT_FILTERS.organicOnly &&
    f.inStockOnly === DEFAULT_FILTERS.inStockOnly
  );
}

/** How many filters differ from the defaults — shown on the Filter button. */
export function activeFilterCount(f: MarketFilters): number {
  let n = 0;
  if (f.minPrice !== DEFAULT_FILTERS.minPrice || f.maxPrice !== DEFAULT_FILTERS.maxPrice) n += 1;
  if (f.minRating !== 0) n += 1;
  if (f.category !== 'All') n += 1;
  if (f.organicOnly) n += 1;
  if (f.inStockOnly) n += 1;
  return n;
}

interface FilterSheetProps {
  visible: boolean;
  categories: readonly string[];
  value: MarketFilters;
  onClose: () => void;
  onApply: (filters: MarketFilters) => void;
}

/**
 * The marketplace filter sheet.
 *
 * Edits a local copy and only reports it on Apply, so backing out of the sheet
 * leaves the results exactly as they were. Reset returns the fields to their
 * defaults without closing, so it can be seen to have worked.
 */
export function FilterSheet({ visible, categories, value, onClose, onApply }: FilterSheetProps) {
  const [draft, setDraft] = useState<MarketFilters>(value);

  /*
    Re-seeded whenever the sheet opens, so it always reflects what is applied.

    Done by remounting rather than by setting state inside an effect: the parent
    gives this component a key that changes with `visible`, so opening the sheet
    produces a fresh component whose initial state is the current filters. Same
    result, no synchronous setState in an effect, and no window in which the
    draft and the applied filters disagree.
  */

  const set = <K extends keyof MarketFilters>(key: K, v: MarketFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />

      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Filter</Text>
          <IconButton
            icon="close"
            accessibilityLabel="Close filters"
            variant="outline"
            size="sm"
            onPress={onClose}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          // The range slider claims the drag; without this the scroll view
          // fights it on the way past.
          keyboardShouldPersistTaps="handled">
          <RangeSlider
            label="Price"
            min={PRICE_FLOOR}
            max={PRICE_CEILING}
            low={draft.minPrice}
            high={draft.maxPrice}
            onChange={(lo, hi) => setDraft((d) => ({ ...d, minPrice: lo, maxPrice: hi }))}
            format={(v) => `$${Math.round(v)}`}
          />

          <View>
            <Text style={styles.groupLabel}>Seller rating</Text>
            <View style={styles.ratingRow}>
              {[0, 3, 3.5, 4, 4.5].map((r) => {
                const active = draft.minRating === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => set('minRating', r)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={r === 0 ? 'Any rating' : `${r} stars and above`}
                    style={[styles.rating, active && styles.ratingActive]}>
                    {r === 0 ? (
                      <Text style={[styles.ratingText, active && styles.ratingTextActive]}>Any</Text>
                    ) : (
                      <>
                        <Ionicons
                          name="star"
                          size={11}
                          color={active ? DS.colors.textInverse : DS.semantic.warning.solid}
                        />
                        <Text style={[styles.ratingText, active && styles.ratingTextActive]}>
                          {r}
                        </Text>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={styles.groupLabel}>Category</Text>
            <View style={styles.chipWrap}>
              {['All', ...categories].map((c) => {
                const active = draft.category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => set('category', c)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={c}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={styles.groupLabel}>Only show</Text>
            <View style={styles.chipWrap}>
              <Toggle
                label="Organic"
                icon="leaf-outline"
                active={draft.organicOnly}
                onPress={() => set('organicOnly', !draft.organicOnly)}
              />
              <Toggle
                label="In stock"
                icon="checkmark-circle-outline"
                active={draft.inStockOnly}
                onPress={() => set('inStockOnly', !draft.inStockOnly)}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => setDraft(DEFAULT_FILTERS)}
            accessibilityRole="button"
            accessibilityLabel="Reset all filters"
            hitSlop={10}
            style={styles.reset}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>

          <Button
            title="Apply"
            style={styles.apply}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Toggle({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: 'leaf-outline' | 'checkmark-circle-outline';
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      accessibilityLabel={label}
      style={[styles.chip, active && styles.chipActive]}>
      <Ionicons
        name={icon}
        size={13}
        color={active ? DS.colors.textInverse : DS.colors.textMuted}
      />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: DS.colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '86%',
    backgroundColor: DS.colors.surface,
    borderTopLeftRadius: DS.radius.xxl,
    borderTopRightRadius: DS.radius.xxl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: DS.colors.border,
    marginTop: DS.spacing.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm + 4,
  },
  title: {
    fontSize: DS.typography.h1.fontSize,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },

  body: { paddingHorizontal: DS.spacing.md, paddingBottom: DS.spacing.lg, gap: DS.spacing.lg },
  groupLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },

  ratingRow: { flexDirection: 'row', gap: DS.spacing.sm },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 52,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: DS.radius.full,
    borderWidth: 1,
    borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
  ratingActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  ratingText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  ratingTextActive: { color: DS.colors.textInverse },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: DS.radius.full,
    borderWidth: 1,
    borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
  chipActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  chipText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  chipTextActive: { color: DS.colors.textInverse },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm + 4,
    paddingBottom: DS.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
  },
  reset: { paddingVertical: DS.spacing.sm, paddingHorizontal: DS.spacing.sm },
  resetText: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  apply: { flex: 1 },
});
