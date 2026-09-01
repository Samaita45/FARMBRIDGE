import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Card } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import { MARKET_SUMMARY, MONTHLY_CATEGORY_STATS } from '@/constants/market-stats';

/**
 * Market value by category.
 *
 * Ranked shares of one total, so this is magnitude rather than identity: one
 * hue, darkest for the largest share. The previous version used five greens
 * pulled from scattered points on the ramp, which shaded the rows in an order
 * unrelated to their values.
 *
 * Every row carries its percentage as text, so the ranking never depends on
 * being able to tell two shades apart.
 */
function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

/** Darkest step for the largest share, so weight tracks magnitude. */
function rampColor(index: number, total: number): string {
  const ramp = DS.chart.sequential;
  const position = total <= 1 ? 0 : index / (total - 1);
  const step = Math.round((1 - position) * (ramp.length - 1));
  return ramp[step] ?? DS.colors.primary;
}

function CategoryRow({
  category,
  percentage,
  color,
  delay,
}: {
  category: string;
  percentage: number;
  color: string;
  delay: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 500 + delay });
  }, [delay, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${percentage * progress.value}%`,
  }));

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={`${category}: ${percentage} percent of market value`}>
      <View style={styles.rowHead}>
        <View style={styles.rowLabel}>
          <View style={[styles.swatch, { backgroundColor: color }]} />
          <Text style={styles.category} numberOfLines={1}>
            {category}
          </Text>
        </View>
        <Text style={styles.percent}>{percentage}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
}

export function MonthlyPieChart() {
  const monthName = new Date().toLocaleString('en', { month: 'long' });
  const total = MONTHLY_CATEGORY_STATS.length;

  return (
    <Card style={styles.card}>
      <View>
        <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          Market value by category
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          Zimbabwe · {monthName} · seasonal estimate
        </Text>
      </View>

      {/* The headline number, given the weight it deserves rather than a ring. */}
      <View style={styles.hero}>
        <Text style={styles.heroValue} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          {formatUSD(MARKET_SUMMARY.totalValueUSD)}
        </Text>
        <Text style={styles.heroLabel} maxFontSizeMultiplier={DS.layout.maxFontScale}>
          Total traded volume
        </Text>
      </View>

      <View style={styles.rows}>
        {MONTHLY_CATEGORY_STATS.map((item, index) => (
          <CategoryRow
            key={item.category}
            category={item.category}
            percentage={item.percentage}
            color={rampColor(index, total)}
            delay={index * 80}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: DS.spacing.md },
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

  hero: { alignItems: 'center', gap: 1 },
  heroValue: {
    fontSize: 32,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  heroLabel: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  rows: { gap: DS.spacing.sm + 2 },
  row: { gap: 5 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: DS.spacing.sm },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  category: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },
  percent: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  track: {
    height: 6,
    borderRadius: DS.radius.full,
    backgroundColor: DS.chart.track,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: DS.radius.full },
});
