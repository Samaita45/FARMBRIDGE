import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/lib/navigation';

export default function TutorialsLayout() {
  return (
    <Stack
      screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Tutorials', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Tutorial' }} />
    </Stack>
  );
}
