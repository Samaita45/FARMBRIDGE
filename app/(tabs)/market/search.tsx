import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/design-system';
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  FilterSheet,
  type MarketFilters,
} from '@/components/market/filter-sheet';
import { ProductCard } from '@/components/market/product-card';
import { DS } from '@/constants/design-system';
import { imageSourceFor } from '@/constants/produce-imagery';
import { MARKET_CATEGORIES, MARKET_PRODUCTS } from '@/constants/zimbabwe-data';
import { asHref } from '@/lib/href';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '@/services/recentSearches';
import type { MarketProduct } from '@/types';

/**
 * Marketplace search.
 *
 * Before a query is typed the screen is about getting back to something: the
 * terms this person has searched before, and a shelf of listings to browse
 * into. Once there is a query it becomes a results grid.
 *
 * ON THE SECOND HEADING. The reference calls it "Popular this week". FarmBridge
 * has no analytics and no backend, so nothing here knows what anyone else
 * looked at, this week or ever. What it does know is which listings carry the
 * most reviews and the best ratings, so that is what the shelf shows and what
 * the heading says. Ranking by a number the app actually holds is the same
 * amount of work; claiming it means popularity is the part that would be made up.
 */
export default function MarketSearchScreen() {
  const inputRef = useRef<TextInput>(null);
  // Arriving from a seller chip on the marketplace lands here with the term
  // already filled in, so the keyboard should not steal the screen.
  const { q } = useLocalSearchParams<{ q?: string }>();

  const [query, setQuery] = useState(q ?? '');
  const [recent, setRecent] = useState<string[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const filterCount = activeFilterCount(filters);
  const trimmed = query.trim();
  const searching = trimmed.length > 0 || filterCount > 0;

  useEffect(() => {
    let alive = true;
    void getRecentSearches()
      .then((terms) => {
        if (alive) setRecent(terms);
      })
      .finally(() => {
        if (alive) setLoadingRecent(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  /** Terms are only recorded once the search is committed, not on every keystroke. */
  const commit = useCallback(
    (term: string) => {
      const clean = term.trim();
      if (!clean) return;
      setQuery(clean);
      void addRecentSearch(clean).then(setRecent);
    },
    []
  );

  const results = useMemo(() => {
    if (!searching) return [];
    const q = trimmed.toLowerCase();
    return MARKET_PRODUCTS.filter((p) => {
      if (q && !`${p.name} ${p.category} ${p.sellerName} ${p.location}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.category !== 'All' && p.category !== filters.category) return false;
      if (p.priceUSD < filters.minPrice || p.priceUSD > filters.maxPrice) return false;
      if (filters.minRating > 0 && p.rating < filters.minRating) return false;
      if (filters.organicOnly && !p.isOrganic) return false;
      if (filters.inStockOnly && !p.inStock) return false;
      return true;
    });
  }, [searching, trimmed, filters]);

  /** Best reviewed first, and only listings someone can actually buy. */
  const bestReviewed = useMemo(
    () =>
      [...MARKET_PRODUCTS]
        .filter((p) => p.inStock && p.reviewCount > 0)
        .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
        .slice(0, 10),
    []
  );

  const renderResult = useCallback(
    ({ item }: { item: MarketProduct }) => (
      <View style={styles.gridCell}>
        <ProductCard product={item} />
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={DS.colors.text} />
        </Pressable>

        <View style={styles.searchField}>
          <Ionicons name="search" size={18} color={DS.colors.textSoft} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={(e) => commit(e.nativeEvent.text)}
            placeholder="Search seeds, produce, equipment"
            placeholderTextColor={DS.colors.textMuted}
            autoFocus={!q}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search the marketplace"
            maxFontSizeMultiplier={DS.layout.maxFontScale}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={DS.colors.textSoft} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={filterCount > 0 ? `Filters, ${filterCount} active` : 'Filters'}
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

      {searching ? (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          renderItem={renderResult}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.grid, results.length === 0 && styles.gridEmpty]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={9}
          removeClippedSubviews
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.resultCount}>
                {results.length} {results.length === 1 ? 'listing' : 'listings'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Nothing matched"
              description={
                filterCount > 0
                  ? 'Try a different term, or widen the filters.'
                  : 'Try a different term — search covers the name, category, seller and location.'
              }
              actionLabel={filterCount > 0 ? 'Reset filters' : undefined}
              onAction={filterCount > 0 ? () => setFilters(DEFAULT_FILTERS) : undefined}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.browse}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {loadingRecent ? (
            <ActivityIndicator color={DS.colors.primary} style={styles.recentLoading} />
          ) : recent.length > 0 ? (
            <View>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Recent searches</Text>
                <Pressable
                  onPress={() => {
                    setRecent([]);
                    void clearRecentSearches();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all recent searches"
                  hitSlop={8}>
                  <Text style={styles.clearAll}>Clear all</Text>
                </Pressable>
              </View>

              <View style={styles.chipWrap}>
                {recent.map((term) => (
                  <View key={term} style={styles.chip}>
                    <Pressable
                      onPress={() => commit(term)}
                      accessibilityRole="button"
                      accessibilityLabel={`Search again for ${term}`}
                      style={styles.chipLabelPress}>
                      <Text style={styles.chipText} numberOfLines={1}>
                        {term}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void removeRecentSearch(term).then(setRecent)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${term} from recent searches`}
                      hitSlop={8}>
                      <Ionicons name="close" size={13} color={DS.colors.textSoft} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View>
            <Text style={styles.sectionTitle}>Browse by category</Text>
            <View style={styles.chipWrap}>
              {MARKET_CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setFilters((f) => ({ ...f, category: c }))}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${c}`}
                  style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Best reviewed</Text>
            <Text style={styles.sectionNote}>
              Ranked by the ratings buyers have left, not by what is selling.
            </Text>

            <View style={styles.shelf}>
              {bestReviewed.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(asHref(`/(tabs)/market/${p.id}`))}
                  accessibilityRole="link"
                  accessibilityLabel={`${p.name}, rated ${p.rating} from ${p.reviewCount} reviews, $${p.priceUSD.toFixed(2)} per ${p.unit}`}
                  style={({ pressed }) => [styles.shelfItem, pressed && styles.pressed]}>
                  <Image
                    source={
                      p.images[0]
                        ? { uri: p.images[0] }
                        : imageSourceFor(`${p.name} ${p.category}`)
                    }
                    style={styles.shelfImage}
                    contentFit="cover"
                    transition={180}
                    cachePolicy="memory-disk"
                  />
                  <View style={styles.shelfBody}>
                    <Text style={styles.shelfName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.shelfPrice}>
                      ${p.priceUSD.toFixed(2)}
                      <Text style={styles.shelfUnit}> per {p.unit}</Text>
                    </Text>
                    <View style={styles.shelfMeta}>
                      <Ionicons name="star" size={11} color={DS.semantic.warning.solid} />
                      <Text style={styles.shelfMetaText}>
                        {p.rating} · {p.reviewCount} reviews
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={DS.colors.textFaint} />
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <FilterSheet
        visible={filterOpen}
        categories={MARKET_CATEGORIES}
        value={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setFilterOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  pressed: { opacity: 0.9 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.sm,
    backgroundColor: DS.colors.surface,
    borderBottomWidth: DS.layout.hairline,
    borderBottomColor: DS.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.surfaceMuted,
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
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: DS.typography.body.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: DS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.borderControl,
  },
  filterBtnActive: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: DS.radius.full,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.semantic.danger.solid,
    borderWidth: 2,
    borderColor: DS.colors.surface,
  },
  filterBadgeText: {
    fontSize: 9,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.textInverse,
  },

  browse: { padding: DS.spacing.md, gap: DS.spacing.lg, paddingBottom: DS.spacing.xl },
  recentLoading: { marginTop: DS.spacing.lg },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  sectionNote: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 2,
  },
  clearAll: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primary,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.spacing.sm,
    marginTop: DS.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    borderRadius: DS.radius.full,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.borderControl,
    backgroundColor: DS.colors.surface,
    paddingLeft: 14,
    paddingRight: 10,
    minHeight: 36,
  },
  chipLabelPress: { flexShrink: 1, justifyContent: 'center', paddingVertical: 8 },
  chipText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.text,
  },
  categoryChip: {
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.primaryBg,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.primaryDark,
  },

  shelf: { marginTop: DS.spacing.sm, gap: DS.spacing.sm },
  shelfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm + 4,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.sm,
  },
  shelfImage: {
    width: 62,
    height: 62,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.surfaceMuted,
  },
  shelfBody: { flex: 1, gap: 2 },
  shelfName: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  shelfPrice: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  shelfUnit: { fontFamily: DS.fontFamily.regular, color: DS.colors.textMuted },
  shelfMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shelfMetaText: {
    fontSize: 11,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  grid: { padding: DS.spacing.md, gap: DS.spacing.md },
  gridEmpty: { flexGrow: 1, justifyContent: 'center' },
  gridRow: { gap: DS.spacing.md },
  gridCell: { flex: 1 },
  resultCount: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginBottom: DS.spacing.sm,
  },
});
