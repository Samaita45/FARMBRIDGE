import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/design-system';
import { SUBSCRIPTION_PLANS } from '@/constants/zimbabwe-data';

export function SubscriptionBanner() {
  const farmerPlan = SUBSCRIPTION_PLANS.find((p) => p.id === 'farmer');

  return (
    <View style={s.wrap}>
      <View style={s.inner}>
        <View style={s.titleRow}>
          <Ionicons name="lock-closed" size={18} color={DS.colors.surface} />
          <Text style={s.title}>Unlock Marketplace & More</Text>
        </View>
        <Text style={s.sub}>
          Subscribe from ${farmerPlan?.priceUSD}/month via EcoCash
        </Text>
        <Link href="/(tabs)/profile" asChild>
          <Pressable style={({ pressed }) => [s.cta, pressed && { opacity: 0.9 }]}>
            <Text style={s.ctaText}>Subscribe Now</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden' },
  inner: { padding: 16, backgroundColor: DS.semantic.warning.solid },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 17, fontWeight: '800', color: DS.semantic.warning.onSolid },
  sub: { marginTop: 6, fontSize: 13, color: DS.semantic.warning.onSolid, opacity: 0.85 },
  cta: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: DS.colors.surface,
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  ctaText: { fontSize: 14, fontWeight: '700', color: DS.semantic.warning.solid },
});
