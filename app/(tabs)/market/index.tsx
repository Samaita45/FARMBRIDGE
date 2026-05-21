import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ChipTabs,
  FadeInView,
  GlassCard,
  SectionHeader,
  TabScreenHeader,
  type ChipTabItem,
} from '@/components/design-system';
import { MarketLocked } from '@/components/market/market-locked';
import { ProductCard } from '@/components/market/product-card';
import { DS } from '@/constants/design-system';
import {
  getFlashDealProducts,
  getFeaturedProducts,
  getProductsByCategory,
  MARKET_CATEGORIES,
  searchProducts,
} from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import { useAuthStore, selectIsSubscribed, type AuthState } from '@/stores/authStore';
import { useCartStore, type CartState } from '@/stores/cartStore';
import { getCategoryIcon } from '@/utils/product-emoji';

const TAB_CATEGORIES = ['All', ...MARKET_CATEGORIES] as const;

export default function MarketplaceScreen() {
  const isSubscribed = useAuthStore(selectIsSubscribed);
  const user = useAuthStore((s: AuthState) => s.user);
  const cartCount = useCartStore((s: CartState) => s.getItemCount());
  const showSeller =
    (user?.role === 'farmer' || user?.role === 'both') &&
    user?.subscription?.planId === 'business';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [countdown, setCountdown] = useState({ h: 2, m: 45, s: 30 });

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        let { h, m, s } = c;
        s -= 1;
        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) return { h: 5, m: 0, s: 0 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const chipItems: ChipTabItem[] = useMemo(
    () =>
      TAB_CATEGORIES.map((cat) => ({
        id: cat,
        label: cat === 'All' ? 'All' : cat.split(' ')[0],
        icon: (cat === 'All' ? 'storefront-outline' : getCategoryIcon(cat)) as ChipTabItem['icon'],
      })),
    [],
  );

  const featured = useMemo(() => getFeaturedProducts(5), []);
  const flashDeals = useMemo(() => getFlashDealProducts(4), []);
  const honeyProducts = useMemo(() => getProductsByCategory('Honey & Bee Products'), []);

  const products = useMemo(() => {
    if (search.trim()) return searchProducts(search);
    if (category !== 'All') return getProductsByCategory(category);
    return searchProducts('');
  }, [search, category]);

  if (!isSubscribed) return <MarketLocked />;

  const pad = (n: number) => String(n).padStart(2, '0');

  const cartButton = (
    <Pressable
      onPress={() => router.push(asHref('/(tabs)/market/cart'))}
      style={({ pressed }) => [styles.cartBtn, pressed && { opacity: 0.88 }]}>
      <Ionicons name="cart" size={22} color={DS.colors.primary} />
      {cartCount > 0 ? (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TabScreenHeader
        title="FarmBridge Market"
        subtitle="Fresh produce · Direct from farmers"
        icon="storefront"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products, crops, equipment…"
        rightAction={cartButton}
      />

      <ChipTabs items={chipItems} activeId={category} onChange={setCategory} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {!search && category === 'All' ? (
          <>
            <FadeInView delay={0}>
              <SectionHeader title="Featured" icon="ribbon-outline" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hscroll}>
                {featured.map((p) => (
                  <View key={p.id} style={styles.hCard}>
                    <ProductCard product={p} compact />
                  </View>
                ))}
              </ScrollView>
            </FadeInView>

            <FadeInView delay={1}>
              <GlassCard style={styles.flashBanner}>
                <View style={styles.flashLeft}>
                  <Ionicons name="flash" size={18} color={DS.colors.red} />
                  <Text style={styles.flashTitle}>Flash Deals</Text>
                </View>
                <View style={styles.flashTimer}>
                  <Ionicons name="time-outline" size={14} color={DS.colors.red} />
                  <Text style={styles.flashTime}>
                    {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                  </Text>
                </View>
              </GlassCard>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hscroll}>
                {flashDeals.map((p) => (
                  <View key={p.id} style={styles.hCard}>
                    <ProductCard product={p} compact />
                  </View>
                ))}
              </ScrollView>
            </FadeInView>

            <FadeInView delay={2}>
              <SectionHeader title="Honey & Bee" icon="flower-outline" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hscroll}>
                {honeyProducts.map((p) => (
                  <View key={p.id} style={styles.hCard}>
                    <ProductCard product={p} compact />
                  </View>
                ))}
              </ScrollView>
            </FadeInView>
          </>
        ) : null}

        <View style={styles.allHeader}>
          <SectionHeader
            title={category === 'All' ? 'All products' : category}
            icon={
              (category === 'All'
                ? 'storefront-outline'
                : getCategoryIcon(category)) as keyof typeof Ionicons.glyphMap
            }
          />
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{products.length}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {products.map((p, i) => (
            <FadeInView key={p.id} delay={i % 6} style={styles.gridItem}>
              <ProductCard product={p} />
            </FadeInView>
          ))}
        </View>

        {showSeller ? (
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/market/seller'))}
            style={({ pressed }) => [styles.sellerBtn, pressed && { opacity: 0.9 }]}>
            <Ionicons name="storefront" size={18} color={DS.colors.primary} />
            <Text style={styles.sellerBtnText}>Seller dashboard</Text>
            <Ionicons name="chevron-forward" size={16} color={DS.colors.primary} />
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DS.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...DS.shadow.card,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: DS.colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: DS.spacing.md, paddingBottom: 100 },
  hscroll: { marginBottom: DS.spacing.md },
  hCard: { marginRight: 12 },
  flashBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DS.spacing.sm,
    backgroundColor: '#FFF5F5',
    borderColor: '#FEE2E2',
  },
  flashLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flashTitle: { fontSize: 15, fontWeight: '700', color: DS.colors.red },
  flashTimer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flashTime: {
    fontSize: 15,
    fontWeight: '800',
    color: DS.colors.red,
    fontVariant: ['tabular-nums'],
  },
  allHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DS.spacing.sm,
  },
  countBadge: {
    backgroundColor: DS.colors.primaryMid,
    borderRadius: DS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countText: { fontSize: 12, fontWeight: '700', color: DS.colors.primary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: { width: '48%' },
  sellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: DS.spacing.lg,
    paddingVertical: 16,
    borderRadius: DS.radius.lg,
    borderWidth: 1.5,
    borderColor: DS.colors.primary,
    backgroundColor: DS.colors.primaryBg,
  },
  sellerBtnText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: DS.colors.primary,
  },
});
