import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { EXPERTS } from '@/constants/community-data';
import { asHref } from '@/lib/href';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';

export default function ExpertsScreen() {
  const { showToast } = useToast();

  return (
    <ScrollView className="flex-1 bg-surface p-4 dark:bg-dSurface" contentContainerStyle={{ paddingBottom: 32 }}>
      <Text className="font-sans text-gray-600 dark:text-dMuted">
        Connect with Agritex officers and verified agricultural specialists across Zimbabwe.
      </Text>

      {EXPERTS.map((expert) => (
        <View
          key={expert.id}
          className="mt-4 rounded-2xl bg-white p-4 dark:bg-dCard"
          style={{ shadowColor: DS.colors.text, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="font-sans-semibold text-dark dark:text-dText">{expert.name}</Text>
              <Text className="mt-1 font-sans text-sm text-primary dark:text-dPrimary">
                {expert.title} · {expert.organization}
              </Text>
              <Text className="mt-1 font-sans text-xs text-gray-500 dark:text-dSoft">
                {expert.specialties.join(' · ')} · {expert.province}
              </Text>
            </View>
            <View
              className={`rounded-full px-2 py-1 ${expert.available ? 'bg-primary/10 dark:bg-dPrimary/20' : 'bg-gray-100 dark:bg-dCardMuted'}`}>
              <Text
                className={`font-sans text-[10px] ${expert.available ? 'text-primary dark:text-dPrimary' : 'text-gray-400 dark:text-dSoft'}`}>
                {expert.available ? 'Available' : 'Busy'}
              </Text>
            </View>
          </View>
          <Pressable
            disabled={!expert.available}
            onPress={() => showToast(`Question sent to ${expert.name} (demo)`, 'success')}
            className="mt-3">
            <Text
              className={`font-sans-semibold text-sm ${expert.available ? 'text-primary dark:text-dPrimary' : 'text-gray-300 dark:text-dSoft'}`}>
              Ask a question →
            </Text>
          </Pressable>
        </View>
      ))}

      <View className="mt-6 rounded-2xl bg-primary/10 p-4 dark:bg-dPrimary/20">
        <Text className="font-sans-semibold text-dark dark:text-dText">Prefer the community?</Text>
        <Text className="mt-1 font-sans text-sm text-gray-600 dark:text-dMuted">
          Post publicly and tag #ExpertHelp — farmers and experts both reply.
        </Text>
        <View className="mt-3">
          <PrimaryButton
            title="Ask the Community"
            onPress={() => router.push(asHref('/(tabs)/community/create'))}
          />
        </View>
      </View>
    </ScrollView>
  );
}
