import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getCropIcon, getCropImage, getDemandBadge } from '@/utils/crop-emoji';
import Colors from '@/constants/colors';
import { asHref } from '@/lib/href';
import type { Crop } from '@/types';

interface CropTrendCardProps { crop: Crop; }

export function CropTrendCard({ crop }: CropTrendCardProps) {
  const badge = getDemandBadge(crop.demandLevel);
  const up = crop.priceChangePercent >= 0;

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
      onPress={() => router.push(asHref('/crop-management'))}
      accessibilityLabel={`${crop.name}, $${crop.currentPriceUSD} per kg`}>

      {/* Demand ribbon */}
      <View style={[s.ribbon, { backgroundColor: badge.bg }]}>
        <Text style={[s.ribbonText, { color: badge.color }]}>{badge.label}</Text>
      </View>

      <View style={s.imageWrap}>
        <Image source={getCropImage(crop.id, crop.category)} style={s.cropImage} resizeMode="cover" />
        <View style={s.imageIcon}>
          <Ionicons name={getCropIcon(crop.category) as keyof typeof Ionicons.glyphMap} size={12} color={Colors.primary} />
        </View>
      </View>
      <Text style={s.name} numberOfLines={1}>{crop.name}</Text>

      <Text style={s.priceUSD}>${crop.currentPriceUSD.toFixed(2)}<Text style={s.perkg}>/kg</Text></Text>
      <Text style={s.priceZWG}>ZWG {crop.currentPriceZWG}</Text>

      <View style={[s.changePill, { backgroundColor: up ? Colors.accentLight : '#fee2e2' }]}>
        <Text style={[s.changeText, { color: up ? Colors.accent : Colors.error }]}>
          {up ? '▲' : '▼'} {Math.abs(crop.priceChangePercent)}%
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    width: 136,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  ribbon: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 8,
  },
  ribbonText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  imageWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: Colors.primaryBg,
  },
  cropImage: { width: '100%', height: '100%' },
  imageIcon: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  name: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  priceUSD: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  perkg: { fontSize: 11, fontWeight: '400', color: Colors.textSecondary },
  priceZWG: { fontSize: 10, color: Colors.textSecondary, marginBottom: 8 },
  changePill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  changeText: { fontSize: 11, fontWeight: '700' },
});
