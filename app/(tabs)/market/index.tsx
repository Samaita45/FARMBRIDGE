import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarketLocked } from '@/components/market/market-locked';
import { ProductCard } from '@/components/market/product-card';
import Colors from '@/constants/colors';
import { ScreenImages } from '@/constants/images';
import {
  getFlashDealProducts,
  getFeaturedProducts,
  getProductsByCategory,
  MARKET_CATEGORIES,
  searchProducts,
} from '@/constants/zimbabwe-data';
import { useCartStore, type CartState } from '@/stores/cartStore';
import { useAuthStore, selectIsSubscribed, type AuthState } from '@/stores/authStore';
import { getCategoryEmoji } from '@/utils/product-emoji';
import { asHref } from '@/lib/href';

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
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) return { h: 5, m: 0, s: 0 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

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

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── Hero banner ── */}
      <ImageBackground source={ScreenImages.market} style={s.heroBg} resizeMode="cover">
        <View style={s.heroOverlay}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroTitle}>🛒 FarmBridge Market</Text>
              <Text style={s.heroSub}>Fresh produce · Direct from farmers</Text>
            </View>
            {/* Cart button */}
            <Pressable
              onPress={() => router.push(asHref('/(tabs)/market/cart'))}
              style={({ pressed }) => [s.cartBtn, pressed && { opacity: 0.8 }]}>
              <Ionicons name="cart" size={22} color={Colors.primary} />
              {cartCount > 0 && (
                <View style={s.cartBadge}>
                  <Text style={s.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={s.searchBar}>
            <Ionicons name="search" size={18} color={Colors.placeholder} />
            <TextInput
              style={s.searchInput}
              placeholder="Search products, crops, equipment..."
              placeholderTextColor={Colors.placeholder}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={Colors.placeholder} />
              </Pressable>
            )}
          </View>
        </View>
      </ImageBackground>

      {/* ── Category tabs ── */}
      <View style={s.tabsBg}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsContent}>
          {TAB_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[s.tab, category === cat && s.tabActive]}>
              <Text style={[s.tabText, category === cat && s.tabTextActive]}>
                {cat === 'All' ? '🛒 All' : `${getCategoryEmoji(cat)} ${cat.split(' ')[0]}`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {!search && category === 'All' ? (
          <>
            {/* Featured */}
            <Text style={s.sectionTitle}>⭐ Featured Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hscroll}>
              {featured.map((p) => (
                <View key={p.id} style={s.hCard}>
                  <ProductCard product={p} compact />
                </View>
              ))}
            </ScrollView>

            {/* Flash deals */}
            <View style={s.flashBanner}>
              <View style={s.flashLeft}>
                <Ionicons name="flash" size={18} color={Colors.error} />
                <Text style={s.flashTitle}>Flash Deals</Text>
              </View>
              <View style={s.flashTimer}>
                <Ionicons name="time-outline" size={14} color={Colors.error} />
                <Text style={s.flashTime}>{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hscroll}>
              {flashDeals.map((p) => (
                <View key={p.id} style={s.hCard}>
                  <ProductCard product={p} compact />
                </View>
              ))}
            </ScrollView>

            {/* Honey */}
            <Text style={s.sectionTitle}>🍯 Honey &amp; Bee Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hscroll}>
              {honeyProducts.map((p) => (
                <View key={p.id} style={s.hCard}>
                  <ProductCard product={p} compact />
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        {/* All / filtered products */}
        <View style={s.allHeader}>
          <Text style={s.sectionTitle}>
            {category === 'All' ? 'All Products' : category}
          </Text>
          <View style={s.countBadge}>
            <Text style={s.countText}>{products.length} items</Text>
          </View>
        </View>

        <View style={s.grid}>
          {products.map((p) => (
            <View key={p.id} style={s.gridItem}>
              <ProductCard product={p} />
            </View>
          ))}
        </View>

        {/* Seller dashboard button */}
        {showSeller ? (
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/market/seller'))}
            style={({ pressed }) => [s.sellerBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="storefront" size={18} color={Colors.primary} />
            <Text style={s.sellerBtnText}>Seller Dashboard</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },

  // Hero
  heroBg: { width: '100%' },
  heroOverlay: {
    backgroundColor: 'rgba(15,23,42,0.60)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.80)', marginTop: 2 },
  cartBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  cartBadge: {
    position: 'absolute', top: -3, right: -3,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },

  // Category tabs
  tabsBg: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.gray[100],
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  // Section titles
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10, marginTop: 6 },
  hscroll: { marginBottom: 16 },
  hCard: { marginRight: 12 },

  // Flash deals
  flashBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  flashLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flashTitle: { fontSize: 14, fontWeight: '700', color: Colors.error },
  flashTimer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flashTime: { fontSize: 14, fontWeight: '800', color: Colors.error, fontVariant: ['tabular-nums'] },

  // All header
  allHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  countBadge: { backgroundColor: Colors.primaryMid, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  gridItem: { width: '48%' },

  // Seller button
  sellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  sellerBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary, flex: 1, textAlign: 'center' },
});
