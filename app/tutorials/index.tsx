import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TutorialCard } from '@/components/cards/tutorial-card';
import { DS } from '@/constants/design-system';
import { getFeaturedTutorial, TUTORIALS } from '@/constants/tutorials-data';
import { asHref } from '@/lib/href';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useTutorialsStore, type TutorialsState } from '@/stores/tutorialsStore';
import type { TutorialCategoryFilter } from '@/types/tutorials';
import { TUTORIAL_CATEGORIES } from '@/types/tutorials';

const CAT_MAP: Record<TutorialCategoryFilter, string | null> = {
  All: null, Planting: 'planting', Watering: 'watering',
  'Pest Control': 'pest', Harvest: 'harvest', Storage: 'storage', Marketing: 'marketing',
};

export default function TutorialsHubScreen() {
  const user = useAuthStore((s: AuthState) => s.user);
  const hydrate = useTutorialsStore((s: TutorialsState) => s.hydrate);
  const completedIds = useTutorialsStore((s: TutorialsState) => s.completedIds);
  const bookmarkedIds = useTutorialsStore((s: TutorialsState) => s.bookmarkedIds);
  const toggleBookmark = useTutorialsStore((s: TutorialsState) => s.toggleBookmark);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TutorialCategoryFilter>('All');
  const featured = getFeaturedTutorial();

  useEffect(() => { if (user?.id) void hydrate(user.id); }, [user?.id, hydrate]);

  const list = useMemo(() => {
    let items = TUTORIALS;
    const cat = CAT_MAP[filter];
    if (cat) items = items.filter((t) => t.category === cat);
    const q = search.trim().toLowerCase();
    if (q) items = items.filter((t) => t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q));
    return items;
  }, [filter, search]);

  const pct = Math.round((completedIds.length / Math.max(TUTORIALS.length, 1)) * 100);

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={DS.colors.surface} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.title}>Tutorials</Text>
          <Text style={s.subtitle}>Best practices for Zimbabwe farmers</Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressWrap}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>{completedIds.length}/{TUTORIALS.length} completed</Text>
            <Text style={s.progressPct}>{pct}%</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        {/* Search */}
        <View style={s.searchBar}>
          <Ionicons name="search" size={17} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={s.searchInput}
            placeholder="Search tutorials..."
            placeholderTextColor="rgba(255,255,255,0.78)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Category filter ── */}
      <View style={s.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {TUTORIAL_CATEGORIES.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[s.tab, filter === f && s.tabActive]}>
              <Text style={[s.tabText, filter === f && s.tabTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Featured card */}
        <Pressable
          onPress={() => router.push(asHref(`/tutorials/${featured.id}`))}
          style={({ pressed }) => [s.featuredCard, pressed && { opacity: 0.9 }]}>
          <View style={s.featuredBadge}>
            <Ionicons name="star" size={11} color={DS.colors.surface} />
            <Text style={s.featuredBadgeText}>Featured</Text>
          </View>
          <View style={s.featuredIcon}>
            <Ionicons name={featured.icon} size={40} color={DS.colors.primary} />
          </View>
          <View style={s.featuredMeta}>
            <Text style={s.featuredTitle} numberOfLines={2}>{featured.title}</Text>
            <View style={s.featuredRow}>
              <View style={s.featuredChip}>
                <Ionicons name="time-outline" size={11} color={DS.colors.primary} />
                <Text style={s.featuredChipText}>{featured.durationMin} min read</Text>
              </View>
              <View style={s.featuredChip}>
                <Ionicons name="arrow-forward-circle" size={11} color={DS.colors.primary} />
                <Text style={s.featuredChipText}>Start now</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Section header */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>All tutorials</Text>
          <Text style={s.sectionCount}>{list.length} {filter !== 'All' ? filter : 'total'}</Text>
        </View>

        {/* Tutorial list */}
        {list.map((tutorial) => (
          <TutorialCard
            key={tutorial.id}
            tutorial={tutorial}
            completed={completedIds.includes(tutorial.id)}
            bookmarked={bookmarkedIds.includes(tutorial.id)}
            onBookmark={() => user?.id && void toggleBookmark(user.id, tutorial.id)}
          />
        ))}

        {list.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={40} color={DS.colors.borderStrong} />
            <Text style={s.emptyTitle}>No tutorials found</Text>
            <Text style={s.emptyHint}>Try a different search or category</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.primaryBg },

  header: { backgroundColor: DS.colors.primary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  headerText: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: DS.colors.surface },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  progressWrap: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  progressPct: { fontSize: 11, fontWeight: '700', color: DS.colors.surface },
  progressTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: DS.colors.accent, borderRadius: 4 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: DS.colors.surface },

  tabsWrap: { backgroundColor: DS.colors.surface, borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight },
  tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: DS.colors.borderLight },
  tabActive: { backgroundColor: DS.colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: DS.colors.textMuted },
  tabTextActive: { color: DS.colors.surface },

  body: { padding: 14, paddingBottom: 40, gap: 4 },

  featuredCard: {
    backgroundColor: DS.colors.surface, borderRadius: 18, overflow: 'hidden',
    marginBottom: 16, flexDirection: 'row', alignItems: 'center',
    shadowColor: DS.colors.text, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1.5, borderColor: DS.colors.primaryMid,
    padding: 14, gap: 14,
  },
  featuredBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: DS.colors.primary, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  featuredBadgeText: { fontSize: 9, fontWeight: '700', color: DS.colors.surface },
  featuredIcon: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  featuredMeta: { flex: 1 },
  featuredTitle: { fontSize: 14, fontWeight: '700', color: DS.colors.text, lineHeight: 20 },
  featuredRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  featuredChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: DS.colors.primaryBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  featuredChipText: { fontSize: 11, fontWeight: '600', color: DS.colors.primary },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: DS.colors.text },
  sectionCount: { fontSize: 12, color: DS.colors.textMuted },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: DS.colors.text },
  emptyHint: { fontSize: 13, color: DS.colors.textMuted },
});
