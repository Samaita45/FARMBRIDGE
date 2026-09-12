import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/lib/navigation';

export default function CropManagementLayout() {
  return (
    <Stack
      screenOptions={stackScreenOptions}>
      {/* The hub renders its own header so it can carry the stat row. */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="planner" options={{ title: 'Crop Planner' }} />
      <Stack.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Stack.Screen name="health" options={{ title: 'Crop Health' }} />
      <Stack.Screen name="soil" options={{ title: 'Soil & Fertilizer' }} />
    </Stack>
  );
}
