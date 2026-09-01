import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/lib/navigation';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Profile', headerShown: false }} />
      <Stack.Screen name="edit-farm" options={{ title: 'My Farm' }} />
      <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
      <Stack.Screen name="earnings" options={{ title: 'Earnings' }} />
    </Stack>
  );
}
