import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/design-system';
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  FilterSheet,
  type MarketFilters,
} from '@/components/market/filter-sheet';
import { MarketLocked } from '@/components/market/market-locked';
import { ProductCard } from '@/components/market/product-card';
import { DS } from '@/constants/design-system';
import { imageSourceFor } from '@/constants/produce-imagery';
import { MARKET_CATEGORIES, MARKET_PRODUCTS } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import { selectIsSubscribed, useAuthStore, type AuthState } from '@/stores/authStore';
import { useCartStore, type CartState } from '@/stores/cartStore';
import type { MarketProduct } from '@/types';

/**
 * The marketplace.
 *
 * Rebuilt to the reference: search with a filter affordance, a category strip,
 * a featured listing, the sellers behind the catalogue, then everything else in
 * a two-column grid.
 *
 * The "Flash Deals" countdown that used to sit here is gone. It ticked down and
 * reset itself to five hours on reaching zero — manufactured urgency attached
 * to no real deadline, aimed at smallholder farmers deciding how to spend
 * money they may not have much of.
 */
export default function MarketplaceScreen() {
  const isSubscribed = useAuthStore(selectIsSubscribed);
  const user = useAuthStore((s: AuthState) => s.user);
  const cartCount = useCartStore((s: CartState) => s.getItemCount());

  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const showSeller = user?.role === 'farmer' || user?.role === 'both';
  const filterCount = activeFilterCount(filters);

  const results = useMemo(() => {
    return MARKET_PRODUCTS.filter((p) => {
      if (filters.category !== 'All' && p.category !== filters.category) return false;
      if (p.priceUSD < filters.minPrice || p.priceUSD > filters.maxPrice) return false;
      if (filters.minRating > 0 && p.rating < filters.minRating) return false;
      if (filters.organicOnly && !p.isOrganic) return false;
      if (filters.inStockOnly && !p.inStock) return false;
      return true;
    });
  }, [filters]);

  const featured = useMemo(
    () => MARKET_PRODUCTS.find((p) => p.isOrganic && p.inStock) ?? MARKET_PRODUCTS[0],
    []
  );

  /** The sellers behind the catalogue, best rated first. */
  const topSellers = useMemo(() => {
    const byId = new Map<string, { name: string; rating: number; count: number; sample: string }>();
    for (const p of MARKET_PRODUCTS) {
      const found = byId.get(p.sellerId);
      if (found) {
        found.rating = (found.rating * found.count + p.rating) / (found.count + 1);
        found.count += 1;
      } else {
        byId.set(p.sellerId, {
          name: p.sellerName,
          rating: p.rating,
          count: 1,
          sample: `${p.name} ${p.category}`,
        });
      }
    }
    return [...byId.entries()]
      .map(([id, v]) => ({ id, ...v, rating: Math.round(v.rating * 10) / 10 }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);
  }, []);

  const renderProduct = useCallback(
    ({ item }: { item: MarketProduct }) => (
      <View style={styles.gridCell}>
        <ProductCard product={item} />
      </View>
    ),
    []
  );

  if (!isSubscribed) return <MarketLocked />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            Marketplace
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={DS.layout.maxFontScale}>
            {MARKET_PRODUCTS.length} listings from Zimbabwean sellers
          </Text>
        </View>

        {showSeller ? (
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/market/seller'))}
            accessibilityRole="button"
            accessibilityLabel="My listings"
            style={styles.headerBtn}>
            <Ionicons name="pricetags-outline" size={20} color={DS.colors.text} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push(asHref('/(tabs)/market/cart'))}
          accessibilityRole="button"
          accessibilityLabel={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart, empty'}
          style={styles.headerBtn}>
          <Ionicons name="cart-outline" size={22} color={DS.colors.text} />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <Pressable
          onPress={() => router.push(asHref('/(tabs)/market/search'))}
          accessibilityRole="search"
          accessibilityLabel="Search the marketplace"
          style={styles.searchField}>
          <Ionicons name="search" size={18} color={DS.colors.textSoft} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Search seeds, produce, equipment
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={
            filterCount > 0 ? `Filters, ${filterCount} active` : 'Filters'
          }
          style={[styles.filterBtn, filterCount > 0 && styles.filterBtnActive]}>
          <Ionicons
            name="options-outline"
            size={20}
            color={filterCount > 0 ? DS.colors.textInverse : DS.colors.text}
          />
          {filterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.list, results.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={9}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <FlatList
              horizontal
              data={['All', ...MARKET_CATEGORIES]}
              keyExtractor={(c) => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
              renderItem={({ item }) => {
                const active = filters.category === item;
                return (
                  <Pressable
                    onPress={() => setFilters((f) => ({ ...f, category: item }))}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={item}
                    style={[styles.category, active && styles.categoryActive]}>
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {featured && filterCount === 0 ? (
              <Pressable
                onPress={() => router.push(asHref(`/(tabs)/market/${featured.id}`))}
                accessibilityRole="link"
                accessibilityLabel={`Featured: ${featured.name} from ${featured.sellerName}`}
                style={styles.promo}>
                <Image
                  source={imageSourceFor(`${featured.name} ${featured.category}`)}
                  style={styles.promoImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
                <View style={styles.promoBody}>
                  <Text style={styles.promoEyebrow}>Featured</Text>
                  <Text style={styles.promoTitle} numberOfLines={2}>
                    {featured.name}
                  </Text>
                  <Text style={styles.promoMeta} numberOfLines={1}>
                    ${featured.priceUSD.toFixed(2)} per {featured.unit} · {featured.sellerName}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={DS.colors.textFaint} />
              </Pressable>
            ) : null}

            {filterCount === 0 ? (
              <View>
                <Text style={styles.sectionTitle}>Top rated sellers</Text>
                <FlatList
                  horizontal
                  data={topSellers}
                  keyExtractor={(s) => s.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sellerRow}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() =>
                        router.push(
                          asHref({
                            pathname: '/(tabs)/market/search',
                            params: { q: item.name },
                          })
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name}, rated ${item.rating}, ${item.count} listings`}
                      style={styles.seller}>
                      <Image
                        source={imageSourceFor(item.sample)}
                        style={styles.sellerAvatar}
                        contentFit="cover"
                        transition={180}
                        cachePolicy="memory-disk"
                      />
                      <Text style={styles.sellerName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.sellerRating}>
                        <Ionicons name="star" size={9} color={DS.semantic.warning.solid} />
                        <Text style={styles.sellerRatingText}>{item.rating}</Text>
                      </View>
                    </Pressable>
                  )}
                />
              </View>
            ) : null}

            <View style={styles.resultsRow}>
              <Text style={styles.sectionTitle}>
                {filterCount > 0
                  ? `${results.length} result${results.length === 1 ? '' : 's'}`
                  : 'All listings'}
              </Text>
              {filterCount > 0 ? (
                <Pressable
                  onPress={() => setFilters(DEFAULT_FILTERS)}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all filters"
                  hitSlop={8}>
                  <Text style={styles.clearText}>Clear filters</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Nothing matches"
            description="No listings match these filters. Try widening them."
            actionLabel={filterCount > 0 ? 'Clear filters' : undefined}
            onAction={filterCount > 0 ? () => setFilters(DEFAULT_FILTERS) : undefined}
          />
        }
      />

      <FilterSheet
        visible={filterOpen}
        categories={[...MARKET_CATEGORIES]}
        value={filters}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm,
    paddingBottom: DS.spacing.sm,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: DS.typography.h1.fontSize,
    lineHeight: DS.typography.h1.lineHeight,
    fontFamily: DS.fontFamily.display,
    color: DS.colors.text,
  },
  subtitle: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 17,
    height: 17,
    borderRadius: DS.radius.full,
    backgroundColor: DS.semantic.danger.solid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 9,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingBottom: DS.spacing.sm,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    minHeight: DS.layout.touchTarget,
    paddingHorizontal: 14,
    borderRadius: DS.radius.full,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.borderControl,
    backgroundColor: DS.colors.surfaceMuted,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: DS.typography.body.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },
  filterBtn: {
    width: DS.layout.touchTarget,
    height: DS.layout.touchTarget,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  filterBtnActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: DS.radius.full,
    backgroundColor: DS.semantic.warning.solid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 9,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textInverse,
  },

  list: { paddingHorizontal: DS.spacing.md, paddingBottom: DS.spacing.xl },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  listHeader: { gap: DS.spacing.md, marginBottom: DS.spacing.md },
  gridRow: { gap: DS.spacing.sm + 4 },
  gridCell: { flex: 1, marginBottom: DS.spacing.sm + 4 },

  categoryRow: { gap: DS.spacing.sm, paddingVertical: 2 },
  category: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  categoryActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  categoryText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },
  categoryTextActive: { color: DS.colors.textInverse },

  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.colors.primaryBg,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.primaryMid,
    padding: DS.spacing.sm + 2,
  },
  promoImage: {
    width: 78,
    height: 78,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.surfaceMuted,
  },
  promoBody: { flex: 1, gap: 2 },
  promoEyebrow: {
    fontSize: DS.typography.label.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  promoTitle: {
    fontSize: DS.typography.bodySm.fontSize,
    lineHeight: 19,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  promoMeta: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  sellerRow: { gap: DS.spacing.sm + 4 },
  seller: { width: 74, alignItems: 'center', gap: 3 },
  sellerAvatar: {
    width: 54,
    height: 54,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surfaceMuted,
  },
  sellerName: {
    fontSize: 10,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    textAlign: 'center',
  },
  sellerRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sellerRatingText: {
    fontSize: 9,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  resultsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
    marginBottom: DS.spacing.sm,
  },
});
