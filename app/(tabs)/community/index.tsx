import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/community/post-card';
import Colors from '@/constants/colors';
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

  useEffect(() => { void hydrate(); }, [hydrate]);

  const filtered = filterPosts(filter, search);
  const pinned = posts.filter((p: CommunityPost) => p.isPinned);
  const onRefresh = useCallback(() => { void hydrate(); }, [hydrate]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── Blue header ── */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <View style={s.headerTitleRow}>
              <Ionicons name="people" size={22} color="#fff" />
              <Text style={s.headerTitle}>Community</Text>
            </View>
            <Text style={s.headerSub}>{user?.province ?? 'Zimbabwe'} · Farmers helping farmers</Text>
          </View>
          <Pressable
            onPress={() => router.push(asHref('/(tabs)/community/create'))}
            style={s.newPostBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.newPostText}>Post</Text>
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={s.searchBar}>
          <Ionicons name="search" size={17} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={s.searchInput}
            placeholder="Search posts, tags..."
            placeholderTextColor="rgba(255,255,255,0.55)"
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

      {/* ── Filter tabs ── */}
      <View style={s.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {FEED_FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[s.tab, filter === f && s.tabActive]}>
              <Text style={[s.tabText, filter === f && s.tabTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>

        {/* Expert Q&A card */}
        <Pressable
          onPress={() => router.push(asHref('/(tabs)/community/experts'))}
          style={s.expertCard}>
          <View style={s.expertIcon}>
            <Ionicons name="school-outline" size={20} color={Colors.primary} />
          </View>
          <View style={s.expertText}>
            <Text style={s.expertTitle}>Expert Q&A</Text>
            <Text style={s.expertSub}>Ask Agritex & verified specialists</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </Pressable>

        {/* Trending */}
        <View style={s.section}>
          <View style={s.sectionTitleRow}>
            <Ionicons name="flame-outline" size={17} color={Colors.primary} />
            <Text style={s.sectionTitle}>Trending</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.trendingRow}>
            {TRENDING_TOPICS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setSearch(t.tag)}
                style={s.trendingChip}>
                <Text style={s.trendingTag}>{t.label}</Text>
                <Text style={s.trendingCount}>{t.postCount} posts</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Success stories */}
        <View style={s.section}>
          <View style={s.sectionTitleRow}>
            <Ionicons name="star-outline" size={17} color={Colors.primary} />
            <Text style={s.sectionTitle}>Success Stories</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.trendingRow}>
            {SUCCESS_STORIES.map((story) => (
              <View key={story.id} style={s.storyCard}>
                <Text style={s.storyName}>{story.name}</Text>
                <Text style={s.storyCrop}>{story.crop} · <Text style={s.storyEarnings}>${story.earningsUSD.toLocaleString()}</Text></Text>
                <Text style={s.storyQuote} numberOfLines={2}>{story.quote}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Feed */}
        {!isHydrated ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={Colors.primary} size="large" />
        ) : (
          <>
            {pinned.map((p: CommunityPost) => <PostCard key={p.id} post={p} />)}

            <View style={s.feedHeader}>
              <Text style={s.feedTitle}>Feed {filter !== 'All' ? `· ${filter}` : ''}</Text>
              <Text style={s.feedCount}>{filtered.length} posts</Text>
            </View>

            {filtered.filter((p: CommunityPost) => !p.isPinned).map((p: CommunityPost) => (
              <PostCard key={p.id} post={p} />
            ))}

            {filtered.length === 0 && (
              <View style={s.emptyState}>
                <Ionicons name="search-outline" size={40} color={Colors.gray[300]} />
                <Text style={s.emptyTitle}>No posts found</Text>
                <Text style={s.emptyHint}>Try a different filter or search term</Text>
              </View>
            )}

            <Pressable onPress={onRefresh} style={s.refreshBtn}>
              <Ionicons name="refresh" size={16} color={Colors.primary} />
              <Text style={s.refreshText}>Refresh Feed</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primaryBg },

  // Header
  header: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  newPostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  newPostText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },

  // Tabs
  tabsWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.gray[100] },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: 14, paddingBottom: 100, gap: 4 },

  // Expert card
  expertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  expertIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  expertText: { flex: 1 },
  expertTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  expertSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Sections
  section: { marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  trendingRow: { gap: 8, paddingRight: 4 },
  trendingChip: {
    backgroundColor: '#fff', borderRadius: 12, padding: 10,
    minWidth: 110,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
    borderWidth: 1, borderColor: Colors.gray[100],
  },
  trendingTag: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  trendingCount: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

  // Story card
  storyCard: {
    width: 200, backgroundColor: Colors.primaryBg,
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.primaryMid,
  },
  storyName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  storyCrop: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  storyEarnings: { fontWeight: '700', color: Colors.accent },
  storyQuote: { fontSize: 11, color: Colors.textSecondary, marginTop: 6, lineHeight: 15 },

  // Feed
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  feedTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  feedCount: { fontSize: 12, color: Colors.textSecondary },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptyHint: { fontSize: 13, color: Colors.textSecondary },

  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8, paddingVertical: 13, borderRadius: 14,
    backgroundColor: Colors.primaryBg, borderWidth: 1.5, borderColor: Colors.primaryMid,
  },
  refreshText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
