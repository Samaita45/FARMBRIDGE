import { StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import { expenseShares } from '@/lib/farm-finance';
import { expenseTotalUSD, toUSD } from '@/services/financialsDb';
import { EXPENSE_CATEGORY_LABELS, type ExpenseEntry } from '@/types/financials';

interface ExpensePieBreakdownProps {
  expenses: ExpenseEntry[];
}

/**
 * Where the money went, ranked.
 *
 * Shares of one total are a magnitude, so this uses one hue darkening with
 * size. It previously assigned six unrelated hues by array position — green,
 * blue, amber, purple, pink, grey — which implied six unrelated categories and
 * had never been checked for colour-vision separation. Each row states its own
 * percentage, so the ranking never depends on telling two shades apart.
 */
function rampColor(index: number, total: number): string {
  const ramp = DS.chart.sequential;
  const position = total <= 1 ? 0 : index / (total - 1);
  const step = Math.round((1 - position) * (ramp.length - 1));
  return ramp[step] ?? DS.colors.primary;
}

export function ExpensePieBreakdown({ expenses }: ExpensePieBreakdownProps) {
  const total = expenseTotalUSD(expenses);

  if (total === 0) {
    return (
      <Card>
        <EmptyState
          icon="receipt-outline"
          title="No expenses yet"
          description="Record what you spend and this shows where the money is going."
        />
      </Card>
    );
  }

  // Each entry converts at the rate stored on it, so a rate change does not
  // rewrite past spending.
  const totals: Record<string, number> = {};
  for (const entry of expenses) {
    const usd = toUSD(entry.amount, entry.currency, entry.rateUsed);
    totals[entry.category] = (totals[entry.category] ?? 0) + usd;
  }

  const shares = expenseShares(totals);

  return (
    <Card style={styles.card}>
      <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
        Expense breakdown
      </Text>

      <View style={styles.rows}>
        {shares.map((share, index) => {
          const label =
            EXPENSE_CATEGORY_LABELS[share.category as keyof typeof EXPENSE_CATEGORY_LABELS] ??
            share.category;
          const color = rampColor(index, shares.length);

          return (
            <View
              key={share.category}
              style={styles.row}
              accessibilityRole="text"
              accessibilityLabel={`${label}: ${share.percent} percent, $${share.amountUSD}`}>
              <View style={styles.rowHead}>
                <View style={styles.rowLabel}>
                  <View style={[styles.swatch, { backgroundColor: color }]} />
                  <Text style={styles.category} numberOfLines={1}>
                    {label}
                  </Text>
                </View>
                <Text style={styles.amount}>
                  ${share.amountUSD.toLocaleString()}
                  <Text style={styles.percent}> · {share.percent}%</Text>
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[styles.fill, { width: `${share.percent}%`, backgroundColor: color }]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: DS.spacing.sm + 4 },
  title: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  rows: { gap: DS.spacing.sm + 2 },
  row: { gap: 5 },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.spacing.sm,
  },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  category: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },
  amount: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  percent: { fontFamily: DS.fontFamily.regular, color: DS.colors.textMuted },
  track: {
    height: 6,
    borderRadius: DS.radius.full,
    backgroundColor: DS.chart.track,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: DS.radius.full },
});
