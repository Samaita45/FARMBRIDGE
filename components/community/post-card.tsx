import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { asHref } from '@/lib/href';
import { useCommunityStore, type CommunityState } from '@/stores/communityStore';
import Colors from '@/constants/colors';
import type { CommunityPost } from '@/types/community';

const ROLE_LABELS: Record<string, string> = {
  farmer: 'Farmer', buyer: 'Buyer', expert: 'Expert', both: 'Farmer & Buyer',
};
const AVATAR_COLORS = [Colors.primary, '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

function avatarColor(name: string): string {
  let h = 0; for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function PostCard({ post }: { post: CommunityPost }) {
  const toggleLike = useCommunityStore((s: CommunityState) => s.toggleLike);
  const liked = useCommunityStore((s: CommunityState) => s.likedPostIds.includes(post.id));
  const initial = post.isAnonymous ? '?' : post.authorName.charAt(0).toUpperCase();

  return (
    <View style={[s.card, post.isPinned && s.cardPinned]}>
      {post.isPinned && (
        <View style={s.pinnedBadge}>
          <Ionicons name="pin" size={11} color={Colors.primary} />
          <Text style={s.pinnedText}>Pinned · Agritex</Text>
        </View>
      )}

      {/* Author row */}
      <View style={s.authorRow}>
        <View style={[s.avatar, { backgroundColor: avatarColor(post.authorName) }]}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <View style={s.authorInfo}>
          <View style={s.nameRow}>
            <Text style={s.authorName}>{post.isAnonymous ? 'Anonymous' : post.authorName}</Text>
            <View style={s.rolePill}>
              <Text style={s.rolePillText}>{ROLE_LABELS[post.authorRole] ?? post.authorRole}</Text>
            </View>
            {post.authorRole === 'expert' && (
              <View style={s.expertBadge}>
                <Ionicons name="checkmark-circle" size={10} color={Colors.primary} />
                <Text style={s.expertText}>Expert</Text>
              </View>
            )}
          </View>
          <Text style={s.meta}>{post.province} · {timeAgo(post.createdAt)}</Text>
        </View>
      </View>

      {/* Post content */}
      <Link href={asHref(`/(tabs)/community/${post.id}`)} asChild>
        <Pressable style={({ pressed }) => [s.bodyWrap, pressed && { opacity: 0.8 }]}>
          <Text style={s.title}>{post.title}</Text>
          <Text style={s.body} numberOfLines={2}>{post.body}</Text>
        </Pressable>
      </Link>

      {/* Tags */}
      <View style={s.tags}>
        {post.tags.slice(0, 4).map((tag) => (
          <View key={tag} style={s.tag}>
            <Text style={s.tagText}>#{tag}</Text>
          </View>
        ))}
        {post.isSolved && (
          <View style={[s.tag, s.tagSolved]}>
            <Ionicons name="checkmark-circle" size={10} color={Colors.accent} />
            <Text style={[s.tagText, { color: Colors.accent }]}>Solved</Text>
          </View>
        )}
      </View>

      {/* Action row */}
      <View style={s.actions}>
        <Pressable onPress={() => toggleLike(post.id)} style={s.actionBtn}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? Colors.error : Colors.gray[400]} />
          <Text style={[s.actionText, liked && { color: Colors.error }]}>{post.likes}</Text>
        </Pressable>
        <View style={s.actionBtn}>
          <Ionicons name="chatbubble-outline" size={16} color={Colors.gray[400]} />
          <Text style={s.actionText}>{post.commentCount}</Text>
        </View>
        <View style={s.actionBtn}>
          <Ionicons name="share-social-outline" size={16} color={Colors.gray[400]} />
          <Text style={s.actionText}>Share</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: Colors.gray[100],
  },
  cardPinned: { borderColor: Colors.primaryMid, borderWidth: 1.5 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  pinnedText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  authorRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  authorInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  authorName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  rolePill: { backgroundColor: Colors.primaryBg, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  rolePillText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  expertBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.primaryMid, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  expertText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  meta: { fontSize: 11, color: Colors.gray[400], marginTop: 2 },
  bodyWrap: { marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  body: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: { backgroundColor: Colors.primaryBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 3 },
  tagSolved: { backgroundColor: Colors.accentLight },
  tagText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  actions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: Colors.gray[100], paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, fontWeight: '600', color: Colors.gray[400] },
});
