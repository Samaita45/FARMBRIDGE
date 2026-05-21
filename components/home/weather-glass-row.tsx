import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Premium } from '@/constants/premium-home';
import type { AgriculturalWeather, CurrentWeather } from '@/services/weatherService';

interface WeatherGlassRowProps {
  current?: CurrentWeather;
  agricultural?: AgriculturalWeather;
  loading?: boolean;
  onPress?: () => void;
}

function GlassCard({ children, style }: { children: ReactNode; style?: object }) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={55} tint="light" style={[styles.glass, style]}>
        {children}
      </BlurView>
    );
  }
  return <View style={[styles.glass, styles.glassAndroid, style]}>{children}</View>;
}

export function WeatherGlassRow({
  current,
  agricultural,
  loading,
  onPress,
}: WeatherGlassRowProps) {
  if (loading || !current) {
    return (
      <View style={styles.row}>
        <View style={[styles.glass, styles.glassAndroid, styles.skeleton]} />
        <View style={[styles.glass, styles.glassAndroid, styles.skeleton]} />
      </View>
    );
  }

  const moisturePct = agricultural
    ? Math.round(agricultural.soilMoisture * 100)
    : null;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardPress, pressed && { opacity: 0.92 }]}>
        <GlassCard>
          <Text style={styles.cardLabel}>Weather</Text>
          <Text style={styles.weatherIcon}>{current.icon}</Text>
          <Text style={styles.temp}>
            {current.temp}
            <Text style={styles.tempUnit}>°C</Text>
          </Text>
          <Text style={styles.condition} numberOfLines={1}>
            {current.condition}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="water-outline" size={14} color={Premium.primary} />
              <Text style={styles.metaText}>{current.humidity}%</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flag-outline" size={14} color={Premium.purple} />
              <Text style={styles.metaText}>{current.windSpeed ?? 12} km/h</Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>

      <View style={styles.cardPress}>
        <GlassCard>
        <Text style={styles.cardLabel}>Farm Conditions</Text>
        {agricultural ? (
          <>
            <MetricBar
              label="Soil temp"
              value={`${agricultural.soilTemperature}°C`}
              pct={Math.min(100, (agricultural.soilTemperature / 35) * 100)}
              color={Premium.orange}
            />
            <MetricBar
              label="Moisture"
              value={`${moisturePct}%`}
              pct={moisturePct ?? 0}
              color={Premium.primary}
            />
            <Text style={styles.insight} numberOfLines={3}>
              {agricultural.insight}
            </Text>
          </>
        ) : (
          <Text style={styles.insight}>Enable location for soil insights.</Text>
        )}
        </GlassCard>
      </View>
    </View>
  );
}

function MetricBar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  cardPress: { flex: 1 },
  glass: {
    flex: 1,
    borderRadius: Premium.radiusLg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    overflow: 'hidden',
    minHeight: 210,
    ...Premium.shadow,
  },
  glassAndroid: {
    backgroundColor: Premium.surfaceGlass,
  },
  skeleton: { backgroundColor: '#E2E8F0', minHeight: 200 },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Premium.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  weatherIcon: { fontSize: 36, marginBottom: 4 },
  temp: { fontSize: 36, fontWeight: '800', color: Premium.text, letterSpacing: -1 },
  tempUnit: { fontSize: 18, fontWeight: '600', color: Premium.textMuted },
  condition: { fontSize: 12, color: Premium.textMuted, marginBottom: 12 },
  metaRow: { gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '700', color: Premium.text },
  metric: { marginBottom: 12 },
  metricHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metricLabel: { fontSize: 11, color: Premium.textMuted, fontWeight: '600' },
  metricValue: { fontSize: 12, fontWeight: '800', color: Premium.text },
  track: {
    height: 6,
    backgroundColor: 'rgba(15,23,42,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
  insight: { fontSize: 11, color: Premium.textMuted, lineHeight: 16, marginTop: 4 },
});
