import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useCommunityStore, type CommunityState } from '@/stores/communityStore';
import type { CommunityPost, UserRoleBadge } from '@/types/community';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s: AuthState) => s.user);
  const post = useCommunityStore((s: CommunityState) => s.getPostById(id ?? ''));
  const toggleLike = useCommunityStore((s: CommunityState) => s.toggleLike);
  const addReply = useCommunityStore((s: CommunityState) => s.addReply);
  const markSolved = useCommunityStore((s: CommunityState) => s.markSolved);
  const upvoteReply = useCommunityStore((s: CommunityState) => s.upvoteReply);
  const liked = useCommunityStore((s: CommunityState) => s.likedPostIds.includes(id ?? ''));
  const { showToast } = useToast();

  const [reply, setReply] = useState('');

  if (!post) {
    return (
      <View className="flex-1 items-center justify-center bg-surface p-4">
        <Text className="font-sans text-gray-500">Post not found</Text>
      </View>
    );
  }

  const currentPost: CommunityPost = post;
  const sortedReplies = [...(currentPost.replies ?? [])].sort((a, b) => {
    if (a.isExpert !== b.isExpert) return a.isExpert ? -1 : 1;
    return b.upvotes - a.upvotes;
  });

  const onReply = () => {
    if (!reply.trim()) return;
    addReply(currentPost.id, {
      authorId: user?.id ?? 'guest',
      authorName: user?.name ?? 'Guest',
      authorRole: (user?.role as UserRoleBadge) ?? 'farmer',
      province: user?.province ?? 'Zimbabwe',
      body: reply.trim(),
      isExpert: false,
    });
    setReply('');
    showToast('Reply added', 'success');
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {currentPost.isPinned ? (
        <Text className="mb-2 font-sans text-xs text-primary">📌 Pinned · Agritex</Text>
      ) : null}
      <Text className="font-display text-xl text-dark">{currentPost.title}</Text>
      <Text className="mt-2 font-sans text-gray-600">{currentPost.body}</Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {currentPost.tags.map((t) => (
          <Text key={t} className="font-sans text-xs text-primary">
            #{t}
          </Text>
        ))}
        {currentPost.isSolved ? (
          <Text className="font-sans text-xs text-primary">✓ Solved</Text>
        ) : null}
      </View>

      <View className="mt-4 flex-row gap-4">
        <Pressable onPress={() => toggleLike(currentPost.id)} className="flex-row items-center gap-1">
          <Text className={liked ? 'text-primary' : ''}>👍 {currentPost.likes}</Text>
        </Pressable>
        <Text>💬 {currentPost.commentCount}</Text>
        {currentPost.category === 'question' && !currentPost.isSolved ? (
          <Pressable onPress={() => markSolved(currentPost.id)}>
            <Text className="font-sans text-sm text-primary">Mark solved</Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="mt-6 font-sans-semibold text-dark">
        Replies ({sortedReplies.length})
      </Text>
      {sortedReplies.map((r) => (
        <View
          key={r.id}
          className={`mt-3 rounded-2xl bg-white p-4 ${r.isExpert ? 'border border-primary/20' : ''}`}>
          <View className="flex-row items-center gap-2">
            <Text className="font-sans-semibold text-dark">{r.authorName}</Text>
            {r.isExpert ? (
              <Text className="rounded-full bg-primary/10 px-2 py-0.5 font-sans text-[10px] text-primary">
                ✓ Expert
              </Text>
            ) : null}
          </View>
          <Text className="font-sans text-xs text-gray-400">{r.province}</Text>
          <Text className="mt-2 font-sans text-gray-700">{r.body}</Text>
          <Pressable onPress={() => upvoteReply(currentPost.id, r.id)} className="mt-2">
            <Text className="font-sans text-sm text-gray-500">👍 {r.upvotes} helpful</Text>
          </Pressable>
        </View>
      ))}

      <Text className="mt-6 font-sans-semibold text-dark">Add a reply</Text>
      <TextInput
        className="mt-2 min-h-[80] rounded-xl bg-white px-4 py-3 font-sans"
        placeholder="Share your experience or advice..."
        value={reply}
        onChangeText={setReply}
        multiline
      />
      <View className="mt-3">
        <PrimaryButton title="Post Reply" onPress={onReply} />
      </View>
    </ScrollView>
  );
}
