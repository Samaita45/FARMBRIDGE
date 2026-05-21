import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/market/product-card';
import Colors from '@/constants/colors';
import {
  getFeaturedProducts,
  MARKET_PRODUCTS,
  PAYMENT_METHODS,
  SUBSCRIPTION_PLANS,
} from '@/constants/zimbabwe-data';

export function MarketLocked() {
  const preview = getFeaturedProducts(4);
  const farmerPlan = SUBSCRIPTION_PLANS.find((p) => p.id === 'farmer');
  const businessPlan = SUBSCRIPTION_PLANS.find((p) => p.id === 'business');

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTitleRow}>
          <Ionicons name="storefront" size={24} color="#fff" />
          <Text style={s.headerTitle}>Marketplace</Text>
        </View>
        <Text style={s.headerSub}>{MARKET_PRODUCTS.length}+ products available</Text>
      </View>

      {/* Blurred preview */}
      <View style={s.previewWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.previewRow} scrollEnabled={false}>
          {preview.map((p) => (
            <View key={p.id} style={s.previewItem}>
              <ProductCard product={p} compact />
            </View>
          ))}
        </ScrollView>
        {/* Blur overlay */}
        <View style={s.previewOverlay} />
      </View>

      {/* Lock card */}
      <View style={s.lockCard}>
        <View style={s.lockIcon}>
          <Ionicons name="lock-closed" size={28} color={Colors.primary} />
        </View>
        <Text style={s.lockTitle}>Subscription Required</Text>
        <Text style={s.lockSub}>Unlock seeds, equipment, honey, fresh produce & more</Text>

        {/* Plan options */}
        <View style={s.plans}>
          <PlanRow
            name={farmerPlan?.name ?? 'Farmer Pro'}
            price={`$${farmerPlan?.priceUSD ?? 3}/mo`}
            code={farmerPlan?.ecocashCode}
            features={['Access full marketplace', '15+ transporters', 'Price alerts']}
          />
          <PlanRow
            name={businessPlan?.name ?? 'Business'}
            price={`$${businessPlan?.priceUSD ?? 8}/mo`}
            highlight
            features={['Everything in Pro', 'Bulk listings', 'Analytics & reports']}
          />
        </View>

        {/* Payment methods */}
        <Text style={s.payLabel}>Pay with</Text>
        <View style={s.payRow}>
          {PAYMENT_METHODS.slice(0, 4).map((pm) => (
            <View key={pm.id} style={[s.payIcon, { backgroundColor: pm.color }]}>
              <Text style={s.payIconText}>{pm.name.slice(0, 2)}</Text>
            </View>
          ))}
        </View>

        <Link href="/(tabs)/profile" asChild>
          <Pressable style={({ pressed }) => [s.subscribeBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={s.subscribeBtnText}>Subscribe with EcoCash</Text>
          </Pressable>
        </Link>
        <Text style={s.trialText}>Try free for 7 days on Farmer Pro</Text>
      </View>
    </SafeAreaView>
  );
}

function PlanRow({ name, price, code, features, highlight }: {
  name: string; price: string; code?: string; features: string[]; highlight?: boolean;
}) {
  return (
    <View style={[s.planRow, highlight && s.planRowHighlight]}>
      <View style={s.planTop}>
        <View style={s.planNameWrap}>
          <Text style={s.planName}>{name}</Text>
          {highlight && <View style={s.popularBadge}><Text style={s.popularText}>Popular</Text></View>}
        </View>
        <Text style={[s.planPrice, highlight && { color: Colors.accent }]}>{price}</Text>
      </View>
      {code && <Text style={s.planCode}>{code}</Text>}
      {features.map((f) => (
        <View key={f} style={s.featureRow}>
          <Ionicons name="checkmark-circle" size={13} color={highlight ? Colors.accent : Colors.primary} />
          <Text style={s.featureText}>{f}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },

  header: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  previewWrap: { height: 160, overflow: 'hidden', position: 'relative' },
  previewRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  previewItem: { opacity: 0.35 },
  previewOverlay: {
    position: 'absolute', inset: 0,
    // gradient-like fade
    backgroundColor: 'rgba(240,253,244,0.7)',
  },

  lockCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
    overflow: 'scroll',
  },
  lockIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 12,
    borderWidth: 1.5, borderColor: Colors.primaryMid,
  },
  lockTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  lockSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 18 },

  plans: { gap: 10, marginBottom: 16 },
  planRow: {
    backgroundColor: Colors.primaryBg, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  planRowHighlight: {
    backgroundColor: Colors.accentLight, borderColor: '#fbbf24',
  },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  planNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  planName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  popularBadge: { backgroundColor: Colors.accent, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  popularText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  planPrice: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  planCode: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  featureText: { fontSize: 12, color: Colors.textSecondary },

  payLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, textAlign: 'center' },
  payRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  payIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  payIconText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  subscribeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 15,
  },
  subscribeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  trialText: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
