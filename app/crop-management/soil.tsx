import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import { CROPS, FERTILIZER_RECOMMENDATIONS } from '@/constants/zimbabwe-data';
import type { IconName } from '@/types/icons';
import { getCropIcon } from '@/utils/crop-emoji';

const SOIL_TYPES = ['Sandy', 'Clay', 'Loam', 'Sandy-Loam', 'Clay-Loam'] as const;
const PH_LEVELS = [4.5, 5.5, 6.5, 7.5, 8.5];
const MOISTURE_LEVELS = [25, 40, 55, 70, 85];

type Tone = keyof typeof DS.semantic;

function phTone(ph: number): { label: string; tone: Tone } {
  if (ph < 5.5) return { label: 'Acidic', tone: 'danger' };
  if (ph < 6.5) return { label: 'Slightly acidic', tone: 'warning' };
  if (ph < 7.5) return { label: 'Neutral', tone: 'success' };
  return { label: 'Alkaline', tone: 'info' };
}

function moistureAdvice(moisture: number): { label: string; tone: Tone } {
  if (moisture < 40) return { label: 'Dry — increase irrigation', tone: 'warning' };
  if (moisture > 70) return { label: 'Wet — reduce watering', tone: 'info' };
  return { label: 'Optimal range', tone: 'success' };
}

