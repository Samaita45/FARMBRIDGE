import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { EXPERTS } from '@/constants/community-data';
import { asHref } from '@/lib/href';
import { useToast } from '@/components/ui/toast-provider';

export default function ExpertsScreen() {
  const { showToast } = useToast();

  return (
    <ScrollView className="flex-1 bg-surface p-4" contentContainerStyle={{ paddingBottom: 32 }}>
      <Text className="font-sans text-gray-600">
        Connect with Agritex officers and verified agricultural specialists across Zimbabwe.
      </Text>

      {EXPERTS.map((expert) => (
        <View
          key={expert.id}
          className="mt-4 rounded-2xl bg-white p-4"
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="font-sans-semibold text-dark">{expert.name}</Text>
              <Text className="mt-1 font-sans text-sm text-primary">
                {expert.title} · {expert.organization}
              </Text>
              <Text className="mt-1 font-sans text-xs text-gray-500">
                {expert.specialties.join(' · ')} · {expert.province}
              </Text>
            </View>
            <View
              className={`rounded-full px-2 py-1 ${expert.available ? 'bg-primary/10' : 'bg-gray-100'}`}>
              <Text
                className={`font-sans text-[10px] ${expert.available ? 'text-primary' : 'text-gray-400'}`}>
                {expert.available ? 'Available' : 'Busy'}
              </Text>
            </View>
          </View>
          <Pressable
            disabled={!expert.available}
            onPress={() => showToast(`Question sent to ${expert.name} (demo)`, 'success')}
            className="mt-3">
            <Text
              className={`font-sans-semibold text-sm ${expert.available ? 'text-primary' : 'text-gray-300'}`}>
              Ask a question →
            </Text>
          </Pressable>
        </View>
      ))}

      <View className="mt-6 rounded-2xl bg-primary/10 p-4">
        <Text className="font-sans-semibold text-dark">Prefer the community?</Text>
        <Text className="mt-1 font-sans text-sm text-gray-600">
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
