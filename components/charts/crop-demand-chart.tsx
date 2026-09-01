import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import { CROPS } from '@/constants/zimbabwe-data';
import type { IconName } from '@/types/icons';
import { getCropIcon } from '@/utils/crop-emoji';

/**
 * Demand index for the next three months.
 *
 * Rebuilt after the palette failed colour-vision validation. It previously
 * showed up to five crops in gradient-filled bars using orange against green
 * (ΔE 4.8 protan) and purple against blue (ΔE 0.4 deutan) — pairs that are
 * indistinguishable to roughly one man in twelve, on a chart meant to inform a
 * planting decision.
 *
 * Now: at most three crops, from the validated categorical set, in solid fills.
 * The cap is not a style preference — three is the largest set that passes
 * across every pair, and any two series here can end up side by side.
 * Series are direct-labelled as well as coloured, so identity never rests on
 * colour alone.
 */

const CHART_HEIGHT = 148;
const GRID_STEPS = [100, 75, 50, 25];
const MAX_SERIES = DS.chart.maxCategorical;

function monthLabels(): string[] {
  return [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleString('en', { month: 'short' });
  });
}

export function CropDemandChart() {
  const months = useMemo(monthLabels, []);
  const topCrops = useMemo(
    () => [...CROPS].sort((a, b) => b.monthlyDemandData[0] - a.monthlyDemandData[0]).slice(0, 8),
    []
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    topCrops.slice(0, MAX_SERIES).map((c) => c.id)
  );

  const activeCrops = useMemo(
    () => topCrops.filter((c) => selectedIds.includes(c.id)).slice(0, MAX_SERIES),
    [topCrops, selectedIds]
  );

  /**
   * Colour follows the crop, not its position in the filtered list, so
   * deselecting one never repaints the others.
   */
  const colorFor = useMemo(() => {
    const map = new Map<string, string>();
    selectedIds.slice(0, MAX_SERIES).forEach((id, index) => {
      map.set(id, DS.chart.categorical[index % DS.chart.categorical.length] ?? DS.colors.primary);
    });
    return map;
  }, [selectedIds]);

  const stats = useMemo(() => {
    let peak = 0;
    let peakMonth = months[0] ?? '';
    for (const crop of activeCrops) {
      crop.monthlyDemandData.slice(0, 3).forEach((value, index) => {
        if (value > peak) {
          peak = value;
          peakMonth = months[index] ?? '';
        }
      });
    }
    const avgNext =
      activeCrops.length === 0
        ? 0
        : Math.round(
            activeCrops.reduce((sum, c) => sum + (c.monthlyDemandData[1] ?? 0), 0) /
              activeCrops.length
          );
    return { peak, peakMonth, avgNext, leader: activeCrops[0]?.name ?? '—' };
  }, [activeCrops, months]);

  const atCap = selectedIds.length >= MAX_SERIES;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        // Never leave the chart with nothing plotted.
        return prev.length <= 1 ? prev : prev.filter((x) => x !== id);
      }
      // Drops the oldest rather than silently ignoring the tap.
      return [...prev, id].slice(-MAX_SERIES);
    });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            Demand forecast
          </Text>
          {/*
            This was badged "Live". The figures come from a bundled reference
            table, so it now says what they are.
          */}
          <Text style={styles.subtitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            Demand index · next 3 months · seasonal estimate
          </Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <Kpi label="Peak index" value={String(stats.peak)} hint={stats.peakMonth} />
        <Kpi label="Next month" value={String(stats.avgNext)} hint="Average" />
        <Kpi label="Top crop" value={stats.leader.split(' ')[0] ?? '—'} hint="By demand" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}>
        {topCrops.map((crop) => {
          const active = selectedIds.includes(crop.id);
          const color = colorFor.get(crop.id);
          return (
            <Pressable
              key={crop.id}
              onPress={() => toggle(crop.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active, disabled: !active && atCap }}
              accessibilityLabel={crop.name}
              accessibilityHint={
                !active && atCap
                  ? `Adding ${crop.name} will remove the oldest of the ${MAX_SERIES} shown`
                  : undefined
              }
              style={[styles.chip, active && { borderColor: color, backgroundColor: DS.colors.surfaceMuted }]}>
              {active ? (
                <View style={[styles.swatch, { backgroundColor: color }]} />
              ) : (
                <Ionicons
                  name={getCropIcon(crop.category)}
                  size={13}
                  color={DS.colors.textSoft}
                />
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{crop.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.plot}>
        <View style={styles.grid} pointerEvents="none">
          {GRID_STEPS.map((step) => (
            <View key={step} style={[styles.gridLine, { bottom: (step / 100) * CHART_HEIGHT }]}>
              <Text style={styles.gridLabel}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.groups}>
          {months.map((month, monthIndex) => (
            <View key={month} style={styles.group}>
              <View style={styles.bars}>
                {activeCrops.map((crop) => {
                  const value = crop.monthlyDemandData[monthIndex] ?? 0;
                  const height = Math.max(4, (value / 100) * CHART_HEIGHT);
                  return (
                    <View
                      key={crop.id}
                      style={styles.barSlot}
                      accessibilityRole="text"
                      accessibilityLabel={`${crop.name}, ${month}: ${value}`}>
                      <View
                        style={[
                          styles.bar,
                          { height, backgroundColor: colorFor.get(crop.id) },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
              <Text style={styles.monthLabel}>{month}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Identity is never colour alone: every series is named beside its swatch. */}
      <View style={styles.legend}>
        {activeCrops.map((crop) => (
          <View key={crop.id} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: colorFor.get(crop.id) }]} />
            <Text style={styles.legendText}>{crop.name}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footnote} maxFontSizeMultiplier={DS.layout.maxFontScale}>
        Showing {activeCrops.length} of {MAX_SERIES}. Tap a crop to swap it in.
      </Text>
    </Card>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View
      style={styles.kpi}
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}, ${hint}`}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.kpiHint} numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: DS.spacing.sm + 4 },
  flex: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.sm },
  title: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },

  kpiRow: { flexDirection: 'row', gap: DS.spacing.sm },
  kpi: {
    flex: 1,
    gap: 1,
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.sm,
    paddingVertical: DS.spacing.sm,
    paddingHorizontal: DS.spacing.sm,
  },
  kpiLabel: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  // Values wear text tokens, never a series colour.
  kpiValue: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  kpiHint: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  chipRow: { gap: DS.spacing.sm, paddingVertical: 2, paddingRight: DS.spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: DS.radius.sm,
    borderWidth: 1,
    borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
  chipText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  chipTextActive: { color: DS.colors.text },
  swatch: { width: 10, height: 10, borderRadius: 2 },

  plot: { height: CHART_HEIGHT + 22, marginTop: DS.spacing.xs },
  grid: { ...StyleSheet.absoluteFillObject },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: DS.chart.grid,
  },
  gridLabel: {
    position: 'absolute',
    right: 0,
    top: -13,
    fontSize: 9,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textFaint,
  },

  groups: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  group: { flex: 1, alignItems: 'center', gap: 5 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    // A surface gap between adjacent fills, so two bars never read as one.
    gap: 3,
  },
  barSlot: { justifyContent: 'flex-end' },
  bar: {
    width: 16,
    // Rounded only at the data end; the baseline stays square so the bar is
    // anchored and its length remains honest.
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  monthLabel: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm + 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  footnote: {
    fontSize: 10,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
});
