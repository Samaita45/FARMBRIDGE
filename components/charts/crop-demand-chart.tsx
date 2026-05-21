import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/colors';
import { CROPS } from '@/constants/zimbabwe-data';
import { getCropEmoji } from '@/utils/crop-emoji';

const BAR_COLORS = [Colors.primary, Colors.accent, '#f59e0b', '#8b5cf6', '#0ea5e9'];

function Bar({ heightPct, color, label }: { heightPct: number; color: string; label: string }) {
  return (
    <View style={b.col}>
      <View style={b.track}>
        <View style={[b.fill, { height: `${Math.max(4, heightPct)}%`, backgroundColor: color }]} />
      </View>
      {label ? <Text style={b.label} numberOfLines={1}>{label}</Text> : <View style={b.spacer} />}
    </View>
  );
}

const b = StyleSheet.create({
  col: { flex: 1, alignItems: 'center' },
  track: { flex: 1, width: '65%', backgroundColor: Colors.gray[100], borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', borderRadius: 6 },
  label: { fontSize: 9, color: Colors.textSecondary, marginTop: 3, textAlign: 'center' },
  spacer: { height: 14 },
});

export function CropDemandChart() {
  const topCrops = useMemo(
    () => [...CROPS].sort((a, b) => b.monthlyDemandData[0] - a.monthlyDemandData[0]).slice(0, 5),
    []
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(topCrops.map((c) => c.id));

  const toggle = (id: string) => setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-5)
  );

  const months = [0, 1, 2].map((offset) => {
    const d = new Date(); d.setMonth(d.getMonth() + offset);
    return d.toLocaleString('en', { month: 'short' });
  });

  const activeCrops = topCrops.filter((c) => selectedIds.includes(c.id));

  return (
    <View style={s.card}>
      <Text style={s.title}>Demand Forecast — Next 3 Months</Text>

      {/* Chip filters */}
      <View style={s.chips}>
        {topCrops.map((crop, i) => {
          const active = selectedIds.includes(crop.id);
          return (
            <Pressable
              key={crop.id}
              onPress={() => toggle(crop.id)}
              style={[s.chip, active && { backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]}>
              <Text style={[s.chipText, active && s.chipTextActive]}>
                {getCropEmoji(crop.id)} {crop.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Bar chart */}
      <View style={s.chartArea}>
        {months.map((monthLabel, mi) => (
          <View key={monthLabel} style={s.monthGroup}>
            {activeCrops.map((crop, ci) => {
              const demand = crop.monthlyDemandData[(new Date().getMonth() + mi) % 12];
              return (
                <Bar
                  key={`${crop.id}-${mi}`}
                  heightPct={demand}
                  color={BAR_COLORS[ci % BAR_COLORS.length]}
                  label={mi === 2 ? crop.name.slice(0, 3) : ''}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Month labels */}
      <View style={s.monthRow}>
        {months.map((m) => (
          <Text key={m} style={s.monthLabel}>{m}</Text>
        ))}
      </View>

      <Text style={s.hint}>Tap chips to filter crops · Bars show demand index (0–100)</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: Colors.gray[100],
  },
  title: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  chip: {
    backgroundColor: Colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  chartArea: {
    flexDirection: 'row',
    height: 130,
    gap: 6,
  },
  monthGroup: { flex: 1, flexDirection: 'row', gap: 2, alignItems: 'flex-end' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 6 },
  monthLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  hint: { marginTop: 8, textAlign: 'center', fontSize: 10, color: Colors.gray[400] },
});
