import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { FERTILIZER_RECOMMENDATIONS, CROPS } from '@/constants/zimbabwe-data';
import { getCropIcon } from '@/utils/crop-emoji';

const SOIL_TYPES = ['Sandy', 'Clay', 'Loam', 'Sandy-Loam', 'Clay-Loam'] as const;
const PH_LEVELS = [4.5, 5.5, 6.5, 7.5, 8.5];

export default function SoilScreen() {
  const [soilType, setSoilType] = useState<string>('Loam');
  const [ph, setPh] = useState(6.5);
  const [cropId, setCropId] = useState('maize');

  const crop = CROPS.find((c) => c.id === cropId);
  const recommendation = useMemo(() => {
    const cropRec = FERTILIZER_RECOMMENDATIONS[cropId];
    if (!cropRec) return null;
    return cropRec[soilType] ?? cropRec['Loam'] ?? Object.values(cropRec)[0];
  }, [cropId, soilType]);

  const phLabel = ph < 5.5 ? 'Acidic' : ph < 6.5 ? 'Slightly Acidic' : ph < 7.5 ? 'Neutral' : 'Alkaline';
  const phColor = ph < 5.5 ? Colors.error : ph < 6.5 ? '#f59e0b' : ph < 7.5 ? Colors.accent : '#0ea5e9';

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View>
          <View style={s.headerTitleRow}>
            <Ionicons name="water" size={22} color="#fff" />
            <Text style={s.headerTitle}>Soil & Fertilizer</Text>
          </View>
          <Text style={s.headerSub}>NPK recommendations for your crops</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Soil type */}
        <Text style={s.sectionTitle}>Select Soil Type</Text>
        <View style={s.soilTypes}>
          {SOIL_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => setSoilType(type)}
              style={[s.soilChip, soilType === type && s.soilChipActive]}>
              <Text style={[s.soilChipText, soilType === type && s.soilChipTextActive]}>{type}</Text>
            </Pressable>
          ))}
        </View>

        {/* pH slider */}
        <View style={s.card}>
          <View style={s.phHeader}>
            <Text style={s.phTitle}>pH Level</Text>
            <View style={[s.phBadge, { backgroundColor: phColor + '20' }]}>
              <Text style={[s.phBadgeText, { color: phColor }]}>{ph.toFixed(1)} — {phLabel}</Text>
            </View>
          </View>
          <View style={s.phLevels}>
            {PH_LEVELS.map((level) => {
              const active = Math.abs(ph - level) < 0.6;
              return (
                <Pressable
                  key={level}
                  onPress={() => setPh(level)}
                  style={[s.phLevel, active && { backgroundColor: phColor }]}>
                  <Text style={[s.phLevelText, active && { color: '#fff', fontWeight: '800' }]}>
                    {level}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={s.phTrack}>
            <View style={[s.phFill, { width: `${((ph - 4) / 5) * 100}%`, backgroundColor: phColor }]} />
          </View>
        </View>

        {/* Crop selector */}
        <Text style={s.sectionTitle}>Select Crop</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cropRow}>
          {Object.keys(FERTILIZER_RECOMMENDATIONS).map((id) => {
            const c = CROPS.find((x) => x.id === id);
            const active = cropId === id;
            return (
              <Pressable
                key={id}
                onPress={() => setCropId(id)}
                style={[s.cropChip, active && s.cropChipActive]}>
                <Ionicons
                  name={getCropIcon(c?.category) as keyof typeof Ionicons.glyphMap}
                  size={13}
                  color={active ? '#fff' : Colors.primary}
                />
                <Text style={[s.cropChipText, active && s.cropChipTextActive]}>
                  {c?.name ?? id}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Fertilizer plan */}
        {recommendation ? (
          <View style={s.card}>
            <View style={s.planHeader}>
              <View style={s.planIconWrap}>
                <Ionicons name="flask" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={s.planTitle}>Fertilizer Plan</Text>
                <Text style={s.planSub}>For {crop?.name} on {soilType} soil</Text>
              </View>
            </View>
            {[
              { label: 'NPK ratio', value: recommendation.npk, icon: 'analytics-outline' as const },
              { label: 'Products', value: recommendation.products.join(', '), icon: 'bag-outline' as const },
              { label: 'Application rate', value: recommendation.ratePerHa, icon: 'speedometer-outline' as const },
              { label: 'Schedule', value: recommendation.schedule, icon: 'calendar-outline' as const },
              { label: 'Estimated cost', value: `$${recommendation.costUSD} / ZWG ${recommendation.costZWG}`, icon: 'cash-outline' as const },
            ].map((row) => (
              <View key={row.label} style={s.planRow}>
                <Ionicons name={row.icon} size={15} color={Colors.textSecondary} style={s.planRowIcon} />
                <View style={s.planRowContent}>
                  <Text style={s.planRowLabel}>{row.label}</Text>
                  <Text style={s.planRowValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.noDataCard}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={s.noDataText}>No fertilizer data for this crop yet. Try maize, tomatoes, tobacco, or beans.</Text>
          </View>
        )}

        {/* Soil tips */}
        <View style={s.tipsCard}>
          <View style={s.tipsHeader}>
            <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
            <Text style={s.tipsTitle}>Soil Health Tips</Text>
          </View>
          {[
            'Test soil every 2–3 seasons through Agritex extension offices',
            'Add compost or manure to sandy soils to improve water retention',
            'Lime acidic soils (pH below 5.5) before planting maize or cabbage',
            'Rotate legumes after cereals to restore nitrogen naturally',
          ].map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <View style={s.tipDot} />
              <Text style={s.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Marketplace CTA */}
        <Link href="/(tabs)/market" asChild>
          <Pressable style={({ pressed }) => [s.marketBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="storefront-outline" size={18} color="#fff" />
            <Text style={s.marketBtnText}>Find Fertilizer Suppliers in Marketplace</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },

  header: {
    backgroundColor: '#0ea5e9', flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  body: { padding: 16, paddingBottom: 40, gap: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  soilTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  soilChip: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.gray[200] },
  soilChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  soilChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  soilChipTextActive: { color: '#fff' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: Colors.gray[100],
  },
  phHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  phTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  phBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  phBadgeText: { fontSize: 12, fontWeight: '700' },
  phLevels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  phLevel: { width: 44, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray[100] },
  phLevelText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  phTrack: { height: 6, backgroundColor: Colors.gray[100], borderRadius: 4, overflow: 'hidden' },
  phFill: { height: '100%', borderRadius: 4 },

  cropRow: { gap: 8, paddingRight: 4 },
  cropChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.gray[200] },
  cropChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cropChipText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  cropChipTextActive: { color: '#fff' },

  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  planTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  planSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  planRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  planRowIcon: { marginTop: 2 },
  planRowContent: { flex: 1 },
  planRowLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  planRowValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },

  noDataCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.gray[100], borderRadius: 12, padding: 14,
  },
  noDataText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  tipsCard: { backgroundColor: Colors.primaryBg, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: Colors.primaryMid },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 6 },
  tipText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  marketBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14,
  },
  marketBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
