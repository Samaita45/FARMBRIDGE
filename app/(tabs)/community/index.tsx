import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ChipTabs,
  EmptyState,
  FadeInView,
  GlassCard,
  SectionHeader,
  TabScreenHeader,
  type ChipTabItem,
} from '@/components/design-system';
import { PostCard } from '@/components/community/post-card';
import { DS } from '@/constants/design-system';
import { SUCCESS_STORIES, TRENDING_TOPICS } from '@/constants/community-data';
import { asHref } from '@/lib/href';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useCommunityStore, type CommunityState } from '@/stores/communityStore';
import type { CommunityPost, FeedFilter } from '@/types/community';
import { FEED_FILTERS } from '@/types/community';

export default function CommunityHubScreen() {
  const user = useAuthStore((s: AuthState) => s.user);
  const hydrate = useCommunityStore((s: CommunityState) => s.hydrate);
  const isHydrated = useCommunityStore((s: CommunityState) => s.isHydrated);
  const filterPosts = useCommunityStore((s: CommunityState) => s.filterPosts);
  const posts = useCommunityStore((s: CommunityState) => s.posts);

  const [filter, setFilter] = useState<FeedFilter>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const filtered = filterPosts(filter, search);
  const pinned = posts.filter((p: CommunityPost) => p.isPinned);
  const onRefresh = useCallback(() => {
    void hydrate();
  }, [hydrate]);

  const filterChips: ChipTabItem[] = useMemo(
    () => FEED_FILTERS.map((f) => ({ id: f, label: f })),
    [],
  );

  const newPostBtn = (
    <Pressable
      onPress={() => router.push(asHref('/(tabs)/community/create'))}
      style={styles.newPostBtn}>
      <Ionicons name="add" size={20} color={DS.colors.textInverse} />
      <Text style={styles.newPostText}>Post</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <TabScreenHeader
        title="Community"
        subtitle={`${user?.province ?? 'Zimbabwe'} · Farmers helping farmers`}
        icon="people"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search posts, tags…"
        searchTint="light"
        rightAction={newPostBtn}
      />

      <ChipTabs
        items={filterChips}
        activeId={filter}
        onChange={(id) => setFilter(id as FeedFilter)}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Pressable onPress={() => router.push(asHref('/(tabs)/community/experts'))}>
            <GlassCard elevated style={styles.expertCard}>
              <View style={styles.expertIcon}>
                <Ionicons name="school-outline" size={22} color={DS.colors.primary} />
              </View>
              <View style={styles.expertText}>
                <Text style={styles.expertTitle}>Expert Q&A</Text>
                <Text style={styles.expertSub}>Ask Agritex & verified specialists</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={DS.colors.primary} />
            </GlassCard>
          </Pressable>
        </FadeInView>

        <FadeInView delay={1}>
          <SectionHeader title="Trending" icon="flame-outline" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingRow}>
            {TRENDING_TOPICS.map((t) => (
              <Pressable key={t.id} onPress={() => setSearch(t.tag)} style={styles.trendingChip}>
                <Text style={styles.trendingTag}>{t.label}</Text>
                <Text style={styles.trendingCount}>{t.postCount} posts</Text>
              </Pressable>
            ))}
          </ScrollView>
        </FadeInView>

        <FadeInView delay={2}>
          <SectionHeader title="Success stories" icon="star-outline" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingRow}>
            {SUCCESS_STORIES.map((story) => (
              <GlassCard key={story.id} style={styles.storyCard}>
                <Text style={styles.storyName}>{story.name}</Text>
                <Text style={styles.storyCrop}>
                  {story.crop} ·{' '}
                  <Text style={styles.storyEarnings}>${story.earningsUSD.toLocaleString()}</Text>
                </Text>
                <Text style={styles.storyQuote} numberOfLines={2}>
                  {story.quote}
                </Text>
              </GlassCard>
            ))}
          </ScrollView>
        </FadeInView>

        {!isHydrated ? (
          <ActivityIndicator color={DS.colors.primary} size="large" style={styles.loader} />
        ) : (
          <>
            {pinned.map((p: CommunityPost) => (
              <PostCard key={p.id} post={p} />
            ))}

            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>
                Feed{filter !== 'All' ? ` · ${filter}` : ''}
              </Text>
              <Text style={styles.feedCount}>{filtered.length} posts</Text>
            </View>

            {filtered.filter((p: CommunityPost) => !p.isPinned).map((p: CommunityPost, i) => (
              <FadeInView key={p.id} delay={i % 5}>
                <PostCard post={p} />
              </FadeInView>
            ))}

            {filtered.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title="No posts found"
                description="Try a different filter or search term."
              />
            ) : null}

            <Pressable onPress={onRefresh} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color={DS.colors.primary} />
              <Text style={styles.refreshText}>Refresh feed</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: DS.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  newPostText: { fontSize: 14, fontWeight: '700', color: DS.colors.textInverse },
  body: { flex: 1 },
  bodyContent: { padding: DS.spacing.md, paddingBottom: 100 },
  expertCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: DS.spacing.md },
  expertIcon: {
    width: 48,
    height: 48,
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertText: { flex: 1 },
  expertTitle: { fontSize: 16, fontWeight: '700', color: DS.colors.text },
  expertSub: { fontSize: 13, color: DS.colors.textMuted, marginTop: 2 },
  trendingRow: { gap: 10, paddingRight: 8, marginBottom: DS.spacing.lg },
  trendingChip: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    padding: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: DS.colors.border,
    ...DS.shadow.soft,
  },
  trendingTag: { fontSize: 14, fontWeight: '700', color: DS.colors.text },
  trendingCount: { fontSize: 11, color: DS.colors.textMuted, marginTop: 4 },
  storyCard: { width: 200, marginRight: 0 },
  storyName: { fontSize: 14, fontWeight: '700', color: DS.colors.text },
  storyCrop: { fontSize: 12, color: DS.colors.textMuted, marginTop: 4 },
  storyEarnings: { fontWeight: '700', color: DS.colors.accent },
  storyQuote: { fontSize: 12, color: DS.colors.textMuted, marginTop: 8, lineHeight: 17 },
  loader: { marginTop: 40 },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DS.spacing.sm,
    marginTop: DS.spacing.sm,
  },
  feedTitle: { fontSize: 16, fontWeight: '700', color: DS.colors.text },
  feedCount: { fontSize: 13, color: DS.colors.textMuted },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: DS.spacing.md,
    paddingVertical: 14,
    borderRadius: DS.radius.lg,
    backgroundColor: DS.colors.primaryBg,
    borderWidth: 1,
    borderColor: DS.colors.primaryMid,
  },
  refreshText: { fontSize: 14, fontWeight: '700', color: DS.colors.primary },
});
