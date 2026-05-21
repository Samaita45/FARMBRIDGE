import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Premium } from '@/constants/premium-home';
import { getCropImage } from '@/utils/crop-emoji';
import type { Crop } from '@/types';

interface PlantNowCardProps {
  crop: Crop;
  onPress: () => void;
}

export function PlantNowCard({ crop, onPress }: PlantNowCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Image
        source={getCropImage(crop.id, crop.category)}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.imageFade} />
      <View style={styles.body}>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={11} color={Premium.purple} />
          <Text style={styles.aiBadgeText}>AI recommendation</Text>
        </View>
        <Text style={styles.name}>{crop.name}</Text>
        <View style={styles.metaRow}>
          <MetaChip icon="time-outline" text={`${crop.harvestDays} days harvest`} />
          <MetaChip icon="water-outline" text={`${crop.waterRequirements} water`} />
        </View>
        <Text style={styles.value}>
          Est. ${crop.currentPriceUSD.toFixed(2)}
          <Text style={styles.valueUnit}>/kg market value</Text>
        </Text>
      </View>
      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={22} color={Premium.primary} />
      </View>
    </Pressable>
  );
}

function MetaChip({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={12} color={Premium.textMuted} />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Premium.surface,
    borderRadius: Premium.radiusLg,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.85)',
    ...Premium.shadow,
  },
  cardPressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  image: { width: 96, height: 112 },
  imageFade: {
    position: 'absolute',
    left: 72,
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  body: { flex: 1, paddingVertical: 16, paddingLeft: 8, paddingRight: 8 },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: Premium.purple, letterSpacing: 0.2 },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: Premium.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  metaRow: { gap: 6, marginBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipText: { fontSize: 12, color: Premium.textMuted, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '800', color: Premium.primary },
  valueUnit: { fontSize: 12, fontWeight: '600', color: Premium.textMuted },
  chevron: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Premium.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
