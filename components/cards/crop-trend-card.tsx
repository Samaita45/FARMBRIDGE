import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DS } from '@/constants/design-system';
import { getCropImage, getDemandBadge } from '@/utils/crop-emoji';
import { asHref } from '@/lib/href';
import type { Crop } from '@/types';

interface CropTrendCardProps {
  crop: Crop;
}

export function CropTrendCard({ crop }: CropTrendCardProps) {
  const badge = getDemandBadge(crop.demandLevel);
  const up = crop.priceChangePercent >= 0;

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      onPress={() => router.push(asHref('/(tabs)/market'))}
      accessibilityLabel={`${crop.name}, $${crop.currentPriceUSD} per kg`}>
      <View style={s.imageHero}>
        <Image source={getCropImage(crop.id, crop.category)} style={s.cropImage} resizeMode="cover" />
        <View style={[s.ribbon, { backgroundColor: badge.bg }]}>
          <Text style={[s.ribbonText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={s.body}>
        <Text style={s.name} numberOfLines={1}>
          {crop.name}
        </Text>
        <Text style={s.priceUSD}>
          ${crop.currentPriceUSD.toFixed(2)}
          <Text style={s.perkg}>/kg</Text>
        </Text>
        <Text style={s.priceZWG}>ZWG {crop.currentPriceZWG.toLocaleString()}</Text>
        <View style={[s.changePill, { backgroundColor: up ? DS.semantic.success.bg : DS.semantic.danger.bg }]}>
          <Ionicons
            name={up ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={up ? DS.semantic.success.fg : DS.semantic.danger.solid}
          />
          <Text style={[s.changeText, { color: up ? DS.semantic.success.fg : DS.semantic.danger.solid }]}>
            {Math.abs(crop.priceChangePercent)}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    width: 172,
    marginRight: 16,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    ...DS.shadow.card,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
  imageHero: { height: 112, position: 'relative' },
  cropImage: { width: '100%', height: '100%' },
  ribbon: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ribbonText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  body: { padding: 16 },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: DS.colors.text,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  priceUSD: {
    fontSize: 22,
    fontWeight: '800',
    color: DS.colors.primary,
    letterSpacing: -0.5,
  },
  perkg: { fontSize: 13, fontWeight: '500', color: DS.colors.textMuted },
  priceZWG: { fontSize: 12, color: DS.colors.textMuted, marginTop: 2, marginBottom: 12 },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changeText: { fontSize: 12, fontWeight: '800' },
});
