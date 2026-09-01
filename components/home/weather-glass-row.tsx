import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/design-system';
import { Skeleton } from '@/components/ui/skeleton';
import { DS } from '@/constants/design-system';
import type { AgriculturalWeather, CurrentWeather } from '@/services/weatherService';

interface WeatherSummaryProps {
  current?: CurrentWeather;
  agricultural?: AgriculturalWeather;
  loading?: boolean;
  onPress?: () => void;
}

/**
 * Current conditions beside the soil readings that matter for field work.
 *
 * Both cards were translucent "glass" panels — a BlurView on iOS and a
 * semi-transparent white on Android, so the two platforms never matched. They
 * are ordinary surfaces now, and the weather glyph is an icon rather than an
 * emoji rendered as text.
 */
export function WeatherSummary({
  current,
  agricultural,
  loading,
  onPress,
}: WeatherSummaryProps) {
  if (loading || !current) {
    return (
      <View style={styles.row}>
        <Card style={styles.card}>
          <Skeleton height={14} width="50%" />
          <Skeleton height={34} width="60%" style={styles.skeletonGap} />
          <Skeleton height={12} width="80%" style={styles.skeletonGap} />
        </Card>
        <Card style={styles.card}>
          <Skeleton height={14} width="70%" />
          <Skeleton height={12} style={styles.skeletonGap} />
          <Skeleton height={12} style={styles.skeletonGap} />
        </Card>
      </View>
    );
  }

  const moisturePct = agricultural ? Math.round(agricultural.soilMoisture * 100) : null;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Current weather: ${current.temp} degrees, ${current.condition}. Open the 7-day forecast.`}
        style={({ pressed }) => [styles.flex, pressed && styles.pressed]}>
        <Card style={styles.card}>
          <Text style={styles.label}>Weather</Text>
          <Ionicons name={current.icon} size={28} color={DS.colors.primary} />
          <Text style={styles.temp} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {current.temp}
            <Text style={styles.tempUnit}>°C</Text>
          </Text>
          <Text style={styles.condition} numberOfLines={1}>
            {current.condition}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="water-outline" size={14} color={DS.colors.textSoft} />
              <Text style={styles.metaText}>{current.humidity}% humidity</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={14} color={DS.colors.textSoft} />
              <Text style={styles.metaText}>{current.windSpeed} km/h wind</Text>
            </View>
          </View>
        </Card>
      </Pressable>

      <Card style={[styles.card, styles.flex]}>
        <Text style={styles.label}>Field conditions</Text>
        {agricultural ? (
          <>
            <MetricBar
              label="Soil temp"
              value={`${agricultural.soilTemperature}°C`}
              pct={Math.min(100, (agricultural.soilTemperature / 35) * 100)}
              tone="warning"
            />
            <MetricBar
              label="Moisture"
              value={`${moisturePct}%`}
              pct={moisturePct ?? 0}
              tone="info"
            />
            <Text style={styles.insight} numberOfLines={3}>
              {agricultural.insight}
            </Text>
          </>
        ) : (
          <Text style={styles.insight}>Turn on location to see soil readings.</Text>
        )}
      </Card>
    </View>
  );
}

/** @deprecated Use `WeatherSummary`. */
export const WeatherGlassRow = WeatherSummary;

function MetricBar({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: string;
  pct: number;
  tone: keyof typeof DS.semantic;
}) {
  return (
    <View
      style={styles.metric}
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${pct}%`, backgroundColor: DS.semantic[tone].solid }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: DS.spacing.sm + 4 },
  flex: { flex: 1 },
  pressed: { opacity: 0.9 },
  card: { minHeight: 196, gap: 4 },
  skeletonGap: { marginTop: DS.spacing.sm },

  label: {
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: DS.spacing.sm,
  },
  temp: {
    fontSize: 32,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
    marginTop: 2,
  },
  tempUnit: {
    fontSize: 16,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  condition: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginBottom: DS.spacing.sm,
  },

  metaRow: { gap: 6, marginTop: 'auto' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  metric: { marginBottom: DS.spacing.sm + 2 },
  metricHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  metricLabel: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  metricValue: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  track: {
    height: 5,
    backgroundColor: DS.colors.surfaceMuted,
    borderRadius: DS.radius.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: DS.radius.full },

  insight: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 2,
  },
});
