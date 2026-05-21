import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Premium } from '@/constants/premium-home';
import { CROPS } from '@/constants/zimbabwe-data';
import { getCropIcon } from '@/utils/crop-emoji';
const CROP_PALETTE: { color: string; gradient: [string, string] }[] = [
  { color: '#2563EB', gradient: ['#60A5FA', '#2563EB'] },
  { color: '#16A34A', gradient: ['#4ADE80', '#16A34A'] },
  { color: '#F97316', gradient: ['#FDBA74', '#F97316'] },
  { color: '#8B5CF6', gradient: ['#C4B5FD', '#8B5CF6'] },
  { color: '#0EA5E9', gradient: ['#7DD3FC', '#0EA5E9'] },
];

const CHART_HEIGHT = 156;
const GRID_LINES = [100, 75, 50, 25];

function monthLabels(): string[] {
  return [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleString('en', { month: 'short' });
  });
}

function GradientBar({
  heightPct,
  gradient,
  width,
}: {
  heightPct: number;
  gradient: [string, string];
  width: number;
}) {
  const h = Math.max(8, (heightPct / 100) * CHART_HEIGHT);
  return (
    <View style={[barStyles.slot, { width }]}>
      <View style={[barStyles.track, { height: CHART_HEIGHT }]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[barStyles.fill, { height: h }]}
        />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  slot: { alignItems: 'center', justifyContent: 'flex-end' },
  track: {
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  fill: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
});

export function CropDemandChart() {
  const topCrops = useMemo(
    () => [...CROPS].sort((a, b) => b.monthlyDemandData[0] - a.monthlyDemandData[0]).slice(0, 5),
    [],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() => topCrops.map((c) => c.id));

  const months = useMemo(() => monthLabels(), []);
  const activeCrops = useMemo(
    () => topCrops.filter((c) => selectedIds.includes(c.id)),
    [topCrops, selectedIds],
  );

  const colorByCropId = useMemo(() => {
    const map: Record<string, (typeof CROP_PALETTE)[0]> = {};
    topCrops.forEach((c, i) => {
      map[c.id] = CROP_PALETTE[i % CROP_PALETTE.length];
    });
    return map;
  }, [topCrops]);

  const stats = useMemo(() => {
    let peak = 0;
    let peakMonth = months[0];
    activeCrops.forEach((crop) => {
      crop.monthlyDemandData.slice(0, 3).forEach((d, mi) => {
        if (d > peak) {
          peak = d;
          peakMonth = months[mi];
        }
      });
    });
    const leader = activeCrops[0]?.name ?? '—';
    const avgNext =
      activeCrops.length === 0
        ? 0
        : Math.round(
            activeCrops.reduce((s, c) => s + c.monthlyDemandData[1], 0) / activeCrops.length,
          );
    return { peak, peakMonth, leader, avgNext };
  }, [activeCrops, months]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id].slice(-5);
    });
  };

  const barWidth = activeCrops.length > 0 ? Math.max(14, (100 / activeCrops.length) * 0.9) : 20;

  return (
    <View style={s.card}>
      <LinearGradient
        colors={['#EFF6FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={s.cardGradient}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerIcon}>
              <Ionicons name="analytics" size={20} color={Premium.primary} />
            </View>
            <View>
              <Text style={s.title}>Demand Forecast</Text>
              <Text style={s.subtitle}>Monthly demand index · next 3 months</Text>
            </View>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeText}>Live</Text>
          </View>
        </View>

        {/* KPI strip */}
        <View style={s.kpiRow}>
          <KpiTile
            icon="flame"
            iconColor={Premium.orange}
            label="Peak index"
            value={`${stats.peak}`}
            hint={stats.peakMonth}
          />
          <KpiTile
            icon="trending-up"
            iconColor={Premium.green}
            label="Next month avg"
            value={`${stats.avgNext}`}
            hint="Across selected"
          />
          <KpiTile
            icon="leaf"
            iconColor={Premium.primary}
            label="Top crop"
            value={stats.leader.split(' ')[0]}
            hint="By demand"
          />
        </View>

        {/* Crop filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipScroll}>
          {topCrops.map((crop) => {
            const active = selectedIds.includes(crop.id);
            const palette = colorByCropId[crop.id];
            return (
              <Pressable
                key={crop.id}
                onPress={() => toggle(crop.id)}
                style={({ pressed }) => [
                  s.chip,
                  active && { backgroundColor: palette.color, borderColor: palette.color },
                  pressed && { opacity: 0.88 },
                ]}>
                {active ? (
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                ) : (
                  <Ionicons
                    name={getCropIcon(crop.category) as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={Premium.primary}
                  />
                )}
                <Text style={[s.chipText, active && s.chipTextActive]}>{crop.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Chart */}
        <View style={s.chartWrap}>
          <View style={s.yAxis}>
            {GRID_LINES.map((v) => (
              <Text key={v} style={s.yLabel}>
                {v}
              </Text>
            ))}
          </View>
          <View style={s.chartMain}>
            <View style={s.grid}>
              {GRID_LINES.map((v) => (
                <View key={v} style={s.gridLine} />
              ))}
            </View>
            <View style={s.barsRow}>
              {months.map((monthLabel, mi) => (
                <View key={monthLabel} style={s.monthCol}>
                  <View style={s.monthBars}>
                    {activeCrops.map((crop) => {
                      const demand =
                        crop.monthlyDemandData[(new Date().getMonth() + mi) % 12] ?? 0;
                      const palette = colorByCropId[crop.id];
                      return (
                        <GradientBar
                          key={`${crop.id}-${mi}`}
                          heightPct={demand}
                          gradient={palette.gradient}
                          width={barWidth}
                        />
                      );
                    })}
                  </View>
                  <Text style={s.monthLabel}>{monthLabel}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Legend */}
        <View style={s.legend}>
          {activeCrops.map((crop) => {
            const palette = colorByCropId[crop.id];
            return (
              <View key={crop.id} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: palette.color }]} />
                <Text style={s.legendText} numberOfLines={1}>
                  {crop.name}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={s.hint}>
          Tap crops to compare · Index 0–100 reflects expected market demand
        </Text>
      </LinearGradient>
    </View>
  );
}

function KpiTile({
  icon,
  iconColor,
  label,
  value,
  hint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <View style={s.kpi}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={s.kpiValue}>{value}</Text>
      <Text style={s.kpiHint} numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: Premium.radiusXl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.95)',
    ...Premium.shadow,
  },
  cardGradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Premium.shadowSoft,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Premium.text,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 12, color: Premium.textMuted, marginTop: 2 },
  badge: {
    backgroundColor: Premium.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: Premium.green, letterSpacing: 0.5 },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpi: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: Premium.radiusSm,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    gap: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Premium.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kpiValue: { fontSize: 20, fontWeight: '800', color: Premium.text, letterSpacing: -0.5 },
  kpiHint: { fontSize: 10, color: Premium.textSoft, fontWeight: '500' },

  chipScroll: { gap: 8, paddingBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: Premium.textMuted },
  chipTextActive: { color: '#fff' },

  chartWrap: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  yAxis: {
    width: 28,
    height: CHART_HEIGHT + 24,
    justifyContent: 'space-between',
    paddingBottom: 22,
  },
  yLabel: { fontSize: 9, fontWeight: '600', color: Premium.textSoft, textAlign: 'right' },
  chartMain: { flex: 1, position: 'relative' },
  grid: {
    ...StyleSheet.absoluteFillObject,
    bottom: 22,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.25)',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 24,
    paddingLeft: 4,
  },
  monthCol: { flex: 1, alignItems: 'center' },
  monthBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: CHART_HEIGHT,
  },
  monthLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
    color: Premium.text,
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.9)',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '48%' },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600', color: Premium.textMuted },

  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: Premium.textSoft,
    lineHeight: 16,
  },
});
