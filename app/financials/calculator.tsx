import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Input } from '@/components/design-system';
import { BUDGET_DISCLAIMER, getCropBudget } from '@/constants/crop-budgets';
import { DS } from '@/constants/design-system';
import { CROPS } from '@/constants/zimbabwe-data';
import {
  breakEvenPricePerKg,
  calculateProductionCost,
  calculateProfit,
  forecastYield,
  rankCropProfitability,
  returnOnInvestment,
} from '@/lib/farm-finance';

const COMPARE_CROP_IDS = ['maize', 'tomatoes', 'groundnuts', 'potatoes'];

function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function ProfitCalculatorScreen() {
  const [cropId, setCropId] = useState('maize');
  const [hectares, setHectares] = useState('1');
  const [price, setPrice] = useState('');
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const crop = CROPS.find((c) => c.id === cropId);
  const budget = getCropBudget(cropId);

  const ha = num(hectares);
  const pricePerKg = num(price) || crop?.currentPriceUSD || 0;

  const field = (key: keyof typeof budget, fallback: number) =>
    overrides[key] !== undefined ? num(overrides[key]) : fallback;

  const cost = useMemo(
    () =>
      calculateProductionCost({
        hectares: ha,
        seedsPerHa: field('seedsPerHa', budget.seedsPerHa),
        fertilizerPerHa: field('fertilizerPerHa', budget.fertilizerPerHa),
        chemicalsPerHa: field('chemicalsPerHa', budget.chemicalsPerHa),
        labourPerHa: field('labourPerHa', budget.labourPerHa),
        fixedCosts: num(overrides.fixedCosts ?? '0'),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ha, budget, overrides]
  );

  const yieldForecast = useMemo(
    () =>
      forecastYield({
        hectares: ha,
        yieldPerHectareKg: field('yieldPerHectareKg', budget.yieldPerHectareKg),
        pricePerKgUSD: pricePerKg,
        lossRate: budget.lossRate,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ha, budget, pricePerKg, overrides]
  );

  const profit = calculateProfit(yieldForecast.expectedRevenueUSD, cost.totalUSD);
  const roi = returnOnInvestment(profit.netProfitUSD, cost.totalUSD);
  const breakEven = breakEvenPricePerKg(cost.totalUSD, yieldForecast.saleableYieldKg);

  const comparison = useMemo(
    () =>
      rankCropProfitability(
        COMPARE_CROP_IDS.map((id) => {
          const c = CROPS.find((x) => x.id === id);
          const b = getCropBudget(id);
          const cropCost = calculateProductionCost({
            hectares: ha,
            seedsPerHa: b.seedsPerHa,
            fertilizerPerHa: b.fertilizerPerHa,
            chemicalsPerHa: b.chemicalsPerHa,
            labourPerHa: b.labourPerHa,
            fixedCosts: 0,
          });
          const cropYield = forecastYield({
            hectares: ha,
            yieldPerHectareKg: b.yieldPerHectareKg,
            pricePerKgUSD: c?.currentPriceUSD ?? 0,
            lossRate: b.lossRate,
          });
          return {
            cropName: c?.name ?? id,
            revenueUSD: cropYield.expectedRevenueUSD,
            expensesUSD: cropCost.totalUSD,
            hectares: ha,
          };
        })
      ),
    [ha]
  );

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>
            Costs and yields start from the planting budget for the crop you pick. Change any
            figure to match your own farm.
          </Text>

          <View>
            <Text style={styles.sectionTitle}>Crop</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}>
              {COMPARE_CROP_IDS.map((id) => {
                const c = CROPS.find((x) => x.id === id);
                const active = cropId === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => {
                      setCropId(id);
                      setOverrides({});
                      setPrice('');
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={c?.name ?? id}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {c?.name ?? id}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Card style={styles.form}>
            <Input
              label="Area planted"
              icon="resize-outline"
              value={hectares}
              onChangeText={setHectares}
              keyboardType="decimal-pad"
              hint="Hectares"
            />
            <Input
              label="Selling price"
              icon="pricetag-outline"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder={crop ? crop.currentPriceUSD.toFixed(2) : '0.00'}
              hint={
                crop
                  ? `Current market price is $${crop.currentPriceUSD.toFixed(2)}/kg`
                  : 'US dollars per kilogram'
              }
            />
          </Card>

          <Card style={styles.form}>
            <Text style={styles.cardTitle}>Costs per hectare</Text>
            {(
              [
                ['seedsPerHa', 'Seeds', budget.seedsPerHa],
                ['fertilizerPerHa', 'Fertilizer', budget.fertilizerPerHa],
                ['chemicalsPerHa', 'Chemicals', budget.chemicalsPerHa],
                ['labourPerHa', 'Labour', budget.labourPerHa],
              ] as [string, string, number][]
            ).map(([key, label, fallback]) => (
              <Input
                key={key}
                label={label}
                value={overrides[key] ?? ''}
                onChangeText={(t) => setOverrides((o) => ({ ...o, [key]: t }))}
                keyboardType="decimal-pad"
                placeholder={String(fallback)}
              />
            ))}
            <Input
              label="Other fixed costs"
              value={overrides.fixedCosts ?? ''}
              onChangeText={(t) => setOverrides((o) => ({ ...o, fixedCosts: t }))}
              keyboardType="decimal-pad"
              placeholder="0"
              hint="Costs that do not scale with area"
            />
          </Card>

          <Card style={styles.result}>
            <Text style={styles.cardTitle}>Forecast</Text>
            <Metric
              label="Saleable yield"
              value={`${yieldForecast.saleableYieldKg.toLocaleString()} kg`}
              note={`After ${Math.round(budget.lossRate * 100)}% expected losses`}
            />
            <Metric label="Gross revenue" value={`$${profit.revenueUSD.toLocaleString()}`} />
            <Metric label="Total costs" value={`$${profit.expensesUSD.toLocaleString()}`} />

            <View style={styles.divider} />

            <Metric
              label="Net profit"
              value={`${profit.netProfitUSD >= 0 ? '' : '−'}$${Math.abs(profit.netProfitUSD).toLocaleString()}`}
              tone={profit.isProfitable ? 'success' : 'danger'}
              large
            />
            <Metric
              label="Margin"
              value={profit.marginPercent === null ? '—' : `${profit.marginPercent}%`}
            />
            <Metric label="Return on spend" value={roi === null ? '—' : `${roi}%`} />
            <Metric
              label="Break-even price"
              value={breakEven === null ? '—' : `$${breakEven.toFixed(2)}/kg`}
              note={
                breakEven !== null && pricePerKg > 0 && breakEven > pricePerKg
                  ? 'Above the market price — this crop loses money at these figures'
                  : undefined
              }
              tone={
                breakEven !== null && pricePerKg > 0 && breakEven > pricePerKg
                  ? 'danger'
                  : undefined
              }
            />
          </Card>

          <Card style={styles.result}>
            <Text style={styles.cardTitle}>
              If you planted {ha || 1} ha of something else
            </Text>
            {comparison.map((line, index) => (
              <View key={line.cropName} style={styles.compareRow}>
                <Text style={styles.compareRank}>{index + 1}</Text>
                <Text style={styles.compareName}>{line.cropName}</Text>
                <Text
                  style={[
                    styles.compareValue,
                    {
                      color:
                        line.netProfitUSD >= 0
                          ? DS.semantic.success.fg
                          : DS.semantic.danger.fg,
                    },
                  ]}>
                  {line.netProfitUSD >= 0 ? '+' : '−'}$
                  {Math.abs(line.netProfitUSD).toLocaleString()}
                </Text>
              </View>
            ))}
          </Card>

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={14} color={DS.colors.textSoft} />
            <Text style={styles.disclaimerText}>{BUDGET_DISCLAIMER}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
  large,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: 'success' | 'danger';
  large?: boolean;
}) {
  return (
    <View style={styles.metric} accessibilityRole="summary" accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text
          style={[
            large ? styles.metricValueLarge : styles.metricValue,
            tone ? { color: DS.semantic[tone].fg } : null,
          ]}>
          {value}
        </Text>
      </View>
      {note ? <Text style={styles.metricNote}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  flex: { flex: 1 },
  body: { padding: DS.spacing.md, paddingBottom: DS.spacing.xl, gap: DS.spacing.md },

  intro: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  chipRow: { gap: DS.spacing.sm, paddingRight: DS.spacing.xs },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  chipActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  chipText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  chipTextActive: { color: DS.colors.textInverse },

  form: { gap: DS.spacing.sm + 4 },
  cardTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },

  result: { gap: DS.spacing.sm },
  metric: { gap: 2 },
  metricHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: DS.spacing.sm },
  metricLabel: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  metricValue: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  metricValueLarge: {
    fontSize: DS.typography.h1.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  metricNote: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
  divider: {
    height: 1,
    backgroundColor: DS.colors.borderLight,
    marginVertical: DS.spacing.xs,
  },

  compareRow: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  compareRank: {
    width: 18,
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textFaint,
  },
  compareName: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },
  compareValue: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
  },

  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
});
