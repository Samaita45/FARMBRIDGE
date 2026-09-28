import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { asHref } from '@/lib/href';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useCommunityStore, type CommunityState } from '@/stores/communityStore';
import type { PostCategory, UserRoleBadge } from '@/types/community';
import { POST_CATEGORY_LABELS } from '@/types/community';
import { Toggle } from '@/components/design-system';

const CATEGORIES: PostCategory[] = ['question', 'tip', 'success', 'market', 'weather', 'general'];

export default function CreatePostScreen() {
  const user = useAuthStore((s: AuthState) => s.user);
  const addPost = useCommunityStore((s: CommunityState) => s.addPost);
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PostCategory>('question');
  const [tags, setTags] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      showToast('Please add a title and description', 'error');
      return;
    }
    setLoading(true);
    try {
      const post = await addPost({
        authorId: user?.id ?? 'guest',
        authorName: user?.name ?? 'Guest',
        authorRole: (user?.role as UserRoleBadge) ?? 'farmer',
        province: user?.province ?? 'Zimbabwe',
        title: title.trim(),
        body: body.trim(),
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        isPinned: false,
        isSolved: false,
        isAnonymous: anonymous,
      });
      showToast('Post published!', 'success');
      router.replace(asHref(`/(tabs)/community/${post.id}`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface p-4 dark:bg-dSurface" keyboardShouldPersistTaps="handled">
      <Text className="font-sans-semibold text-dark dark:text-dText">Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            className={`mr-2 rounded-full px-3 py-2 ${category === c ? 'bg-primary dark:bg-dPrimary' : 'bg-white dark:bg-dCard'}`}>
            <Text className={`font-sans text-xs ${category === c ? 'text-white dark:text-dOnPrimary' : 'text-gray-600 dark:text-dMuted'}`}>
              {POST_CATEGORY_LABELS[c]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text className="mt-4 font-sans-semibold text-dark dark:text-dText">Title</Text>
      <TextInput
        className="mt-2 rounded-xl bg-white px-4 py-3 font-sans text-dark dark:bg-dCard dark:text-dText"
        placeholder="What's on your mind?"
        value={title}
        onChangeText={setTitle}
        maxLength={120}
      />

      <Text className="mt-4 font-sans-semibold text-dark dark:text-dText">Details</Text>
      <TextInput
        className="mt-2 min-h-[120] rounded-xl bg-white px-4 py-3 font-sans text-dark dark:bg-dCard dark:text-dText"
        placeholder="Share your question, tip, or story..."
        value={body}
        onChangeText={setBody}
        multiline
        textAlignVertical="top"
      />

      <Text className="mt-4 font-sans-semibold text-dark dark:text-dText">Tags (comma separated)</Text>
      <TextInput
        className="mt-2 rounded-xl bg-white px-4 py-3 font-sans text-dark dark:bg-dCard dark:text-dText"
        placeholder="maize, harare, irrigation"
        value={tags}
        onChangeText={setTags}
        autoCapitalize="none"
      />

      <View className="mt-4 flex-row items-center justify-between rounded-xl bg-white px-4 py-3 dark:bg-dCard">
        <Text className="font-sans text-dark dark:text-dText">Post anonymously</Text>
        <Toggle
          value={anonymous}
          onValueChange={setAnonymous}
          accessibilityLabel="Post anonymously"
        />
      </View>

      <View className="mt-6">
        <PrimaryButton title="Publish Post" loading={loading} onPress={onSubmit} />
      </View>
    </ScrollView>
  );
}
