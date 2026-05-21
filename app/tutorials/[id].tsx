import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';

import { TutorialCard } from '@/components/cards/tutorial-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { TUTORIALS } from '@/constants/tutorials-data';
import { useAuthStore, type AuthState } from '@/stores/authStore';
import { useTutorialsStore, type TutorialsState } from '@/stores/tutorialsStore';

export default function TutorialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s: AuthState) => s.user);
  const complete = useTutorialsStore((s: TutorialsState) => s.complete);
  const completedIds = useTutorialsStore((s: TutorialsState) => s.completedIds);
  const { showToast } = useToast();

  const tutorial = TUTORIALS.find((t) => t.id === id);
  const related = tutorial?.relatedIds
    .map((rid) => TUTORIALS.find((t) => t.id === rid))
    .filter(Boolean) ?? [];

  if (!tutorial) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="font-sans text-gray-500">Tutorial not found</Text>
      </View>
    );
  }

  const isDone = completedIds.includes(tutorial.id);

  const onComplete = async () => {
    if (!user?.id) return;
    await complete(user.id, tutorial.id);
    showToast('Marked as complete!', 'success');
  };

  const onShare = () => {
    void Share.share({ message: `${tutorial.title} — ZimFarm Tutorials` });
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="items-center bg-primary/10 py-8">
        <Text className="text-6xl">{tutorial.emoji}</Text>
      </View>

      <View className="p-4">
        <Text className="font-display text-xl text-dark">{tutorial.title}</Text>
        <Text className="mt-2 font-sans text-sm text-gray-500">
          {tutorial.durationMin} min · {tutorial.difficulty} · {tutorial.language.toUpperCase()}
        </Text>

        {tutorial.sections.map((sec, i) => (
          <View key={i} className="mt-4">
            {sec.heading ? (
              <Text className="font-sans-semibold text-lg text-dark">{sec.heading}</Text>
            ) : null}
            <Text className="mt-1 font-sans text-gray-700 leading-6">{sec.body}</Text>
            {sec.tip ? (
              <View className="mt-2 rounded-xl bg-amber-50 border border-amber-100 p-3">
                <Text className="font-sans-semibold text-sm text-amber-800">💡 Tip</Text>
                <Text className="font-sans text-sm text-amber-900">{sec.tip}</Text>
              </View>
            ) : null}
          </View>
        ))}

        <View className="mt-4 flex-row gap-3">
          <Pressable onPress={onShare} className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-primary py-3">
            <Ionicons name="share-outline" size={18} color="#22c55e" />
            <Text className="font-sans-semibold text-primary">Share</Text>
          </Pressable>
        </View>

        <View className="mt-3">
          <PrimaryButton
            title={isDone ? 'Completed ✓' : 'Mark as Complete'}
            variant={isDone ? 'outline' : 'primary'}
            disabled={isDone}
            onPress={onComplete}
          />
        </View>

        <Pressable
          onPress={() => Linking.openURL('https://wa.me/263771234567?text=Expert%20question%20from%20ZimFarm')}
          className="mt-3 rounded-xl bg-surface py-3">
          <Text className="text-center font-sans-semibold text-primary">Ask an Expert →</Text>
        </Pressable>

        {related.length > 0 ? (
          <View className="mt-6">
            <Text className="font-sans-semibold text-dark">Related tutorials</Text>
            {related.map((t) => (t ? <TutorialCard key={t.id} tutorial={t} completed={completedIds.includes(t.id)} /> : null))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
