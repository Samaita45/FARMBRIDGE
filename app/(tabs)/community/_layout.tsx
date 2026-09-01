import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/lib/navigation';

export default function CommunityLayout() {
  return (
    <Stack
      screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Community', headerShown: false }} />
      <Stack.Screen name="create" options={{ title: 'New Post' }} />
      <Stack.Screen name="[id]" options={{ title: 'Discussion' }} />
      <Stack.Screen name="experts" options={{ title: 'Expert Q&A' }} />
    </Stack>
  );
}
