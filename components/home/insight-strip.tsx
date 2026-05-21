import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Premium } from '@/constants/premium-home';

export interface InsightItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  trend?: string;
  colors: [string, string];
  accent: string;
}

interface InsightStripProps {
  items: InsightItem[];
}

export function InsightStrip({ items }: InsightStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {items.map((item, index) => (
        <MotiView
          key={item.id}
          from={{ opacity: 0, translateX: 16 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 0.35, delay: index * 0.06 }}>
          <LinearGradient
            colors={item.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}>
            <View style={[styles.iconWrap, { borderColor: item.accent + '33' }]}>
              <Ionicons name={item.icon} size={20} color={item.accent} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
            {item.trend ? (
              <View style={styles.trendRow}>
                <View style={[styles.trendDot, { backgroundColor: item.accent }]} />
                <Ionicons name="pulse" size={11} color={item.accent} />
                <Text style={[styles.trend, { color: item.accent }]}>{item.trend}</Text>
              </View>
            ) : null}
          </LinearGradient>
        </MotiView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 14, paddingRight: 8, paddingVertical: 4 },
  card: {
    width: 148,
    borderRadius: Premium.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    ...Premium.shadowSoft,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Premium.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: Premium.text,
    letterSpacing: -0.5,
  },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  trendDot: { width: 6, height: 6, borderRadius: 3 },
  trend: { fontSize: 11, fontWeight: '700' },
});
