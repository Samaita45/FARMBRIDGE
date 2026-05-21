import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, FadeInView, GlassCard, SectionHeader } from '@/components/design-system';
import { Screen } from '@/components/ui/screen';
import { DS } from '@/constants/design-system';
import { CROPS } from '@/constants/zimbabwe-data';

function calc(
  yieldKg: number,
  pricePerKg: number,
  seed: number,
  fertilizer: number,
  labor: number,
  transport: number,
  other: number,
) {
  const gross = yieldKg * pricePerKg;
  const costs = seed + fertilizer + labor + transport + other;
  const net = gross - costs;
  const roi = costs > 0 ? (net / costs) * 100 : 0;
  const breakEven = yieldKg > 0 ? costs / yieldKg : 0;
  return { gross, costs, net, roi, breakEven };
}

const INPUTS = [
  { key: 'hectares', label: 'Hectares', placeholder: '1' },
  { key: 'yieldKg', label: 'Expected yield (kg)', placeholder: '8000' },
  { key: 'pricePerKg', label: 'Market price ($/kg)', placeholder: '0.85' },
  { key: 'seed', label: 'Seed cost ($)', placeholder: '120' },
  { key: 'fertilizer', label: 'Fertilizer ($)', placeholder: '350' },
  { key: 'labor', label: 'Labor ($)', placeholder: '200' },
  { key: 'transport', label: 'Transport ($)', placeholder: '60' },
  { key: 'other', label: 'Other costs ($)', placeholder: '80' },
] as const;

export default function ProfitCalculatorScreen() {
  const [values, setValues] = useState<Record<string, string>>({
    hectares: '1',
    yieldKg: '8000',
    pricePerKg: '0.85',
    seed: '120',
    fertilizer: '350',
    labor: '200',
    transport: '60',
    other: '80',
  });

  const h = parseFloat(values.hectares) || 0;
  const y = (parseFloat(values.yieldKg) || 0) * h;
  const p = parseFloat(values.pricePerKg) || 0;

  const result = useMemo(
    () =>
      calc(
        y,
        p,
        parseFloat(values.seed) || 0,
        parseFloat(values.fertilizer) || 0,
        parseFloat(values.labor) || 0,
        parseFloat(values.transport) || 0,
        parseFloat(values.other) || 0,
      ),
    [y, p, values],
  );

  const tomato = CROPS.find((c) => c.id === 'tomatoes');
  const maize = CROPS.find((c) => c.id === 'maize');

  return (
    <Screen scroll contentContainerStyle={styles.scroll}>
      <SectionHeader
        title="Farm profit calculator"
        subtitle="ROI, break-even, and crop comparison"
        icon="calculator-outline"
      />

      <GlassCard style={styles.form}>
        {INPUTS.map((field, i) => (
          <FadeInView key={field.key} delay={i}>
            <AppText variant="label" muted style={styles.label}>
              {field.label}
            </AppText>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder={field.placeholder}
              placeholderTextColor={DS.colors.textSoft}
              value={values[field.key]}
              onChangeText={(t) => setValues((v) => ({ ...v, [field.key]: t }))}
            />
          </FadeInView>
        ))}
      </GlassCard>

      <FadeInView delay={4}>
        <GlassCard elevated style={styles.summary}>
          <AppText variant="h2" style={styles.summaryTitle}>
            Forecast
          </AppText>
          <MetricRow label="Gross revenue" value={`$${result.gross.toFixed(0)}`} />
          <MetricRow label="Total costs" value={`$${result.costs.toFixed(0)}`} />
          <MetricRow
            label="Net profit"
            value={`$${result.net.toFixed(0)}`}
            highlight={result.net >= 0}
          />
          <MetricRow label="ROI" value={`${result.roi.toFixed(1)}%`} accent />
          <MetricRow label="Break-even price" value={`$${result.breakEven.toFixed(2)}/kg`} />
        </GlassCard>
      </FadeInView>

      {tomato && maize ? (
        <FadeInView delay={5}>
          <GlassCard style={styles.compare}>
            <AppText variant="h3">Crop comparison (per ha)</AppText>
            <CompareRow
              crop="Tomatoes"
              net={
                calc(
                  12000 * h,
                  tomato.currentPriceUSD,
                  150 * h,
                  400 * h,
                  250 * h,
                  80 * h,
                  100 * h,
                ).net
              }
            />
            <CompareRow
              crop="Maize"
              net={
                calc(
                  5000 * h,
                  maize.currentPriceUSD,
                  80 * h,
                  300 * h,
                  200 * h,
                  50 * h,
                  80 * h,
                ).net
              }
            />
          </GlassCard>
        </FadeInView>
      ) : null}
    </Screen>
  );
}

function MetricRow({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={styles.metricRow}>
      <AppText variant="bodySm" muted>
        {label}
      </AppText>
      <AppText
        variant="h3"
        color={
          accent
            ? DS.colors.primary
            : highlight === false
              ? DS.colors.red
              : highlight
                ? DS.colors.accent
                : DS.colors.text
        }>
        {value}
      </AppText>
    </View>
  );
}

function CompareRow({ crop, net }: { crop: string; net: number }) {
  return (
    <View style={styles.compareRow}>
      <AppText variant="bodySm">{crop}</AppText>
      <AppText variant="bodySm" color={net >= 0 ? DS.colors.accent : DS.colors.red}>
        ${net.toFixed(0)} net
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: DS.spacing.md, paddingBottom: 48 },
  form: { marginBottom: DS.spacing.md },
  label: { marginTop: DS.spacing.sm, marginBottom: 4 },
  input: {
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.md,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: DS.colors.text,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  summary: { marginBottom: DS.spacing.md },
  summaryTitle: { marginBottom: DS.spacing.md },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.borderLight,
  },
  compare: { gap: 8 },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
  },
});