export default function SoilScreen() {
  const [soilType, setSoilType] = useState<string>('Loam');
  const [ph, setPh] = useState(6.5);
  const [cropId, setCropId] = useState('maize');
  const [moisture, setMoisture] = useState(55);

  const crop = CROPS.find((c) => c.id === cropId);

  const recommendation = useMemo(() => {
    const cropRec = FERTILIZER_RECOMMENDATIONS[cropId];
    if (!cropRec) return null;
    return cropRec[soilType] ?? cropRec['Loam'] ?? Object.values(cropRec)[0];
  }, [cropId, soilType]);

  const phState = phTone(ph);
  const phColour = DS.semantic[phState.tone];
  const moistureState = moistureAdvice(moisture);
  const moistureColour = DS.semantic[moistureState.tone];

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Pick your conditions to get an NPK plan matched to the crop and soil.
        </Text>

        <View>
          <Text style={styles.sectionTitle}>Soil type</Text>
          <View style={styles.chipWrap}>
            {SOIL_TYPES.map((type) => {
              const active = soilType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setSoilType(type)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${type} soil`}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{type}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Soil moisture</Text>
            <View style={[styles.badge, { backgroundColor: moistureColour.bg, borderColor: moistureColour.border }]}>
              <Text style={[styles.badgeText, { color: moistureColour.fg }]}>{moisture}%</Text>
            </View>
          </View>

          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityLabel="Soil moisture"
            accessibilityValue={{ min: 0, max: 100, now: moisture }}>
            <View
              style={[styles.fill, { width: `${moisture}%`, backgroundColor: moistureColour.solid }]}
            />
          </View>

          <Text style={[styles.advice, { color: moistureColour.fg }]}>{moistureState.label}</Text>

          <View style={styles.levelRow}>
            {MOISTURE_LEVELS.map((m) => {
              const active = Math.abs(moisture - m) < 8;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMoisture(m)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Set soil moisture to ${m} percent`}
                  style={[styles.level, active && styles.levelActive]}>
                  <Text style={[styles.levelText, active && styles.levelTextActive]}>{m}%</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>pH level</Text>
            <View style={[styles.badge, { backgroundColor: phColour.bg, borderColor: phColour.border }]}>
              <Text style={[styles.badgeText, { color: phColour.fg }]}>
                {ph.toFixed(1)} · {phState.label}
              </Text>
            </View>
          </View>

          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityLabel="Soil pH"
            accessibilityValue={{ min: 4, max: 9, now: ph }}>
            <View
              style={[
                styles.fill,
                { width: `${((ph - 4) / 5) * 100}%`, backgroundColor: phColour.solid },
              ]}
            />
          </View>

          <View style={styles.levelRow}>
            {PH_LEVELS.map((level) => {
              const active = Math.abs(ph - level) < 0.6;
              return (
                <Pressable
                  key={level}
                  onPress={() => setPh(level)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Set pH to ${level}`}
                  style={[styles.level, active && styles.levelActive]}>
                  <Text style={[styles.levelText, active && styles.levelTextActive]}>{level}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <View>
          <Text style={styles.sectionTitle}>Crop</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cropRow}>
            {Object.keys(FERTILIZER_RECOMMENDATIONS).map((id) => {
              const c = CROPS.find((x) => x.id === id);
              const active = cropId === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setCropId(id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={c?.name ?? id}
                  style={[styles.cropChip, active && styles.chipActive]}>
                  <Ionicons
                    name={getCropIcon(c?.category)}
                    size={14}
                    color={active ? DS.colors.textInverse : DS.colors.primary}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {c?.name ?? id}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {recommendation ? (
          <Card style={styles.card}>
            <View style={styles.planHeader}>
              <View style={styles.planIcon}>
                <Ionicons name="flask-outline" size={20} color={DS.colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>Fertilizer plan</Text>
                <Text style={styles.planSub}>
                  {crop?.name} on {soilType} soil
                </Text>
              </View>
            </View>

            {(
              [
                { label: 'NPK ratio', value: recommendation.npk, icon: 'analytics-outline' },
                { label: 'Products', value: recommendation.products.join(', '), icon: 'bag-outline' },
                { label: 'Application rate', value: recommendation.ratePerHa, icon: 'speedometer-outline' },
                { label: 'Schedule', value: recommendation.schedule, icon: 'calendar-outline' },
                {
                  label: 'Estimated cost',
                  value: `$${recommendation.costUSD} · ZWG ${recommendation.costZWG}`,
                  icon: 'cash-outline',
                },
              ] as { label: string; value: string; icon: IconName }[]
            ).map((row) => (
              <View key={row.label} style={styles.planRow}>
                <Ionicons name={row.icon} size={15} color={DS.colors.textSoft} />
                <View style={styles.flex}>
                  <Text style={styles.planLabel}>{row.label}</Text>
                  <Text style={styles.planValue}>{row.value}</Text>
                </View>
              </View>
            ))}

            <View style={styles.caveat}>
              <Ionicons name="information-circle-outline" size={14} color={DS.colors.textSoft} />
              <Text style={styles.caveatText}>
                Costs are indicative. Confirm current prices with your supplier.
              </Text>
            </View>
          </Card>
        ) : (
          <Card variant="flat" style={styles.noData}>
            <Ionicons name="information-circle-outline" size={20} color={DS.colors.textMuted} />
            <Text style={styles.noDataText}>
              No fertilizer data for this crop yet. Try maize, tomatoes, tobacco or beans.
            </Text>
          </Card>
        )}

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bulb-outline" size={18} color={DS.colors.primary} />
            <Text style={styles.cardTitle}>Soil health tips</Text>
          </View>
          {[
            'Test soil every 2–3 seasons through Agritex extension offices',
            'Add compost or manure to sandy soils to improve water retention',
            'Lime acidic soils (pH below 5.5) before planting maize or cabbage',
            'Rotate legumes after cereals to restore nitrogen naturally',
          ].map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Card>

        <Link href="/(tabs)/market" asChild>
          <Button
            title="Find fertilizer suppliers"
            icon="storefront-outline"
            accessibilityLabel="Find fertilizer suppliers in the marketplace"
          />
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  body: { padding: DS.spacing.md, paddingBottom: DS.spacing.xl, gap: DS.spacing.md },
  flex: { flex: 1 },

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

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.spacing.sm },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
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

  cropRow: { gap: DS.spacing.sm, paddingRight: DS.spacing.xs },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },

  card: { gap: DS.spacing.sm + 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  cardTitle: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  badge: {
    borderRadius: DS.radius.xs,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontFamily: DS.fontFamily.semibold },

  track: {
    height: 6,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: DS.radius.full },
  advice: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
  },

  levelRow: { flexDirection: 'row', gap: DS.spacing.sm },
  level: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.surfaceMuted,
  },
  levelActive: { backgroundColor: DS.colors.primary },
  levelText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  levelTextActive: { color: DS.colors.textInverse },

  planHeader: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planSub: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.sm + 2,
    paddingTop: DS.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
  },
  planLabel: {
    fontSize: 11,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  planValue: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
    marginTop: 1,
  },
  caveat: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  caveatText: {
    flex: 1,
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },

  noData: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm + 4 },
  noDataText: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.sm + 2 },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: DS.colors.primary,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 20,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
});
